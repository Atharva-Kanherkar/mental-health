'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { memoryApi, type Memory } from '@/lib/api-client';
import ProtectedRoute from '@/components/ProtectedRoute';
import { PasswordPrompt } from '@/components/PasswordPrompt';
import { useDecryptedFiles } from '@/lib/use-decrypted-files';
import { 
  BookOpen, 
  Plus, 
  Search,
  Calendar,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  FileText,
  ImageIcon,
  Music,
  Video,
  Lock,
  Brain,
  Sparkles
} from 'lucide-react';

function MemoriesPageContent() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [userPassword, setUserPassword] = useState<string>('');
  const [deletingMemoryId, setDeletingMemoryId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<Memory | null>(null);
  const [activeTab, setActiveTab] = useState<'private' | 'smart'>('private');
  const { user } = useAuth();

  // Use the decrypted files hook
  const { decryptedFiles, loadingFiles, errors } = useDecryptedFiles(memories, userPassword);

  useEffect(() => {
    if (user) {
      loadMemories();
    }
  }, [user]);

  // Check if we need to prompt for password (only when viewing private tab with zero-knowledge files)
  useEffect(() => {
    const hasZeroKnowledgeFiles = memories.some(m => m.privacyLevel === 'zero_knowledge');
    if (activeTab === 'private' && hasZeroKnowledgeFiles && !userPassword && !showPasswordPrompt) {
      setShowPasswordPrompt(true);
    }
  }, [memories, userPassword, showPasswordPrompt, activeTab]);

  useEffect(() => {
    // Filter memories based on search query and active tab
    let filtered = memories.filter(memory =>
      memory.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter by privacy level based on active tab
    if (activeTab === 'private') {
      filtered = filtered.filter(memory => memory.privacyLevel === 'zero_knowledge');
    } else if (activeTab === 'smart') {
      filtered = filtered.filter(memory => memory.privacyLevel === 'server_managed');
    }

    setFilteredMemories(filtered);
  }, [memories, searchQuery, activeTab]);

  const loadMemories = async () => {
    try {
      setIsLoading(true);
      const memoriesData = await memoryApi.getAll();
      setMemories(memoriesData);
    } catch (error) {
      console.error('Failed to load memories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = (password: string) => {
    setUserPassword(password);
    setShowPasswordPrompt(false);
  };

  const handlePasswordCancel = () => {
    setShowPasswordPrompt(false);
    // Don't clear password in case user wants to try again
  };

  const handleDeleteClick = (memory: Memory) => {
    setMemoryToDelete(memory);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memoryToDelete) return;
    
    try {
      setDeletingMemoryId(memoryToDelete.id);
      await memoryApi.delete(memoryToDelete.id);
      
      // Remove from local state
      setMemories(prev => prev.filter(m => m.id !== memoryToDelete.id));
      
      setShowDeleteConfirm(false);
      setMemoryToDelete(null);
    } catch (error) {
      console.error('Failed to delete memory:', error);
      alert('Failed to delete memory. Please try again.');
    } finally {
      setDeletingMemoryId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setMemoryToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="w-6 h-6" />;
      case 'image':
        return <ImageIcon className="w-6 h-6" />;
      case 'audio':
        return <Music className="w-6 h-6" />;
      case 'video':
        return <Video className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA]">
      {/* Subtle floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-100/20 to-pink-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/70 backdrop-blur-md border-b border-[#8B86B8]/20">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button asChild variant="ghost" className="rounded-full text-[#6B5FA8] hover:bg-[#E6E1F7] font-light">
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Sanctuary
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-light text-[#6B5FA8] mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Memory Sanctuary
                </h1>
                <p className="text-[#8B86B8] font-light opacity-80">Where precious moments find their home</p>
              </div>
            </div>
            <Button asChild className="rounded-full bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] transition-all duration-300 border-0 font-light px-6">
              <Link href="/memories/new">
                <Plus className="w-4 h-4 mr-2" />
                Preserve a Memory
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8B86B8] opacity-70" />
            <Input
              placeholder="Search within your sanctuary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-full bg-white/50 border-[#8B86B8]/20 text-[#6B5FA8] placeholder-[#8B86B8]/60 font-light focus:bg-white/70 focus:border-[#6B5FA8]/30 transition-all duration-300"
            />
          </div>
        </div>

        {/* Memory Type Tabs */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="inline-flex bg-white/30 backdrop-blur-sm rounded-full p-1 border border-[#8B86B8]/15">
              {[
                { key: 'private', label: 'Private', icon: Lock },
                { key: 'smart', label: 'Smart', icon: Sparkles }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as 'private' | 'smart')}
                  className={`
                    relative flex items-center gap-2 px-6 py-3 rounded-full font-light text-sm transition-all duration-300
                    ${activeTab === key
                      ? 'bg-[#6B5FA8] text-white shadow-lg transform scale-105'
                      : 'text-[#6B5FA8] hover:bg-white/40 hover:text-[#5A4A98]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {activeTab === key && (
                    <div className="absolute inset-0 rounded-full bg-[#6B5FA8] opacity-10 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <div className="group p-6 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-[#EBE7F8] text-[#6B5FA8] group-hover:bg-[#E0DBF3] transition-colors duration-300">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-light text-[#6B5FA8] mb-1">{filteredMemories.length}</p>
                <p className="text-sm font-light text-[#8B86B8] opacity-80">
                  {activeTab === 'private' ? 'Private Moments' : 
                   activeTab === 'smart' ? 'Smart Memories' : 'Treasured Moments'}
                </p>
              </div>
            </div>
          </div>
          <div className="group p-6 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-[#EBE7F8] text-[#6B5FA8] group-hover:bg-[#E0DBF3] transition-colors duration-300">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-light text-[#6B5FA8] mb-1">
                  {filteredMemories.filter(m => m.type === 'text').length}
                </p>
                <p className="text-sm font-light text-[#8B86B8] opacity-80">Written Reflections</p>
              </div>
            </div>
          </div>
          <div className="group p-6 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-[#EBE7F8] text-[#6B5FA8] group-hover:bg-[#E0DBF3] transition-colors duration-300">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-light text-[#6B5FA8] mb-1">
                  {filteredMemories.filter(m => m.type === 'image').length}
                </p>
                <p className="text-sm font-light text-[#8B86B8] opacity-80">Visual Memories</p>
              </div>
            </div>
          </div>
          <div className="group p-6 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-[#EBE7F8] text-[#6B5FA8] group-hover:bg-[#E0DBF3] transition-colors duration-300">
                <Music className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-light text-[#6B5FA8] mb-1">
                  {filteredMemories.filter(m => m.type === 'audio').length}
                </p>
                <p className="text-sm font-light text-[#8B86B8] opacity-80">Sound Memories</p>
              </div>
            </div>
          </div>
          <div className="group p-6 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-[#EBE7F8] text-[#6B5FA8] group-hover:bg-[#E0DBF3] transition-colors duration-300">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-light text-[#6B5FA8] mb-1">
                  {filteredMemories.filter(m => m.type === 'video').length}
                </p>
                <p className="text-sm font-light text-[#8B86B8] opacity-80">Video Memories</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15">
                <div className="animate-pulse">
                  <div className="h-4 bg-[#8B86B8]/20 rounded-full w-1/4 mb-3"></div>
                  <div className="h-3 bg-[#8B86B8]/20 rounded-full w-3/4 mb-6"></div>
                  <div className="h-20 bg-[#8B86B8]/20 rounded-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && memories.length === 0 && (
          <div className="p-16 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 text-center">
            <div className="p-4 rounded-full bg-[#EBE7F8] text-[#6B5FA8] w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-light text-[#6B5FA8] mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Your sanctuary awaits
            </h3>
            <p className="text-[#8B86B8] font-light opacity-80 mb-8 max-w-md mx-auto leading-relaxed">
              Begin gathering the moments that have shaped your heart, the memories that remind you of your strength
            </p>
            <Button asChild className="rounded-full bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] transition-all duration-300 border-0 font-light px-8">
              <Link href="/memories/new">
                <Plus className="w-4 h-4 mr-2" />
                Preserve Your First Memory
              </Link>
            </Button>
          </div>
        )}

        {/* No Results */}
        {!isLoading && memories.length > 0 && filteredMemories.length === 0 && (
          <div className="p-16 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 text-center">
            <div className="p-4 rounded-full bg-[#EBE7F8] text-[#6B5FA8] w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-light text-[#6B5FA8] mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Nothing found in this search
            </h3>
            <p className="text-[#8B86B8] font-light opacity-80">
              Try different words to find your cherished moments
            </p>
          </div>
        )}

        {/* Memories List */}
        {!isLoading && filteredMemories.length > 0 && (
          <div className="space-y-6">
            {filteredMemories.map((memory) => (
              <div key={memory.id} className="group p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500">
                <div className="flex items-start gap-6">
                  <div className="p-3 rounded-full bg-[#EBE7F8] text-[#6B5FA8] opacity-70">
                    {getTypeIcon(memory.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-[#EBE7F8] rounded-full text-xs font-light text-[#6B5FA8]">
                          {memory.type}
                        </div>
                        {/* Privacy Level Indicator */}
                        <div className={`px-3 py-1 rounded-full text-xs font-light flex items-center gap-1 ${
                          memory.privacyLevel === 'zero_knowledge' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {memory.privacyLevel === 'zero_knowledge' ? (
                            <>
                              <Lock className="w-3 h-3" />
                              Private
                            </>
                          ) : (
                            <>
                              <Brain className="w-3 h-3" />
                              Smart
                            </>
                          )}
                        </div>
                        <span className="text-sm text-[#8B86B8] opacity-70 font-light">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          {formatDate(memory.createdAt)}
                        </span>
                      </div>
                      
                      {/* Delete Button */}
                      <Button
                        onClick={() => handleDeleteClick(memory)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        disabled={deletingMemoryId === memory.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {memory.type === 'text' && memory.content && (
                      <div className="prose prose-sm max-w-none">
                        <p className="text-[#6B5FA8] font-light leading-relaxed whitespace-pre-wrap">
                          {memory.content}
                        </p>
                      </div>
                    )}
                    
                    {memory.type === 'image' && (
                      <div className="space-y-4">
                        {memory.privacyLevel === 'zero_knowledge' ? (
                          // Encrypted image handling
                          decryptedFiles.has(memory.id) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={decryptedFiles.get(memory.id)}
                              alt="Memory"
                              className="max-w-md w-full h-auto rounded-2xl border border-[#8B86B8]/20 shadow-sm object-cover"
                              style={{ maxHeight: '300px' }}
                            />
                          ) : loadingFiles.has(memory.id) ? (
                            <div className="max-w-md h-64 rounded-2xl border border-[#8B86B8]/20 bg-gradient-to-br from-white/40 to-white/20 flex items-center justify-center">
                              <div className="text-center space-y-3">
                                <div className="w-8 h-8 border-2 border-[#6B5FA8]/30 border-t-[#6B5FA8] rounded-full animate-spin mx-auto" />
                                <p className="text-[#8B86B8] font-light text-sm">Decrypting...</p>
                              </div>
                            </div>
                          ) : errors.has(memory.id) ? (
                            <div className="max-w-md h-64 rounded-2xl border border-red-200 bg-red-50/50 flex items-center justify-center">
                              <div className="text-center space-y-3 p-6">
                                <Lock className="w-8 h-8 text-red-500 mx-auto" />
                                <p className="text-red-600 font-light text-sm">{errors.get(memory.id)}</p>
                                <Button
                                  onClick={() => setShowPasswordPrompt(true)}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                >
                                  Try Again
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="max-w-md h-64 rounded-2xl border border-[#8B86B8]/20 bg-gradient-to-br from-white/40 to-white/20 flex items-center justify-center">
                              <div className="text-center space-y-3 p-6">
                                <Lock className="w-8 h-8 text-[#6B5FA8] mx-auto" />
                                <p className="text-[#8B86B8] font-light text-sm">Enter password to view</p>
                                <Button
                                  onClick={() => setShowPasswordPrompt(true)}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                >
                                  Unlock
                                </Button>
                              </div>
                            </div>
                          )
                        ) : memory.fileUrl ? (
                          <div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={memory.privacyLevel === 'server_managed' 
                                ? `${process.env.NEXT_PUBLIC_API_URL}/api/files/serve/${memory.id}` 
                                : memory.fileUrl}
                              alt="Memory"
                              className="max-w-md rounded-2xl border border-[#8B86B8]/20 shadow-sm max-h-80 object-cover"
                            />
                          </div>
                        ) : null}
                        {memory.content && (
                          <p className="text-[#8B86B8] font-light text-sm opacity-80">{memory.content}</p>
                        )}
                      </div>
                    )}
                    
                    {memory.type === 'audio' && (
                      <div className="space-y-4">
                        {memory.privacyLevel === 'zero_knowledge' ? (
                          decryptedFiles.has(memory.id) ? (
                            <audio controls className="w-full max-w-md rounded-2xl">
                              <source src={decryptedFiles.get(memory.id)} type={memory.fileMimeType || "audio/mpeg"} />
                              Your browser does not support the audio element.
                            </audio>
                          ) : loadingFiles.has(memory.id) ? (
                            <div className="w-full max-w-md h-16 rounded-2xl border border-[#8B86B8]/20 bg-gradient-to-br from-white/40 to-white/20 flex items-center justify-center">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-[#6B5FA8]/30 border-t-[#6B5FA8] rounded-full animate-spin" />
                                <span className="text-[#8B86B8] font-light text-sm">Decrypting audio...</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full max-w-md h-16 rounded-2xl border border-[#8B86B8]/20 bg-gradient-to-br from-white/40 to-white/20 flex items-center justify-center">
                              <Button
                                onClick={() => setShowPasswordPrompt(true)}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                <Lock className="w-4 h-4 mr-1" />
                                Unlock Audio
                              </Button>
                            </div>
                          )
                        ) : memory.fileUrl ? (
                          <audio controls className="w-full max-w-md rounded-2xl">
                            <source src={memory.privacyLevel === 'server_managed' 
                              ? `${process.env.NEXT_PUBLIC_API_URL}/api/files/serve/${memory.id}` 
                              : memory.fileUrl} type={memory.fileMimeType || "audio/mpeg"} />
                            Your browser does not support the audio element.
                          </audio>
                        ) : null}
                        {memory.content && (
                          <p className="text-[#8B86B8] font-light text-sm opacity-80">{memory.content}</p>
                        )}
                      </div>
                    )}

                    {memory.type === 'video' && (
                      <div className="space-y-4">
                        {memory.privacyLevel === 'zero_knowledge' ? (
                          decryptedFiles.has(memory.id) ? (
                            <video controls className="w-full max-w-md rounded-2xl border border-[#8B86B8]/20 shadow-sm" style={{ maxHeight: '300px' }}>
                              <source src={decryptedFiles.get(memory.id)} type={memory.fileMimeType || "video/mp4"} />
                              Your browser does not support the video element.
                            </video>
                          ) : loadingFiles.has(memory.id) ? (
                            <div className="w-full max-w-md h-64 rounded-2xl border border-[#8B86B8]/20 bg-gradient-to-br from-white/40 to-white/20 flex items-center justify-center">
                              <div className="text-center space-y-3">
                                <div className="w-8 h-8 border-2 border-[#6B5FA8]/30 border-t-[#6B5FA8] rounded-full animate-spin mx-auto" />
                                <p className="text-[#8B86B8] font-light text-sm">Decrypting video...</p>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full max-w-md h-64 rounded-2xl border border-[#8B86B8]/20 bg-gradient-to-br from-white/40 to-white/20 flex items-center justify-center">
                              <Button
                                onClick={() => setShowPasswordPrompt(true)}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                <Lock className="w-4 h-4 mr-1" />
                                Unlock Video
                              </Button>
                            </div>
                          )
                        ) : memory.fileUrl ? (
                          <video controls className="w-full max-w-md rounded-2xl border border-[#8B86B8]/20 shadow-sm" style={{ maxHeight: '300px' }}>
                            <source src={memory.privacyLevel === 'server_managed' 
                              ? `${process.env.NEXT_PUBLIC_API_URL}/api/files/serve/${memory.id}` 
                              : memory.fileUrl} type={memory.fileMimeType || "video/mp4"} />
                            Your browser does not support the video element.
                          </video>
                        ) : null}
                        {memory.content && (
                          <p className="text-[#8B86B8] font-light text-sm opacity-80">{memory.content}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show results count */}
        {!isLoading && memories.length > 0 && (
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/30 backdrop-blur-sm rounded-full border border-[#8B86B8]/20">
              <span className="text-sm font-light text-[#6B5FA8] opacity-80">
                {searchQuery ? (
                  <>Showing {filteredMemories.length} of {memories.length} cherished moments</>
                ) : (
                  <>All {memories.length} precious memories preserved</>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Password Prompt for Encrypted Files */}
        <PasswordPrompt
          isOpen={showPasswordPrompt}
          onClose={handlePasswordCancel}
          onConfirm={handlePasswordSubmit}
          title="Unlock Your Memories"
          description="Enter your password to decrypt and view your encrypted memories."
          isLoading={false}
        />

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && memoryToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#8B86B8]/20 p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-serif font-light text-[#6B5FA8] mb-2">
                    Delete Memory?
                  </h3>
                  <p className="text-[#8B86B8] font-light">
                    Are you sure you want to delete this {memoryToDelete.type} memory? 
                    {memoryToDelete.privacyLevel === 'zero_knowledge' && (
                      <span className="block mt-2 text-sm text-red-600">
                        This will permanently delete the encrypted file from secure storage.
                      </span>
                    )}
                    This action cannot be undone.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleDeleteCancel}
                    variant="outline"
                    className="flex-1 rounded-full font-light border-[#8B86B8]/30 text-[#6B5FA8] hover:bg-[#EBE7F8]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteConfirm}
                    disabled={deletingMemoryId === memoryToDelete.id}
                    className="flex-1 rounded-full bg-red-500 hover:bg-red-600 text-white font-light"
                  >
                    {deletingMemoryId === memoryToDelete.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Memory'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MemoriesPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <MemoriesPageContent />
    </ProtectedRoute>
  );
}
