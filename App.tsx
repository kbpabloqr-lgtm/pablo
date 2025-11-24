import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { LiveAssistant } from './components/LiveAssistant';
import { ImageCreative } from './components/ImageCreative';
import { VideoCreative } from './components/VideoCreative';
import { OmniChat } from './components/OmniChat';
import { AudioTools } from './components/AudioTools';
import { View } from './types';

// Load Material Icons
const link = document.createElement('link');
link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
link.rel = "stylesheet";
document.head.appendChild(link);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LIVE_ASSISTANT);

  const renderView = () => {
    switch (currentView) {
      case View.LIVE_ASSISTANT: return <LiveAssistant />;
      case View.IMAGE_STUDIO: return <ImageCreative />;
      case View.VIDEO_STUDIO: return <VideoCreative />;
      case View.OMNI_CHAT: return <OmniChat />;
      case View.AUDIO_TOOLS: return <AudioTools />;
      default: return <LiveAssistant />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 h-full overflow-hidden relative">
        <div className="absolute inset-0 p-6">
           {/* Glass morphism container for view content */}
           <div className="h-full w-full bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
              {renderView()}
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
