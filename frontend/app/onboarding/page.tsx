'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// removed react-hook-form usage from onboarding page to avoid in-page API calls
// zod import removed; form schemas moved out
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { withErrorHandling } from '@/lib/api-error-handler';
// Removed Input/Textarea imports since in-page forms were removed
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { onboardingApi, type FavoritePerson, type Memory } from '@/lib/api-client';
import { Heart, Plus, ChevronRight, Check, Users, Sparkles } from 'lucide-react';
import { isDiyana, hasDiyanaInPeople } from '@/lib/special-users';
import DiyanaSpecialSurprise from '@/components/DiyanaSpecialSurprise';

// Form schemas removed; onboarding defers adding people/memories to dedicated pages

type OnboardingStep = 'welcome' | 'content' | 'complete' | 'diyana-surprise';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [alreadyOnboarded, setAlreadyOnboarded] = useState(false);
  const addedPeople: FavoritePerson[] = [];
  const addedMemories: Memory[] = [];
  // Removed in-page forms to prevent failing API calls during onboarding
  const { user } = useAuth();
  const router = useRouter();

  // form logic removed — onboarding will defer add-person/add-memory to dedicated pages

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Check onboarding status and page data
    const checkStatus = async () => {
      try {
        // First check a lightweight status
        const status = await onboardingApi.getStatus();
        if (status.isOnboarded) {
          // User is already onboarded; show a friendly note instead of redirecting/logging out
          setAlreadyOnboarded(true);
          setCurrentStep('complete');
          return;
        }

        // Also fetch onboarding page data — server may respond with alreadyOnboarded=true for GET
        try {
          const pageData = await onboardingApi.getPage();
          if (pageData?.data?.alreadyOnboarded) {
            setAlreadyOnboarded(true);
            setCurrentStep('complete');
            return;
          }
        } catch (err) {
          // Non-fatal: continue to allow onboarding
          console.warn('Failed to fetch onboarding page data:', err);
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
      }
    };

    checkStatus();
  }, [user, router]);

  const initializeOnboarding = async () => {
    setIsLoading(true);
    try {
      await withErrorHandling(
        () => onboardingApi.initialize(),
        { context: 'Onboarding Initialization', rethrow: true }
      );
      
      // Try to proactively create the memory vault so subsequent add-person/add-memory
      // calls won't fail if the server expects a vault to exist already.
      try {
        await withErrorHandling(
          () => onboardingApi.createVaultWithContent(),
          { context: 'Memory Vault Creation', showToast: false, rethrow: true }
        );
      } catch (err) {
        // Non-fatal: if this fails, add-person/add-memory will surface the issue.
        console.warn('createVaultWithContent failed (non-fatal):', err);
      }
      
      setCurrentStep('content');
      toast.success('Your healing journey has begun 🌱');
    } catch (error) {
      // Error was already logged and shown via withErrorHandling
      console.error('Failed to initialize onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // addPerson/addMemory handlers removed; users are directed to dedicated pages instead

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      await withErrorHandling(
        () => onboardingApi.complete(),
        { context: 'Completing Onboarding', rethrow: true }
      );

     

      const isSpecialUser = (user && isDiyana(user)) || hasDiyanaInPeople(addedPeople);

      console.log('🔍 Is special user?', isSpecialUser);

      if (isSpecialUser) {
        // Show special surprise for Diyana
        console.log('🎉 Showing Diyana surprise!');
        setCurrentStep('diyana-surprise');
        toast.success('Something special awaits you... 💕');
      } else {
        // Regular completion
        toast.success('Welcome to your memory sanctuary! 🏛️');
        router.push('/dashboard');
      }
    } catch (error) {
      // Error was already handled by withErrorHandling
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-gradient-to-b from-[#FAFAFE] via-[#F6F4FC] to-[#F0EDFA] relative overflow-hidden">
      {/* Floating background elements - matching landing page */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-100/20 to-pink-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-lavender-100/10 to-blue-100/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '15s', animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Welcome Step */}
        {currentStep === 'welcome' && (
          <div className="max-w-4xl mx-auto text-center pt-12">
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-light tracking-wider text-[#6B5FA8] mb-6 leading-[0.9] opacity-90" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Welcome to Your Sanctuary
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-[#8B86B8] font-light leading-relaxed mb-12 max-w-2xl mx-auto opacity-80">
                This is your safe space - a gentle place where memories become medicine and healing becomes possible.
              </p>
            </div>

            <Card className="p-8 bg-white/30 backdrop-blur-sm border border-[#8B86B8]/20 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#EBE7F8] to-[#E0DBF3] rounded-full flex items-center justify-center">
                    <Heart className="w-8 h-8 text-[#6B5FA8]" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl md:text-2xl font-serif font-light text-[#6B5FA8]">
                    Your Healing Journey Begins Here
                  </h3>
                  <p className="text-[#8B86B8] font-light leading-relaxed">
                    We&apos;ll help you create a memory sanctuary - a place where you can safely store your precious moments, 
                    connect with people who matter, and find comfort when you need it most.
                  </p>
                  <p className="text-sm text-[#8B86B8] font-light opacity-75">
                    Take your time. There&apos;s no pressure. You can always add more later.
                  </p>
                </div>

                <Button
                  onClick={initializeOnboarding}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-3 text-lg font-light rounded-full bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] transition-all duration-300 shadow-sm hover:shadow-md border-0"
                >
                  {isLoading ? 'Preparing your space...' : 'Begin My Journey'}
                </Button>
              </div>
            </Card>

            <div className="mt-8 text-sm text-[#8B86B8] font-light opacity-70">
              You are worthy of healing. Your pain is valid. Your journey matters.
            </div>
          </div>
        )}

        {/* Content Collection Step */}
        {currentStep === 'content' && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-light text-[#6B5FA8] mb-4">
                Build Your Sanctuary
              </h2>
              <p className="text-lg text-[#8B86B8] font-light opacity-80 max-w-2xl mx-auto">
                Add the people and memories that bring you comfort. You can start with just one, or skip and add them later.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* People Section */}
              <Card className="p-6 bg-white/30 backdrop-blur-sm border border-[#8B86B8]/20 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#EBE7F8] to-[#E0DBF3] rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-[#6B5FA8]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif font-light text-[#6B5FA8]">
                        Cherished People
                      </h3>
                      <p className="text-sm text-[#8B86B8] font-light opacity-75">
                        Those who understand your heart
                      </p>
                    </div>
                  </div>

                  {addedPeople.length > 0 && (
                    <div className="space-y-3">
                      {addedPeople.map((person) => (
                        <div key={person.id} className="flex items-center space-x-3 p-3 bg-[#EBE7F8]/30 rounded-2xl">
                          <div className="w-8 h-8 bg-[#6B5FA8] rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-light">
                              {person.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-[#6B5FA8] font-light">{person.name}</p>
                            <Badge variant="secondary" className="text-xs bg-[#EBE7F8]/60 text-[#6B5FA8]">
                              {person.relationship}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-sm text-[#8B86B8]">You can add people later from your Favorites page.</p>
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full py-3 text-[#8B86B8] hover:bg-[#F5F3FA] transition-all duration-300 rounded-2xl border-2 border-dashed border-[#8B86B8]/30 hover:border-[#6B5FA8]/50"
                    >
                      <a href="/favorites/new" className="flex items-center justify-center w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Someone Later
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Memories Section */}
              <Card className="p-6 bg-white/30 backdrop-blur-sm border border-[#8B86B8]/20 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#EBE7F8] to-[#E0DBF3] rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-[#6B5FA8]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif font-light text-[#6B5FA8]">
                        Precious Memories
                      </h3>
                      <p className="text-sm text-[#8B86B8] font-light opacity-75">
                        Moments that warm your heart
                      </p>
                    </div>
                  </div>

                  {addedMemories.length > 0 && (
                    <div className="space-y-3">
                      {addedMemories.map((memory) => (
                        <div key={memory.id} className="p-3 bg-[#EBE7F8]/30 rounded-2xl">
                          <p className="text-[#6B5FA8] font-light text-sm line-clamp-3">
                            {memory.content}
                          </p>
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-xs bg-[#EBE7F8]/60 text-[#6B5FA8]">
                              Memory
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-sm text-[#8B86B8]">You can add memories later from your Memories page.</p>
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full py-3 text-[#8B86B8] hover:bg-[#F5F3FA] transition-all duration-300 rounded-2xl border-2 border-dashed border-[#8B86B8]/30 hover:border-[#6B5FA8]/50"
                    >
                      <a href="/memories/new" className="flex items-center justify-center w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Memory Later
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Complete Section */}
            <div className="text-center">
              <Card className="inline-block p-6 bg-white/30 backdrop-blur-sm border border-[#8B86B8]/20 rounded-3xl shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Check className="w-5 h-5 text-[#6B5FA8]" />
                    <span className="text-[#6B5FA8] font-light">
                      {addedPeople.length} people, {addedMemories.length} memories added
                    </span>
                  </div>
                  
                  <p className="text-sm text-[#8B86B8] font-light opacity-75 max-w-md">
                    {addedPeople.length > 0 || addedMemories.length > 0 
                      ? "Your sanctuary is taking shape. You can always add more later."
                      : "Ready to enter your sanctuary? You can add people and memories anytime."
                    }
                  </p>

                  {alreadyOnboarded ? (
                    <Button
                      onClick={() => router.push('/dashboard')}
                      className="px-8 py-3 text-lg font-light rounded-full bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] transition-all duration-300 shadow-sm hover:shadow-md border-0"
                    >
                      Go to Dashboard
                    </Button>
                  ) : (
                    <Button
                      onClick={completeOnboarding}
                      disabled={isLoading}
                      className="px-8 py-3 text-lg font-light rounded-full bg-[#EBE7F8] text-[#6B5FA8] hover:bg-[#E0DBF3] transition-all duration-300 shadow-sm hover:shadow-md border-0"
                    >
                      <ChevronRight className="w-5 h-5 mr-2" />
                      {isLoading ? 'Creating your sanctuary...' : 'Enter My Sanctuary'}
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-[#8B86B8] font-light opacity-70">
                Take your time. Healing happens at your own pace. You&apos;re already brave for being here.
              </p>
            </div>
          </div>
        )}

        {/* Special surprise for Diyana */}
        {currentStep === 'diyana-surprise' && (
          <DiyanaSpecialSurprise
            onComplete={() => {
              router.push('/dashboard');
            }}
          />
        )}
      </div>
    </div>
  );
}
