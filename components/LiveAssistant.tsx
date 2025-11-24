import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { getClient } from '../services/gemini';
import { blobToBase64 } from '../services/gemini';

// Audio config constants
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export const LiveAssistant: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  // Refs for audio handling to avoid re-renders
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const startSession = async () => {
    try {
      setError(null);
      const ai = await getClient(false); // Standard client
      
      // Setup Audio Contexts
      const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      const outputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;
      
      // Get Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Connect Live API
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setConnected(true);
            
            // Audio Input Processing
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Simple volume meter
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.sqrt(sum / inputData.length));

              const pcmBlob = createPcmBlob(inputData);
              sessionPromiseRef.current?.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Audio Output
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              const ctx = outputContextRef.current;
              if(!ctx) return;

              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(audioData), ctx, OUTPUT_SAMPLE_RATE, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Interruption
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            setConnected(false);
          },
          onerror: (e) => {
            console.error(e);
            setError("Connection error. Please try again.");
            disconnect();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: "You are a helpful, witty, and concise AI assistant. You are chatting with the user via voice."
        }
      });

    } catch (err: any) {
      setError(err.message || "Failed to start session");
      disconnect();
    }
  };

  const disconnect = () => {
    // Cleanup
    sessionPromiseRef.current?.then((session: any) => session.close());
    sessionPromiseRef.current = null;

    streamRef.current?.getTracks().forEach(t => t.stop());
    processorRef.current?.disconnect();
    inputContextRef.current?.close();
    outputContextRef.current?.close();
    
    setConnected(false);
    setVolume(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => disconnect();
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-8 p-6 bg-slate-900 rounded-2xl relative overflow-hidden">
      {/* Visualizer Background Effect */}
      <div className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${connected ? 'opacity-30' : 'opacity-0'}`}>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="z-10 text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">Gemini Live Voice</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Experience low-latency, real-time voice conversations with Gemini 2.5.
        </p>
      </div>

      <div className="z-10 relative">
        <div className={`w-48 h-48 rounded-full flex items-center justify-center border-4 transition-all duration-100 ${connected ? 'border-blue-400 shadow-[0_0_30px_rgba(96,165,250,0.5)]' : 'border-slate-700'}`}>
           <div 
             className={`w-40 h-40 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 transition-all duration-100 flex items-center justify-center`}
             style={{ transform: `scale(${1 + volume * 2})` }}
           >
             <span className="material-icons text-5xl text-white">
               {connected ? 'graphic_eq' : 'mic_off'}
             </span>
           </div>
        </div>
      </div>

      <div className="z-10">
        {!connected ? (
          <button 
            onClick={startSession}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full shadow-lg transition-transform active:scale-95"
          >
            Start Conversation
          </button>
        ) : (
          <button 
            onClick={disconnect}
            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-full shadow-lg transition-transform active:scale-95"
          >
            End Call
          </button>
        )}
      </div>

      {error && <div className="z-10 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg">{error}</div>}
    </div>
  );
};

// --- Audio Helpers ---

function createPcmBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  const bytes = new Uint8Array(int16.buffer);
  
  // Encode manually to avoid lib dependency
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
