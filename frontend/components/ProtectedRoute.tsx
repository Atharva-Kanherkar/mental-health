'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait until the loading state is resolved
    }
    if (requireAuth && !user) {
      router.push('/auth/login'); // Redirect if auth is required and user is not logged in
    }
  }, [user, loading, router, requireAuth]);

  // While loading, show a spinner to prevent content from flashing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If authentication is required and there is no user, return null.
  // The useEffect above will handle the redirect. This prevents the children from rendering.
  if (requireAuth && !user) {
    return null;
  }

  // Otherwise, render the children
  return <>{children}</>;
}
