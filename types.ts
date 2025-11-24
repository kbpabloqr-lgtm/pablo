export enum View {
  LIVE_ASSISTANT = 'LIVE_ASSISTANT',
  IMAGE_STUDIO = 'IMAGE_STUDIO',
  VIDEO_STUDIO = 'VIDEO_STUDIO',
  OMNI_CHAT = 'OMNI_CHAT',
  AUDIO_TOOLS = 'AUDIO_TOOLS'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
  video?: string;
  isThinking?: boolean;
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT_2_3 = '2:3',
  LANDSCAPE_3_2 = '3:2',
  PORTRAIT_3_4 = '3:4',
  LANDSCAPE_4_3 = '4:3',
  PORTRAIT_9_16 = '9:16',
  LANDSCAPE_16_9 = '16:9',
  CINEMATIC_21_9 = '21:9'
}

export enum ImageSize {
  K1 = '1K',
  K2 = '2K',
  K4 = '4K'
}

// Minimal interface for window.aistudio
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}