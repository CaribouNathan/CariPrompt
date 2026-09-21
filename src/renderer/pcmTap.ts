/**
 * Prise de signal brut dans le graphe audio.
 *
 * Deux implémentations : AudioWorklet en premier choix (le traitement se fait
 * sur le fil audio, donc le défilement du prompteur ne peut pas provoquer de
 * trou dans l'enregistrement), ScriptProcessorNode en repli si le worklet ne
 * peut pas être chargé.
 */

export interface PcmTap {
  /** Blocs captés, dans l'ordre */
  readonly chunks: Float32Array[];
  /** Vide le tampon résiduel et détache le nœud */
  flush(): Promise<void>;
}

/**
 * Le repli tourne sur le fil principal : un tampon large lui laisse le temps
 * d'être servi même si le défilement du prompteur bloque brièvement la page.
 * 16384 échantillons ≈ 340 ms de marge à 48 kHz.
 */
const FALLBACK_BLOCK = 16384;

/**
 * Le module du worklet est un fichier servi à côté de la page : un blob:
 * serait refusé par la politique de sécurité du rendu, qui n'autorise que les
 * scripts de l'application elle-même.
 */
const WORKLET_URL = new URL('cari-tap.js', document.baseURI).href;

export async function createTap(
  ctx: AudioContext,
  source: AudioNode,
  onBlock?: (block: Float32Array) => void,
  block = 4096,
): Promise<PcmTap> {
  const chunks: Float32Array[] = [];
  try {
    await ctx.audioWorklet.addModule(WORKLET_URL);
    const node = new AudioWorkletNode(ctx, 'cari-tap', { numberOfInputs: 1, numberOfOutputs: 0, processorOptions: { block } });
    let resolveFlush: (() => void) | null = null;
    node.port.onmessage = (e) => {
      const msg = e.data as { block?: Float32Array; done?: Float32Array };
      if (msg.block) {
        if (onBlock) onBlock(msg.block);
        else chunks.push(msg.block);
      }
      else if (msg.done) {
        if (msg.done.length) chunks.push(msg.done);
        resolveFlush?.();
        resolveFlush = null;
      }
    };
    source.connect(node);
    return {
      chunks,
      flush: () =>
        new Promise<void>((resolve) => {
          const done = () => {
            source.disconnect(node);
            node.port.onmessage = null;
            resolve();
          };
          // Si le worklet ne répond pas, on n'attend pas indéfiniment
          const timer = setTimeout(done, 250);
          resolveFlush = () => {
            clearTimeout(timer);
            done();
          };
          node.port.postMessage('flush');
        }),
    };
  } catch {
    // Repli : ScriptProcessorNode, qui exige une sortie connectée pour
    // tourner. Il ne sert que si le module du worklet n'a pas pu être chargé.
    const node = ctx.createScriptProcessor(FALLBACK_BLOCK, 1, 1);
    const mute = ctx.createGain();
    mute.gain.value = 0;
    node.onaudioprocess = (e) => {
      const data = new Float32Array(e.inputBuffer.getChannelData(0));
      if (onBlock) onBlock(data);
      else chunks.push(data);
    };
    source.connect(node);
    node.connect(mute);
    mute.connect(ctx.destination);
    const detach = () => {
      node.onaudioprocess = null;
      source.disconnect(node);
      node.disconnect();
      mute.disconnect();
    };
    return {
      chunks,
      // On attend un dernier bloc avant de détacher : la fin de la phrase est
      // encore dans le tampon d'entrée et ne sort qu'une fois celui-ci plein.
      flush: () =>
        new Promise<void>((resolve) => {
          const timer = setTimeout(() => {
            detach();
            resolve();
          }, (FALLBACK_BLOCK / ctx.sampleRate) * 1000 + 60);
          node.onaudioprocess = (e) => {
            chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
            clearTimeout(timer);
            detach();
            resolve();
          };
        }),
    };
  }
}
