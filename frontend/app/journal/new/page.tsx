'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { journalApi, type JournalEntry } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft, 
  Save, 
  Heart,
  Zap,
  Brain,
  Frown,
  Meh,
  Smile,
  Lock,
  Globe,
  Maximize2,
  Minimize2,
  X,
  Sun,
  Moon,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';

// AI Analysis interface matching API response
interface AIAnalysis {
  sentiment?: string;
  moodTags: string[];
  wellnessScore?: number;
  insights?: string;
  themes: string[];
  safetyRisk?: boolean;
  supportiveMessage?: string;
}

// Form validation schema
const journalSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters'),
  overallMood: z.number().min(1).max(10).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  anxietyLevel: z.number().min(1).max(10).optional(),
  stressLevel: z.number().min(1).max(10).optional(),
  privacyLevel: z.enum(['zero_knowledge', 'server_managed']).optional(),
  convertToMemory: z.boolean().optional(),
  mediaType: z.enum(['image', 'audio', 'video']).optional(),
  mediaUrl: z.string().url().optional(),
});

type JournalFormData = z.infer<typeof journalSchema>;

function NewJournalEntryContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [immersiveField, setImmersiveField] = useState<'title' | 'content'>('content');
  const [immersiveTheme, setImmersiveTheme] = useState<'dark' | 'light'>('dark');
  
  // Sidebar state
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  
  const { user } = useAuth();

  // Load past journal entries for sidebar
  const loadPastEntries = useCallback(async () => {
    if (!user || !isImmersiveMode) return;
    
    try {
      setEntriesLoading(true);
      const result = await journalApi.getAll({ page: 1, limit: 10 });
      setPastEntries(result.entries);
    } catch (error) {
      console.error('Failed to load past entries:', error);
    } finally {
      setEntriesLoading(false);
    }
  }, [user, isImmersiveMode]);

  // Load entries when entering immersive mode
  useEffect(() => {
    if (isImmersiveMode) {
      loadPastEntries();
    }
  }, [isImmersiveMode, loadPastEntries]);

  // Handle sidebar resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      setSidebarWidth(Math.max(280, Math.min(600, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Handle keyboard shortcuts in immersive mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isImmersiveMode) return;
      
      // Escape to close immersive mode
      if (event.key === 'Escape') {
        setIsImmersiveMode(false);
        return;
      }
      
      // Tab to switch between fields (prevent default tab behavior)
      if (event.key === 'Tab') {
        event.preventDefault();
        setImmersiveField(immersiveField === 'title' ? 'content' : 'title');
        return;
      }
      
      // Ctrl+T for title, Ctrl+C for content, Ctrl+D for theme toggle
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 't' || event.key === 'T') {
          event.preventDefault();
          setImmersiveField('title');
        } else if (event.key === 'c' || event.key === 'C') {
          event.preventDefault();
          setImmersiveField('content');
        } else if (event.key === 'd' || event.key === 'D') {
          event.preventDefault();
          setImmersiveTheme(immersiveTheme === 'dark' ? 'light' : 'dark');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isImmersiveMode, immersiveField, immersiveTheme]);
  const router = useRouter();

  const form = useForm<JournalFormData>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      title: '',
      content: '',
      privacyLevel: 'server_managed',
      convertToMemory: false,
    },
  });

  const { register, handleSubmit, watch, formState: { errors } } = form;

  const privacyLevel = watch('privacyLevel');
  const overallMood = watch('overallMood');
  const energyLevel = watch('energyLevel');
  const anxietyLevel = watch('anxietyLevel');
  const stressLevel = watch('stressLevel');

  const onSubmit = async (data: JournalFormData) => {
    try {
      setIsSubmitting(true);
      
      const entry = await journalApi.create(data);
      
      // Show AI analysis results
      setAiAnalysis(entry.aiAnalysis);
      
      toast.success('Journal entry created successfully!');
      
      // Redirect after a longer delay to show AI insights
      setTimeout(() => {
        router.push('/journal');
      }, 8000);
      
    } catch (error) {
      console.error('Failed to create journal entry:', error);
      toast.error('Failed to create journal entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMoodIcon = (mood?: number) => {
    if (!mood) return null;
    if (mood >= 7) return <Smile className="h-5 w-5 text-green-500" />;
    if (mood >= 4) return <Meh className="h-5 w-5 text-yellow-500" />;
    return <Frown className="h-5 w-5 text-red-500" />;
  };

  const getScaleColor = (value?: number) => {
    if (!value) return 'bg-gray-200';
    if (value >= 8) return 'bg-green-500';
    if (value >= 6) return 'bg-yellow-500';
    if (value >= 4) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (aiAnalysis) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA] flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-[#8B86B8]/20 shadow-2xl">
            <div className="text-center mb-8">
              <div className="mb-4">
                <Heart className="h-12 w-12 text-[#6B5FA8] mx-auto animate-pulse" />
              </div>
              <h2 className="text-2xl font-serif text-[#6B5FA8] mb-2">Echo is here for you</h2>
              <p className="text-[#8B86B8]">Your AI companion has some thoughts to share</p>
            </div>

            <div className="space-y-6">
              {/* Companion Message - Most Prominent */}
              {aiAnalysis.supportiveMessage && (
                <div className="bg-gradient-to-r from-[#EBE7F8] to-[#F0EDFA] rounded-2xl p-6 border-l-4 border-[#6B5FA8]">
                  <div className="flex items-start space-x-3">
                    <Heart className="h-6 w-6 text-[#6B5FA8] mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-[#6B5FA8] mb-2 text-lg">A message from Echo</h3>
                      <p className="text-[#6B5FA8] leading-relaxed font-light">
                        {aiAnalysis.supportiveMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sentiment */}
              <div className="bg-[#F8F6FF] rounded-xl p-4">
                <h3 className="font-medium text-[#6B5FA8] mb-2">Sentiment</h3>
                <p className="text-[#8B86B8] capitalize">{aiAnalysis.sentiment || 'Neutral'}</p>
              </div>

              {/* Wellness Score */}
              {aiAnalysis.wellnessScore && (
                <div className="bg-[#F8F6FF] rounded-xl p-4">
                  <h3 className="font-medium text-[#6B5FA8] mb-2">Wellness Score</h3>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-[#6B5FA8] h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${aiAnalysis.wellnessScore}%` }}
                      ></div>
                    </div>
                    <span className="text-[#6B5FA8] font-medium">{Math.round(aiAnalysis.wellnessScore)}/100</span>
                  </div>
                </div>
              )}

              {/* Mood Tags */}
              {aiAnalysis.moodTags?.length > 0 && (
                <div className="bg-[#F8F6FF] rounded-xl p-4">
                  <h3 className="font-medium text-[#6B5FA8] mb-2">Mood Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.moodTags.map((tag: string, index: number) => (
                      <span key={index} className="bg-[#EBE7F8] text-[#6B5FA8] px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Insights */}
              {aiAnalysis.insights && (
                <div className="bg-[#F8F6FF] rounded-xl p-4">
                  <h3 className="font-medium text-[#6B5FA8] mb-2">AI Insights</h3>
                  <p className="text-[#8B86B8]">{aiAnalysis.insights}</p>
                </div>
              )}

              {/* Safety Alert */}
              {aiAnalysis.safetyRisk && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="font-medium text-red-700 mb-2">Safety Notice</h3>
                  <p className="text-red-600 text-sm">
                    I noticed some concerning content in your entry. Please remember that support is available. 
                    Consider reaching out to a mental health professional or a trusted person.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <Button 
                onClick={() => router.push('/journal')}
                className="rounded-full px-8 py-3 bg-[#6B5FA8] hover:bg-[#5A4F96] text-white"
              >
                View Your Journal
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
      {/* Gentle floating elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-[#EBE7F8]/10 to-[#E0DBF3]/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-gradient-to-br from-[#F0EDFA]/10 to-[#EBE7F8]/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '10s' }}></div>
      </div>

      {/* Minimal Header */}
      <header className="relative z-10 py-8">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <Link
              href="/journal"
              className="flex items-center space-x-2 text-[#8B86B8] hover:text-[#6B5FA8] transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-light">Back to your journal</span>
            </Link>
            <div className="flex items-center space-x-2 text-[#8B86B8]">
              <Heart className="h-4 w-4" />
              <span className="font-light text-sm">Safe space</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 pb-12">
        <div className="max-w-3xl mx-auto px-6">
          {/* Welcome Message */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/40 backdrop-blur-sm rounded-full mb-6 border border-[#8B86B8]/10">
              <Heart className="h-7 w-7 text-[#6B5FA8]" />
            </div>
            <h1 className="text-4xl font-serif text-[#6B5FA8] mb-4 font-light" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Whats in your heart today?
            </h1>
            <p className="text-[#8B86B8] text-lg font-light max-w-xl mx-auto leading-relaxed">
              This is your private sanctuary. Write freely, share openly, and know that every word is held with understanding and care.
            </p>
          </div>

          {/* Journal Paper Effect */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#8B86B8]/10 shadow-2xl shadow-[#6B5FA8]/5 overflow-hidden">
            {/* Paper lines effect */}
            <div className="bg-gradient-to-r from-[#6B5FA8]/5 to-transparent h-px"></div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
              {/* Main Content */}
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-light text-[#6B5FA8] mb-3 font-serif" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    Give your thoughts a gentle name
                  </label>
                  <div className="relative">
                    <Input
                      {...register('title')}
                      placeholder="Today I feel..."
                      className="bg-transparent border-none border-b border-[#8B86B8]/30 rounded-none focus:border-[#6B5FA8] focus:ring-0 text-lg font-serif text-[#6B5FA8] placeholder:text-[#8B86B8]/60 pb-2 pr-8"
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                      onFocus={() => {
                        setImmersiveField('title');
                        setIsImmersiveMode(true);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImmersiveField('title');
                        setIsImmersiveMode(true);
                      }}
                      className="absolute top-1/2 right-0 -translate-y-1/2 p-1 text-[#8B86B8] hover:text-[#6B5FA8] transition-colors opacity-60 hover:opacity-100"
                      title="Open immersive writing mode"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </button>
                  </div>
                  {errors.title && (
                    <p className="text-red-500/80 text-sm mt-2 font-light">{errors.title.message}</p>
                  )}
                </div>

                {/* Content */}
                <div className="mt-8">
                  <label className="block text-sm font-light text-[#6B5FA8] mb-4 font-serif" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    Pour your heart onto these pages
                  </label>
                  <div className="relative">
                    <Textarea
                      {...register('content')}
                      placeholder="Dear Journal,&#10;&#10;Today I want to share..."
                      rows={10}
                      className="bg-transparent border-none focus:ring-0 resize-none text-base font-serif text-[#6B5FA8] placeholder:text-[#8B86B8]/50 leading-relaxed w-full min-h-[300px] p-0 cursor-text"
                      style={{ 
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        backgroundImage: 'repeating-linear-gradient(transparent, transparent 1.4em, #8B86B8/10 1.4em, #8B86B8/10 1.5em)',
                        lineHeight: '1.5em'
                      }}
                      onFocus={() => {
                        setImmersiveField('content');
                        setIsImmersiveMode(true);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImmersiveField('content');
                        setIsImmersiveMode(true);
                      }}
                      className="absolute top-2 right-2 p-2 text-[#8B86B8] hover:text-[#6B5FA8] transition-colors opacity-60 hover:opacity-100"
                      title="Open immersive writing mode"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                  {errors.content && (
                    <p className="text-red-500/80 text-sm mt-2 font-light">{errors.content.message}</p>
                  )}
                </div>
              </div>

            {/* Mental Health Tracking */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-8 border border-[#8B86B8]/10 mt-8">
              <h3 className="text-xl font-light text-[#6B5FA8] mb-6 flex items-center font-serif" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                <Heart className="h-5 w-5 mr-3 text-[#6B5FA8]/70" />
                How is your heart today?
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Overall Mood */}
                <div className="space-y-3">
                  <label className="block text-sm font-light text-[#6B5FA8] flex items-center font-serif" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    {getMoodIcon(overallMood)}
                    <span className="ml-3">My overall feeling</span>
                    {overallMood && <span className="ml-auto text-[#8B86B8]/80 text-xs">({overallMood}/10)</span>}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    {...register('overallMood', { valueAsNumber: true })}
                    className="w-full h-1 bg-[#8B86B8]/20 rounded-full appearance-none cursor-pointer slider"
                    style={{
                      background: overallMood ? `linear-gradient(90deg, ${getScaleColor(overallMood)} 0%, ${getScaleColor(overallMood)} ${overallMood * 10}%, #8B86B8/20 ${overallMood * 10}%, #8B86B8/20 100%)` : '#8B86B8/20'
                    }}
                  />
                  <div className="flex justify-between text-xs text-[#8B86B8]/70 font-light">
                    <span>Struggling</span>
                    <span>Flourishing</span>
                  </div>
                </div>

                {/* Energy Level */}
                <div className="space-y-3">
                  <label className="block text-sm font-light text-[#6B5FA8] flex items-center font-serif" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    <Zap className="h-4 w-4 mr-3 text-[#6B5FA8]/70" />
                    My energy feels
                    {energyLevel && <span className="ml-auto text-[#8B86B8]/80 text-xs">({energyLevel}/10)</span>}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    {...register('energyLevel', { valueAsNumber: true })}
                    className="w-full h-1 bg-[#8B86B8]/20 rounded-full appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-[#8B86B8]/70 font-light">
                    <span>Drained</span>
                    <span>Vibrant</span>
                  </div>
                </div>

                {/* Anxiety Level */}
                <div className="space-y-3">
                  <label className="block text-sm font-light text-[#6B5FA8] flex items-center font-serif" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    <Brain className="h-4 w-4 mr-3 text-[#6B5FA8]/70" />
                    My mind feels
                    {anxietyLevel && <span className="ml-auto text-[#8B86B8]/80 text-xs">({anxietyLevel}/10)</span>}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    {...register('anxietyLevel', { valueAsNumber: true })}
                    className="w-full h-1 bg-[#8B86B8]/20 rounded-full appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-[#8B86B8]/70 font-light">
                    <span>Peaceful</span>
                    <span>Restless</span>
                  </div>
                </div>

                {/* Stress Level */}
                <div className="space-y-3">
                  <label className="block text-sm font-light text-[#6B5FA8] flex items-center font-serif" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    <span>My stress level</span>
                    {stressLevel && <span className="ml-auto text-[#8B86B8]/80 text-xs">({stressLevel}/10)</span>}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    {...register('stressLevel', { valueAsNumber: true })}
                    className="w-full h-1 bg-[#8B86B8]/20 rounded-full appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-[#8B86B8]/70 font-light">
                    <span>Relaxed</span>
                    <span>Tense</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy & Settings */}
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-[#8B86B8]/10 mt-6">
              <h3 className="text-lg font-light text-[#6B5FA8] mb-6 font-serif" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Your sacred space settings
              </h3>
              
              <div className="space-y-6">
                {/* Privacy Level */}
                <div>
                  <label className="block text-sm font-light text-[#6B5FA8] mb-4 font-serif" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    How would you like your thoughts protected?
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-white/30 transition-colors">
                      <input
                        type="radio"
                        value="server_managed"
                        {...register('privacyLevel')}
                        className="text-[#6B5FA8] focus:ring-[#6B5FA8]/30"
                      />
                      <Globe className="h-4 w-4 text-[#6B5FA8]/70" />
                      <span className="text-[#8B86B8] font-light">AI companion insights available</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-white/30 transition-colors">
                      <input
                        type="radio"
                        value="zero_knowledge"
                        {...register('privacyLevel')}
                        className="text-[#6B5FA8] focus:ring-[#6B5FA8]/30"
                      />
                      <Lock className="h-4 w-4 text-[#6B5FA8]/70" />
                      <span className="text-[#8B86B8] font-light">Completely private & encrypted</span>
                    </label>
                  </div>
                  <p className="text-xs text-[#8B86B8]/70 mt-3 font-light italic">
                    {privacyLevel === 'zero_knowledge' 
                      ? 'Your entry will be encrypted and only you can read it'
                      : 'AI will provide gentle insights and support'
                    }
                  </p>
                </div>

                {/* Convert to Memory */}
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-white/30 transition-colors">
                    <input
                      type="checkbox"
                      {...register('convertToMemory')}
                      className="text-[#6B5FA8] focus:ring-[#6B5FA8]/30 rounded"
                    />
                    <span className="text-[#8B86B8] font-light">Preserve as a cherished memory</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center space-x-6 pt-8">
              <Link href="/journal">
                <Button 
                  variant="outline" 
                  type="button" 
                  className="rounded-full px-8 py-3 border-[#8B86B8]/30 text-[#8B86B8] hover:bg-white/30 hover:border-[#6B5FA8] font-light transition-all duration-300"
                >
                  Maybe later
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-full px-10 py-3 bg-gradient-to-r from-[#6B5FA8] to-[#8B86B8] hover:from-[#5A4F96] hover:to-[#7A75A6] text-white font-light transition-all duration-300 shadow-lg shadow-[#6B5FA8]/20"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-3"></div>
                    <span className="font-serif" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      Understanding your heart...
                    </span>
                  </>
                ) : (
                  <>
                    <Heart className="mr-3 h-4 w-4" />
                    <span className="font-serif" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                      Share with my companion
                    </span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
      </main>

      {/* Immersive Writing Modal */}
      {isImmersiveMode && (
        <div className={`fixed inset-0 flex z-50 transition-all duration-500 ${
          immersiveTheme === 'dark' 
            ? 'bg-gradient-to-br from-[#2A2A2A] via-[#1F1F1F] to-[#151515]'
            : 'bg-gradient-to-br from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]'
        }`}>
          
          {/* Main Writing Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className={`flex items-center justify-between p-4 md:p-6 border-b transition-colors ${
              immersiveTheme === 'dark' ? 'border-white/10' : 'border-[#6B5FA8]/10'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6B5FA8] to-[#7C6DB8] flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <h2 className={`font-serif text-lg transition-colors hidden md:block ${
                  immersiveTheme === 'dark' ? 'text-white' : 'text-[#4A4A4A]'
                }`}>
                  {immersiveField === 'title' ? 'Title your thoughts' : 'Let your thoughts flow'}
                </h2>
              </div>
              
              {/* Controls */}
              <div className="flex items-center space-x-2 md:space-x-4">
                {/* Sidebar Toggle */}
                <button
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                  className={`p-2 rounded-lg transition-all ${
                    immersiveTheme === 'dark'
                      ? 'text-white/60 hover:text-white hover:bg-white/5'
                      : 'text-[#6B5FA8]/60 hover:text-[#6B5FA8] hover:bg-[#6B5FA8]/5'
                  }`}
                  title="Toggle past entries"
                >
                  <BookOpen className="h-5 w-5" />
                </button>
                
                {/* Theme Toggle */}
                <button
                  onClick={() => setImmersiveTheme(immersiveTheme === 'dark' ? 'light' : 'dark')}
                  className={`p-2 rounded-lg transition-all ${
                    immersiveTheme === 'dark'
                      ? 'text-white/60 hover:text-white hover:bg-white/5'
                      : 'text-[#6B5FA8]/60 hover:text-[#6B5FA8] hover:bg-[#6B5FA8]/5'
                  }`}
                  title={`Switch to ${immersiveTheme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {immersiveTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                
                {/* Field Toggle */}
                <div className={`hidden md:flex items-center rounded-lg p-1 ${
                  immersiveTheme === 'dark' ? 'bg-white/10' : 'bg-[#6B5FA8]/10'
                }`}>
                  <button
                    onClick={() => setImmersiveField('title')}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                      immersiveField === 'title'
                        ? 'bg-[#6B5FA8] text-white shadow-lg'
                        : immersiveTheme === 'dark'
                          ? 'text-white/60 hover:text-white hover:bg-white/5'
                          : 'text-[#6B5FA8]/60 hover:text-[#6B5FA8] hover:bg-[#6B5FA8]/5'
                    }`}
                  >
                    Title
                  </button>
                  <button
                    onClick={() => setImmersiveField('content')}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                      immersiveField === 'content'
                        ? 'bg-[#6B5FA8] text-white shadow-lg'
                        : immersiveTheme === 'dark'
                          ? 'text-white/60 hover:text-white hover:bg-white/5'
                          : 'text-[#6B5FA8]/60 hover:text-[#6B5FA8] hover:bg-[#6B5FA8]/5'
                    }`}
                  >
                    Content
                  </button>
                </div>
                
                <button
                  onClick={() => setIsImmersiveMode(false)}
                  className={`p-2 transition-colors rounded-lg ${
                    immersiveTheme === 'dark'
                      ? 'text-white/60 hover:text-white hover:bg-white/5'
                      : 'text-[#6B5FA8]/60 hover:text-[#6B5FA8] hover:bg-[#6B5FA8]/5'
                  }`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Writing Area */}
            <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
              <div className="w-full max-w-4xl">
                {immersiveField === 'title' ? (
                  <input
                    {...register('title')}
                    autoFocus
                    placeholder="Today I feel..."
                    className={`w-full bg-transparent border-none text-2xl md:text-4xl focus:outline-none font-serif text-center transition-colors ${
                      immersiveTheme === 'dark'
                        ? 'text-white placeholder:text-white/40'
                        : 'text-[#4A4A4A] placeholder:text-[#8B86B8]/50'
                    }`}
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  />
                ) : (
                  <textarea
                    {...register('content')}
                    autoFocus
                    placeholder="Dear journal, today..."
                    className={`w-full h-64 md:h-96 bg-transparent border-none text-lg md:text-xl focus:outline-none resize-none leading-relaxed font-serif transition-colors ${
                      immersiveTheme === 'dark'
                        ? 'text-white placeholder:text-white/40'
                        : 'text-[#4A4A4A] placeholder:text-[#8B86B8]/50'
                    }`}
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  />
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className={`p-4 md:p-6 border-t flex items-center justify-between transition-colors ${
              immersiveTheme === 'dark' ? 'border-white/10' : 'border-[#6B5FA8]/10'
            }`}>
              <div className="flex items-center space-x-4 md:space-x-6">
                <div className={`text-xs md:text-sm transition-colors ${
                  immersiveTheme === 'dark' ? 'text-white/60' : 'text-[#8B86B8]'
                }`}>
                  <span className="hidden md:inline">Escape to minimize • Tab to switch • Ctrl+D for theme • </span>Take your time
                </div>
                <div className={`text-xs transition-colors ${
                  immersiveTheme === 'dark' ? 'text-white/40' : 'text-[#8B86B8]/60'
                }`}>
                  <span className="capitalize">{immersiveField}</span> • <span className="capitalize">{immersiveTheme}</span>
                </div>
              </div>
              <button
                onClick={() => setIsImmersiveMode(false)}
                className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-[#6B5FA8] hover:bg-[#5D4F9A] text-white rounded-lg transition-colors text-sm"
              >
                <Minimize2 className="h-4 w-4" />
                <span className="hidden md:inline">Minimize</span>
              </button>
            </div>
          </div>

          {/* Resizable Sidebar */}
          {sidebarVisible && (
            <div 
              className={`relative flex-shrink-0 transition-all duration-300 ${
                immersiveTheme === 'dark' ? 'bg-black/20' : 'bg-white/20'
              } backdrop-blur-sm border-l ${
                immersiveTheme === 'dark' ? 'border-white/10' : 'border-[#6B5FA8]/10'
              }`}
              style={{ width: `${sidebarWidth}px` }}
            >
              {/* Resize Handle */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors hover:bg-[#6B5FA8]/50 ${
                  isResizing ? 'bg-[#6B5FA8]' : ''
                }`}
                onMouseDown={handleMouseDown}
              />
              
              {/* Sidebar Content */}
              <div className="flex flex-col h-full p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`font-serif text-lg transition-colors ${
                    immersiveTheme === 'dark' ? 'text-white' : 'text-[#4A4A4A]'
                  }`}>
                    Past Entries
                  </h3>
                  <button
                    onClick={() => setSidebarVisible(false)}
                    className={`p-1 rounded transition-colors md:hidden ${
                      immersiveTheme === 'dark'
                        ? 'text-white/60 hover:text-white hover:bg-white/5'
                        : 'text-[#6B5FA8]/60 hover:text-[#6B5FA8] hover:bg-[#6B5FA8]/5'
                    }`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Past Entries List */}
                <div className="flex-1 overflow-y-auto space-y-3">
                  {entriesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className={`animate-spin rounded-full h-6 w-6 border-2 ${
                        immersiveTheme === 'dark' 
                          ? 'border-white/20 border-t-white' 
                          : 'border-[#6B5FA8]/20 border-t-[#6B5FA8]'
                      }`}></div>
                    </div>
                  ) : pastEntries.length === 0 ? (
                    <div className={`text-center py-8 text-sm ${
                      immersiveTheme === 'dark' ? 'text-white/40' : 'text-[#8B86B8]/60'
                    }`}>
                      No past entries yet. This will be your first!
                    </div>
                  ) : (
                    pastEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`p-3 rounded-lg transition-all cursor-pointer ${
                          immersiveTheme === 'dark'
                            ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                            : 'bg-white/30 hover:bg-white/50 border border-[#6B5FA8]/10'
                        }`}
                        onClick={() => window.open(`/journal/${entry.id}`, '_blank')}
                      >
                        <h4 className={`font-serif text-sm mb-1 line-clamp-1 ${
                          immersiveTheme === 'dark' ? 'text-white' : 'text-[#4A4A4A]'
                        }`}>
                          {entry.title}
                        </h4>
                        <p className={`text-xs line-clamp-2 mb-2 ${
                          immersiveTheme === 'dark' ? 'text-white/60' : 'text-[#8B86B8]'
                        }`}>
                          {entry.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${
                            immersiveTheme === 'dark' ? 'text-white/40' : 'text-[#8B86B8]/60'
                          }`}>
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                          {entry.overallMood && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              immersiveTheme === 'dark'
                                ? 'bg-white/10 text-white/60'
                                : 'bg-[#6B5FA8]/10 text-[#6B5FA8]'
                            }`}>
                              {entry.overallMood}/10
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NewJournalEntry() {
  return (
    <ProtectedRoute>
      <NewJournalEntryContent />
    </ProtectedRoute>
  );
}
