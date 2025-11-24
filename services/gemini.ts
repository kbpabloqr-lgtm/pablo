import { GoogleGenAI } from "@google/genai";

// Helper to ensure we have a paid key for Veo/Pro Image
export const ensurePaidKey = async (): Promise<void> => {
  if (window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
  }
};

export const getClient = async (requiresPaidKey: boolean = false): Promise<GoogleGenAI> => {
  if (requiresPaidKey) {
    await ensurePaidKey();
  }
  // If window.aistudio is used, process.env.API_KEY is automatically injected with the selected key
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- Helper for file to Base64 ---
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
