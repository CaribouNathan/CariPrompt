import { useId } from 'react';
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = ({ size = 16, ...rest }: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...rest,
});

export const IconPlay = (p: P) => (
  <svg {...base(p)}><path d="M7 4.5v15a.8.8 0 0 0 1.2.7l12-7.5a.8.8 0 0 0 0-1.4l-12-7.5A.8.8 0 0 0 7 4.5Z" fill="currentColor" stroke="none" /></svg>
);
export const IconPause = (p: P) => (
  <svg {...base(p)}><rect x="6" y="4" width="4.2" height="16" rx="1.2" fill="currentColor" stroke="none" /><rect x="13.8" y="4" width="4.2" height="16" rx="1.2" fill="currentColor" stroke="none" /></svg>
);
export const IconClose = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" strokeWidth={2.2} /></svg>
);
export const IconBack10 = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 3.5v4h4" />
    <text x="12" y="15.3" fontSize="7.5" fontWeight="700" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="-apple-system, system-ui, sans-serif">10</text>
  </svg>
);
export const IconFwd10 = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 12a8 8 0 1 1-2.4-5.7" />
    <path d="M20 3.5v4h-4" />
    <text x="12" y="15.3" fontSize="7.5" fontWeight="700" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="-apple-system, system-ui, sans-serif">10</text>
  </svg>
);
export const IconScreen = (p: P) => (
  <svg {...base(p)}><rect x="2.5" y="4" width="19" height="12.5" rx="2" /><path d="M8.5 20h7M12 16.5V20" /></svg>
);
export const IconScreenOff = (p: P) => (
  <svg {...base(p)}><rect x="2.5" y="4" width="19" height="12.5" rx="2" /><path d="M8.5 20h7M12 16.5V20M3 3l18 18" /></svg>
);
export const IconSidebarRight = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4.5" width="18" height="15" rx="2.5" /><path d="M15 4.5v15" /></svg>
);
export const IconCompose = (p: P) => (
  <svg {...base(p)}><path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" /><path d="M17.5 3.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
);
export const IconImport = (p: P) => (
  <svg {...base(p)}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
);
export const IconDoc = (p: P) => (
  <svg {...base(p)}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>
);
export const IconKeyboard = (p: P) => (
  <svg {...base(p)}><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7.5 14h9" /></svg>
);
export const IconPencil = (p: P) => (
  <svg {...base(p)}><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);
export const IconGauge = (p: P) => (
  <svg {...base(p)}><path d="M4.5 17a8.5 8.5 0 1 1 15 0" /><path d="M12 13l4-4" /><circle cx="12" cy="13" r="1.2" fill="currentColor" /></svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const IconTextSize = (p: P) => (
  <svg {...base(p)}><path d="M3 18l4.5-11L12 18M4.6 14h5.8M14 18l3-7 3 7M15 16h4" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" /><path d="M8 12.2l2.6 2.6L16 9.4" stroke="#fff" strokeWidth={2} /></svg>
);
export const IconWarning = (p: P) => (
  <svg {...base(p)}><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" fill="currentColor" stroke="none" /><path d="M12 9v4.5M12 17h.01" stroke="#fff" strokeWidth={2} /></svg>
);
export const IconSlow = (p: P) => (
  <svg {...base(p)}><path d="M4 12h10M10 8l4 4-4 4" /></svg>
);
export const IconFast = (p: P) => (
  <svg {...base(p)}><path d="M3 12h12M9 7l5 5-5 5M15 7l5 5-5 5" /></svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const IconFullscreen = (p: P) => (
  <svg {...base(p)}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
);
export const IconExitFullscreen = (p: P) => (
  <svg {...base(p)}><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
);
export const IconBold = (p: P) => (
  <svg {...base(p)}><path d="M7 5h6a3.5 3.5 0 0 1 0 7H7Zm0 7h7a3.5 3.5 0 0 1 0 7H7Z" strokeWidth={2} /></svg>
);
export const IconItalic = (p: P) => (
  <svg {...base(p)}><path d="M15 5h-5M14 19H9M13.5 5 10.5 19" /></svg>
);
export const IconClear = (p: P) => (
  <svg {...base(p)}><path d="M7 7h11M10 7l-1.5 10M14 13l5 5M19 13l-5 5" /></svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></svg>
);
export const IconUndo = (p: P) => (
  <svg {...base(p)}><path d="M9 7H15a5 5 0 0 1 0 10h-4" /><path d="M12 4 9 7l3 3" /></svg>
);
export const IconRedo = (p: P) => (
  <svg {...base(p)}><path d="M15 7H9a5 5 0 0 0 0 10h4" /><path d="M12 4l3 3-3 3" /></svg>
);
export const IconMic = (p: P) => (
  <svg {...base(p)}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
);
export const IconStop = (p: P) => (
  <svg {...base(p)}><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" /></svg>
);

/**
 * Armoiries de la Haute-Savoie, d'après le fichier fourni : de gueules à la
 * croix d'argent, la croix occupant le tiers central dans les deux sens.
 * Redessinées en SVG pour rester nettes à 13 px comme à 200 %.
 */
const SHIELD = 'M0 0H100V67C100 95 75 112 50 129C25 112 0 95 0 67Z';
export const IconHauteSavoie = ({ size = 16 }: { size?: number }) => {
  const clip = `hs-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width={size} height={size * 1.284} viewBox="-1 -1 102 131" aria-hidden="true">
      <defs><clipPath id={clip}><path d={SHIELD} /></clipPath></defs>
      <path d={SHIELD} fill="#fefefe" />
      <g clipPath={`url(#${clip})`} fill="#d30000">
        <rect x="0" y="0" width="33.4" height="40.5" />
        <rect x="66.6" y="0" width="33.4" height="40.5" />
        <rect x="0" y="74" width="33.4" height="60" />
        <rect x="66.6" y="74" width="33.4" height="60" />
      </g>
      <path d={SHIELD} fill="none" stroke="#1a1a1a" strokeWidth="0.8" strokeLinejoin="round" />
    </svg>
  );
};

export const IconTranslate = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 5h9M8.5 3v2M6 5c.8 3.2 3 5.8 6 7M11 5c-.8 3.4-3.2 6.2-7 7.5" />
    <path d="M13 21l4-9 4 9M14.4 18h5.2" />
  </svg>
);
export const IconSpeak = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12h2l3-5v10l-3-5" />
    <path d="M13 9.5a4 4 0 0 1 0 5M16 7a7.5 7.5 0 0 1 0 10" />
  </svg>
);

