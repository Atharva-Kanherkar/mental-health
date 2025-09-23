'use client';

import { useEffect } from 'react';
import { mapErrorToUserFriendly, logError } from '@/lib/error-handler';
import ErrorPage from '@/components/ErrorPage';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    // Log the error for debugging
    logError(error, 'Next.js Error Boundary');
  }, [error]);

  const mappedError = mapErrorToUserFriendly(error);

  return (
    <ErrorPage 
      error={mappedError}
      onRetry={reset}
      showContactSupport={true}
    />
  );
}
