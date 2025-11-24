
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const NavItem = ({ view, current, label, icon, onClick }: { view: View, current: View, label: string, icon: string, onClick: (v: View) => void }) => (
  <button
    onClick={() => onClick(view)}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      current === view 
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/20' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
    }`}
  >
    <span className={`material-icons transition-colors ${current === view ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>{icon}</span>
    <span className="font-medium tracking-wide">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="w-80 bg-slate-950 h-full flex flex-col border-r border-slate-800/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950 pointer-events-none"></div>
      
      <div className="p-8 relative z-10">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="material-icons text-white text-lg">auto_awesome</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Omni-Studio
          </h1>
        </div>
        <p className="text-xs text-slate-500 pl-11">Powered by Gemini 2.5 & 3.0</p>
      </div>
      
      <div className="flex-1 px-4 space-y-2 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="text-[10px] font-bold text-slate-600 px-4 py-2 uppercase tracking-widest">Live Interactions</div>
        <NavItem view={View.LIVE_ASSISTANT} current={currentView} label="Live Assistant" icon="graphic_eq" onClick={onViewChange} />
        
        <div className="text-[10px] font-bold text-slate-600 px-4 py-2 uppercase tracking-widest mt-6">Creative Suite</div>
        <NavItem view={View.IMAGE_STUDIO} current={currentView} label="Image Studio" icon="palette" onClick={onViewChange} />
        <NavItem view={View.VIDEO_STUDIO} current={currentView} label="Video Studio" icon="movie_filter" onClick={onViewChange} />
        
        <div className="text-[10px] font-bold text-slate-600 px-4 py-2 uppercase tracking-widest mt-6">Intelligence</div>
        <NavItem view={View.OMNI_CHAT} current={currentView} label="Omni Chat" icon="chat_bubble" onClick={onViewChange} />
        <NavItem view={View.AUDIO_TOOLS} current={currentView} label="Transcriber" icon="description" onClick={onViewChange} />
      </div>

      <div className="p-4 border-t border-slate-800/50 relative z-10">
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" 
           className="flex items-center justify-center space-x-2 text-xs text-slate-500 hover:text-blue-400 transition-colors p-3 rounded-lg hover:bg-slate-900">
           <span className="material-icons text-sm">credit_card</span>
           <span>Billing Information</span>
        </a>
      </div>
    </div>
  );
};
