export interface LandingFooterLink {
  label: string;
  path: string;
}

export interface LandingConfig {
  /** Base URL of the full app, empty when the landing shares the app origin. */
  appUrl?: string;
  /** HashRouter paths for the landing calls to action. */
  buryProjectPath: string;
  vaultPath: string;
  footerLinks: readonly LandingFooterLink[];
}

export const landingConfig: LandingConfig = {
  buryProjectPath: '/vault',
  vaultPath: '/vault',
  footerLinks: [
    { label: 'Vault', path: '/vault' },
    { label: 'Salvage', path: '/salvage' },
    { label: 'Roadmap', path: '/roadmap' },
    { label: 'Export', path: '/export' },
  ],
};

export function getLandingHref(path: string, appUrl = landingConfig.appUrl): string {
  const base = appUrl?.trim().replace(/\/+$/, '') ?? '';
  const hashPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}/#${hashPath}`;
}
