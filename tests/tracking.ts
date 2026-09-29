/**
 * Suivi vocal hors application : on simule un lecteur et les hypothèses de
 * Whisper, puis on mesure le déplacement du texte.
 *
 * Ce que l'on cherche : le texte ne doit pas aller et venir. Sur une lecture
 * suivie, il n'avance jamais qu'en avant ; sur une reprise de phrase, il recule
 * une fois, franchement, puis repart.
 *
 *   npx esbuild tests/tracking.ts --bundle --platform=node --outfile=/tmp/t.mjs --format=esm && node /tmp/t.mjs
 */
import { LiveAligner, ReadingEstimate, smoothRate, trackingRate } from '../src/renderer/liveAlign';


const TICK = 100;          // pas de régulation, en ms
const HYP_EVERY = 1000;    // une hypothèse de Whisper par seconde
const HYP_WINDOW = 6000;   // fenêtre glissante de la reconnaissance
const WPS = 2.5;           // débit du lecteur, mots par seconde
const LINE = 0.02;         // hauteur d'une ligne, en progression

const SCRIPT = [
  'Mesdames et messieurs, bonsoir.',
  'Aujourd’hui, je suis devant vous pour une raison très simple.',
  'Enfin, simple en théorie.',
  'Parce que lorsque j’ai accepté de faire ce discours, on m’a dit que cela ne prendrait que deux minutes.',
  'Deux minutes, c’est exactement ce qu’on m’a dit avant de me donner un micro.',
  'Une salle pleine de monde et absolument aucune idée de ce que j’allais raconter.',
  'Alors respirez, regardez autour de vous, et surtout ne paniquez pas.',
  'Parce que si tout se passe bien, dans quelques instants, vous aurez oublié pourquoi vous êtes venus.',
  'Et moi aussi, je l’aurai oublié, et ce sera très bien ainsi.',
];

const words = SCRIPT.join('\n\n').split(/\s+/);
const text = SCRIPT.join('\n\n');

/** Les mots réellement prononcés, dans l'ordre, avec éventuelle reprise */
function spoken(repeat: { from: number; to: number } | null): number[] {
  const order: number[] = [];
  for (let i = 0; i < words.length; i++) {
    order.push(i);
    if (repeat && i === repeat.to) for (let k = repeat.from; k <= repeat.to; k++) order.push(k);
  }
  return order;
}

/** Bruit de reconnaissance : un mot sur dix est écorché ou perdu */
function noisy(w: string, n: number): string | null {
  if (n % 11 === 0) return null;
  if (n % 7 === 0 && w.length > 4) return w.slice(0, -1);
  return w;
}

/** Bruit reproductible */
function rng(seed: number): () => number {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}

interface Run {
  back: number; worst: number; end: number; jumps: number; episodes: number;
  /** Plus grande variation de vitesse d'un pas à l'autre, en lignes par seconde */
  jolt: number;
  /** Part des pas où le texte est immobile */
  still: number;
}

function simulate(repeat: { from: number; to: number } | null, legacy: boolean, seed = 7, smooth = !legacy): Run {
  const al = new LiveAligner(text);
  const est = new ReadingEstimate();
  const order = spoken(repeat);

  const rand = rng(seed);
  let progress = 0;
  let rate = 0;
  let now = 0;
  let nextHyp = HYP_EVERY;
  let said = 0;                  // mots prononcés
  let spokenMs = 0;              // temps de parole effectif, pauses déduites
  let lastAt = 0;                // date de la dernière hypothèse (mode d'avant)
  let back = 0, worst = 0, jumps = 0, episodes = 0, wasBack = false;
  let jolt = 0, still = 0, ticks = 0;

  // Une voix off respire : une pause à chaque fin de phrase, et le débit varie.
  const breaks = new Set<number>();
  let n = 0;
  for (const s of SCRIPT) { n += s.split(/\s+/).length; breaks.add(n - 1); }

  const total = (order.length / WPS) * 1000 + 6000;
  let pauseLeft = 0;
  while (now < total) {
    now += TICK;
    const speaking = pauseLeft <= 0;
    if (!speaking) pauseLeft -= TICK;
    else {
      spokenMs += TICK * (0.8 + 0.4 * rand());   // débit irrégulier
      const next = Math.min(order.length, Math.floor((spokenMs / 1000) * WPS));
      if (next > said && breaks.has(order[said])) pauseLeft = 400 + 900 * rand();
      said = next;
    }

    if (now >= nextHyp) {
      // Whisper ne rend pas ses hypothèses à intervalle fixe, et toujours en retard
      nextHyp = now + HYP_EVERY * (0.8 + 0.6 * rand());
      const audioEnd = now - (150 + 450 * rand());
      const heard = Math.max(0, said - 1);
      const first = Math.max(0, heard - Math.round((HYP_WINDOW / 1000) * WPS));
      const hyp = order.slice(first, heard).map((i, k) => noisy(words[i], first + k)).filter(Boolean).join(' ');
      if (hyp) {
        const before = al.pos;
        if (al.update(hyp, audioEnd) && al.pos !== before) lastAt = audioEnd;
      }
    }

    // Position visée : estimation d'aujourd'hui, ou extrapolation d'avant la 2.2.5
    let word: number;
    if (legacy) {
      // predict() de la 2.2.4 : la position confirmée prolongée au débit, et
      // ramenée telle quelle dès que le lecteur se tait
      word = al.pos < 0 ? -1
        : !speaking || !lastAt ? al.pos
          : al.pos + 1 + al.rate * Math.min(2.5, Math.max(0, (now - lastAt) / 1000));
    } else {
      word = est.update(al, now, speaking);
    }

    if (word >= 0) {
      const target = al.charAt(word) / text.length;
      const d = trackingRate(target - progress, LINE);
      if (d.jump) { progress = target; rate = 0; jumps++; } else {
        const before = rate;
        rate = smooth ? smoothRate(rate, d.rate, TICK / 1000) : d.rate;
        jolt = Math.max(jolt, Math.abs(rate - before) / LINE / (TICK / 1000));
      }
    }
    ticks++;
    if (Math.abs(rate) < 1e-7) still++;
    const step = rate * (TICK / 1000);
    const goingBack = step < -1e-9;
    if (goingBack) { back++; worst = Math.max(worst, -step); if (!wasBack) episodes++; }
    wasBack = goingBack;
    progress = Math.max(0, Math.min(1, progress + step));
  }
  return { back, worst, end: progress, jumps, episodes, jolt, still: still / Math.max(1, ticks) };
}

