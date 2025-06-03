
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VoiceGenerator from '@/components/VoiceGenerator';
import VoiceCloning from '@/components/VoiceCloning';
import VoiceLibrary from '@/components/VoiceLibrary';
import ApiDocumentation from '@/components/ApiDocumentation';
import { Mic, BookOpen, Library, Settings } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm"></div>
        <div className="relative container mx-auto px-6 py-16 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Local Voice Studio
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Complete offline voice generation and cloning platform supporting Arabic and English with local API server
          </p>
          <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
            <span className="text-sm font-medium">100% Local • No Internet Required</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-16">
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/10 backdrop-blur-sm border-0">
            <TabsTrigger value="generate" className="data-[state=active]:bg-white/20 text-white">
              <Mic className="w-4 h-4 mr-2" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="clone" className="data-[state=active]:bg-white/20 text-white">
              <Settings className="w-4 h-4 mr-2" />
              Clone Voice
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-white/20 text-white">
              <Library className="w-4 h-4 mr-2" />
              Voice Library
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-white/20 text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              API Docs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <VoiceGenerator />
          </TabsContent>

          <TabsContent value="clone" className="space-y-6">
            <VoiceCloning />
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <VoiceLibrary />
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <ApiDocumentation />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
