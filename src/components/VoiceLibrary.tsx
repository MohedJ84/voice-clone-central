
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Library, Play, Download, Trash2, Volume2 } from 'lucide-react';

interface VoiceItem {
  id: string;
  name: string;
  audioUrl: string;
  type: 'cloned' | 'generated';
  language?: string;
  dateCreated: string;
}

const VoiceLibrary = () => {
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    // Load voices from localStorage
    const loadVoices = () => {
      const stored = localStorage.getItem('voiceLibrary') || '[]';
      setVoices(JSON.parse(stored));
    };
    loadVoices();
  }, []);

  const playVoice = (voiceId: string, audioUrl: string) => {
    if (playingId === voiceId) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(audioUrl);
    audio.play();
    setPlayingId(voiceId);
    
    audio.onended = () => setPlayingId(null);
  };

  const downloadVoice = (audioUrl: string, name: string) => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${name}_voice.wav`;
    a.click();
  };

  const deleteVoice = (voiceId: string) => {
    const updatedVoices = voices.filter(voice => voice.id !== voiceId);
    setVoices(updatedVoices);
    localStorage.setItem('voiceLibrary', JSON.stringify(updatedVoices));
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Library className="w-5 h-5" />
          Voice Library
        </CardTitle>
        <CardDescription className="text-blue-100">
          Manage your collection of generated and cloned human voices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {voices.length === 0 ? (
          <div className="text-center py-12">
            <Volume2 className="w-16 h-16 mx-auto mb-4 text-blue-300 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No voices in library</h3>
            <p className="text-blue-200 mb-4">
              Start by generating voices or cloning your own to build your collection
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {voices.map((voice) => (
              <div
                key={voice.id}
                className="p-4 bg-white/5 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{voice.name}</h4>
                    <p className="text-sm text-blue-200">
                      {voice.type === 'cloned' ? 'Voice Clone' : 'Generated Voice'} • 
                      {voice.language && ` ${voice.language} • `}
                      {new Date(voice.dateCreated).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => playVoice(voice.id, voice.audioUrl)}
                      className="text-white hover:bg-white/10"
                    >
                      <Play className={`w-4 h-4 ${playingId === voice.id ? 'animate-pulse' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadVoice(voice.audioUrl, voice.name)}
                      className="text-white hover:bg-white/10"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteVoice(voice.id)}
                      className="text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceLibrary;
