/**
 * Encodage WAV (RIFF / PCM 16 bits) à partir de blocs Float32.
 *
 * MediaRecorder ne sait pas produire de WAV : on capte le signal brut dans le
 * graphe audio et on écrit l'en-tête à la main. Le format est non compressé,
 * lisible partout, et c'est aussi ce qu'attend Whisper pour la 2.0.
 */

export const WAV_MIME = 'audio/wav';

/** Nombre total d'échantillons dans une liste de blocs. */
function totalFrames(chunks: Float32Array[]): number {
  let n = 0;
  for (const c of chunks) n += c.length;
  return n;
}

export function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const frames = totalFrames(chunks);
  const dataBytes = frames * 2; // mono, 16 bits
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  const ascii = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  ascii(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true); // taille du bloc fmt
  view.setUint16(20, 1, true); // PCM entier
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // octets par seconde
  view.setUint16(32, 2, true); // alignement de bloc
  view.setUint16(34, 16, true); // bits par échantillon
  ascii(36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      // Écrêtage avant conversion : au-delà de ±1 le signal sature de toute façon
      const s = chunk[i] < -1 ? -1 : chunk[i] > 1 ? 1 : chunk[i];
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: WAV_MIME });
}

/** Type MIME déduit de l'extension, pour relire les prises déjà enregistrées. */
export function audioMime(file: string): string {
  const ext = file.slice(file.lastIndexOf('.') + 1).toLowerCase();
  if (ext === 'wav') return WAV_MIME;
  if (ext === 'mp4' || ext === 'm4a') return 'audio/mp4';
  if (ext === 'webm') return 'audio/webm';
  return '';
}
