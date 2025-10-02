'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { StreamingWalkthrough } from '@/components/streaming/StreamingWalkthrough';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function WalkthroughV2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const memoryId = searchParams.get('memoryId');

  if (!memoryId) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#6B5FA8] via-[#8B86B8] to-[#6B5FA8]">
          <div className="text-center text-white p-8 bg-white/10 backdrop-blur rounded-2xl shadow-sm">
            <p className="text-lg font-medium mb-4">No memory selected</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-white/80 hover:text-white underline"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <StreamingWalkthrough
        memoryId={memoryId}
        onExit={() => router.push('/dashboard')}
      />
    </ProtectedRoute>
  );
}
