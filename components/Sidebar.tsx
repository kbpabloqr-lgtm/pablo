import React from 'react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const NavItem = ({ view, current, label, icon, onClick }: { view: View, current: View, label: string, icon: string, onClick: (v: View) => void }) => (
  <button
    onClick={() => onClick(view)}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${current === view ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    <span className="material-icons">{icon}</span>
    <span className="font-medium">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="w-80 bg-slate-900 h-full flex flex-col border-r border-slate-800">
      <div className="p-8">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Omni-Studio
        </h1>
        <p className="text-xs text-slate-500 mt-1">Powered by Google Gemini</p>
      </div>
      
      <div className="flex-1 px-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-600 px-4 py-2 uppercase tracking-wider">Live</div>
        <NavItem view={View.LIVE_ASSISTANT} current={currentView} label="Voice Assistant" icon="graphic_eq" onClick={onViewChange} />
        
        <div className="text-xs font-semibold text-slate-600 px-4 py-2 uppercase tracking-wider mt-6">Creative</div>
        <NavItem view={View.IMAGE_STUDIO} current={currentView} label="Image Studio" icon="palette" onClick={onViewChange} />
        <NavItem view={View.VIDEO_STUDIO} current={currentView} label="Video Studio" icon="movie_filter" onClick={onViewChange} />
        
        <div className="text-xs font-semibold text-slate-600 px-4 py-2 uppercase tracking-wider mt-6">Intelligence</div>
        <NavItem view={View.OMNI_CHAT} current={currentView} label="Omni Chat" icon="chat_bubble" onClick={onViewChange} />
        <NavItem view={View.AUDIO_TOOLS} current={currentView} label="Transcriber" icon="description" onClick={onViewChange} />
      </div>

      <div className="p-4 border-t border-slate-800">
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-xs text-slate-500 hover:text-blue-400 transition-colors justify-center">
           <span className="material-icons text-sm">info</span>
           <span>Billing Information</span>
        </a>
      </div>
    </div>
  );
};
