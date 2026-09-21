/**
 * Prise de signal brut, exécutée sur le fil audio.
 *
 * Ce fichier est chargé tel quel par AudioWorklet : il n'est ni compilé ni
 * groupé par Vite, et doit rester en JavaScript simple.
 */
const BLOCK = 4096;

class CariTap extends AudioWorkletProcessor {
  constructor(options) {
    super();
    // Taille de bloc réglable : le suivi vocal veut des blocs courts (latence)
    const block = options && options.processorOptions && options.processorOptions.block;
    this.buf = new Float32Array(block > 0 ? block : BLOCK);
    this.n = 0;
    // Un message quelconque déclenche la purge du tampon résiduel
    this.port.onmessage = () => {
      this.port.postMessage({ done: this.buf.slice(0, this.n) });
      this.n = 0;
    };
  }

  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) {
      for (let i = 0; i < ch.length; i++) {
        this.buf[this.n++] = ch[i];
        if (this.n === this.buf.length) {
          this.port.postMessage({ block: this.buf.slice(0) });
          this.n = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('cari-tap', CariTap);
