
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Mic, Save, Play } from 'lucide-react';

const VoiceCloning = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceName, setVoiceName] = useState('');
  const [clonedVoices, setClonedVoices] = useState<Array<{id: string, name: string, audioUrl: string}>>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly for 10-30 seconds to create a high-quality voice clone"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      toast({
        title: "Recording Complete",
        description: "Voice sample captured successfully"
      });
    }
  };

  const saveVoiceClone = () => {
    if (!audioBlob || !voiceName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a voice name and record a sample",
        variant: "destructive"
      });
      return;
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    const newVoice = {
      id: Date.now().toString(),
      name: voiceName,
      audioUrl
    };

    setClonedVoices(prev => [...prev, newVoice]);
    setVoiceName('');
    setAudioBlob(null);

    // Store in localStorage for persistence
    const stored = localStorage.getItem('clonedVoices') || '[]';
    const voices = JSON.parse(stored);
    voices.push(newVoice);
    localStorage.setItem('clonedVoices', JSON.stringify(voices));

    toast({
      title: "Voice Cloned Successfully",
      description: `"${voiceName}" has been added to your voice library`
    });
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Cloning Studio
        </CardTitle>
        <CardDescription className="text-blue-100">
          Create custom human voice clones from audio samples for natural speech synthesis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voiceName">Voice Clone Name</Label>
            <input
              id="voiceName"
              type="text"
              placeholder="Enter a name for this voice clone..."
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white placeholder:text-blue-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'}`}
            >
              <Mic className="w-4 h-4 mr-2" />
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>

            <Button
              onClick={saveVoiceClone}
              disabled={!audioBlob || !voiceName.trim()}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Voice Clone
            </Button>
          </div>

          {audioBlob && (
            <div className="p-4 bg-white/5 rounded-lg border border-white/20">
              <Label>Voice Sample Preview</Label>
              <audio controls className="w-full mt-2">
                <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
              </audio>
            </div>
          )}
        </div>

        {clonedVoices.length > 0 && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Your Voice Clones</Label>
            <div className="grid gap-3">
              {clonedVoices.map((voice) => (
                <div key={voice.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/20">
                  <span className="font-medium">{voice.name}</span>
                  <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <h4 className="font-semibold mb-2">Tips for Better Voice Cloning:</h4>
          <ul className="text-sm space-y-1 text-blue-100">
            <li>• Record in a quiet environment</li>
            <li>• Speak clearly and naturally for 15-30 seconds</li>
            <li>• Use varied sentences with different emotions</li>
            <li>• Ensure good audio quality for best results</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceCloning;
