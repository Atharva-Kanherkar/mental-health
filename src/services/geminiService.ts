import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import { Memory, FavPerson } from '../generated/prisma';
import { getSignedUrl, PrivacyLevel } from '../config/storage';

config();

// Initialize Gemini AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Use Gemini 2.5 Flash for fast, efficient responses
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Helper type for Memory with associatedPerson populated
export type MemoryWithPerson = Memory & {
  associatedPerson?: Pick<FavPerson, 'name' | 'relationship'> | null;
};

export interface WalkthroughStep {
  text: string;
  duration: number; // milliseconds to display this step
  pauseAfter?: boolean; // whether to pause for user interaction
}

export interface MemoryWalkthrough {
  memoryId: string;
  title: string;
  introduction: string;
  steps: WalkthroughStep[];
  conclusion: string;
  estimatedDuration: number; // total duration in seconds
}

export class GeminiService {
  
  /**
   * Generate a calming, immersive walkthrough for a single memory
   * This creates guided text that helps the user engage deeply with the memory
   * Now supports multimodal input (images, audio, video) for richer experiences
   */
  static async generateMemoryWalkthrough(memory: MemoryWithPerson): Promise<MemoryWalkthrough> {
    try {
      const { textPrompt, mediaData } = await this.buildMultimodalPrompt(memory);
      
      // Create content array for multimodal input
      const contentParts: any[] = [{ text: textPrompt }];
      
      // Add media data if available
      if (mediaData) {
        contentParts.push({
          inlineData: {
            data: mediaData.base64Data,
            mimeType: mediaData.mimeType
          }
        });
      }
      
      const result = await model.generateContent(contentParts);
      const response = await result.response;
      const text = response.text();
      
      return this.parseWalkthroughResponse(text, memory.id);
      
    } catch (error) {
      console.error('Error generating memory walkthrough:', error);
      throw new Error('Failed to generate memory walkthrough');
    }
  }

  /**
   * Select the best memories for panic mode and create a curated journey
   * This analyzes all user memories and intelligently selects the most calming ones
   * Enhanced with multimodal awareness for better memory selection
   */
  static async generatePanicModeWalkthrough(memories: MemoryWithPerson[]): Promise<{
    selectedMemories: string[]; // memory IDs in order
    overallNarrative: string;
    estimatedDuration: number;
  }> {
    try {
      const prompt = this.buildEnhancedPanicModePrompt(memories);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parsePanicModeResponse(text);
      
    } catch (error) {
      console.error('Error generating panic mode walkthrough:', error);
      throw new Error('Failed to generate panic mode walkthrough');
    }
  }

  /**
   * Build multimodal prompt and fetch media data for memory walkthrough
   */
  private static async buildMultimodalPrompt(memory: MemoryWithPerson): Promise<{
    textPrompt: string;
    mediaData?: { base64Data: string; mimeType: string };
  }> {
    let mediaData: { base64Data: string; mimeType: string } | undefined;

    // Fetch media data for server-managed memories with files
    if (memory.privacyLevel === 'server_managed' && memory.fileKey && memory.type !== 'text') {
      try {
        mediaData = await this.fetchMediaForAI(memory);
      } catch (error) {
        console.error('Error fetching media for AI:', error);
        // Continue without media data - AI will work with text description only
      }
    }

    const textPrompt = this.buildEnhancedWalkthroughPrompt(memory, !!mediaData);
    return { textPrompt, mediaData };
  }

