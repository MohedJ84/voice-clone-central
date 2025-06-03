
// Utility functions for voice generation and management
export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
}

export interface VoiceGenerationOptions {
  text: string;
  voice: string;
  language: string;
  settings: VoiceSettings;
}

// Get available high-quality voices that sound more human
export const getLocalVoices = (): SpeechSynthesisVoice[] => {
  const voices = speechSynthesis.getVoices();
  
  // Filter for higher quality voices that sound more natural
  return voices.filter(voice => {
    const isSupported = voice.lang.includes('en') || voice.lang.includes('ar');
    const isHighQuality = voice.name.includes('Neural') || 
                         voice.name.includes('Enhanced') || 
                         voice.name.includes('Premium') ||
                         voice.name.includes('Natural') ||
                         !voice.name.includes('eSpeak');
    
    return isSupported && isHighQuality;
  });
};

// Enhanced speech synthesis for more natural output
export const generateNaturalSpeech = (options: VoiceGenerationOptions): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const utterance = new SpeechSynthesisUtterance(options.text);
      const voices = getLocalVoices();
      const selectedVoice = voices.find(v => v.name === options.voice);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      // Optimize for natural speech
      utterance.rate = options.settings.rate;
      utterance.pitch = options.settings.pitch;
      utterance.volume = options.settings.volume;
      
      // Add natural pauses and emphasis
      utterance.text = options.text
        .replace(/\./g, '. ')
        .replace(/,/g, ', ')
        .replace(/!/g, '! ')
        .replace(/\?/g, '? ');

      // Create audio context for recording
      const context = new AudioContext();
      const destination = context.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(destination.stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        resolve(blob);
      };

      utterance.onstart = () => {
        mediaRecorder.start();
      };

      utterance.onend = () => {
        mediaRecorder.stop();
      };

      utterance.onerror = () => {
        reject(new Error('Speech synthesis failed'));
      };

      speechSynthesis.speak(utterance);
    } catch (error) {
      reject(error);
    }
  });
};

// Download audio file
export const downloadAudio = (blob: Blob, filename: string = 'voice_output.wav') => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// Save voice to library
export const saveToVoiceLibrary = (voice: {
  name: string;
  audioBlob: Blob;
  type: 'cloned' | 'generated';
  language?: string;
}) => {
  const audioUrl = URL.createObjectURL(voice.audioBlob);
  const voiceItem = {
    id: Date.now().toString(),
    name: voice.name,
    audioUrl,
    type: voice.type,
    language: voice.language,
    dateCreated: new Date().toISOString()
  };

  const stored = localStorage.getItem('voiceLibrary') || '[]';
  const voices = JSON.parse(stored);
  voices.push(voiceItem);
  localStorage.setItem('voiceLibrary', JSON.stringify(voices));

  return voiceItem;
};
