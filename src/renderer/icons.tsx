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
