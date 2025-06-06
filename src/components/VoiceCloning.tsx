
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, Mic, Save, Play, FileAudio } from 'lucide-react';

const VoiceCloning = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceName, setVoiceName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [clonedVoices, setClonedVoices] = useState<Array<{id: string, name: string, audioUrl: string}>>([]);
  const [audioSource, setAudioSource] = useState<'record' | 'upload'>('record');
  const [isCloning, setIsCloning] = useState(false);
  const [cloningProgress, setCloningProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    // Load existing cloned voices
    const stored = localStorage.getItem('voiceLibrary') || '[]';
    const voices = JSON.parse(stored);
    setClonedVoices(voices.filter((v: any) => v.type === 'cloned'));
  }, []);

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
      setIsCloning(true);
      setCloningProgress(0);

      // Simulate cloning progress
      const progressInterval = setInterval(() => {
        setCloningProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Convert file to blob if needed
      let blob: Blob;
      if (uploadedFile) {
        blob = uploadedFile;
      } else {
        blob = audioBlob!;
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

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

      setCloningProgress(100);
      
      setTimeout(() => {
        setClonedVoices(prev => [...prev, newVoice]);
        setVoiceName('');
        setAudioBlob(null);
        setUploadedFile(null);
        setIsCloning(false);
        setCloningProgress(0);

        toast({
          title: "Voice Cloned Successfully",
          description: `"${voiceName}" has been added to your voice library and is ready to use for text generation`
        });

        // Trigger a page refresh to update voice lists
        window.dispatchEvent(new Event('voiceLibraryUpdated'));
      }, 500);

    } catch (error) {
      setIsCloning(false);
      setCloningProgress(0);
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

  const deleteVoice = (voiceId: string) => {
    const updatedVoices = clonedVoices.filter(voice => voice.id !== voiceId);
    setClonedVoices(updatedVoices);
    
    // Update localStorage
    const stored = localStorage.getItem('voiceLibrary') || '[]';
    const allVoices = JSON.parse(stored);
    const filteredVoices = allVoices.filter((v: any) => v.id !== voiceId);
    localStorage.setItem('voiceLibrary', JSON.stringify(filteredVoices));
    
    toast({
      title: "Voice Deleted",
      description: "Voice clone removed from library"
    });
  };

  const getAudioPreviewUrl = () => {
    if (audioBlob) return URL.createObjectURL(audioBlob);
    if (uploadedFile) return URL.createObjectURL(uploadedFile);
    return null;
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Mic className="w-5 h-5 text-white" />
          Voice Cloning Studio
        </CardTitle>
        <CardDescription className="text-blue-100">
          Create custom human voice clones from audio samples or recordings for natural speech synthesis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Name Input */}
        <div className="space-y-2">
          <Label htmlFor="voiceName" className="text-white">Voice Clone Name</Label>
          <input
            id="voiceName"
            type="text"
            placeholder="Enter a name for this voice clone..."
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white placeholder:text-blue-200"
            disabled={isCloning}
          />
        </div>

        {/* Audio Source Selection */}
        <div className="space-y-3">
          <Label className="text-white">Audio Source</Label>
          <div className="flex gap-2">
            <Button
              variant={audioSource === 'record' ? 'default' : 'outline'}
              onClick={() => setAudioSource('record')}
              disabled={isCloning}
              className={audioSource === 'record' ? 'bg-purple-600 hover:bg-purple-700 text-white border-0' : 'border-white/20 text-white hover:bg-white/10 bg-transparent'}
            >
              <Mic className="w-4 h-4 mr-2" />
              Record
            </Button>
            <Button
              variant={audioSource === 'upload' ? 'default' : 'outline'}
              onClick={() => setAudioSource('upload')}
              disabled={isCloning}
              className={audioSource === 'upload' ? 'bg-purple-600 hover:bg-purple-700 text-white border-0' : 'border-white/20 text-white hover:bg-white/10 bg-transparent'}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </div>
        </div>

        {/* Recording/Upload Section */}
        {audioSource === 'record' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isCloning}
              className={`${isRecording ? 'bg-red-600 hover:bg-red-700 text-white border-0' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0'}`}
            >
              <Mic className="w-4 h-4 mr-2" />
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>

            <Button
              onClick={saveVoiceClone}
              disabled={!audioBlob || !voiceName.trim() || isCloning}
              className="bg-green-600 hover:bg-green-700 text-white border-0 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Save className="w-4 h-4 mr-2" />
              {isCloning ? 'Cloning...' : 'Save Voice Clone'}
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
              disabled={isCloning}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={triggerFileUpload}
                disabled={isCloning}
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <FileAudio className="w-4 h-4 mr-2" />
                {uploadedFile ? 'Change File' : 'Select Audio File'}
              </Button>

              <Button
                onClick={saveVoiceClone}
                disabled={!uploadedFile || !voiceName.trim() || isCloning}
                className="bg-green-600 hover:bg-green-700 text-white border-0 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Save className="w-4 h-4 mr-2" />
                {isCloning ? 'Cloning...' : 'Save Voice Clone'}
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

        {/* Cloning Progress */}
        {isCloning && (
          <div className="space-y-2">
            <Label className="text-white">Cloning Progress</Label>
            <Progress value={cloningProgress} className="w-full" />
            <p className="text-sm text-blue-200">
              {cloningProgress < 30 ? 'Analyzing voice patterns...' :
               cloningProgress < 60 ? 'Processing audio features...' :
               cloningProgress < 90 ? 'Training voice model...' :
               'Finalizing voice clone...'}
            </p>
          </div>
        )}

        {/* Audio Preview */}
        {(audioBlob || uploadedFile) && !isCloning && (
          <div className="p-4 bg-white/5 rounded-lg border border-white/20">
            <Label className="text-white">Voice Sample Preview</Label>
            <audio controls className="w-full mt-2">
              <source src={getAudioPreviewUrl()!} type={uploadedFile ? uploadedFile.type : "audio/webm"} />
            </audio>
          </div>
        )}

        {/* Cloned Voices List */}
        {clonedVoices.length > 0 && (
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-white">Your Voice Clones ({clonedVoices.length})</Label>
            <div className="grid gap-3">
              {clonedVoices.map((voice) => (
                <div key={voice.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/20">
                  <span className="font-medium text-white">{voice.name}</span>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      className="text-white hover:bg-white/10 bg-transparent border-0"
                      onClick={() => playVoice(voice.audioUrl)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      className="text-red-300 hover:bg-red-500/20 bg-transparent border-0"
                      onClick={() => deleteVoice(voice.id)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <h4 className="font-semibold mb-2 text-white">Tips for Better Voice Cloning:</h4>
          <ul className="text-sm space-y-1 text-blue-100">
            <li>• Record in a quiet environment or upload high-quality audio</li>
            <li>• Speak clearly and naturally for 15-30 seconds</li>
            <li>• Use varied sentences with different emotions</li>
            <li>• Supported formats: MP3, WAV, OGG, M4A, FLAC</li>
            <li>• Maximum file size: 50MB</li>
            <li>• Cloned voices can be used to generate any new text</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceCloning;
