// @polsia:user-owned — brand identity. Edit freely. `site.ts` re-exports
// siteName/siteDescription; `manifest.ts` + `opengraph-image.tsx` read `brandVisual`.

export const siteName = 'Tervox';
export const siteDescription =
  'Tervox — Triagem jurídica por IA no WhatsApp, sempre com revisão humana. SaaS multiempresa para escritórios de advocacia brasileiros.';

// PWA + social-share colors. HEX only (the oklch() tokens in globals.css aren't
// readable here) — set to match your brand seed.
export const brandVisual = {
  /** PWA browser-UI / status-bar color. */
  themeColor: '#0a6e75',
  /** PWA splash + install background. */
  backgroundColor: '#ffffff',
  /** Social-share (OG/Twitter) image. */
  og: {
    background: '#072528',
    foreground: '#eaf6f6',
    /** Second line under the site name; '' hides it. */
    tagline: 'Triagem jurídica por IA no WhatsApp, sempre com revisão humana.',
  },
} as const;
