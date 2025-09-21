'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { PasswordPrompt } from '@/components/PasswordPrompt';
import { useEncryptedFiles } from '@/lib/use-encrypted-files';
import { FileText, Image as ImageIcon, Music, Video, Upload, ArrowLeft, Lock, Shield, Brain, Heart, User } from 'lucide-react';
import { favoritesApi, type FavoritePerson } from '@/lib/api-client';

// Memory form validation schema
const memorySchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  memoryType: z.enum(['text', 'image', 'audio', 'video'], {
    message: 'Please select a memory type',
  }),
  privacyLevel: z.enum(['zero_knowledge', 'server_managed'], {
    message: 'Please select a privacy level',
  }),
  associatedPersonId: z.string().optional(),
});

type MemoryFormData = z.infer<typeof memorySchema>;
type FileType = 'text' | 'image' | 'audio' | 'video';

export default function NewMemoryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [memoryPassword, setMemoryPassword] = useState<string>('');
  const [favoritePeople, setFavoritePeople] = useState<FavoritePerson[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  
  const { uploadEncryptedFile, state } = useEncryptedFiles();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<MemoryFormData>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      memoryType: 'text',
      privacyLevel: 'server_managed', // Default to server-managed for better UX
    },
  });

  const { user } = useAuth();
  const router = useRouter();
  const selectedType = watch('memoryType');
  const selectedPrivacyLevel = watch('privacyLevel');
  const selectedPersonId = watch('associatedPersonId');

  // Fetch favorite people on component mount
  useEffect(() => {
    const fetchFavoritePeople = async () => {
      try {
        setLoadingPeople(true);
        const people = await favoritesApi.getAll();
        setFavoritePeople(people);
      } catch (error) {
        console.error('Failed to fetch favorite people:', error);
        toast.error('Failed to load your cherished people');
      } finally {
        setLoadingPeople(false);
      }
    };

    fetchFavoritePeople();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B5FA8]"></div>
      </div>
    );
  }

  const handlePasswordSubmit = (password: string) => {
    setMemoryPassword(password);
    setShowPasswordPrompt(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const onSubmit = async (data: MemoryFormData) => {
    // SECURITY: Only require password for zero-knowledge memories
    if (data.privacyLevel === 'zero_knowledge' && !memoryPassword) {
      setShowPasswordPrompt(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const fileToUpload = selectedFile || new File([data.description || ''], 'memory.txt', { type: 'text/plain' });
      
      const uploadParams = {
        file: fileToUpload,
        type: data.memoryType,
        content: data.description,
        associatedPersonId: data.associatedPersonId,
        privacyLevel: data.privacyLevel,
        // Only pass password for zero-knowledge memories
        userPassword: data.privacyLevel === 'zero_knowledge' ? memoryPassword : undefined
      };

      const uploadedFile = await uploadEncryptedFile(uploadParams);

      if (uploadedFile) {
        toast.success(`${data.privacyLevel === 'zero_knowledge' ? 'Private' : 'Smart'} memory preserved successfully!`);
        router.push('/memories');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to preserve memory. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileTypeIcon = (type: FileType) => {
    switch (type) {
      case 'text': return <FileText className="w-5 h-5" />;
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
    }
  };

  const getAcceptedFileTypes = (type: FileType) => {
    switch (type) {
      case 'image': return 'image/*';
      case 'audio': return 'audio/*';
      case 'video': return 'video/*';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
      {/* Subtle floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-100/20 to-pink-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/70 backdrop-blur-md border-b border-[#8B86B8]/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-6">
            <Button asChild variant="ghost" className="rounded-full text-[#6B5FA8] hover:bg-[#E6E1F7] font-light">
              <Link href="/memories">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Sanctuary
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-light text-[#6B5FA8] mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Preserve a Memory
              </h1>
              <p className="text-[#8B86B8] font-light opacity-80">Create a sacred space for your precious moment</p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Memory Type Selection */}
          <div className="p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15">
            <h2 className="text-2xl font-serif font-light text-[#6B5FA8] mb-6 text-center" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Choose Your Memory&apos;s Form
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['text', 'image', 'audio', 'video'] as FileType[]).map((type) => (
                <label key={type} className="cursor-pointer group">
                  <input
                    type="radio"
                    value={type}
                    {...register('memoryType')}
                    className="sr-only"
                  />
                  <div className={`
                    p-6 rounded-3xl text-center transition-all duration-500 group-hover:scale-105
                    ${selectedType === type 
                      ? 'bg-[#EBE7F8] text-[#6B5FA8] border-2 border-[#6B5FA8]/30 shadow-lg' 
                      : 'bg-white/30 text-[#8B86B8] border-2 border-transparent hover:bg-white/50'
                    }
                  `}>
                    <div className="flex justify-center mb-3">
                      {getFileTypeIcon(type)}
                    </div>
                    <span className="font-light capitalize">{type}</span>
                  </div>
                </label>
              ))}
            </div>
            {errors.memoryType && (
              <p className="text-red-500 text-sm mt-4 text-center font-light">
                {errors.memoryType.message}
              </p>
            )}
          </div>

          {/* Privacy Level Selection */}
          <div className="p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15">
            <h2 className="text-2xl font-serif font-light text-[#6B5FA8] mb-4 text-center" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Choose Your Privacy Level
            </h2>
            <p className="text-[#8B86B8] font-light text-center mb-6 text-sm">
              This choice affects what features will be available for this memory
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Server-Managed Option */}
              <label className="cursor-pointer group">
                <input
                  type="radio"
                  value="server_managed"
                  {...register('privacyLevel')}
                  className="sr-only"
                />
                <div className={`
                  p-6 rounded-3xl transition-all duration-500 group-hover:scale-105 border-2
                  ${selectedPrivacyLevel === 'server_managed' 
                    ? 'bg-[#EBE7F8] text-[#6B5FA8] border-[#6B5FA8]/30 shadow-lg' 
                    : 'bg-white/30 text-[#8B86B8] border-transparent hover:bg-white/50'
                  }
                `}>
                  <div className="flex items-center justify-center mb-4">
                    <Brain className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-center">Smart Memory</h3>
                  <p className="text-sm font-light leading-relaxed text-center mb-4">
                    Enable AI-powered features like personalized insights, memory analysis, and intelligent recommendations.
                  </p>
                  <div className="text-xs font-light text-center opacity-75 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>LLM walkthrough features</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>AI-powered insights</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Memory analysis</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span>Server can access file contents</span>
                    </div>
                  </div>
                </div>
              </label>

              {/* Zero-Knowledge Option */}
              <label className="cursor-pointer group">
                <input
                  type="radio"
                  value="zero_knowledge"
                  {...register('privacyLevel')}
                  className="sr-only"
                />
                <div className={`
                  p-6 rounded-3xl transition-all duration-500 group-hover:scale-105 border-2
                  ${selectedPrivacyLevel === 'zero_knowledge' 
                    ? 'bg-[#EBE7F8] text-[#6B5FA8] border-[#6B5FA8]/30 shadow-lg' 
                    : 'bg-white/30 text-[#8B86B8] border-transparent hover:bg-white/50'
                  }
                `}>
                  <div className="flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-center">Private Memory</h3>
                  <p className="text-sm font-light leading-relaxed text-center mb-4">
                    Maximum privacy with client-side encryption. Only you can decrypt and view this memory.
                  </p>
                  <div className="text-xs font-light text-center opacity-75 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Complete privacy</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Client-side encryption</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Server cannot read contents</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>No LLM features available</span>
                    </div>
                  </div>
                </div>
              </label>
            </div>
            
            {errors.privacyLevel && (
              <p className="text-red-500 text-sm mt-4 text-center font-light">
                {errors.privacyLevel.message}
              </p>
            )}
          </div>

          {/* Associate with Favorite Person */}
          <div className="p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15">
            <h2 className="text-2xl font-serif font-light text-[#6B5FA8] mb-4 text-center" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Connect to Someone Special
            </h2>
            <p className="text-[#8B86B8] font-light text-center mb-6 text-sm">
              Optionally associate this memory with someone cherished (helps AI create more personalized experiences)
            </p>
            
            {loadingPeople ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#6B5FA8]/20 border-t-[#6B5FA8]"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* No One Selected Option */}
                <label className="cursor-pointer group block">
                  <input
                    type="radio"
                    value=""
                    {...register('associatedPersonId')}
                    className="sr-only"
                  />
                  <div className={`
                    p-4 rounded-2xl transition-all duration-300 border-2 flex items-center gap-4
                    ${selectedPersonId === '' || selectedPersonId === undefined
                      ? 'bg-[#EBE7F8] text-[#6B5FA8] border-[#6B5FA8]/30 shadow-sm' 
                      : 'bg-white/30 text-[#8B86B8] border-transparent hover:bg-white/50'
                    }
                  `}>
                    <User className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Just me</div>
                      <div className="text-xs opacity-75">This memory is about me or doesn&apos;t involve anyone specific</div>
                    </div>
                  </div>
                </label>

                {/* Favorite People Options */}
                {favoritePeople.map((person) => (
                  <label key={person.id} className="cursor-pointer group block">
                    <input
                      type="radio"
                      value={person.id}
                      {...register('associatedPersonId')}
                      className="sr-only"
                    />
                    <div className={`
                      p-4 rounded-2xl transition-all duration-300 border-2 flex items-center gap-4
                      ${selectedPersonId === person.id
                        ? 'bg-[#EBE7F8] text-[#6B5FA8] border-[#6B5FA8]/30 shadow-sm' 
                        : 'bg-white/30 text-[#8B86B8] border-transparent hover:bg-white/50'
                      }
                    `}>
                      <Heart className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{person.name}</div>
                        <div className="text-xs opacity-75">{person.relationship}</div>
                      </div>
                    </div>
                  </label>
                ))}

                {favoritePeople.length === 0 && (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 mx-auto text-[#8B86B8]/50 mb-4" />
                    <p className="text-[#8B86B8] font-light mb-4">
                      No cherished people added yet
                    </p>
                    <Button asChild variant="outline" className="rounded-full text-[#6B5FA8] border-[#8B86B8]/30 hover:bg-[#EBE7F8]">
                      <Link href="/favorites/new">
                        Add Someone Special
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title Input */}
          <div className="p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15">
            <label className="block text-[#6B5FA8] font-light mb-4 text-lg">
              What shall we call this memory? *
            </label>
            <Input
              {...register('title')}
              placeholder="Give your memory a gentle name..."
              className="bg-white/50 border-[#8B86B8]/20 text-[#6B5FA8] placeholder-[#8B86B8]/60 font-light focus:bg-white/70 focus:border-[#6B5FA8]/30 transition-all duration-300 text-lg py-3 rounded-full"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-2 font-light">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Content/File Upload */}
          <div className="p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15">
            <h2 className="text-2xl font-serif font-light text-[#6B5FA8] mb-6 text-center" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Share Your Heart
            </h2>
            
            {selectedType === 'text' ? (
              <div>
                <Textarea
                  {...register('description')}
                  placeholder="Pour your heart into words, let your thoughts find their home..."
                  rows={8}
                  className="bg-white/50 border-[#8B86B8]/20 text-[#6B5FA8] placeholder-[#8B86B8]/60 font-light focus:bg-white/70 focus:border-[#6B5FA8]/30 transition-all duration-300 resize-none text-lg rounded-2xl"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-2 font-light">
                    {errors.description.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-[#8B86B8]/30 rounded-3xl p-12 text-center bg-white/20 hover:bg-white/30 transition-all duration-300">
                  <Upload className="w-12 h-12 text-[#8B86B8] mx-auto mb-4 opacity-70" />
                  <p className="text-[#6B5FA8] mb-4 text-lg font-light">
                    Choose your {selectedType} to preserve
                  </p>
                  <input
                    type="file"
                    accept={getAcceptedFileTypes(selectedType)}
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button 
                      type="button" 
                      className="rounded-full bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] border-0 font-light px-6"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Select File
                    </Button>
                  </label>
                  {selectedFile && (
                    <p className="text-[#6B5FA8] mt-4 font-light">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
                
                {/* Optional description for media files */}
                <div>
                  <label className="block text-[#6B5FA8] font-light mb-3">
                    Add a gentle description (optional)
                  </label>
                  <Textarea
                    {...register('description')}
                    placeholder="Share the story behind this precious moment..."
                    rows={4}
                    className="bg-white/50 border-[#8B86B8]/20 text-[#6B5FA8] placeholder-[#8B86B8]/60 font-light focus:bg-white/70 focus:border-[#6B5FA8]/30 transition-all duration-300 resize-none rounded-2xl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-6 pt-4">
            <Link href="/memories" className="flex-1">
              <Button 
                type="button" 
                variant="ghost"
                className="w-full rounded-full text-[#8B86B8] hover:bg-white/50 hover:text-[#6B5FA8] py-3 text-lg font-light border border-[#8B86B8]/20"
              >
                Not Today
              </Button>
            </Link>
            <div className="flex-1">
              <Button
                type="submit"
                disabled={isSubmitting || state.isUploading}
                className="w-full rounded-full bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] border-0 font-light px-6 py-3 text-lg transition-all duration-300"
              >
                {state.isUploading ? (
                  <>
                    <Upload className="w-5 h-5 mr-2 animate-spin" />
                    Preserving...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Preserve Memory
                  </>
                )}
              </Button>
            </div>
          </div>

          {state.error && (
            <div className="p-6 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-3xl">
              <p className="text-red-600 text-sm font-light text-center">
                {state.error}
              </p>
            </div>
          )}
        </form>
      </div>

      {showPasswordPrompt && (
        <PasswordPrompt
          isOpen={showPasswordPrompt}
          onClose={() => setShowPasswordPrompt(false)}
          onConfirm={handlePasswordSubmit}
          title="Encryption Password"
          description="Enter a password to encrypt your memory. Remember this password - it cannot be recovered!"
        />
      )}
    </div>
  );
}
