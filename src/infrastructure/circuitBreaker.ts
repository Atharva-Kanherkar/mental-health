/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by stopping requests to failing services
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are blocked
 * - HALF_OPEN: Testing if service has recovered
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening circuit
  successThreshold: number;     // Successes needed to close from half-open
  timeout: number;              // Request timeout in ms
  resetTimeout: number;         // Time before trying half-open in ms
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
      resetTimeout: 60000,
    }
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttemptTime) {
        console.log(`[CircuitBreaker:${this.name}] Transitioning to HALF_OPEN`);
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        const waitTime = Math.ceil((this.nextAttemptTime - Date.now()) / 1000);
        throw new Error(
          `Circuit breaker [${this.name}] is OPEN. Retry in ${waitTime}s`
        );
      }
    }

    try {
      // Execute with timeout
      const result = await this.withTimeout(fn(), this.config.timeout);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Wrap promise with timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      console.log(
        `[CircuitBreaker:${this.name}] HALF_OPEN success ${this.successCount}/${this.config.successThreshold}`
      );

      if (this.successCount >= this.config.successThreshold) {
        console.log(`[CircuitBreaker:${this.name}] Recovered - transitioning to CLOSED`);
        this.state = 'CLOSED';
        this.successCount = 0;
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    console.error(
      `[CircuitBreaker:${this.name}] Failure ${this.failureCount}/${this.config.failureThreshold}`
    );

    if (
      this.state === 'HALF_OPEN' ||
      this.failureCount >= this.config.failureThreshold
    ) {
      console.error(`[CircuitBreaker:${this.name}] Opening circuit`);
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
      this.successCount = 0;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Manually reset circuit (use carefully!)
   */
  reset(): void {
    console.log(`[CircuitBreaker:${this.name}] Manual reset`);
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
  }
}
