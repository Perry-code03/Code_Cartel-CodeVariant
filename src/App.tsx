import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { StoreProvider } from '@/store/StoreProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Shell } from '@/components/layout/Shell';

// Pages
import { HomePage } from '@/pages/HomePage';
import { VaultPage } from '@/pages/VaultPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { AutopsyWizardPage } from '@/pages/AutopsyWizardPage';
import { AutopsyHubPage } from '@/pages/AutopsyHubPage';
import { EngineHubPage } from '@/pages/EngineHubPage';
import { SalvageMarketPage } from '@/pages/SalvageMarketPage';
import { RoadmapPage } from '@/pages/RoadmapPage';
import { ExportPage } from '@/pages/ExportPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { StyleguidePage } from '@/pages/StyleguidePage';

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <TooltipProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Shell />}>
                <Route index element={<HomePage />} />
                <Route path="vault" element={<VaultPage />} />
                <Route path="autopsy" element={<AutopsyHubPage />} />
                <Route path="projects/:id/autopsy" element={<AutopsyWizardPage />} />
                <Route path="engine" element={<EngineHubPage />} />
                <Route path="project/:id" element={<ProjectDetailPage />} />
                <Route path="market" element={<SalvageMarketPage />} />
                <Route path="salvage" element={<SalvageMarketPage />} />
                <Route path="roadmap" element={<RoadmapPage />} />
                <Route path="export" element={<ExportPage />} />
                <Route path="styleguide" element={<StyleguidePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </HashRouter>
        </TooltipProvider>
      </StoreProvider>
    </MotionConfig>
  );
}

export default App;
