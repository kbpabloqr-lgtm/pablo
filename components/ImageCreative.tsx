
import React, { useState } from 'react';
import { AspectRatio, ImageSize } from '../types';
import { getClient, fileToGenerativePart } from '../services/gemini';
import { GoogleGenAI } from '@google/genai';

export const ImageCreative: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'edit'>('generate');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // Generation Settings
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [size, setSize] = useState<ImageSize>(ImageSize.K1);

  // Edit Settings
  const [sourceImage, setSourceImage] = useState<File | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setResultImage(null);
    try {
      const ai = await getClient(true); // Requires Paid Key (Pro)
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: size
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
           setResultImage(`data:image/png;base64,${part.inlineData.data}`);
           break;
        }
      }
    } catch (error: any) {
      console.error(error);
      alert('Generation failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!prompt || !sourceImage) return;
    setLoading(true);
    setResultImage(null);
    try {
      const ai = await getClient(false); // Nano Banana (Flash Image)
      const imagePart = await fileToGenerativePart(sourceImage);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            imagePart,
            { text: prompt }
          ]
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
           setResultImage(`data:image/png;base64,${part.inlineData.data}`);
           break;
        }
      }
    } catch (error: any) {
      console.error(error);
      alert('Editing failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg w-fit">
        <button 
          onClick={() => setActiveTab('generate')}
          className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
            activeTab === 'generate' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-slate-400 hover:text-white'
          }`}
        >
          Generate (Pro)
        </button>
        <button 
          onClick={() => setActiveTab('edit')}
          className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
            activeTab === 'edit' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-slate-400 hover:text-white'
          }`}
        >
          Edit (Flash)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 h-fit overflow-y-auto">
          
          {activeTab === 'edit' && (
             <div className="space-y-3">
               <label className="block text-sm font-medium text-slate-300">Source Image</label>
               <div className={`border-2 border-dashed rounded-xl p-4 transition-colors ${sourceImage ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
                 <input 
                   type="file" 
                   accept="image/*"
                   onChange={(e) => setSourceImage(e.target.files?.[0] || null)}
                   className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                 />
                 {sourceImage && <div className="mt-2 text-xs text-blue-300 flex items-center gap-1"><span className="material-icons text-sm">check_circle</span> {sourceImage.name}</div>}
               </div>
             </div>
          )}

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={activeTab === 'generate' ? "A futuristic city on Mars, cinematic lighting, 8k..." : "Add a retro filter, remove the background..."}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none h-40 resize-none text-sm leading-relaxed"
            />
          </div>

          {activeTab === 'generate' && (
            <>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Aspect Ratio</label>
                <select 
                  value={aspectRatio} 
                  onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500"
                >
                  {Object.entries(AspectRatio).map(([key, value]) => (
                    <option key={key} value={value}>{key.replace(/_/g, ' ')} ({value})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(ImageSize).map(s => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                        size === s 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            onClick={activeTab === 'generate' ? handleGenerate : handleEdit}
            disabled={loading || !prompt || (activeTab === 'edit' && !sourceImage)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-white shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (activeTab === 'generate' ? 'Generate Image' : 'Edit Image')}
          </button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 bg-slate-900/50 rounded-2xl flex items-center justify-center p-6 border-2 border-dashed border-slate-700/50 min-h-[400px] relative overflow-hidden group">
          {loading ? (
            <div className="text-center z-10">
               <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 animate-pulse flex items-center justify-center shadow-2xl shadow-blue-500/20">
                  <span className="material-icons text-4xl text-white animate-spin">brush</span>
               </div>
               <p className="text-slate-300 font-medium text-lg">Creating masterpiece...</p>
               <p className="text-slate-500 text-sm mt-2">Powered by Gemini 3 Pro</p>
            </div>
          ) : resultImage ? (
            <div className="relative w-full h-full flex items-center justify-center">
               <img src={resultImage} alt="Generated" className="max-w-full max-h-full rounded-lg shadow-2xl" />
               <a 
                 href={resultImage} 
                 download={`gemini-${Date.now()}.png`}
                 className="absolute bottom-4 right-4 bg-black/70 hover:bg-black text-white px-4 py-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"
               >
                 <span className="material-icons text-sm">download</span> Download
               </a>
            </div>
          ) : (
            <div className="text-slate-500 text-center">
              <span className="material-icons text-6xl mb-4 opacity-20">image</span>
              <p>Result will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
