import React, { useState } from 'react';
import { getClient, fileToGenerativePart } from '../services/gemini';

export const VideoCreative: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [refImage, setRefImage] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setVideoUri(null);
    setStatusMessage('Initializing Veo...');
    
    try {
      const ai = await getClient(true); // Veo requires Paid Key

      let contents: any = {};
      
      // Setup payload based on if image exists
      // Using generateVideos method
      const config: any = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      };
      
      let operation;

      if (refImage) {
        const imagePart = await fileToGenerativePart(refImage);
        operation = await ai.models.generateVideos({
           model: 'veo-3.1-fast-generate-preview',
           prompt: prompt,
           image: {
             imageBytes: imagePart.inlineData.data,
             mimeType: imagePart.inlineData.mimeType
           },
           config: config
        });
      } else {
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt,
          config: config
        });
      }

      setStatusMessage('Veo is dreaming... (this may take a minute)');
      
      // Polling
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        setStatusMessage('Rendering frames...');
      }

      const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) {
        // Must append API Key to fetch
        setVideoUri(`${uri}&key=${process.env.API_KEY}`);
      } else {
        throw new Error("No video URI returned");
      }

    } catch (error: any) {
      console.error(error);
      alert('Video generation failed: ' + error.message);
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="border-b border-slate-700 pb-2">
         <h2 className="text-2xl font-bold text-white">Veo Video Studio</h2>
         <p className="text-slate-400">Generate high-quality videos from text or image prompts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-1 space-y-6 bg-slate-800 p-6 rounded-xl h-fit">
          <div className="space-y-2">
            <label className="block text-sm text-slate-400">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A cyberpunk cat driving a neon motorcycle..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none h-32 resize-none"
            />
          </div>

           <div className="space-y-2">
             <label className="block text-sm text-slate-400">Reference Image (Optional)</label>
             <input 
               type="file" 
               accept="image/*"
               onChange={(e) => setRefImage(e.target.files?.[0] || null)}
               className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
             />
           </div>

           <div className="space-y-2">
            <label className="block text-sm text-slate-400">Aspect Ratio</label>
            <div className="flex space-x-2">
               <button 
                  onClick={() => setAspectRatio('16:9')}
                  className={`flex-1 py-2 rounded border ${aspectRatio === '16:9' ? 'bg-purple-600 border-purple-600' : 'bg-slate-900 border-slate-700'}`}
               >Landscape (16:9)</button>
               <button 
                  onClick={() => setAspectRatio('9:16')}
                  className={`flex-1 py-2 rounded border ${aspectRatio === '9:16' ? 'bg-purple-600 border-purple-600' : 'bg-slate-900 border-slate-700'}`}
               >Portrait (9:16)</button>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-500 hover:to-pink-500"
          >
            {loading ? 'Generating...' : 'Create Video'}
          </button>
        </div>

        <div className="lg:col-span-2 bg-slate-900 rounded-xl flex items-center justify-center p-4 border-2 border-dashed border-slate-700 min-h-[400px]">
          {loading ? (
             <div className="text-center">
               <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
               <p className="text-purple-300 animate-pulse">{statusMessage}</p>
             </div>
          ) : videoUri ? (
            <video controls src={videoUri} className="max-w-full max-h-[600px] rounded-lg shadow-2xl" autoPlay loop />
          ) : (
             <div className="text-slate-500 text-center">
               <p className="text-4xl mb-2">🎬</p>
               <p>Generated video will play here</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