/** Huit lectures, débits et latences différents : une seule ne prouve rien */
const SEEDS = [1, 3, 7, 11, 19, 23, 31, 47];
function runs(repeat: { from: number; to: number } | null, legacy: boolean, smooth = !legacy): Run {
  const all = SEEDS.map((s) => simulate(repeat, legacy, s, smooth));
  return {
    back: all.reduce((a, r) => a + r.back, 0),
    worst: Math.max(...all.map((r) => r.worst)),
    jumps: all.reduce((a, r) => a + r.jumps, 0),
    episodes: all.reduce((a, r) => a + r.episodes, 0),
    jolt: Math.max(...all.map((r) => r.jolt)),
    still: all.reduce((a, r) => a + r.still, 0) / all.length,
    end: Math.min(...all.map((r) => r.end)),
  };
}

const REPEAT = { from: 40, to: 52 };
const rows: [string, Run][] = [
  ['lecture suivie — avant la 2.2.5', runs(null, true)],
  ['lecture suivie — 2.2.6 (sans lissage)', runs(null, false, false)],
  ['lecture suivie — 2.2.7', runs(null, false)],
  ['reprise d’une phrase — avant la 2.2.5', runs(REPEAT, true)],
  ['reprise d’une phrase — 2.2.6 (sans lissage)', runs(REPEAT, false, false)],
  ['reprise d’une phrase — 2.2.7', runs(REPEAT, false)],
];

console.log(`${words.length} mots, ${Math.round(words.length / WPS)} s de lecture simulée\n`);
console.log(`${SEEDS.length} lectures par scénario\n`);
console.log('scénario'.padEnd(40), 'reculs', 'plus grand recul', 'reprises', 'à-coup max', 'immobile', 'fin mini');
for (const [name, r] of rows) {
  console.log(
    name.padEnd(40),
    String(r.back).padStart(6),
    (r.worst ? (r.worst * 100).toFixed(3) + ' %' : '—').padStart(16),
    String(r.episodes).padStart(8),
    (r.jolt.toFixed(1) + ' l/s²').padStart(10),
    ((r.still * 100).toFixed(0) + ' %').padStart(8),
    (r.end * 100).toFixed(1) + ' %',
  );
}

const straight = rows[2][1];
const repeated = rows[5][1];
const checks: [string, boolean][] = [
  ['pas plus d’un retour en arrière par lecture suivie', straight.episodes <= SEEDS.length],
  ['aucun retour brusque en lecture suivie', straight.worst < 0.0015],
  ['la lecture suivie atteint la fin', straight.end >= 0.9],
  ['le texte n’est presque jamais figé', straight.still < 0.1],
  ['défilement sans à-coup', straight.jolt < 40 && repeated.jolt < 40],
  ['la reprise ramène le texte', repeated.episodes >= SEEDS.length],
  ['le retour se fait d’un seul glissement', repeated.episodes <= SEEDS.length * 2],
];
let bad = 0;
console.log('');
for (const [label, ok] of checks) { console.log(`${ok ? '✓' : '✗'} ${label}`); if (!ok) bad++; }
process.exit(bad ? 1 : 0);