  /**
   * Build the enhanced text prompt for memory walkthrough (multimodal aware)
   */
  private static buildEnhancedWalkthroughPrompt(memory: MemoryWithPerson, hasMediaData: boolean): string {
    const mediaPrompt = hasMediaData ? this.getMediaSpecificPrompt(memory.type) : '';
    
    return `You are a gentle, caring therapist creating an immersive, calming walkthrough experience for someone who wants to deeply engage with a cherished memory. Your goal is to help them feel grounded, peaceful, and connected to this positive moment.

MEMORY DETAILS:
- Type: ${memory.type}
- Content: ${memory.content || 'Visual/audio content'}
- Created: ${memory.createdAt.toLocaleDateString()}
- Associated Person: ${memory.associatedPerson ? `${memory.associatedPerson.name} (${memory.associatedPerson.relationship})` : 'Not specified'}
- File: ${memory.fileName || 'No file'}

${mediaPrompt}

INSTRUCTIONS:
Create a guided walkthrough that helps the user immerse themselves in this memory. The walkthrough should:
1. Be deeply calming and grounding
2. Use specific sensory details to help them "step into" the memory
3. ${hasMediaData ? 'Reference specific visual/audio details you can observe in the media' : 'Use imagination to create vivid sensory details'}
4. Guide them through different aspects of the memory slowly
5. Include moments of reflection and appreciation
6. Use a warm, gentle, therapeutic tone
7. Be broken into 4-6 steps, each lasting 8-15 seconds when read aloud
8. End with a sense of gratitude and peace

FORMAT YOUR RESPONSE AS JSON:
{
  "title": "A short, beautiful title for this memory experience",
  "introduction": "A gentle opening sentence to prepare them for the journey",
  "steps": [
    {
      "text": "First guided step (1-2 sentences, very gentle and immersive)",
      "duration": 10000,
      "pauseAfter": false
    },
    {
      "text": "Second step with deeper engagement",
      "duration": 12000,
      "pauseAfter": true
    }
    // ... continue for 4-6 steps total
  ],
  "conclusion": "A peaceful closing thought that leaves them feeling calm and grateful",
  "estimatedDuration": 90
}

Remember: This is for someone seeking calm and grounding. Every word should contribute to their sense of peace.`;
  }

  /**
   * Build the enhanced prompt for panic mode memory selection (multimodal aware)
   */
  private static buildEnhancedPanicModePrompt(memories: MemoryWithPerson[]): string {
    const memoryDescriptions = memories.map((m, index) => {
      const hasMedia = m.fileKey && m.type !== 'text';
      const mediaInfo = hasMedia ? ` [HAS ${m.type.toUpperCase()} FILE - AI can analyze visual/audio content]` : '';
      return `${index + 1}. [${m.id}] ${m.type} - ${m.content || m.fileName || 'Media file'} (${m.associatedPerson?.name || 'No person'}) - Created: ${m.createdAt.toLocaleDateString()}${mediaInfo}`;
    }).join('\n');

    return `You are an expert therapist selecting the most calming, grounding memories for someone in a panic state or a self harm urge. Your goal is to choose 2-3 memories that will most effectively help them return to a state of calm and safety.

AVAILABLE MEMORIES:
${memoryDescriptions}

SELECTION CRITERIA:
- Choose memories that are most likely to be deeply calming and grounding
- Prioritize memories with positive emotional associations
- Consider variety (don't pick all the same type)
- Select memories that can build on each other for maximum calming effect
- Think about sensory richness and peaceful content
- Prefer memories with people who bring comfort
- ENHANCED: Prioritize memories with media files when possible - images, audio, and video can be analyzed by AI for much more specific and immersive therapeutic experiences
- Consider how visual/audio content can enhance the calming effect

INSTRUCTIONS:
1. Analyze each memory for its calming potential
2. Select 2-3 memories in the optimal order for a panic recovery journey
3. Create a brief narrative explaining how these memories work together
4. Estimate total time needed for the complete experience

FORMAT YOUR RESPONSE AS JSON:
{
  "selectedMemories": ["memory-id-1", "memory-id-2", "memory-id-3"],
  "overallNarrative": "A brief explanation of why these memories were chosen and how they work together to create calm",
  "estimatedDuration": 180
}

Focus on maximum therapeutic impact - these memories need to genuinely help someone move from panic to peace.`;
  }

