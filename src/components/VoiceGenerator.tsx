
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Play, Download, Volume2, Zap } from 'lucide-react';

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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Coqui-TTS voice models
  const coquiVoices = {
    'en-US': [
      { name: 'Female-English-Natural', model: 'tts_models/en/ljspeech/tacotron2-DDC_ph' },
      { name: 'Male-English-Natural', model: 'tts_models/en/sam/tacotron-DDC' },
      { name: 'Female-English-Expressive', model: 'tts_models/en/jenny/jenny' }
    ],
    'ar-SA': [
      { name: 'Female-Arabic-Natural', model: 'tts_models/ar/css10/vits' },
      { name: 'Male-Arabic-Classical', model: 'tts_models/ar/css10/glow-tts' }
    ]
  };

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      const humanVoices = availableVoices.filter(voice => 
        (voice.lang.includes('en') || voice.lang.includes('ar')) &&
        (voice.name.includes('Neural') || 
         voice.name.includes('Enhanced') || 
         voice.name.includes('Premium') ||
         voice.name.includes('Natural') ||
         !voice.name.includes('eSpeak'))
      );
      setVoices(humanVoices);
      if (humanVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(humanVoices[0].name);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [selectedVoice]);

  const generateWithCoqui = async () => {
    try {
      setIsGenerating(true);
      
      // Get the appropriate voice model for the language
      const languageVoices = coquiVoices[language as keyof typeof coquiVoices] || coquiVoices['en-US'];
      const selectedModel = languageVoices[0].model;

      // Simulate Coqui-TTS API call (replace with actual implementation)
      const response = await fetch('/api/coqui-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model: selectedModel,
          language,
          rate: rate[0],
          pitch: pitch[0],
          volume: volume[0]
        })
      });

      if (!response.ok) {
        throw new Error('Coqui-TTS generation failed');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      toast({
        title: "Success",
        description: `High-quality ${language.includes('ar') ? 'Arabic' : 'English'} voice generated with Coqui-TTS`,
      });

    } catch (error) {
      console.log('Coqui-TTS failed, falling back to browser synthesis');
      generateWithBrowser();
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWithBrowser = async () => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      let voice;

      if (language.includes('ar')) {
        // Find Arabic voices or use the best available
        voice = voices.find(v => v.lang.includes('ar')) || 
               voices.find(v => v.name.includes('Google')) ||
               voices[0];
      } else {
        voice = voices.find(v => v.name === selectedVoice) || voices[0];
      }
      
      if (voice) {
        utterance.voice = voice;
        utterance.lang = language;
      }
      
      utterance.rate = rate[0];
      utterance.pitch = pitch[0];
      utterance.volume = volume[0];
      
      // Enhanced text processing for Arabic
      if (language.includes('ar')) {
        // Add Arabic-specific text processing
        utterance.text = text.replace(/\./g, ' . ').replace(/،/g, ' ، ');
      } else {
        utterance.text = text.replace(/\./g, '. ').replace(/,/g, ', ');
      }

      // Create audio recording
      const audioContext = new AudioContext();
      const mediaStreamDestination = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      speechSynthesis.speak(utterance);

      utterance.onend = () => {
        mediaRecorder.stop();
        toast({
          title: "Success",
          description: `Voice generated successfully in ${language.includes('ar') ? 'Arabic' : 'English'}`,
        });
      };

    } catch (error) {
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

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Human Voice Generator with Coqui-TTS
        </CardTitle>
        <CardDescription className="text-blue-100">
          Generate natural, human-like speech from text with Coqui-TTS and browser synthesis for Arabic and English
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
            <Select value={useCoqui ? 'coqui' : 'browser'} onValueChange={(value) => setUseCoqui(value === 'coqui')}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="coqui" className="text-white">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Coqui-TTS (High Quality)
                  </span>
                </SelectItem>
                <SelectItem value="browser" className="text-white">Browser Synthesis</SelectItem>
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

          {!useCoqui && (
            <div className="space-y-2">
              <Label>Voice Selection</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {voices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name} className="text-white">
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {useCoqui && (
          <div className="space-y-2">
            <Label>Coqui Voice Model</Label>
            <Select value="auto" onValueChange={() => {}}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {(coquiVoices[language as keyof typeof coquiVoices] || coquiVoices['en-US']).map((voice) => (
                  <SelectItem key={voice.name} value={voice.name} className="text-white">
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
            <li>• Coqui-TTS for high-quality, natural voice synthesis</li>
            <li>• Full Arabic language support with proper pronunciation</li>
            <li>• Multiple voice models for different languages</li>
            <li>• Fallback to browser synthesis for compatibility</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceGenerator;
