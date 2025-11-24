
import React, { useState, useRef, useEffect } from 'react';
import { getClient, fileToGenerativePart } from '../services/gemini';
import { ChatMessage } from '../types';
import { Modality } from '@google/genai';

export const OmniChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinkingMode, setThinkingMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if ((!input && !file) || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    if (file) {
      if (file.type.startsWith('image')) userMsg.image = URL.createObjectURL(file);
      if (file.type.startsWith('video')) userMsg.video = URL.createObjectURL(file);
    }

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setInput('');
    const currentFile = file;
    setFile(null);

    try {
      const ai = await getClient(false);
      const model = 'gemini-3-pro-preview';
      
      const config: any = {};
      // Thinking config - Gemini 3 Pro supports explicit thinking budget
      if (thinkingMode) {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }

      let response;

      if (currentFile) {
        const filePart = await fileToGenerativePart(currentFile);
        response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              filePart,
              { text: userMsg.text || (currentFile.type.startsWith('video') ? "Analyze this video." : "Analyze this image.") }
            ]
          },
          config
        });
      } else {
        // Construct history for context
        const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }] 
        }));
        
        const chat = ai.chats.create({ model, config, history });
        response = await chat.sendMessage({ message: userMsg.text });
      }

      const text = response.text || "No response generated.";
      setMessages(prev => [...prev, { role: 'model', text, isThinking: thinkingMode }]);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const playTTS = async (text: string) => {
    try {
      const ai = await getClient(false);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: { parts: [{ text }] },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const binaryString = atob(audioData);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        
        const buffer = await audioCtx.decodeAudioData(bytes.buffer);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);
      }
    } catch (e) {
      console.error(e);
      alert("TTS failed");
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/50 rounded-xl overflow-hidden backdrop-blur-sm">
      <div className="p-4 bg-slate-900/80 border-b border-slate-700/50 flex justify-between items-center backdrop-blur-md sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-white flex items-center gap-2 text-lg">
            Omni Chat
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs border border-blue-500/30">Gemini 3 Pro</span>
          </h2>
          <p className="text-xs text-slate-400">Advanced reasoning & multimodal analysis</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-slate-800/50 p-1.5 rounded-full border border-slate-700/50">
          <span className={`text-xs font-bold tracking-wider px-2 ${thinkingMode ? 'text-purple-300' : 'text-slate-500'}`}>
            {thinkingMode ? 'DEEP THINKING' : 'FAST'}
          </span>
          <button 
            onClick={() => setThinkingMode(!thinkingMode)}
            className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${thinkingMode ? 'bg-purple-600' : 'bg-slate-600'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${thinkingMode ? 'translate-x-4' : ''}`}></div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
            <span className="material-icons text-6xl mb-4">chat_bubble_outline</span>
            <p>Start a conversation or upload media</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-5 shadow-lg ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm' 
                : 'bg-slate-800 border border-slate-700/50 text-slate-200 rounded-tl-sm'
            }`}>
              {msg.image && (
                <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
                  <img src={msg.image} className="max-h-64 w-full object-cover" alt="upload" />
                </div>
              )}
              {msg.video && (
                <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
                  <video src={msg.video} className="max-h-64 w-full object-cover" controls />
                </div>
              )}
              
              <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
              
              {msg.role === 'model' && (
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                   <div className="flex items-center gap-2">
                     {msg.isThinking && (
                       <span className="flex items-center gap-1 text-[10px] text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                         <span className="material-icons text-[12px]">psychology</span>
                         THOUGHT PROCESS
                       </span>
                     )}
                   </div>
                   <button 
                     onClick={() => playTTS(msg.text)} 
                     className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                     title="Read aloud"
                   >
                     <span className="material-icons text-lg">volume_up</span>
                   </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
           <div className="flex justify-start">
             <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm p-4 flex items-center space-x-3 shadow-lg">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-xs text-slate-400 font-medium animate-pulse">
                  {thinkingMode ? 'Reasoning deeply...' : 'Generating response...'}
                </span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900/80 border-t border-slate-700/50 backdrop-blur-md">
        {file && (
          <div className="flex items-center gap-3 mb-3 p-3 bg-slate-800 rounded-lg border border-slate-700 shadow-sm animate-fade-in-up">
            <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center">
              <span className="material-icons text-blue-400">
                {file.type.startsWith('video') ? 'movie' : 'image'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200 font-medium truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button onClick={() => setFile(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
              <span className="material-icons text-sm">close</span>
            </button>
          </div>
        )}
        
        <div className="flex space-x-3 items-end">
          <label className="p-3 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-700">
            <span className="material-icons">add_photo_alternate</span>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={file ? (file.type.startsWith('video') ? "Ask about this video..." : "Ask about this image...") : "Message Gemini..."}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none min-h-[50px] max-h-[150px] custom-scrollbar"
              rows={1}
            />
          </div>
          
          <button 
            onClick={handleSend}
            disabled={(!input && !file) || loading}
            className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all active:scale-95"
          >
            <span className="material-icons">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