  /**
   * Parse the AI response for single memory walkthrough
   */
  private static parseWalkthroughResponse(response: string, memoryId: string): MemoryWalkthrough {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        memoryId,
        title: parsed.title || 'A Peaceful Memory',
        introduction: parsed.introduction || 'Let\'s take a gentle journey together.',
        steps: parsed.steps || [
          {
            text: 'Take a moment to breathe deeply and let this memory wash over you.',
            duration: 8000,
            pauseAfter: false
          }
        ],
        conclusion: parsed.conclusion || 'Thank you for sharing this moment of peace with yourself.',
        estimatedDuration: parsed.estimatedDuration || 60
      };
    } catch (error) {
      console.error('Error parsing walkthrough response:', error);
      // Return a fallback response
      return {
        memoryId,
        title: 'A Moment of Peace',
        introduction: 'Let\'s explore this cherished memory together.',
        steps: [
          {
            text: 'Take a deep breath and allow yourself to step into this memory.',
            duration: 8000,
            pauseAfter: false
          },
          {
            text: 'Notice the details around you - the colors, sounds, and feelings of this moment.',
            duration: 10000,
            pauseAfter: true
          },
          {
            text: 'Feel the peace and comfort that this memory brings to your heart.',
            duration: 8000,
            pauseAfter: false
          }
        ],
        conclusion: 'Carry this sense of calm with you as you continue your day.',
        estimatedDuration: 45
      };
    }
  }

  /**
   * Parse the AI response for panic mode selection
   */
  private static parsePanicModeResponse(response: string): {
    selectedMemories: string[];
    overallNarrative: string;
    estimatedDuration: number;
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        selectedMemories: parsed.selectedMemories || [],
        overallNarrative: parsed.overallNarrative || 'These memories have been chosen to help guide you back to calm.',
        estimatedDuration: parsed.estimatedDuration || 120
      };
    } catch (error) {
      console.error('Error parsing panic mode response:', error);
      return {
        selectedMemories: [],
        overallNarrative: 'Let\'s take this journey together, one peaceful moment at a time.',
        estimatedDuration: 120
      };
        }
  }

  /**
   * Fetch media data for AI processing (only for server-managed memories)
   */
  private static async fetchMediaForAI(memory: MemoryWithPerson): Promise<{ base64Data: string; mimeType: string }> {
    if (!memory.fileKey || memory.privacyLevel !== 'server_managed') {
      throw new Error('Cannot fetch media for zero-knowledge or non-file memories');
    }

    try {
      // Generate a signed URL for the file
      const signedUrl = await getSignedUrl(memory.fileKey, 'server_managed', 300); // 5 minutes should be enough
      
      // Fetch the file data
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      // Convert to base64
      const arrayBuffer = await response.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');

      return {
        base64Data,
        mimeType: memory.fileMimeType || 'application/octet-stream'
      };
    } catch (error) {
      console.error('Error fetching media for AI:', error);
      throw error;
    }
  }

  /**
   * Get media-specific prompts for different content types
   */
  private static getMediaSpecificPrompt(memoryType: string): string {
    switch (memoryType) {
      case 'image':
        return `
VISUAL ANALYSIS INSTRUCTIONS:
You have access to the actual image from this memory. Use what you can see to create a much more specific and immersive experience:
- Describe the actual colors, lighting, and atmosphere you observe
- Notice facial expressions, body language, and emotions visible in the photo
- Reference specific objects, settings, or backgrounds you can see
- Use the visual details to evoke stronger emotional connections
- Guide them to "look" at specific parts of the image during the walkthrough
- Basically`;

      case 'audio':
        return `
AUDIO ANALYSIS INSTRUCTIONS:
You have access to the actual audio from this memory. Use what you can hear to create a rich sensory experience:
- Reference the actual sounds, voices, music, or ambient noise you can hear
- Describe the tone, rhythm, and emotional quality of the audio
- Use specific audio details to trigger memories and emotions
- Guide them to "listen" to different elements during the walkthrough
- Incorporate the natural pacing and flow of the audio content`;

      case 'video':
        return `
VIDEO ANALYSIS INSTRUCTIONS:
You have access to the actual video from this memory. Use both visual and audio elements:
- Describe specific moments, movements, and interactions you can see
- Reference the actual dialogue, sounds, or music you can hear
- Notice the setting, lighting, and atmosphere throughout the video
- Use key visual and audio moments to structure the walkthrough steps
- Guide them through different scenes or moments in the video`;

      default:
        return '';
    }
  }
    /**
   * Generate comprehensive AI analysis and insights for a mental health profile
   * Uses the existing JSON function calling pattern for structured responses
   */
  static async generateProfileAnalysis(profileData: any): Promise<{
    overallAssessment: string;
    strengths: string[];
    areasOfConcern: string[];
    recommendations: string[];
    wellnessScore: number;
    riskAssessment: {
      level: 'low' | 'moderate' | 'high';
      factors: string[];
    };
    supportiveMessage: string;
    nextSteps: string[];
  }> {
    const prompt = `You are a licensed clinical psychologist providing a comprehensive mental health analysis based on a user's assessment data. Analyze the following profile and provide structured insights.

PROFILE DATA:
${JSON.stringify(profileData, null, 2)}

ANALYSIS REQUIREMENTS:
1. Provide a holistic assessment of the person's mental health status
2. Identify key strengths and protective factors
3. Highlight areas that may need attention or support
4. Give evidence-based recommendations following therapeutic best practices
5. Calculate a wellness score (1-100) based on all factors
6. Assess risk level and contributing factors
7. Provide a supportive, non-judgmental message
8. Suggest concrete next steps

IMPORTANT GUIDELINES:
- Be compassionate and non-judgmental
- Focus on strengths-based approach while acknowledging challenges
- Avoid clinical diagnoses - this is supportive analysis only
- Provide actionable, realistic recommendations
- Consider cultural sensitivity and individual circumstances
- Emphasize hope and resilience

FORMAT YOUR RESPONSE AS VALID JSON:
{
  "overallAssessment": "A comprehensive 2-3 sentence overview of the person's current mental health status",
  "strengths": ["List of 3-5 key strengths and protective factors identified"],
  "areasOfConcern": ["List of 2-4 areas that may benefit from attention"],
  "recommendations": ["List of 4-6 specific, actionable recommendations"],
  "wellnessScore": 75,
  "riskAssessment": {
    "level": "moderate",
    "factors": ["List of factors contributing to risk assessment"]
  },
  "supportiveMessage": "A warm, encouraging message acknowledging their journey and efforts",
  "nextSteps": ["List of 3-4 immediate, concrete steps they can take"]
}

Ensure all responses are supportive, professional, and focused on empowerment and healing.`;

    try {
      const jsonResponse = await this.generateJson(prompt);
      return JSON.parse(jsonResponse);
    } catch (error) {
      console.error('Error generating profile analysis:', error);
      // Return fallback analysis
      return {
        overallAssessment: "Thank you for sharing your mental health information. Your openness to self-reflection and seeking support shows strength and self-awareness.",
        strengths: ["Willingness to seek help", "Self-awareness", "Taking proactive steps"],
        areasOfConcern: ["Individual assessment needed"],
        recommendations: ["Continue regular self-reflection", "Consider professional support", "Maintain healthy routines"],
        wellnessScore: 65,
        riskAssessment: {
          level: 'moderate' as const,
          factors: ["Assessment data incomplete"]
        },
        supportiveMessage: "Your journey toward better mental health is commendable. Every step you take matters.",
        nextSteps: ["Schedule regular check-ins with yourself", "Maintain support systems", "Consider professional guidance"]
      };
    }
  }

  /**
   * A generic function to send a prompt to the AI and get a structured JSON object back.
   * @param prompt The detailed prompt instructing the AI to return JSON.
   * @returns The raw string of the JSON response from the AI.
   */
  static async generateJson(prompt: string): Promise<string> {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Basic cleanup to extract the JSON block
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("AI did not return a valid JSON block. Response:", text);
        throw new Error('No JSON object found in the AI response.');
      }
      
      return jsonMatch[0];

    } catch (error) {
      console.error('Error in GeminiService.generateJson:', error);
      throw new Error('Failed to generate JSON response from AI.');
    }
  }
}
