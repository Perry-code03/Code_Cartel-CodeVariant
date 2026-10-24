import { LandingPage } from '@/landing/LandingPage';
import '@/landing/landing.css';

export const HomePage = () => (
  <LandingPage onBuryProject={() => window.dispatchEvent(new Event('graveyard:open-bury-dialog'))} />
);
