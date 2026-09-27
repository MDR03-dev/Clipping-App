import React from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useProjectStore } from './stores/useProjectStore';
import { Header } from './components/layout/Header';
import { VideoImport } from './components/videoImport/VideoImport';
import { ClipCards } from './components/clipCards/ClipCards';
import { VisualEditor } from './components/visualEditor/VisualEditor';
import { PublishModal } from './components/publishModal/PublishModal';
import { Container } from '@mui/material';

function App() {
  const { projects, currentProject, clips, currentStep, isProcessing } = useProjectStore();

  return (
    <div className="min-height-screen">
      <Header />

      <main className="min-h-screen flex flex-col">
        {/* Stepper */}
        <div className="bg-[#1a1a2e] border-b border-[#2a2a45] px-6 py-3">
          <div className="flex items-center justify-between">
            <h2 className="font-anton text-xl text-white">Project Wizard</h2>
            <span className="text-sm text-[#a0a0b8]">{currentStep}/4 steps complete</span>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {currentStep === 0 && <VideoImport />}

          {currentStep >= 1 && currentProject && <ClipCards />}

          {currentProject && currentStep >= 2 && selectedClip && <VisualEditor />}

          {currentProject && selectedClip && currentStep >= 3 && <PublishModal />}
        </main>
      </main>
    </div>
  );
}

export default App;