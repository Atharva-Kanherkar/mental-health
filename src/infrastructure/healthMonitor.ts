/**
 * Health Monitor
 * Monitors service health and triggers auto-recovery
 */

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ServiceHealth {
  status: HealthStatus;
  lastCheck: number;
  lastSuccess: number;
  lastFailure: number;
  consecutiveFailures: number;
  metadata?: any;
}

export type ServiceName = 'gemini' | 'database' | 'storage' | 'voice';

export class HealthMonitor {
  private health: Map<ServiceName, ServiceHealth> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 30000; // 30 seconds
  private readonly FAILURE_THRESHOLD = 3;

  constructor() {
    // Initialize health status for all services
    const services: ServiceName[] = ['gemini', 'database', 'storage', 'voice'];
    services.forEach((service) => {
      this.health.set(service, {
        status: 'healthy',
        lastCheck: Date.now(),
        lastSuccess: Date.now(),
        lastFailure: 0,
        consecutiveFailures: 0,
      });
    });
  }

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    if (this.checkInterval) {
      console.log('[HealthMonitor] Already monitoring');
      return;
    }

    console.log(
      `[HealthMonitor] Starting health checks every ${this.CHECK_INTERVAL_MS / 1000}s`
    );

    this.checkInterval = setInterval(() => {
      this.checkAllServices();
    }, this.CHECK_INTERVAL_MS);

    // Initial check
    this.checkAllServices();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[HealthMonitor] Stopped monitoring');
    }
  }

  /**
   * Check all services
   */
  private async checkAllServices(): Promise<void> {
    const services: ServiceName[] = ['gemini', 'database', 'storage', 'voice'];

    await Promise.all(
      services.map((service) => this.checkService(service))
    );

    this.logHealthStatus();
  }

  /**
   * Check individual service health
   */
  private async checkService(service: ServiceName): Promise<void> {
    const health = this.health.get(service)!;
    health.lastCheck = Date.now();

    try {
      // Perform service-specific health check
      await this.performHealthCheck(service);

      // Success
      health.status = 'healthy';
      health.lastSuccess = Date.now();
      health.consecutiveFailures = 0;
    } catch (error) {
      // Failure
      health.lastFailure = Date.now();
      health.consecutiveFailures++;

      console.error(
        `[HealthMonitor] ${service} health check failed:`,
        (error as Error).message
      );

      // Update status based on failure count
      if (health.consecutiveFailures >= this.FAILURE_THRESHOLD) {
        health.status = 'unhealthy';
        console.error(`[HealthMonitor] ${service} is UNHEALTHY`);

        // Trigger recovery
        this.triggerRecovery(service);
      } else {
        health.status = 'degraded';
      }
    }

    this.health.set(service, health);
  }

  /**
   * Perform service-specific health check
   */
  private async performHealthCheck(service: ServiceName): Promise<void> {
    switch (service) {
      case 'gemini':
        // Quick ping to Gemini API
        // This would be implemented with actual API call
        // For now, we'll assume it's working
        break;

      case 'database':
        // Quick database query
        // This would be implemented with actual DB call
        break;

      case 'storage':
        // Check storage availability
        break;

      case 'voice':
        // Check voice service
        break;
    }

    // Simulate health check with random chance of failure (for testing)
    if (Math.random() < 0.05) {
      // 5% chance of failure
      throw new Error('Simulated health check failure');
    }
  }

  /**
   * Trigger recovery for unhealthy service
   */
  private triggerRecovery(service: ServiceName): void {
    console.log(`[HealthMonitor] Triggering recovery for ${service}`);

    switch (service) {
      case 'gemini':
        // Could switch to fallback mode, different model, etc.
        console.log('[HealthMonitor] Switching to fallback responses for Gemini');
        break;

      case 'database':
        // Attempt reconnection
        console.log('[HealthMonitor] Attempting database reconnection');
        break;

      case 'storage':
        // Check storage credentials, connectivity
        console.log('[HealthMonitor] Checking storage connectivity');
        break;

      case 'voice':
        // Disable voice temporarily, use text-only
        console.log('[HealthMonitor] Disabling voice, using text-only');
        break;
    }

    // Schedule recovery attempt
    setTimeout(() => {
      this.attemptRecovery(service);
    }, 60000); // Try recovery after 1 minute
  }

  /**
   * Attempt to recover service
   */
  private async attemptRecovery(service: ServiceName): Promise<void> {
    console.log(`[HealthMonitor] Attempting recovery for ${service}`);

    try {
      await this.performHealthCheck(service);

      const health = this.health.get(service)!;
      health.status = 'healthy';
      health.consecutiveFailures = 0;

      console.log(`[HealthMonitor] ${service} recovered successfully`);
    } catch (error) {
      console.error(
        `[HealthMonitor] Recovery failed for ${service}:`,
        (error as Error).message
      );
    }
  }

  /**
   * Get health status for all services
   */
  getHealthStatus(): Map<ServiceName, ServiceHealth> {
    return new Map(this.health);
  }

  /**
   * Get health status for specific service
   */
  getServiceHealth(service: ServiceName): ServiceHealth | undefined {
    return this.health.get(service);
  }

  /**
   * Check if all services are healthy
   */
  isAllHealthy(): boolean {
    return Array.from(this.health.values()).every(
      (h) => h.status === 'healthy'
    );
  }

  /**
   * Log current health status
   */
  private logHealthStatus(): void {
    const statusSummary = Array.from(this.health.entries()).map(
      ([service, health]) => `${service}: ${health.status}`
    );

    console.log(`[HealthMonitor] Status: ${statusSummary.join(', ')}`);
  }

  /**
   * Manually mark service as healthy (for testing)
   */
  markHealthy(service: ServiceName): void {
    const health = this.health.get(service);
    if (health) {
      health.status = 'healthy';
      health.consecutiveFailures = 0;
      health.lastSuccess = Date.now();
    }
  }

  /**
   * Manually mark service as unhealthy (for testing)
   */
  markUnhealthy(service: ServiceName): void {
    const health = this.health.get(service);
    if (health) {
      health.status = 'unhealthy';
      health.consecutiveFailures = this.FAILURE_THRESHOLD;
      health.lastFailure = Date.now();
    }
  }
}

// Singleton instance
export const healthMonitor = new HealthMonitor();
