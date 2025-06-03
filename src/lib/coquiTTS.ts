
// Coqui-TTS integration utilities
export interface CoquiTTSRequest {
  text: string;
  model: string;
  language: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface CoquiTTSResponse {
  audioUrl: string;
  success: boolean;
  error?: string;
}

// Available Coqui-TTS models
export const COQUI_MODELS = {
  'en-US': [
    { 
      name: 'Female-English-Natural', 
      model: 'tts_models/en/ljspeech/tacotron2-DDC_ph',
      description: 'High-quality female English voice'
    },
    { 
      name: 'Male-English-Natural', 
      model: 'tts_models/en/sam/tacotron-DDC',
      description: 'Natural male English voice'
    },
    { 
      name: 'Female-English-Expressive', 
      model: 'tts_models/en/jenny/jenny',
      description: 'Expressive female voice with emotions'
    }
  ],
  'ar-SA': [
    { 
      name: 'Female-Arabic-Natural', 
      model: 'tts_models/ar/css10/vits',
      description: 'Natural Arabic female voice'
    },
    { 
      name: 'Male-Arabic-Classical', 
      model: 'tts_models/ar/css10/glow-tts',
      description: 'Classical Arabic male voice'
    }
  ]
};

// Enhanced browser synthesis with improved Arabic support
export const generateCoquiTTS = async (request: CoquiTTSRequest): Promise<Blob> => {
  try {
    console.log('Generating with enhanced browser synthesis:', request.model);
    
    // Enhanced synthesis for Arabic and English
    const utterance = new SpeechSynthesisUtterance(request.text);
    
    // Get better voices for the language
    const voices = speechSynthesis.getVoices();
    let selectedVoice;
    
    if (request.language.includes('ar')) {
      // Find the best Arabic voice
      selectedVoice = voices.find(v => 
        v.lang.includes('ar') && 
        (v.name.includes('Neural') || v.name.includes('Enhanced'))
      ) || voices.find(v => v.lang.includes('ar'));
    } else {
      // Find the best English voice
      selectedVoice = voices.find(v => 
        v.lang.includes('en') && 
        (v.name.includes('Neural') || v.name.includes('Enhanced') || v.name.includes('Google'))
      );
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = request.language;
    }
    
    // Apply voice parameters
    utterance.rate = request.rate;
    utterance.pitch = request.pitch;
    utterance.volume = request.volume;
    
    // Enhanced text preprocessing for Arabic
    if (request.language.includes('ar')) {
      // Arabic text preprocessing - add pauses for better pronunciation
      utterance.text = request.text
        .replace(/\./g, ' . ')
        .replace(/،/g, ' ، ')
        .replace(/؟/g, ' ؟ ')
        .replace(/!/g, ' ! ');
    } else {
      // English text preprocessing
      utterance.text = request.text
        .replace(/\./g, '. ')
        .replace(/,/g, ', ')
        .replace(/!/g, '! ')
        .replace(/\?/g, '? ');
    }
    
    return new Promise((resolve, reject) => {
      // Create audio context for recording
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const destination = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        resolve(blob);
      };
      
      utterance.onstart = () => mediaRecorder.start();
      utterance.onend = () => {
        setTimeout(() => mediaRecorder.stop(), 100);
      };
      utterance.onerror = () => reject(new Error('Speech synthesis failed'));
      
      speechSynthesis.speak(utterance);
    });
    
  } catch (error) {
    console.error('Enhanced synthesis failed:', error);
    throw error;
  }
};

// Voice cloning simulation (browser-based)
export const cloneVoiceWithCoqui = async (audioBlob: Blob, voiceName: string): Promise<string> => {
  try {
    console.log('Processing voice clone:', voiceName);
    
    // Store the audio for later use (in real implementation, this would train a model)
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Save to localStorage for persistence
    const voiceData = {
      name: voiceName,
      audioUrl,
      timestamp: Date.now()
    };
    
    const existingVoices = JSON.parse(localStorage.getItem('clonedVoices') || '[]');
    existingVoices.push(voiceData);
    localStorage.setItem('clonedVoices', JSON.stringify(existingVoices));
    
    return audioUrl;
    
  } catch (error) {
    console.error('Voice cloning failed:', error);
    throw error;
  }
};

// Check if enhanced synthesis is available
export const checkCoquiTTSStatus = async (): Promise<boolean> => {
  try {
    // Check if speech synthesis is supported
    return 'speechSynthesis' in window && speechSynthesis.getVoices().length > 0;
  } catch (error) {
    return false;
  }
};
