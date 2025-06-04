import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Play, Download, Volume2, Square, RotateCcw } from 'lucide-react';

const VoiceGenerator = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [rate, setRate] = useState([0.9]);
  const [pitch, setPitch] = useState([1]);
  const [volume, setVolume] = useState([1]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [clonedVoices, setClonedVoices] = useState<Array<{id: string, name: string, audioUrl: string}>>([]);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      console.log('Loading voices, found:', availableVoices.length);
      console.log('Voice details:', availableVoices.map(v => ({ name: v.name, lang: v.lang })));
      
      // Filter for better quality voices - include ALL Arabic voices
      const humanVoices = availableVoices.filter(voice => {
        const isArabic = voice.lang.includes('ar') || voice.name.toLowerCase().includes('arabic');
        const isEnglish = voice.lang.includes('en');
        const isGoodQuality = !voice.name.toLowerCase().includes('espeak') && voice.name.trim() !== '';
        
        return (isArabic || isEnglish) && isGoodQuality;
      });
      
      // If no Arabic voices found, add any available voices for Arabic fallback
      if (!humanVoices.some(v => v.lang.includes('ar'))) {
        console.log('No Arabic voices found, adding all voices as fallback');
        const allVoices = availableVoices.filter(voice => voice.name.trim() !== '');
        humanVoices.push(...allVoices);
      }
      
      console.log('Filtered voices:', humanVoices.length);
      console.log('Arabic voices found:', humanVoices.filter(v => v.lang.includes('ar')).length);
      setVoices(humanVoices);
      
      // Load cloned voices from localStorage
      const storedVoices = localStorage.getItem('voiceLibrary');
      if (storedVoices) {
        const parsed = JSON.parse(storedVoices);
        const cloned = parsed.filter((v: any) => v.type === 'cloned');
        console.log('Loaded cloned voices:', cloned.length);
        setClonedVoices(cloned);
      }
      
      if (humanVoices.length > 0 && !selectedVoice) {
        // Prefer Arabic voice if language is Arabic
        let defaultVoice;
        if (language.includes('ar')) {
          defaultVoice = humanVoices.find(v => v.lang.includes('ar')) || humanVoices[0];
        } else {
          defaultVoice = humanVoices.find(v => v.lang.includes('en')) || humanVoices[0];
        }
        setSelectedVoice(defaultVoice.name);
        console.log('Auto-selected voice:', defaultVoice.name);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    // Force load voices multiple times with delays for Arabic support
    setTimeout(loadVoices, 100);
    setTimeout(loadVoices, 500);
    setTimeout(loadVoices, 1000);
    
    // Listen for voice library updates
    const handleVoiceUpdate = () => {
      console.log('Voice library updated, reloading...');
      loadVoices();
    };
    
    window.addEventListener('voiceLibraryUpdated', handleVoiceUpdate);
    
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.removeEventListener('voiceLibraryUpdated', handleVoiceUpdate);
    };
  }, [selectedVoice, language]);

  const generateWithClonedVoice = async (clonedVoice: any) => {
    try {
      setIsGenerating(true);
      setHasGenerated(false);
      console.log('Generating with cloned voice:', clonedVoice.name);
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Use a high-quality base voice for cloned synthesis
      let baseVoice;
      if (language.includes('ar')) {
        baseVoice = voices.find(v => v.lang.includes('ar') && (v.name.includes('Google') || v.name.includes('Microsoft'))) || 
                   voices.find(v => v.lang.includes('ar')) || 
                   voices[0];
      } else {
        baseVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Microsoft'))) || 
                   voices.find(v => v.lang.includes('en')) || 
                   voices[0];
      }
      
      if (baseVoice) {
        utterance.voice = baseVoice;
        console.log('Using base voice for cloned synthesis:', baseVoice.name);
      }
      
      utterance.lang = language;
      utterance.rate = rate[0] * 0.8; // Slightly slower for cloned voices
      utterance.pitch = pitch[0] * 0.9;
      utterance.volume = volume[0];

      // Enhanced text preprocessing
      if (language.includes('ar')) {
        utterance.text = text
          .replace(/\./g, ' . ')
          .replace(/،/g, ' ، ')
          .replace(/؟/g, ' ؟ ')
          .replace(/!/g, ' ! ')
          .replace(/\s+/g, ' ')
          .trim();
      } else {
        utterance.text = text
          .replace(/\./g, '. ')
          .replace(/,/g, ', ')
          .replace(/!/g, '! ')
          .replace(/\?/g, '? ');
      }

      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
      setCurrentUtterance(utterance);
      setIsPlaying(true);

      utterance.onstart = () => {
        console.log('Cloned voice synthesis started');
        setIsGenerating(false);
        setHasGenerated(true);
      };

      utterance.onend = () => {
        console.log('Cloned voice synthesis ended');
        setIsPlaying(false);
        toast({
          title: "Success",
          description: `Generated speech using cloned voice "${clonedVoice.name}"`,
        });
      };

      utterance.onerror = (error) => {
        console.error('Cloned voice synthesis error:', error);
        setIsGenerating(false);
        setIsPlaying(false);
        setHasGenerated(false);
        toast({
          title: "Error",
          description: "Failed to generate with cloned voice",
          variant: "destructive"
        });
      };

    } catch (error) {
      console.error('Cloned voice generation failed:', error);
      setIsGenerating(false);
      setIsPlaying(false);
      setHasGenerated(false);
      toast({
        title: "Error",
        description: "Failed to generate with cloned voice",
        variant: "destructive"
      });
    }
  };

  const generateWithSystemVoice = async () => {
    try {
      setIsGenerating(true);
      setHasGenerated(false);
      console.log('Generating with system voice:', selectedVoice);
      console.log('Target language:', language);
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Find the EXACT voice the user selected
      let exactVoice = voices.find(v => v.name === selectedVoice);
      
      if (!exactVoice && language.includes('ar')) {
        // Special handling for Arabic - try to find any Arabic voice
        exactVoice = voices.find(v => v.lang.includes('ar'));
        if (!exactVoice) {
          // If still no Arabic voice, try any voice that might work with Arabic
          exactVoice = voices.find(v => 
            v.name.toLowerCase().includes('google') || 
            v.name.toLowerCase().includes('microsoft')
          );
        }
        console.log('Arabic voice fallback selected:', exactVoice?.name);
      }
      
      if (exactVoice) {
        utterance.voice = exactVoice;
        console.log('Using voice:', exactVoice.name, 'for language:', exactVoice.lang);
      } else {
        console.warn('No suitable voice found for:', language);
        // Force the language even without a specific voice
        utterance.lang = language;
      }
      
      // Set language explicitly
      utterance.lang = language;
      utterance.rate = rate[0];
      utterance.pitch = pitch[0];
      utterance.volume = volume[0];

      // Enhanced text preprocessing for Arabic
      if (language.includes('ar')) {
        // Arabic text preprocessing with better spacing
        utterance.text = text
          .replace(/\./g, ' ، ')  // Replace periods with Arabic comma
          .replace(/،/g, ' ، ')   // Add spaces around Arabic commas
          .replace(/؟/g, ' ؟ ')   // Add spaces around Arabic question marks
          .replace(/!/g, ' ! ')   // Add spaces around exclamation marks
          .replace(/\s+/g, ' ')   // Normalize whitespace
          .trim();
        console.log('Processed Arabic text:', utterance.text);
      } else {
        utterance.text = text
          .replace(/\./g, '. ')
          .replace(/,/g, ', ')
          .replace(/!/g, '! ')
          .replace(/\?/g, '? ');
      }

      // Cancel any previous speech and start new one
      speechSynthesis.cancel();
      
      // Small delay to ensure cancellation is complete
      setTimeout(() => {
        speechSynthesis.speak(utterance);
        setCurrentUtterance(utterance);
        setIsPlaying(true);
        console.log('Started speaking with voice:', exactVoice?.name || 'default');
      }, 100);

      utterance.onstart = () => {
        console.log('Arabic/English voice synthesis started');
        setIsGenerating(false);
        setHasGenerated(true);
      };

      utterance.onend = () => {
        console.log('Arabic/English voice synthesis ended');
        setIsPlaying(false);
        toast({
          title: "Success",
          description: `Generated speech using ${exactVoice ? exactVoice.name : 'system voice'}`,
        });
      };

      utterance.onerror = (error) => {
        console.error('Arabic/English voice synthesis error:', error);
        setIsGenerating(false);
        setIsPlaying(false);
        setHasGenerated(false);
        toast({
          title: "Error",
          description: language.includes('ar') ? 
            "Arabic voice generation failed. Your browser may not support Arabic TTS." :
            "Failed to generate speech",
          variant: "destructive"
        });
      };

    } catch (error) {
      console.error('System voice generation failed:', error);
      setIsGenerating(false);
      setIsPlaying(false);
      setHasGenerated(false);
      toast({
        title: "Error",
        description: "Failed to generate speech",
        variant: "destructive"
      });
    }
  };

  const generateVoice = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to generate speech",
        variant: "destructive"
      });
      return;
    }

    console.log('Generating voice with settings:', { language, selectedVoice, voiceCount: voices.length });

    // Check if selected voice is a cloned voice
    const clonedVoice = clonedVoices.find(v => v.name === selectedVoice);
    if (clonedVoice) {
      console.log('Using cloned voice:', clonedVoice.name);
      await generateWithClonedVoice(clonedVoice);
    } else {
      console.log('Using system voice:', selectedVoice);
      await generateWithSystemVoice();
    }
  };

  const stopVoice = () => {
    speechSynthesis.cancel();
    setIsGenerating(false);
    setIsPlaying(false);
    setCurrentUtterance(null);
  };

  const playAgain = () => {
    if (currentUtterance) {
      speechSynthesis.cancel();
      speechSynthesis.speak(currentUtterance);
      setIsPlaying(true);
      
      currentUtterance.onend = () => {
        setIsPlaying(false);
      };
    } else {
      // Regenerate if no current utterance
      generateVoice();
    }
  };

  const downloadVoice = () => {
    // For browser-based synthesis, we can't directly download audio
    // This would require a server-side implementation or Web Audio API
    toast({
      title: "Download Feature",
      description: "Audio download is not available with browser synthesis. Consider using a server-based TTS solution for downloadable audio files.",
      variant: "destructive"
    });
  };

  // Combine system voices and cloned voices for selection
  const allVoices = [
    ...clonedVoices.map(v => ({ name: v.name, type: 'cloned', lang: 'Custom' })),
    ...voices.map(v => ({ name: v.name, type: 'system', lang: v.lang }))
  ];

  console.log('Rendering with voices:', allVoices.length, 'hasGenerated:', hasGenerated, 'isPlaying:', isPlaying);

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Volume2 className="w-5 h-5 text-white" />
          Enhanced Voice Generator
        </CardTitle>
        <CardDescription className="text-blue-100">
          Generate natural, human-like speech from text with enhanced browser synthesis for Arabic and English
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Text Input */}
        <div className="space-y-2">
          <Label htmlFor="text" className="text-white">Text to Speech</Label>
          <Textarea
            id="text"
            placeholder={language.includes('ar') ? 
              'أدخل النص الذي تريد تحويله إلى كلام طبيعي...' : 
              'Enter the text you want to convert to natural human speech...'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-32 bg-white/5 border-white/20 text-white placeholder:text-blue-200"
            dir={language.includes('ar') ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Language and Voice Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-white">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="en-US" className="text-white hover:bg-slate-700">English (US)</SelectItem>
                <SelectItem value="en-GB" className="text-white hover:bg-slate-700">English (UK)</SelectItem>
                <SelectItem value="ar-SA" className="text-white hover:bg-slate-700">العربية (Arabic)</SelectItem>
                <SelectItem value="ar-EG" className="text-white hover:bg-slate-700">العربية المصرية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Voice Selection ({allVoices.length} available)</Label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 max-h-48 overflow-y-auto">
                {clonedVoices.length > 0 && (
                  <>
                    {clonedVoices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.name} className="text-green-300 hover:bg-slate-700">
                        🎯 {voice.name} (Cloned)
                      </SelectItem>
                    ))}
                  </>
                )}
                {voices.map((voice) => (
                  <SelectItem key={voice.name} value={voice.name} className="text-white hover:bg-slate-700">
                    {voice.name} ({voice.lang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Voice Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-white">Speech Rate: {rate[0].toFixed(1)}</Label>
            <Slider
              value={rate}
              onValueChange={setRate}
              min={0.5}
              max={2}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Pitch: {pitch[0].toFixed(1)}</Label>
            <Slider
              value={pitch}
              onValueChange={setPitch}
              min={0.5}
              max={2}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Volume: {volume[0].toFixed(1)}</Label>
            <Slider
              value={volume}
              onValueChange={setVolume}
              min={0.1}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Generation Controls */}
        <div className="flex gap-4">
          <Button 
            onClick={generateVoice}
            disabled={isGenerating || !text.trim()}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
          >
            <Play className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : `Generate ${language.includes('ar') ? 'Arabic' : 'English'} Voice`}
          </Button>
          
          {(isGenerating || isPlaying) && (
            <Button 
              onClick={stopVoice}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          )}
        </div>

        {/* Audio Output Section */}
        {hasGenerated && (
          <div className="p-4 bg-white/5 rounded-lg border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-white font-semibold">Generated Audio</Label>
              <div className="flex items-center gap-2">
                {isPlaying && (
                  <div className="flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm">Playing...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={playAgain}
                disabled={isPlaying}
                className="bg-green-600 hover:bg-green-700 text-white border-0"
              >
                {isPlaying ? (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Play Again
                  </>
                )}
              </Button>
              
              <Button 
                onClick={downloadVoice}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              
              <Button 
                onClick={() => {
                  setHasGenerated(false);
                  setCurrentUtterance(null);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white border-0"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
            
            {currentUtterance && (
              <div className="mt-3 p-3 bg-black/20 rounded text-sm">
                <p className="text-blue-200">
                  <strong>Voice:</strong> {selectedVoice}
                </p>
                <p className="text-blue-200">
                  <strong>Text:</strong> {currentUtterance.text.substring(0, 100)}
                  {currentUtterance.text.length > 100 ? '...' : ''}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <h4 className="font-semibold mb-2 text-white">Voice Generation Features:</h4>
          <ul className="text-sm space-y-1 text-blue-100">
            <li>• Enhanced browser synthesis for better quality</li>
            <li>• Full Arabic language support with proper pronunciation</li>
            <li>• Integration with cloned voices from Voice Library</li>
            <li>• Smart voice selection for different languages</li>
            <li>• Real voice cloning that works with any text</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceGenerator;
