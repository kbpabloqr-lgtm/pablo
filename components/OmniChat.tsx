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
      // Thinking config
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
        // Chat history context (simplified for single turn or accumulating context manually)
        // Here we just send the last message for simplicity in this demo structure, 
        // but robust chat usually sends history. Let's send history.
        const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }] // Simplified history, ignoring previous images for this demo to avoid complexity
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
    <div className="h-full flex flex-col bg-slate-900 rounded-xl overflow-hidden">
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <h2 className="font-bold text-white flex items-center gap-2">
          <span className="material-icons text-blue-400">psychology</span>
          Gemini 3 Pro Intelligence
        </h2>
        <div className="flex items-center space-x-2">
          <span className={`text-xs uppercase font-bold tracking-wider ${thinkingMode ? 'text-purple-400' : 'text-slate-500'}`}>Thinking Mode</span>
          <button 
            onClick={() => setThinkingMode(!thinkingMode)}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${thinkingMode ? 'bg-purple-600' : 'bg-slate-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${thinkingMode ? 'translate-x-6' : ''}`}></div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
              {msg.image && <img src={msg.image} className="max-h-48 rounded mb-2" alt="upload" />}
              {msg.video && <video src={msg.video} className="max-h-48 rounded mb-2" controls />}
              <div className="whitespace-pre-wrap">{msg.text}</div>
              {msg.role === 'model' && (
                <div className="mt-2 flex items-center gap-2 border-t border-slate-700/50 pt-2">
                   {msg.isThinking && <span className="text-xs text-purple-400 font-mono">Thought Process Used</span>}
                   <button onClick={() => playTTS(msg.text)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white ml-auto">
                     <span className="material-icons text-sm">volume_up</span>
                   </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
           <div className="flex justify-start">
             <div className="bg-slate-800 rounded-2xl p-4 flex space-x-2">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-800 border-t border-slate-700">
        {file && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-slate-700 rounded text-sm text-slate-300">
            <span className="material-icons text-sm">attach_file</span>
            {file.name}
            <button onClick={() => setFile(null)} className="ml-auto hover:text-white">✕</button>
          </div>
        )}
        <div className="flex space-x-2">
          <label className="p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
            <span className="material-icons">add_photo_alternate</span>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={file ? (file.type.startsWith('video') ? "Ask about this video..." : "Ask about this image...") : "Ask anything..."}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={handleSend}
            disabled={(!input && !file) || loading}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-icons">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
