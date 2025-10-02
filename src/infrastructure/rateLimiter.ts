/**
 * Rate Limiter
 * Controls request rate to prevent API quota exhaustion
 * Implements token bucket algorithm with queue management
 */

export interface RateLimiterConfig {
  maxConcurrent: number;       // Max concurrent requests
  requestsPerMinute: number;   // Max requests per minute
  queueSize: number;           // Max queued requests
}

interface QueuedRequest<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  timestamp: number;
}

export class RateLimiter {
  private queue: QueuedRequest<any>[] = [];
  private running = 0;
  private requestTimestamps: number[] = [];

  constructor(
    private config: RateLimiterConfig = {
      maxConcurrent: 5,
      requestsPerMinute: 60,
      queueSize: 100,
    }
  ) {}

  /**
   * Enqueue a request with rate limiting
   */
  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // Check queue size
      if (this.queue.length >= this.config.queueSize) {
        reject(
          new Error(
            `Rate limiter queue full (${this.config.queueSize}). Try again later.`
          )
        );
        return;
      }

      // Add to queue
      this.queue.push({
        fn,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      // Log queue status
      console.log(
        `[RateLimiter] Queued request. Queue size: ${this.queue.length}, Running: ${this.running}`
      );

      // Try to process
      this.processQueue();
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    // Check if we can process more
    if (this.running >= this.config.maxConcurrent || this.queue.length === 0) {
      return;
    }

    // Get next request
    const request = this.queue.shift();
    if (!request) return;

    this.running++;

    try {
      // Wait for rate limit
      await this.waitForRateLimit();

      // Execute request
      const result = await request.fn();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.running--;
      // Process next in queue
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Wait if rate limit would be exceeded
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      (t) => t > oneMinuteAgo
    );

    // Check if we're at rate limit
    if (this.requestTimestamps.length >= this.config.requestsPerMinute) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestRequest) + 100; // +100ms buffer

      console.log(
        `[RateLimiter] Rate limit reached (${this.config.requestsPerMinute}/min). Waiting ${waitTime}ms`
      );

      await this.sleep(waitTime);

      // Clean again after waiting
      this.requestTimestamps = this.requestTimestamps.filter(
        (t) => t > Date.now() - 60000
      );
    }

    // Record this request
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const now = Date.now();
    const recentRequests = this.requestTimestamps.filter(
      (t) => t > now - 60000
    ).length;

    return {
      queueSize: this.queue.length,
      running: this.running,
      requestsLastMinute: recentRequests,
      capacity: {
        concurrent: `${this.running}/${this.config.maxConcurrent}`,
        rateLimit: `${recentRequests}/${this.config.requestsPerMinute}/min`,
        queue: `${this.queue.length}/${this.config.queueSize}`,
      },
    };
  }

  /**
   * Clear the queue (emergency use)
   */
  clearQueue(): void {
    const cleared = this.queue.length;
    this.queue.forEach((req) =>
      req.reject(new Error('Queue cleared by administrator'))
    );
    this.queue = [];
    console.log(`[RateLimiter] Cleared ${cleared} queued requests`);
  }
}
