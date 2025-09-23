 'use client';

import { createAuthClient } from 'better-auth/react';

// IMPORTANT: point to the API origin (include the /api/auth path here only if your server mounted Better Auth under a custom path)
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://api.my-echoes.app';

export const authClient = createAuthClient({
  baseURL,
  // Ensure cross-origin cookies are sent/stored
  fetchOptions: {
    credentials: 'include',
  },
});
