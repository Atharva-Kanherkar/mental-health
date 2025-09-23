/**
 * Enhanced API client with centralized error handling
 */

import { mapErrorToUserFriendly, getToastErrorMessage, logError } from './error-handler';
import toast from 'react-hot-toast';

/**
 * Configuration for API error handling behavior
 */
interface ApiErrorConfig {
  showToast?: boolean;
  logError?: boolean;
  rethrow?: boolean;
  context?: string;
}

/**
 * Default configuration for API errors
 */
const DEFAULT_ERROR_CONFIG: ApiErrorConfig = {
  showToast: true,
  logError: true,
  rethrow: true,
  context: 'API Call'
};

/**
 * Enhanced wrapper for API calls that handles errors gracefully
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  config: ApiErrorConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_ERROR_CONFIG, ...config };

  try {
    return await apiCall();
  } catch (error) {
    // Log the error if requested
    if (finalConfig.logError) {
      logError(error, finalConfig.context);
    }

    // Show user-friendly toast if requested
    if (finalConfig.showToast) {
      const toastMessage = getToastErrorMessage(error);
      toast.error(toastMessage);
    }

    // Re-throw the error if requested (for component-level handling)
    if (finalConfig.rethrow) {
      throw error;
    }

    // Otherwise, return mapped error for component to handle
    return Promise.reject(mapErrorToUserFriendly(error));
  }
}

/**
 * Helper for API calls that should show loading states
 */
export async function withLoadingAndErrorHandling<T>(
  apiCall: () => Promise<T>,
  setLoading: (loading: boolean) => void,
  config: ApiErrorConfig = {}
): Promise<T | null> {
  setLoading(true);
  
  try {
    const result = await withErrorHandling(apiCall, {
      ...config,
      rethrow: false // Don't rethrow since we're handling it
    });
    return result;
  } catch {
    // Error was already handled by withErrorHandling
    // Return null to indicate failure
    return null;
  } finally {
    setLoading(false);
  }
}

/**
 * Specialized wrapper for authentication-related API calls
 */
export async function withAuthErrorHandling<T>(
  apiCall: () => Promise<T>,
  onAuthError?: () => void
): Promise<T> {
  try {
    return await withErrorHandling(apiCall, {
      context: 'Authentication',
      showToast: false // We'll handle auth errors specially
    });
  } catch (error) {
    const mappedError = mapErrorToUserFriendly(error);
    
    if (mappedError.type === 'auth') {
      // Special handling for auth errors
      toast.error('Your session has expired. Please sign in again.');
      onAuthError?.();
    } else {
      // Regular error handling for non-auth errors
      toast.error(getToastErrorMessage(error));
    }
    
    throw error;
  }
}

/**
 * Wrapper for silent API calls (background operations)
 */
export async function withSilentErrorHandling<T>(
  apiCall: () => Promise<T>,
  context?: string
): Promise<T | null> {
  try {
    return await withErrorHandling(apiCall, {
      showToast: false,
      logError: true,
      rethrow: false,
      context: context || 'Background Operation'
    });
  } catch {
    // Return null for silent failures
    return null;
  }
}

/**
 * Retry wrapper for API calls with exponential backoff
 */
export async function withRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  config: ApiErrorConfig = {}
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Wait before retry with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Show retry toast
        toast.loading(`Retrying... (${attempt}/${maxRetries})`, {
          id: 'retry-toast'
        });
      }
      
      const result = await withErrorHandling(apiCall, {
        ...config,
        showToast: attempt === maxRetries, // Only show toast on final attempt
        context: `${config.context || 'API Call'} (Attempt ${attempt + 1})`
      });
      
      // Dismiss retry toast on success
      if (attempt > 0) {
        toast.dismiss('retry-toast');
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Don't retry auth errors or validation errors
      const mappedError = mapErrorToUserFriendly(error);
      if (mappedError.type === 'auth' || mappedError.type === 'validation') {
        toast.dismiss('retry-toast');
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        toast.dismiss('retry-toast');
        throw error;
      }
    }
  }
  
  throw lastError;
}
