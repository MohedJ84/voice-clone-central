
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
    console.log('Language:', request.language, 'Text:', request.text.substring(0, 50));
    
    // Enhanced synthesis for Arabic and English
    const utterance = new SpeechSynthesisUtterance(request.text);
    
    // Get better voices for the language
    const voices = speechSynthesis.getVoices();
    console.log('Available voices for selection:', voices.length);
    
    let selectedVoice;
    
    if (request.language.includes('ar')) {
      console.log('Looking for Arabic voices...');
      // Find the best Arabic voice
      selectedVoice = voices.find(v => 
        v.lang.includes('ar') && 
        (v.name.includes('Neural') || v.name.includes('Enhanced') || v.name.includes('Microsoft'))
      ) || voices.find(v => 
        v.lang.includes('ar')
      ) || voices.find(v => 
        v.name.includes('Google') || v.name.includes('Microsoft')
      );
      
      console.log('Selected Arabic voice:', selectedVoice?.name, selectedVoice?.lang);
    } else {
      // Find the best English voice
      selectedVoice = voices.find(v => 
        v.lang.includes('en') && 
        (v.name.includes('Neural') || v.name.includes('Enhanced') || v.name.includes('Google'))
      ) || voices.find(v => v.lang.includes('en'));
      
      console.log('Selected English voice:', selectedVoice?.name, selectedVoice?.lang);
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = request.language;
    } else {
      console.warn('No suitable voice found, using default');
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
        .replace(/!/g, ' ! ')
        .replace(/\s+/g, ' ')
        .trim();
      console.log('Processed Arabic text:', utterance.text);
    } else {
      // English text preprocessing
      utterance.text = request.text
        .replace(/\./g, '. ')
        .replace(/,/g, ', ')
        .replace(/!/g, '! ')
        .replace(/\?/g, '? ');
    }
    
    return new Promise((resolve, reject) => {
      try {
        // Create a simple blob with text info (browser fallback)
        const textBlob = new Blob([request.text], { type: 'text/plain' });
        
        // Speak the utterance
        speechSynthesis.cancel(); // Cancel any previous speech
        speechSynthesis.speak(utterance);
        
        utterance.onstart = () => {
          console.log('Speech synthesis started');
          // Return a simple blob for now
          resolve(textBlob);
        };
        
        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          reject(new Error('Speech synthesis failed'));
        };
        
        utterance.onend = () => {
          console.log('Speech synthesis completed');
        };
        
      } catch (error) {
        console.error('Error in synthesis setup:', error);
        reject(error);
      }
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
      id: Date.now().toString(),
      name: voiceName,
      audioUrl,
      type: 'cloned',
      dateCreated: new Date().toISOString()
    };
    
    const existingVoices = JSON.parse(localStorage.getItem('voiceLibrary') || '[]');
    existingVoices.push(voiceData);
    localStorage.setItem('voiceLibrary', JSON.stringify(existingVoices));
    
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
    const isSupported = 'speechSynthesis' in window;
    if (isSupported) {
      // Trigger voice loading
      speechSynthesis.getVoices();
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};
