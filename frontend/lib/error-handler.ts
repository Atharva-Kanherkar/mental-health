/**
 * Centralized error handling utilities for user-friendly error messages
 */

export interface AppError {
  type: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  title: string;
  message: string;
  suggestion?: string;
  canRetry?: boolean;
}

/**
 * Maps technical errors to user-friendly messages
 */
export function mapErrorToUserFriendly(error: unknown): AppError {
  // Handle API errors (axios-style)
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as { 
      response?: { 
        status?: number; 
        data?: { error?: string; message?: string }; 
      };
      message?: string;
    };

    const status = apiError.response?.status;
    const serverMessage = apiError.response?.data?.error || apiError.response?.data?.message;

    switch (status) {
      case 401:
        return {
          type: 'auth',
          title: 'Sign In Required',
          message: 'Please sign in to continue your healing journey.',
          suggestion: 'Your session may have expired. Try signing in again.',
          canRetry: false
        };

      case 403:
        return {
          type: 'auth',
          title: 'Access Not Allowed',
          message: 'You don\'t have permission to access this part of your sanctuary.',
          suggestion: 'If you believe this is an error, please try signing out and back in.',
          canRetry: false
        };

      case 404:
        return {
          type: 'server',
          title: 'Not Found',
          message: 'We couldn\'t find what you\'re looking for in your sanctuary.',
          suggestion: 'This item may have been moved or removed. Try going back to your dashboard.',
          canRetry: false
        };

      case 400:
        // Handle validation errors
        if (serverMessage?.toLowerCase().includes('validation') || 
            serverMessage?.toLowerCase().includes('invalid')) {
          return {
            type: 'validation',
            title: 'Information Needed',
            message: 'Some required information is missing or incorrect.',
            suggestion: 'Please check your entries and try again.',
            canRetry: true
          };
        }
        break;

      case 429:
        return {
          type: 'server',
          title: 'Taking a Moment',
          message: 'You\'re moving a bit fast for us to keep up.',
          suggestion: 'Please wait a moment before trying again. Your healing journey is worth taking slowly.',
          canRetry: true
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: 'server',
          title: 'Temporary Hiccup',
          message: 'Something went wrong on our end, but it\'s not your fault.',
          suggestion: 'Please try again in a few moments. We\'re working to fix this.',
          canRetry: true
        };
    }

    // Generic API error
    return {
      type: 'server',
      title: 'Connection Issue',
      message: 'We\'re having trouble connecting to your sanctuary right now.',
      suggestion: 'Please check your internet connection and try again.',
      canRetry: true
    };
  }

  // Handle network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        type: 'network',
        title: 'Connection Problem',
        message: 'We\'re having trouble reaching your sanctuary.',
        suggestion: 'Please check your internet connection and try again.',
        canRetry: true
      };
    }

    if (message.includes('timeout')) {
      return {
        type: 'network',
        title: 'Taking Too Long',
        message: 'Your request is taking longer than expected.',
        suggestion: 'Please try again. Sometimes patience is part of the healing process.',
        canRetry: true
      };
    }

    if (message.includes('unauthorized') || message.includes('authentication')) {
      return {
        type: 'auth',
        title: 'Sign In Required',
        message: 'Please sign in to continue your healing journey.',
        suggestion: 'Your session may have expired. Try signing in again.',
        canRetry: false
      };
    }
  }

  // Fallback for unknown errors
  return {
    type: 'unknown',
    title: 'Something Unexpected Happened',
    message: 'We encountered an unexpected issue in your sanctuary.',
    suggestion: 'Please try again, or refresh the page if the problem continues.',
    canRetry: true
  };
}

/**
 * Get a brief user-friendly error message for toast notifications
 */
export function getToastErrorMessage(error: unknown): string {
  const mappedError = mapErrorToUserFriendly(error);
  
  // Return shorter messages for toasts
  switch (mappedError.type) {
    case 'auth':
      return 'Please sign in to continue';
    case 'network':
      return 'Connection problem - please try again';
    case 'validation':
      return 'Please check your information and try again';
    case 'server':
      return 'Something went wrong - please try again';
    default:
      return 'Something unexpected happened - please try again';
  }
}

/**
 * Enhanced error logging (can be extended to send to monitoring service)
 */
export function logError(error: unknown, context?: string) {
  const mappedError = mapErrorToUserFriendly(error);
  
  console.error('App Error:', {
    context,
    type: mappedError.type,
    title: mappedError.title,
    originalError: error,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A',
    url: typeof window !== 'undefined' ? window.location.href : 'N/A'
  });

  // In production, you could send this to a monitoring service like Sentry
  // if (process.env.NODE_ENV === 'production') {
  //   sentryService.captureError(error, { context, mappedError });
  // }
}
