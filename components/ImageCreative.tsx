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

      // Extract image
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
        model: 'gemini-2.5-flash-image', // Correct Flash Image Model
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
      <div className="flex space-x-4 border-b border-slate-700 pb-2">
        <button 
          onClick={() => setActiveTab('generate')}
          className={`pb-2 text-lg font-medium transition-colors ${activeTab === 'generate' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
        >
          Generate (Pro)
        </button>
        <button 
          onClick={() => setActiveTab('edit')}
          className={`pb-2 text-lg font-medium transition-colors ${activeTab === 'edit' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
        >
          Edit (Nano Banana)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6 bg-slate-800 p-6 rounded-xl h-fit">
          
          {activeTab === 'edit' && (
             <div className="space-y-2">
               <label className="block text-sm text-slate-400">Source Image</label>
               <input 
                 type="file" 
                 accept="image/*"
                 onChange={(e) => setSourceImage(e.target.files?.[0] || null)}
                 className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
               />
               {sourceImage && <div className="text-xs text-green-400">Selected: {sourceImage.name}</div>}
             </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm text-slate-400">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={activeTab === 'generate' ? "A futuristic city on Mars..." : "Add a retro filter, remove the background..."}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
            />
          </div>

          {activeTab === 'generate' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm text-slate-400">Aspect Ratio</label>
                <select 
                  value={aspectRatio} 
                  onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {Object.values(AspectRatio).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm text-slate-400">Size</label>
                <div className="flex space-x-2">
                  {Object.values(ImageSize).map(s => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`flex-1 py-2 rounded-lg border ${size === s ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
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
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500"
          >
            {loading ? 'Processing...' : (activeTab === 'generate' ? 'Generate Image' : 'Edit Image')}
          </button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl flex items-center justify-center p-4 border-2 border-dashed border-slate-700 min-h-[400px]">
          {loading ? (
            <div className="text-center animate-pulse">
               <div className="text-6xl mb-4">🎨</div>
               <p className="text-slate-400">Creating masterpiece...</p>
            </div>
          ) : resultImage ? (
            <img src={resultImage} alt="Generated" className="max-w-full max-h-[600px] rounded-lg shadow-2xl" />
          ) : (
            <div className="text-slate-500 text-center">
              <p>Result will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
