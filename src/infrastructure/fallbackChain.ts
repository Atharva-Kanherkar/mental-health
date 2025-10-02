/**
 * Fallback Chain Pattern
 * Provides graceful degradation through multiple fallback strategies
 * Ensures the app always has a response, even if primary services fail
 */

export interface FallbackResponse {
  text: string;
  duration: number;
  source: 'primary' | 'secondary' | 'tertiary' | 'static';
  metadata?: any;
}

export class FallbackChain {
  /**
   * Execute with fallback chain
   * Tries primary, then secondary, then tertiary, then static
   */
  async executeWithFallback<T>(
    primary: () => Promise<T>,
    secondary?: () => Promise<T>,
    tertiary?: () => Promise<T>,
    staticFallback?: () => T
  ): Promise<T> {
    // Try primary
    try {
      console.log('[FallbackChain] Attempting primary');
      return await primary();
    } catch (primaryError) {
      console.warn('[FallbackChain] Primary failed:', (primaryError as Error).message);

      // Try secondary
      if (secondary) {
        try {
          console.log('[FallbackChain] Attempting secondary');
          return await secondary();
        } catch (secondaryError) {
          console.warn('[FallbackChain] Secondary failed:', (secondaryError as Error).message);

          // Try tertiary
          if (tertiary) {
            try {
              console.log('[FallbackChain] Attempting tertiary');
              return await tertiary();
            } catch (tertiaryError) {
              console.warn('[FallbackChain] Tertiary failed:', (tertiaryError as Error).message);

              // Use static fallback
              if (staticFallback) {
                console.log('[FallbackChain] Using static fallback');
                return staticFallback();
              }

              throw tertiaryError;
            }
          } else if (staticFallback) {
            console.log('[FallbackChain] Using static fallback');
            return staticFallback();
          }

          throw secondaryError;
        }
      } else if (staticFallback) {
        console.log('[FallbackChain] Using static fallback');
        return staticFallback();
      }

      throw primaryError;
    }
  }

  /**
   * Pre-written therapeutic responses for common scenarios
   */
  static getStaticFallback(
    scenario: string,
    context?: any
  ): FallbackResponse {
    const fallbacks: Record<string, FallbackResponse> = {
      // Anxiety/panic scenarios
      anxiety: {
        text: "Let's pause for a moment together. Take a deep breath with me - in through your nose for 4 counts, hold for 4, and out through your mouth for 6. You're safe in this moment. Let's ground ourselves - notice 5 things you can see around you, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. I'm here with you.",
        duration: 20000,
        source: 'static',
        metadata: { scenario: 'anxiety' },
      },

      // Memory exploration
      memory_exploration: {
        text: "This memory holds something meaningful for you. Take your time with it - there's no rush at all. Notice the details that stand out... the colors, the feelings, the warmth. What emotions does it bring? You're exactly where you need to be in this moment. Let yourself be present with these feelings.",
        duration: 15000,
        source: 'static',
        metadata: { scenario: 'memory_exploration' },
      },

      // General calming
      calming: {
        text: "I'm here with you. Let's take this one moment at a time. Notice your breath - the gentle rise and fall of your chest. Feel the surface beneath you, supporting you. You're doing beautifully just by being here. Whatever you're feeling right now is okay. I'm listening.",
        duration: 15000,
        source: 'static',
        metadata: { scenario: 'calming' },
      },

      // Transition/pause
      pause: {
        text: "Let's take a gentle pause here. Breathe with me. Notice how you're feeling in this moment. There's no rush - we have all the time you need. When you're ready, we can continue together.",
        duration: 12000,
        source: 'static',
        metadata: { scenario: 'pause' },
      },

      // Ending/conclusion
      conclusion: {
        text: "You've done beautiful work here today. Thank you for trusting this process and being present with yourself. The peace and calm you've found is always within reach. Remember - you can return to these moments whenever you need them. You're stronger than you know.",
        duration: 15000,
        source: 'static',
        metadata: { scenario: 'conclusion' },
      },

      // Introduction
      introduction: {
        text: "Welcome. I'm here to walk through this journey with you. We'll take this at your pace - there's no rush, no pressure. Just you, me, and this moment together. Take a deep breath, and when you're ready, we'll begin.",
        duration: 12000,
        source: 'static',
        metadata: { scenario: 'introduction' },
      },

      // Grounding
      grounding: {
        text: "Let's ground ourselves together. Feel your feet on the floor. Notice the weight of your body. Listen to the sounds around you. You're here, you're present, you're safe. Let's take three slow breaths together - in... and out... in... and out... in... and out. Better.",
        duration: 18000,
        source: 'static',
        metadata: { scenario: 'grounding' },
      },

      // Compassion
      self_compassion: {
        text: "You're being so brave right now, just by being here. It's okay to feel whatever you're feeling - there's no wrong way to experience this. Be gentle with yourself. You deserve the same kindness and compassion you'd give to someone you love. You're doing enough. You are enough.",
        duration: 15000,
        source: 'static',
        metadata: { scenario: 'self_compassion' },
      },
    };

    // Return specific fallback or default to calming
    return fallbacks[scenario] || fallbacks.calming;
  }

  /**
   * Categorize user input to select appropriate fallback
   */
  static categorizeScenario(input: string, userContext?: any): string {
    const lowerInput = input.toLowerCase();

    if (
      lowerInput.includes('anxious') ||
      lowerInput.includes('panic') ||
      lowerInput.includes('worried') ||
      lowerInput.includes('scared')
    ) {
      return 'anxiety';
    }

    if (
      lowerInput.includes('memory') ||
      lowerInput.includes('remember') ||
      lowerInput.includes('past')
    ) {
      return 'memory_exploration';
    }

    if (
      lowerInput.includes('pause') ||
      lowerInput.includes('wait') ||
      lowerInput.includes('slow')
    ) {
      return 'pause';
    }

    if (
      lowerInput.includes('ground') ||
      lowerInput.includes('present') ||
      lowerInput.includes('here')
    ) {
      return 'grounding';
    }

    if (
      lowerInput.includes('start') ||
      lowerInput.includes('begin') ||
      lowerInput.includes('intro')
    ) {
      return 'introduction';
    }

    if (
      lowerInput.includes('end') ||
      lowerInput.includes('finish') ||
      lowerInput.includes('done')
    ) {
      return 'conclusion';
    }

    // Default
    return 'calming';
  }

  /**
   * Get smart fallback based on context
   */
  static getContextualFallback(
    input: string,
    userContext?: any
  ): FallbackResponse {
    const scenario = this.categorizeScenario(input, userContext);
    return this.getStaticFallback(scenario, userContext);
  }
}
