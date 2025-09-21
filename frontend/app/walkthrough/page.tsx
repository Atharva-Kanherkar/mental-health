'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MemorySelection } from '@/components/MemorySelection';
import { BreathingExercise } from '@/components/BreathingExercise';
import { ImmersiveWalkthrough, type MemoryWalkthrough } from '@/components/ImmersiveWalkthrough';
import ProtectedRoute from '@/components/ProtectedRoute';
import { walkthroughApi, type PanicModeWalkthrough } from '@/lib/api-client';

type AppState = 
  | 'selection'
  | 'breathing'
  | 'loading-walkthrough'
  | 'single-walkthrough'
  | 'panic-walkthrough'
  | 'completed';



export default function WalkthroughPage() {
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>('selection');
  const [, setSelectedMemoryId] = useState<string | null>(null);
  const [currentWalkthrough, setCurrentWalkthrough] = useState<MemoryWalkthrough | null>(null);
  const [panicModeData, setPanicModeData] = useState<PanicModeWalkthrough | null>(null);
  const [currentPanicIndex, setCurrentPanicIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSelectMemory = async (memoryId: string) => {
    try {
      setSelectedMemoryId(memoryId);
      setAppState('loading-walkthrough');
      setError(null);

      const walkthrough = await walkthroughApi.generateMemoryWalkthrough(memoryId);
      setCurrentWalkthrough(walkthrough);
      setAppState('single-walkthrough');

    } catch (err) {
      console.error('Error generating walkthrough:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate walkthrough');
      setAppState('selection');
    }
  };

  const handleSelectPanicMode = () => {
    setAppState('breathing');
  };

  const handleBreathingComplete = async () => {
    try {
      setAppState('loading-walkthrough');
      setError(null);

      const data = await walkthroughApi.generatePanicModeWalkthrough();
      setPanicModeData(data);
      setCurrentPanicIndex(0);
      
      // Start with the first walkthrough
      if (data.walkthroughs && data.walkthroughs.length > 0) {
        setCurrentWalkthrough(data.walkthroughs[0]);
        setAppState('panic-walkthrough');
      } else {
        throw new Error('No walkthroughs generated');
      }

    } catch (err) {
      console.error('Error generating panic mode walkthrough:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate panic mode walkthrough');
      setAppState('selection');
    }
  };

  const handleWalkthroughComplete = () => {
    if (appState === 'panic-walkthrough' && panicModeData && currentPanicIndex < panicModeData.walkthroughs.length - 1) {
      // Move to next walkthrough in panic mode
      setCurrentPanicIndex(prev => prev + 1);
      setCurrentWalkthrough(panicModeData.walkthroughs[currentPanicIndex + 1]);
    } else {
      // All walkthroughs completed
      setAppState('completed');
      
      // Redirect to dashboard after a moment
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    }
  };

  const handleExit = () => {
    router.push('/dashboard');
  };

  const getMemoryImageUrl = (walkthrough: MemoryWalkthrough | null) => {
    if (!walkthrough) return undefined;
    
    // For server-managed memories, use the proxy endpoint
    return `${process.env.NEXT_PUBLIC_API_URL}/api/files/serve/${walkthrough.memoryId}`;
  };

  return (
    <ProtectedRoute>
      {appState === 'selection' && (
        <div>
          <MemorySelection
            onSelectMemory={handleSelectMemory}
            onSelectPanicMode={handleSelectPanicMode}
          />
          
          {error && (
            <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
        </div>
      )}

      {appState === 'breathing' && (
        <BreathingExercise
          onComplete={handleBreathingComplete}
          duration={15}
        />
      )}

      {appState === 'loading-walkthrough' && (
        <div className="fixed inset-0 bg-gradient-to-br from-[#6B5FA8] via-[#8B86B8] to-[#6B5FA8] flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-serif mb-2">Creating your journey...</h2>
            <p className="text-white/80 font-light">
              Our AI is crafting a personalized experience just for you
            </p>
          </div>
        </div>
      )}

      {(appState === 'single-walkthrough' || appState === 'panic-walkthrough') && currentWalkthrough && (
        <ImmersiveWalkthrough
          walkthrough={currentWalkthrough}
          memoryImageUrl={getMemoryImageUrl(currentWalkthrough)}
          onComplete={handleWalkthroughComplete}
          onExit={handleExit}
        />
      )}

      {appState === 'completed' && (
        <div className="fixed inset-0 bg-gradient-to-br from-[#6B5FA8] via-[#8B86B8] to-[#6B5FA8] flex items-center justify-center">
          <div className="text-center text-white max-w-2xl mx-auto px-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-3xl font-serif mb-4">Journey Complete</h2>
            <p className="text-white/80 font-light text-lg leading-relaxed mb-8">
              Thank you for taking this time for yourself. Remember that peace and calm are always within reach, 
              and your memories are here whenever you need them.
            </p>
            <p className="text-white/60 text-sm">
              Returning to your sanctuary...
            </p>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
