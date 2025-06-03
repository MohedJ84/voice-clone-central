
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Mic, Save, Play, FileAudio } from 'lucide-react';

const VoiceCloning = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceName, setVoiceName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [clonedVoices, setClonedVoices] = useState<Array<{id: string, name: string, audioUrl: string}>>([]);
  const [audioSource, setAudioSource] = useState<'record' | 'upload'>('record');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        setUploadedFile(null); // Clear uploaded file if recording
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is audio
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Error",
          description: "Please select an audio file (MP3, WAV, etc.)",
          variant: "destructive"
        });
        return;
      }

      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size too large. Please select a file under 50MB",
          variant: "destructive"
        });
        return;
      }

      setUploadedFile(file);
      setAudioBlob(null); // Clear recorded audio if uploading
      
      toast({
        title: "File Uploaded",
        description: `"${file.name}" uploaded successfully for voice cloning`
      });
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const saveVoiceClone = async () => {
    const audioData = audioBlob || uploadedFile;
    
    if (!audioData || !voiceName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a voice name and either record or upload an audio sample",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convert file to blob if needed
      let blob: Blob;
      if (uploadedFile) {
        blob = uploadedFile;
      } else {
        blob = audioBlob!;
      }

      const audioUrl = URL.createObjectURL(blob);
      const newVoice = {
        id: Date.now().toString(),
        name: voiceName,
        audioUrl,
        type: 'cloned' as const,
        dateCreated: new Date().toISOString()
      };

      // Save to voice library
      const stored = localStorage.getItem('voiceLibrary') || '[]';
      const voices = JSON.parse(stored);
      voices.push(newVoice);
      localStorage.setItem('voiceLibrary', JSON.stringify(voices));

      setClonedVoices(prev => [...prev, newVoice]);
      setVoiceName('');
      setAudioBlob(null);
      setUploadedFile(null);

      toast({
        title: "Voice Cloned Successfully",
        description: `"${voiceName}" has been added to your voice library`
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save voice clone",
        variant: "destructive"
      });
    }
  };

  const playVoice = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const getAudioPreviewUrl = () => {
    if (audioBlob) return URL.createObjectURL(audioBlob);
    if (uploadedFile) return URL.createObjectURL(uploadedFile);
    return null;
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Cloning Studio
        </CardTitle>
        <CardDescription className="text-blue-100">
          Create custom human voice clones from audio samples or recordings for natural speech synthesis
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

          <div className="space-y-3">
            <Label>Audio Source</Label>
            <div className="flex gap-2">
              <Button
                variant={audioSource === 'record' ? 'default' : 'outline'}
                onClick={() => setAudioSource('record')}
                className={audioSource === 'record' ? 'bg-purple-600' : 'border-white/20 text-white hover:bg-white/10'}
              >
                <Mic className="w-4 h-4 mr-2" />
                Record
              </Button>
              <Button
                variant={audioSource === 'upload' ? 'default' : 'outline'}
                onClick={() => setAudioSource('upload')}
                className={audioSource === 'upload' ? 'bg-purple-600' : 'border-white/20 text-white hover:bg-white/10'}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>
          </div>

          {audioSource === 'record' ? (
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
          ) : (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="audio/*"
                className="hidden"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={triggerFileUpload}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <FileAudio className="w-4 h-4 mr-2" />
                  {uploadedFile ? 'Change File' : 'Select Audio File'}
                </Button>

                <Button
                  onClick={saveVoiceClone}
                  disabled={!uploadedFile || !voiceName.trim()}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Voice Clone
                </Button>
              </div>

              {uploadedFile && (
                <div className="p-3 bg-white/5 rounded-lg border border-white/20">
                  <p className="text-sm text-blue-200">
                    Selected: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>
          )}

          {(audioBlob || uploadedFile) && (
            <div className="p-4 bg-white/5 rounded-lg border border-white/20">
              <Label>Voice Sample Preview</Label>
              <audio controls className="w-full mt-2">
                <source src={getAudioPreviewUrl()!} type={uploadedFile ? uploadedFile.type : "audio/webm"} />
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
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-white hover:bg-white/10"
                    onClick={() => playVoice(voice.audioUrl)}
                  >
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
            <li>• Record in a quiet environment or upload high-quality audio</li>
            <li>• Speak clearly and naturally for 15-30 seconds</li>
            <li>• Use varied sentences with different emotions</li>
            <li>• Supported formats: MP3, WAV, OGG, M4A, FLAC</li>
            <li>• Maximum file size: 50MB</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceCloning;