export const IconDownload = (p: P) => (
  <svg {...base(p)}><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14" /></svg>
);
export const IconScissors = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6" cy="7" r="2.5" /><circle cx="6" cy="17" r="2.5" />
    <path d="M8 8.5 19 18M8 15.5 19 6" />
  </svg>
);
export const IconMerge = (p: P) => (
  <svg {...base(p)}><path d="M6 5v4a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v4M6 19v-4a3 3 0 0 1 3-3" /></svg>
);

/** Onde vocale : le suivi vocal */
export const IconWave = (p: P) => (
  <svg {...base(p)}><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2M21 12h0" /></svg>
);

export const IconInfo = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><path d="M12 7.6h.01" /></svg>
);

export const IconCountdown = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2" /><path d="M9.5 3h5" /></svg>
);

/**
 * Drapeaux des langues de l'interface, réduits à leurs bandes : lisibles à 14 px
 * et identiques sur les trois systèmes, contrairement aux émojis drapeaux.
 */
const FLAGS: Record<string, Array<[string, number, number, number, number]>> = {
  // [couleur, x, y, largeur, hauteur] sur une grille 18×12
  fr: [['#002654', 0, 0, 6, 12], ['#ffffff', 6, 0, 6, 12], ['#ce1126', 12, 0, 6, 12]],
  it: [['#008c45', 0, 0, 6, 12], ['#ffffff', 6, 0, 6, 12], ['#cd212a', 12, 0, 6, 12]],
  de: [['#000000', 0, 0, 18, 4], ['#dd0000', 0, 4, 18, 4], ['#ffce00', 0, 8, 18, 4]],
  es: [['#aa151b', 0, 0, 18, 3], ['#f1bf00', 0, 3, 18, 6], ['#aa151b', 0, 9, 18, 3]],
  en: [['#012169', 0, 0, 18, 12]],
};

export const IconFlag = ({ lang, size = 14 }: { lang: string; size?: number }) => {
  const bands = FLAGS[lang];
  if (!bands) return null;
  return (
    <svg width={size * 1.5} height={size} viewBox="0 0 18 12" aria-hidden="true" className="flag">
      {bands.map(([fill, x, y, w, h], i) => <rect key={i} fill={fill} x={x} y={y} width={w} height={h} />)}
      {lang === 'en' && (
        <g>
          <path d="M0 0 18 12M18 0 0 12" stroke="#ffffff" strokeWidth="2.4" />
          <path d="M0 0 18 12M18 0 0 12" stroke="#c8102e" strokeWidth="1.2" />
          <path d="M9 0v12M0 6h18" stroke="#ffffff" strokeWidth="4" />
          <path d="M9 0v12M0 6h18" stroke="#c8102e" strokeWidth="2.4" />
        </g>
      )}
      <rect x="0.25" y="0.25" width="17.5" height="11.5" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="0.5" />
    </svg>
  );
};
