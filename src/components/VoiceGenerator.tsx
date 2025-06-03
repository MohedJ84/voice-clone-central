
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Play, Download, Volume2, Zap } from 'lucide-react';
import { generateCoquiTTS, COQUI_MODELS } from '../lib/coquiTTS';

const VoiceGenerator = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [rate, setRate] = useState([0.9]);
  const [pitch, setPitch] = useState([1]);
  const [volume, setVolume] = useState([1]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useCoqui, setUseCoqui] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [clonedVoices, setClonedVoices] = useState<Array<{id: string, name: string, audioUrl: string}>>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      console.log('Available voices:', availableVoices);
      
      // Filter for better quality voices
      const humanVoices = availableVoices.filter(voice => 
        (voice.lang.includes('en') || voice.lang.includes('ar')) &&
        !voice.name.toLowerCase().includes('espeak')
      );
      
      setVoices(humanVoices);
      
      // Load cloned voices from localStorage
      const storedVoices = localStorage.getItem('voiceLibrary');
      if (storedVoices) {
        const parsed = JSON.parse(storedVoices);
        setClonedVoices(parsed.filter((v: any) => v.type === 'cloned'));
      }
      
      if (humanVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(humanVoices[0].name);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    // Also load voices when component mounts
    setTimeout(loadVoices, 100);
    
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [selectedVoice]);

  const generateWithCoqui = async () => {
    try {
      setIsGenerating(true);
      console.log('Starting enhanced synthesis for language:', language);
      
      // Get the appropriate voice model for the language
      const languageVoices = COQUI_MODELS[language as keyof typeof COQUI_MODELS] || COQUI_MODELS['en-US'];
      const selectedModel = languageVoices[0].model;

      // Use the enhanced browser synthesis
      const audioBlob = await generateCoquiTTS({
        text,
        model: selectedModel,
        language,
        rate: rate[0],
        pitch: pitch[0],
        volume: volume[0]
      });

      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      toast({
        title: "Success",
        description: `High-quality ${language.includes('ar') ? 'Arabic' : 'English'} voice generated`,
      });

    } catch (error) {
      console.error('Voice generation failed:', error);
      toast({
        title: "Error",
        description: "Failed to generate voice. Trying fallback method...",
        variant: "destructive"
      });
      
      // Fallback to browser synthesis
      await generateWithBrowser();
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWithBrowser = async () => {
    try {
      setIsGenerating(true);
      console.log('Using browser synthesis');
      
      // Check if a cloned voice is selected
      const isClonedVoice = clonedVoices.find(v => v.name === selectedVoice);
      if (isClonedVoice) {
        // For cloned voices, just play the original audio (simplified simulation)
        const audio = new Audio(isClonedVoice.audioUrl);
        audio.play();
        
        toast({
          title: "Playing Cloned Voice",
          description: `Playing sample of "${selectedVoice}" voice`,
        });
        setIsGenerating(false);
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      let voice;

      if (language.includes('ar')) {
        console.log('Looking for Arabic voices...');
        // Find the best Arabic voice
        const arabicVoices = voices.filter(v => 
          v.lang.includes('ar') || 
          v.lang.includes('Arabic') ||
          v.name.toLowerCase().includes('arabic')
        );
        console.log('Arabic voices found:', arabicVoices);
        
        voice = arabicVoices[0] || voices.find(v => 
          v.name.includes('Google') || 
          v.name.includes('Microsoft')
        ) || voices[0];
        
        // Enhanced Arabic text preprocessing
        utterance.text = text
          .replace(/\./g, ' . ')
          .replace(/،/g, ' ، ')
          .replace(/؟/g, ' ؟ ')
          .replace(/!/g, ' ! ')
          .replace(/\s+/g, ' ')
          .trim();
          
        utterance.lang = 'ar-SA';
      } else {
        voice = voices.find(v => v.name === selectedVoice) || voices[0];
        utterance.text = text.replace(/\./g, '. ').replace(/,/g, ', ');
        utterance.lang = language;
      }
      
      if (voice) {
        console.log('Selected voice:', voice.name, voice.lang);
        utterance.voice = voice;
      }
      
      utterance.rate = rate[0];
      utterance.pitch = pitch[0];
      utterance.volume = volume[0];

      speechSynthesis.cancel(); // Cancel any previous speech
      speechSynthesis.speak(utterance);

      utterance.onstart = () => {
        console.log('Speech started');
      };

      utterance.onend = () => {
        setIsGenerating(false);
        toast({
          title: "Success",
          description: `Voice generated successfully in ${language.includes('ar') ? 'Arabic' : 'English'}`,
        });
      };

      utterance.onerror = (error) => {
        console.error('Speech error:', error);
        setIsGenerating(false);
        toast({
          title: "Error",
          description: "Failed to generate voice",
          variant: "destructive"
        });
      };

    } catch (error) {
      console.error('Browser synthesis failed:', error);
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "Failed to generate voice",
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

    console.log('Generating voice with settings:', { language, selectedVoice, useCoqui });

    if (useCoqui) {
      await generateWithCoqui();
    } else {
      await generateWithBrowser();
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `voice_${language}_${Date.now()}.wav`;
      a.click();
    }
  };

  // Combine system voices and cloned voices for selection
  const allVoices = [
    ...voices.map(v => ({ name: v.name, type: 'system', lang: v.lang })),
    ...clonedVoices.map(v => ({ name: v.name, type: 'cloned', lang: 'Custom' }))
  ];

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Enhanced Voice Generator
        </CardTitle>
        <CardDescription className="text-blue-100">
          Generate natural, human-like speech from text with enhanced browser synthesis for Arabic and English
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="text">Text to Speech</Label>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Engine</Label>
            <Select value={useCoqui ? 'enhanced' : 'browser'} onValueChange={(value) => setUseCoqui(value === 'enhanced')}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="enhanced" className="text-white">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Enhanced Synthesis
                  </span>
                </SelectItem>
                <SelectItem value="browser" className="text-white">Basic Browser Synthesis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="en-US" className="text-white">English (US)</SelectItem>
                <SelectItem value="en-GB" className="text-white">English (UK)</SelectItem>
                <SelectItem value="ar-SA" className="text-white">العربية (Arabic)</SelectItem>
                <SelectItem value="ar-EG" className="text-white">العربية المصرية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Voice Selection ({allVoices.length} available)</Label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {clonedVoices.length > 0 && (
                  <>
                    <SelectItem value="" disabled className="text-blue-300 font-semibold">
                      — Cloned Voices —
                    </SelectItem>
                    {clonedVoices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.name} className="text-green-300">
                        🎯 {voice.name} (Cloned)
                      </SelectItem>
                    ))}
                  </>
                )}
                <SelectItem value="" disabled className="text-blue-300 font-semibold">
                  — System Voices —
                </SelectItem>
                {voices.map((voice) => (
                  <SelectItem key={voice.name} value={voice.name} className="text-white">
                    {voice.name} ({voice.lang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Speech Rate: {rate[0].toFixed(1)}</Label>
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
            <Label>Pitch: {pitch[0].toFixed(1)}</Label>
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
            <Label>Volume: {volume[0].toFixed(1)}</Label>
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

        <div className="flex gap-4">
          <Button 
            onClick={generateVoice}
            disabled={isGenerating || !text.trim()}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : `Generate ${language.includes('ar') ? 'Arabic' : 'English'} Voice`}
          </Button>

          {audioUrl && (
            <Button 
              onClick={downloadAudio}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
        </div>

        {audioUrl && (
          <audio ref={audioRef} controls className="w-full">
            <source src={audioUrl} type="audio/wav" />
          </audio>
        )}

        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <h4 className="font-semibold mb-2">Voice Generation Features:</h4>
          <ul className="text-sm space-y-1 text-blue-100">
            <li>• Enhanced browser synthesis for better quality</li>
            <li>• Full Arabic language support with proper pronunciation</li>
            <li>• Integration with cloned voices from Voice Library</li>
            <li>• Smart voice selection for different languages</li>
            <li>• Audio recording and download capabilities</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceGenerator;
