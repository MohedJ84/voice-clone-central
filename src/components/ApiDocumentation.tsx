
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookOpen, Copy, Server, Key } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const ApiDocumentation = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Code copied to clipboard"
    });
  };

  const apiExamples = {
    generateVoice: `curl -X POST http://localhost:3000/api/generate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "text": "Hello, this is a natural human voice",
    "voice": "human_voice_1",
    "language": "en-US",
    "settings": {
      "rate": 0.9,
      "pitch": 1.0,
      "volume": 1.0
    }
  }'`,
    
    cloneVoice: `curl -X POST http://localhost:3000/api/clone \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "audio=@voice_sample.wav" \\
  -F "name=My Custom Voice" \\
  -F "language=en-US"`,
    
    listVoices: `curl -X GET http://localhost:3000/api/voices \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    
    downloadAudio: `curl -X GET http://localhost:3000/api/download/VOICE_ID \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  --output voice_output.wav`
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          API Documentation
        </CardTitle>
        <CardDescription className="text-blue-100">
          Complete API reference for integrating our local voice generation platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 text-white">Overview</TabsTrigger>
            <TabsTrigger value="endpoints" className="data-[state=active]:bg-white/20 text-white">Endpoints</TabsTrigger>
            <TabsTrigger value="examples" className="data-[state=active]:bg-white/20 text-white">Examples</TabsTrigger>
            <TabsTrigger value="sdk" className="data-[state=active]:bg-white/20 text-white">SDKs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Local Voice API</h3>
              <p className="text-blue-100">
                Our local voice generation API provides natural, human-like text-to-speech and voice cloning capabilities 
                that run entirely offline. Perfect for Docker deployments and air-gapped environments.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="w-5 h-5 text-blue-400" />
                    <h4 className="font-semibold">Base URL</h4>
                  </div>
                  <code className="text-sm text-blue-200">http://localhost:3000/api</code>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-5 h-5 text-blue-400" />
                    <h4 className="font-semibold">Authentication</h4>
                  </div>
                  <code className="text-sm text-blue-200">Bearer Token</code>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h4 className="font-semibold mb-2">Key Features:</h4>
                <ul className="text-sm space-y-1 text-blue-100">
                  <li>• 100% offline operation - no internet required</li>
                  <li>• Natural human voice synthesis in Arabic and English</li>
                  <li>• Voice cloning from audio samples</li>
                  <li>• RESTful API with comprehensive endpoints</li>
                  <li>• Docker-ready for easy deployment</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-6">
            <div className="space-y-4">
              {[
                {
                  method: "POST",
                  endpoint: "/api/generate",
                  description: "Generate natural human speech from text",
                  params: ["text", "voice", "language", "settings"]
                },
                {
                  method: "POST", 
                  endpoint: "/api/clone",
                  description: "Create a voice clone from audio sample",
                  params: ["audio (file)", "name", "language"]
                },
                {
                  method: "GET",
                  endpoint: "/api/voices",
                  description: "List all available voices",
                  params: []
                },
                {
                  method: "GET",
                  endpoint: "/api/download/{voice_id}",
                  description: "Download generated audio file",
                  params: ["voice_id"]
                }
              ].map((endpoint, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      endpoint.method === 'GET' ? 'bg-green-600' : 'bg-blue-600'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-blue-300">{endpoint.endpoint}</code>
                  </div>
                  <p className="text-sm text-blue-100 mb-2">{endpoint.description}</p>
                  {endpoint.params.length > 0 && (
                    <div>
                      <span className="text-xs text-blue-200">Parameters: </span>
                      <code className="text-xs text-blue-300">{endpoint.params.join(', ')}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            {Object.entries(apiExamples).map(([title, code]) => (
              <div key={title} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold capitalize">{title.replace(/([A-Z])/g, ' $1').trim()}</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(code)}
                    className="text-white hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="p-4 bg-black/20 rounded-lg text-sm text-blue-100 overflow-x-auto">
                  <code>{code}</code>
                </pre>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="sdk" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Official SDKs</h3>
              
              <div className="grid gap-4">
                {[
                  {
                    language: "JavaScript/Node.js",
                    install: "npm install local-voice-sdk",
                    example: `import { VoiceClient } from 'local-voice-sdk';

const client = new VoiceClient({
  baseUrl: 'http://localhost:3000',
  apiKey: 'your-api-key'
});

const audio = await client.generateVoice({
  text: 'Hello world',
  voice: 'human_voice_1',
  language: 'en-US'
});`
                  },
                  {
                    language: "Python",
                    install: "pip install local-voice-python",
                    example: `from local_voice import VoiceClient

client = VoiceClient(
    base_url='http://localhost:3000',
    api_key='your-api-key'
)

audio = client.generate_voice(
    text='Hello world',
    voice='human_voice_1',
    language='en-US'
)`
                  }
                ].map((sdk, index) => (
                  <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/20">
                    <h4 className="font-semibold mb-2">{sdk.language}</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-blue-200">Installation:</span>
                        <pre className="mt-1 p-2 bg-black/20 rounded text-sm text-blue-100">
                          <code>{sdk.install}</code>
                        </pre>
                      </div>
                      <div>
                        <span className="text-sm text-blue-200">Example:</span>
                        <pre className="mt-1 p-2 bg-black/20 rounded text-sm text-blue-100 overflow-x-auto">
                          <code>{sdk.example}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ApiDocumentation;
