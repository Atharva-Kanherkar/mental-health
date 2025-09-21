'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { favoritesApi, type FavoritePerson } from '@/lib/api-client';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  Heart, 
  Plus, 
  Search,
  Calendar,
  ArrowLeft,
  Users,
  Trash2,
  AlertTriangle,
  Mail,
  Phone
} from 'lucide-react';

function FavoritesPageContent() {
  const [favorites, setFavorites] = useState<FavoritePerson[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoritePerson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPersonId, setDeletingPersonId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<FavoritePerson | null>(null);


  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    // Filter favorites based on search query
    const filtered = favorites.filter(person =>
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.relationship.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.supportMsg?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFavorites(filtered);
  }, [favorites, searchQuery]);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const favoritesData = await favoritesApi.getAll();
      setFavorites(favoritesData);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-gradient-to-br from-pink-500 to-red-500',
      'bg-gradient-to-br from-blue-500 to-purple-500',
      'bg-gradient-to-br from-green-500 to-teal-500',
      'bg-gradient-to-br from-yellow-500 to-orange-500',
      'bg-gradient-to-br from-indigo-500 to-blue-500',
      'bg-gradient-to-br from-purple-500 to-pink-500',
    ];
    
    const index = name.length % colors.length;
    return colors[index];
  };

  const handleDeleteClick = (person: FavoritePerson) => {
    setPersonToDelete(person);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!personToDelete) return;
    
    try {
      setDeletingPersonId(personToDelete.id);
      await favoritesApi.delete(personToDelete.id);
      
      // Remove from local state
      setFavorites(prev => prev.filter(p => p.id !== personToDelete.id));
      
      setShowDeleteConfirm(false);
      setPersonToDelete(null);
    } catch (error) {
      console.error('Failed to delete favorite person:', error);
      alert('Failed to delete person. Please try again.');
    } finally {
      setDeletingPersonId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setPersonToDelete(null);
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
                  Cherished Circle
                </h1>
                <p className="text-[#8B86B8] font-light opacity-80">The souls who light your path</p>
              </div>
            </div>
            <Button asChild className="rounded-full bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] transition-all duration-300 border-0 font-light px-6">
              <Link href="/favorites/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Cherished Person
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
              placeholder="Search your cherished circle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-full bg-white/50 border-[#8B86B8]/20 text-[#6B5FA8] placeholder-[#8B86B8]/60 font-light focus:bg-white/70 focus:border-[#6B5FA8]/30 transition-all duration-300"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="group p-6 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-[#EBE7F8] text-[#6B5FA8] group-hover:bg-[#E0DBF3] transition-colors duration-300">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-light text-[#6B5FA8] mb-1">{favorites.length}</p>
                <p className="text-sm font-light text-[#8B86B8] opacity-80">Cherished Souls</p>
              </div>
            </div>
          </div>
          <div className="group p-6 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-[#EBE7F8] text-[#6B5FA8] group-hover:bg-[#E0DBF3] transition-colors duration-300">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-light text-[#6B5FA8] mb-1">
                  {new Set(favorites.map(f => f.relationship.toLowerCase())).size}
                </p>
                <p className="text-sm font-light text-[#8B86B8] opacity-80">Types of Love</p>
              </div>
            </div>
          </div>
          <div className="group p-6 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-[#EBE7F8] text-[#6B5FA8] group-hover:bg-[#E0DBF3] transition-colors duration-300">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-light text-[#6B5FA8] mb-1">
                  {favorites.length > 0 ? 
                    Math.ceil((Date.now() - new Date(favorites[favorites.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    : 0
                  }
                </p>
                <p className="text-sm font-light text-[#8B86B8] opacity-80">Days Since Last</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15">
                <div className="animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#8B86B8]/20 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-[#8B86B8]/20 rounded-full w-3/4 mb-2"></div>
                      <div className="h-3 bg-[#8B86B8]/20 rounded-full w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-16 bg-[#8B86B8]/20 rounded-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && favorites.length === 0 && (
          <div className="p-16 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 text-center">
            <div className="p-4 rounded-full bg-[#EBE7F8] text-[#6B5FA8] w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-light text-[#6B5FA8] mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              Your circle awaits
            </h3>
            <p className="text-[#8B86B8] font-light opacity-80 mb-8 max-w-md mx-auto leading-relaxed">
              Begin honoring the souls who have touched your heart, the ones who see your light even in darkness
            </p>
            <Button asChild className="rounded-full bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] transition-all duration-300 border-0 font-light px-8">
              <Link href="/favorites/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Cherished Person
              </Link>
            </Button>
          </div>
        )}

        {/* No Results */}
        {!isLoading && favorites.length > 0 && filteredFavorites.length === 0 && (
          <div className="p-16 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 text-center">
            <div className="p-4 rounded-full bg-[#EBE7F8] text-[#6B5FA8] w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-serif font-light text-[#6B5FA8] mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              No souls found in this search
            </h3>
            <p className="text-[#8B86B8] font-light opacity-80">
              Try different words to find your cherished ones
            </p>
          </div>
        )}

        {/* Favorites Grid */}
        {!isLoading && filteredFavorites.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFavorites.map((person) => (
              <div key={person.id} className="group p-8 bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm rounded-3xl border border-[#8B86B8]/15 hover:border-[#6B5FA8]/25 hover:bg-gradient-to-br hover:from-white/50 hover:to-white/30 transition-all duration-500">
                <div className="flex items-start gap-6">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-light text-lg shadow-sm ${getAvatarColor(person.name)}`}>
                    {getInitials(person.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-serif font-light text-[#6B5FA8]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{person.name}</h3>
                        <Heart className="w-4 h-4 text-[#6B5FA8] opacity-60" />
                      </div>
                      
                      {/* Delete Button */}
                      <Button
                        onClick={() => handleDeleteClick(person)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        disabled={deletingPersonId === person.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-[#8B86B8] font-light text-sm mb-4 opacity-80">{person.relationship}</p>
                    
                    {person.supportMsg && (
                      <p className="text-[#6B5FA8] font-light text-sm leading-relaxed mb-4 opacity-90">
                        &ldquo;{person.supportMsg}&rdquo;
                      </p>
                    )}
                    
                    {person.email && (
                      <p className="text-[#8B86B8] font-light text-sm mb-2 opacity-70 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {person.email}
                      </p>
                    )}
                    
                    {person.phoneNumber && (
                      <p className="text-[#8B86B8] font-light text-sm mb-3 opacity-70 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {person.phoneNumber}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs bg-[#EBE7F8] text-[#6B5FA8] px-3 py-1 rounded-full font-light">
                        Priority: {person.priority}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-[#8B86B8] opacity-60 font-light">
                      <Calendar className="w-3 h-3" />
                      <span>Cherished since {formatDate(person.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show results count */}
        {!isLoading && favorites.length > 0 && (
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/30 backdrop-blur-sm rounded-full border border-[#8B86B8]/20">
              <span className="text-sm font-light text-[#6B5FA8] opacity-80">
                {searchQuery ? (
                  <>Showing {filteredFavorites.length} of {favorites.length} cherished souls</>
                ) : (
                  <>All {favorites.length} beloved souls in your circle</>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && personToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-[#8B86B8]/20 p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-serif font-light text-[#6B5FA8] mb-2">
                    Remove from Circle?
                  </h3>
                  <p className="text-[#8B86B8] font-light">
                    Are you sure you want to remove <strong>{personToDelete.name}</strong> from your cherished circle?
                    <span className="block mt-2 text-sm text-red-600">
                      This will permanently delete all their information and cannot be undone.
                    </span>
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
                    disabled={deletingPersonId === personToDelete.id}
                    className="flex-1 rounded-full bg-red-500 hover:bg-red-600 text-white font-light"
                  >
                    {deletingPersonId === personToDelete.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Removing...
                      </>
                    ) : (
                      'Remove Person'
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

export default function FavoritesPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <FavoritesPageContent />
    </ProtectedRoute>
  );
}
