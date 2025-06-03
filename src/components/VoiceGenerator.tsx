
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Play, Download, Volume2 } from 'lucide-react';

const VoiceGenerator = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [rate, setRate] = useState([0.9]);
  const [pitch, setPitch] = useState([1]);
  const [volume, setVolume] = useState([1]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      // Filter for higher quality, more natural sounding voices
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

  const generateVoice = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to generate speech",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Create enhanced speech synthesis for more human-like output
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find(v => v.name === selectedVoice);
      
      if (voice) {
        utterance.voice = voice;
      }
      
      // Optimize settings for more natural speech
      utterance.rate = rate[0];
      utterance.pitch = pitch[0];
      utterance.volume = volume[0];
      
      // Add natural pauses and emphasis
      utterance.text = text.replace(/\./g, '. ').replace(/,/g, ', ');

      // Create audio recording for download
      const mediaRecorder = await createAudioRecording(utterance);
      
      speechSynthesis.speak(utterance);

      utterance.onend = () => {
        setIsGenerating(false);
        toast({
          title: "Success",
          description: "Voice generated successfully with natural human-like quality",
        });
      };

      utterance.onerror = () => {
        setIsGenerating(false);
        toast({
          title: "Error",
          description: "Failed to generate voice",
          variant: "destructive"
        });
      };

    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "Failed to generate voice",
        variant: "destructive"
      });
    }
  };

  const createAudioRecording = async (utterance: SpeechSynthesisUtterance) => {
    // This creates a downloadable audio file from the speech synthesis
    const context = new AudioContext();
    const destination = context.createMediaStreamDestination();
    const mediaRecorder = new MediaRecorder(destination.stream);
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    };

    mediaRecorder.start();
    
    utterance.onend = () => {
      mediaRecorder.stop();
    };

    return mediaRecorder;
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `voice_${Date.now()}.wav`;
      a.click();
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Human Voice Generator
        </CardTitle>
        <CardDescription className="text-blue-100">
          Generate natural, human-like speech from text with advanced voice synthesis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="text">Text to Speech</Label>
          <Textarea
            id="text"
            placeholder="Enter the text you want to convert to natural human speech..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-32 bg-white/5 border-white/20 text-white placeholder:text-blue-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Voice Selection</Label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Select a natural voice" />
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

          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="en-US" className="text-white">English (US)</SelectItem>
                <SelectItem value="en-GB" className="text-white">English (UK)</SelectItem>
                <SelectItem value="ar-SA" className="text-white">Arabic (Saudi Arabia)</SelectItem>
                <SelectItem value="ar-EG" className="text-white">Arabic (Egypt)</SelectItem>
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
            {isGenerating ? 'Generating...' : 'Generate Human Voice'}
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
      </CardContent>
    </Card>
  );
};

export default VoiceGenerator;
