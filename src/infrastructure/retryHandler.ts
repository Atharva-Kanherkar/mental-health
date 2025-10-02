/**
 * Exponential Backoff Retry Handler
 * Automatically retries failed operations with increasing delays
 * Includes jitter to prevent thundering herd
 */

export interface RetryConfig {
  maxRetries: number;      // Maximum number of retry attempts
  initialDelay: number;    // Initial delay in ms
  maxDelay: number;        // Maximum delay cap in ms
  factor: number;          // Exponential backoff multiplier
  jitter: boolean;         // Add randomness to delays
}

export interface RetryableError {
  retryable: boolean;
  message: string;
}

export class RetryHandler {
  constructor(
    private config: RetryConfig = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      factor: 2,
      jitter: true,
    }
  ) {}

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    errorClassifier?: (error: any) => boolean
  ): Promise<T> {
    let lastError: Error;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Check if error is retryable
        if (errorClassifier && !errorClassifier(error)) {
          console.log(`[RetryHandler] Non-retryable error: ${lastError.message}`);
          throw lastError;
        }

        // No more retries
        if (attempt > this.config.maxRetries) {
          console.error(
            `[RetryHandler] Max retries (${this.config.maxRetries}) exceeded`
          );
          throw lastError;
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt);
        console.log(
          `[RetryHandler] Attempt ${attempt}/${this.config.maxRetries} failed. Retrying in ${delay}ms...`
        );

        // Wait before retry
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Calculate exponential backoff delay with optional jitter
   */
  private calculateDelay(attempt: number): number {
    // Exponential backoff: initialDelay * (factor ^ attempt)
    const exponentialDelay = Math.min(
      this.config.initialDelay * Math.pow(this.config.factor, attempt - 1),
      this.config.maxDelay
    );

    // Add jitter (random 0-30% of delay)
    if (this.config.jitter) {
      const jitterAmount = Math.random() * 0.3 * exponentialDelay;
      return Math.floor(exponentialDelay + jitterAmount);
    }

    return exponentialDelay;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Default error classifier for common retryable errors
   */
  static isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // HTTP status codes that are retryable
    if (error.status) {
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      return retryableStatuses.includes(error.status);
    }

    // Timeout errors
    if (error.message && error.message.includes('timeout')) {
      return true;
    }

    // Rate limit errors
    if (error.message && error.message.includes('rate limit')) {
      return true;
    }

    // Default to not retryable
    return false;
  }
}

/**
 * Convenience function for quick retries
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const handler = new RetryHandler(config as RetryConfig);
  return handler.execute(fn, RetryHandler.isRetryableError);
}
