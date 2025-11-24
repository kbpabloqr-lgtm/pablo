import React, { useState, useRef } from 'react';
import { getClient, blobToBase64 } from '../services/gemini';

export const AudioTools: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribe(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      setTranscript('');
    } catch (err) {
      console.error(err);
      alert("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const transcribe = async (audioBlob: Blob) => {
    setLoading(true);
    try {
      const ai = await getClient(false);
      const base64Audio = await blobToBase64(audioBlob);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'audio/webm',
                data: base64Audio
              }
            },
            { text: "Transcribe this audio exactly." }
          ]
        }
      });
      
      setTranscript(response.text || "No speech detected.");
    } catch (err: any) {
      setTranscript("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 space-y-8 text-center">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-white">Audio Transcription</h2>
        <p className="text-slate-400">Record your voice and let Gemini 2.5 Flash transcribe it instantly.</p>
      </div>

      <div className="relative">
         <button
           onClick={recording ? stopRecording : startRecording}
           className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl shadow-2xl transition-all duration-300 ${recording ? 'bg-red-600 scale-110 shadow-[0_0_30px_rgba(220,38,38,0.5)]' : 'bg-slate-700 hover:bg-slate-600'}`}
         >
           <span className="material-icons text-white">{recording ? 'stop' : 'mic'}</span>
         </button>
         {recording && <div className="absolute -top-4 -right-4 w-6 h-6 bg-red-500 rounded-full animate-ping"></div>}
      </div>

      <div className="w-full max-w-2xl bg-slate-800 rounded-xl p-6 min-h-[200px] text-left border border-slate-700">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Transcript</h3>
        {loading ? (
          <div className="text-slate-400 italic animate-pulse">Transcribing audio...</div>
        ) : (
          <p className="text-slate-200 whitespace-pre-wrap text-lg leading-relaxed">{transcript || "Transcript will appear here after recording stops."}</p>
        )}
      </div>
    </div>
  );
};
