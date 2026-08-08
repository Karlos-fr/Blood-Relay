export const BRAND_IDENTITY = {
  name: 'Blood Relay',
  label: 'BLOOD RELAY',
  shortDescription: 'Combat rapide, transfert vital, pression constante.',
} as const;

export const BRAND_PALETTE = {
  scene: {
    background: '#0f1217',
    bootBackground: '#111722',
    shadow: '#000000',
    panelOuter: 0x0f1623,
    panelInner: 0x111c34,
    panelGlow: 0x84b7f9,
    panelGrid: 0x192539,
  },
  text: {
    title: '#ffffff',
    titleMuted: '#d9e8ff',
    body: '#dbe3f6',
    bodyDim: '#c2d7f2',
    secondary: '#9fb9dd',
    muted: '#97a8cc',
    accent: '#8ec7ff',
    link: '#7ec5ff',
    status: '#88d0ff',
    warning: '#ff8d8d',
  },
  logo: {
    background: 0x121e32,
    mark: 0xe85d5d,
    markGlow: 0x7a1818,
    accent: 0xa0ca78,
    projectile: 0xffe06b,
    blood: 0x7a1818,
  },
  ui: {
    fontFamilyTitle: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif',
    fontFamilyBody: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif',
    fontFamilyMono: '"Courier New", Consolas, monospace',
    shadow: 4,
  },
  gameplay: {
    projectile: 0xffe06b,
  },
} as const;

export const BRAND_GRAPHIC = {
  logo: {
    width: 340,
    height: 90,
  },
  introDurationMs: 1450,
  logoRevealDurationMs: 360,
  logoPulseDurationMs: 260,
  logoPulseScale: 1.08,
} as const;

