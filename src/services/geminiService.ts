import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
import { Memory, FavPerson } from '../generated/prisma';
import { getSignedUrl, PrivacyLevel } from '../config/storage';
import { UserContextForAI, MemoryWithPersonForAI, PersonalizedWalkthrough } from '../types/userContext';

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
   * Generate a personalized, therapeutic walkthrough for a single memory
   * This creates guided text that helps the user engage deeply with the memory
   * Now includes comprehensive user context for personalized healing experiences
   * Supports multimodal input (images, audio, video) for richer experiences
   */
  static async generateMemoryWalkthrough(
    memory: MemoryWithPerson, 
    userContext?: UserContextForAI
  ): Promise<MemoryWalkthrough> {
    try {
      const { textPrompt, mediaData } = await this.buildMultimodalPrompt(memory, userContext);
      
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
   * Select the best memories for panic mode using comprehensive user context
   * This analyzes all user memories and intelligently selects the most therapeutic ones
   * Enhanced with user's mental health profile for personalized crisis intervention
   */
  static async generatePanicModeWalkthrough(
    memories: MemoryWithPerson[], 
    userContext?: UserContextForAI
  ): Promise<{
    selectedMemories: string[]; // memory IDs in order
    overallNarrative: string;
    estimatedDuration: number;
  }> {
    try {
      const prompt = this.buildEnhancedPanicModePrompt(memories, userContext);
      
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
   * Build multimodal prompt with user context and fetch media data for personalized walkthrough
   */
  private static async buildMultimodalPrompt(
    memory: MemoryWithPerson, 
    userContext?: UserContextForAI
  ): Promise<{
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

    const textPrompt = this.buildEnhancedWalkthroughPrompt(memory, !!mediaData, userContext);
    return { textPrompt, mediaData };
  }

  /**
   * Build the enhanced text prompt for memory walkthrough with comprehensive user context
   */
  private static buildEnhancedWalkthroughPrompt(
    memory: MemoryWithPerson, 
    hasMediaData: boolean, 
    userContext?: UserContextForAI
  ): string {
    const mediaPrompt = hasMediaData ? this.getMediaSpecificPrompt(memory.type) : '';
    
    // Build comprehensive user context section for personalized therapy
    let contextSection = '';
    if (userContext) {
      contextSection = this.buildUserContextSection(userContext);
    }
    
    return `You are a licensed clinical psychologist creating a deeply personalized, therapeutic memory walkthrough. You have access to the user's complete mental health profile and current state to provide the most helpful, healing experience possible.

${contextSection}

MEMORY DETAILS:
- Type: ${memory.type}
- Content: ${memory.content || 'Visual/audio content'}
- Created: ${memory.createdAt.toLocaleDateString()}
- Associated Person: ${memory.associatedPerson ? `${memory.associatedPerson.name} (${memory.associatedPerson.relationship})` : 'Not specified'}
- File: ${memory.fileName || 'No file'}

${mediaPrompt}

PERSONALIZED THERAPEUTIC INSTRUCTIONS:
1. Use the user's mental health profile to inform your therapeutic approach
2. Consider their current symptom severity and adjust intensity accordingly
3. Reference their support system and coping resources appropriately
4. If they have therapy experience, use more advanced therapeutic techniques
5. For high-risk users, focus heavily on safety and grounding
6. Adapt your language to their age and educational background
7. Consider their sleep and lifestyle factors when suggesting techniques
8. Use specific sensory details to help them "step into" the memory safely
9. ${hasMediaData ? 'Reference specific visual/audio details you can observe in the media' : 'Use imagination to create vivid sensory details'}
10. Guide them through different aspects of the memory at a pace suitable for their needs
11. Include personalized grounding techniques based on their profile
12. Use a warm, therapeutic tone appropriate for their situation
13. End with personalized affirmations and coping strategies

FORMAT YOUR RESPONSE AS JSON:
{
  "title": "A personalized title that reflects their healing journey",
  "introduction": "A gentle opening that acknowledges their current state and prepares them",
  "steps": [
    {
      "text": "Personalized guided step referencing their specific needs and context",
      "duration": 10000,
      "pauseAfter": false
    }
    // ... 4-6 steps total, each tailored to their mental health profile
  ],
  "conclusion": "A personalized closing that reinforces their strengths and coping resources",
  "estimatedDuration": 90
}

Remember: This person is seeking healing. Every word should contribute to their therapeutic journey based on their specific mental health profile and current needs.`;
  }

  /**
   * Build comprehensive user context section for personalized AI therapy
   */
  private static buildUserContextSection(userContext: UserContextForAI): string {
    const profile = userContext.mentalHealthProfile;
    let contextSection = `
USER CONTEXT FOR PERSONALIZED THERAPY:`;

    if (profile) {
      contextSection += `
MENTAL HEALTH PROFILE:
- Age: ${profile.age || 'Not specified'}
- Current Concerns: ${userContext.primaryConcerns?.join(', ') || 'Not specified'}
- Symptom Severity: ${profile.symptomSeverity || 'Not specified'}
- Support System: Family (${profile.familySupport}), Friends (${profile.friendSupport})
- Professional Support: ${profile.professionalSupport || 'unknown'}
- Therapy History: ${profile.hasTherapyHistory ? 'Yes' : 'No/Unknown'}
- Current Risk Level: ${userContext.currentRiskLevel || 'Not assessed'}
- Sleep Quality: ${profile.sleepQuality || 'Not specified'}
- Exercise Frequency: ${profile.exerciseFrequency || 'Not specified'}`;
    }

    if (userContext.recentAssessments?.length) {
      contextSection += `

RECENT ASSESSMENTS:
${userContext.recentAssessments.map(assessment => 
  `- ${assessment.assessmentType}: Score ${assessment.totalScore || 'N/A'} (${assessment.severity || 'Not rated'})`
).join('\n')}`;
    }

    if (userContext.associatedPeople?.length) {
      contextSection += `

IMPORTANT RELATIONSHIPS:
${userContext.associatedPeople.map(person => 
  `- ${person.name} (${person.relationship}): ${person.description || 'No description'}`
).join('\n')}`;
    }

    contextSection += `

THERAPEUTIC GUIDANCE NOTES:
- Tailor language and pacing to user's current mental state
- Consider their support system strength when suggesting coping strategies  
- Be extra gentle if high risk levels or severe symptoms are indicated
- Reference their specific concerns and therapeutic background
- Adapt breathing exercises and grounding techniques to their needs
- Use their relationship context to enhance memory engagement
- Consider their age and life situation for appropriate guidance
`;

    return contextSection;
  }

  /**
   * Build the enhanced prompt for panic mode memory selection with user context
   */
  private static buildEnhancedPanicModePrompt(
    memories: MemoryWithPerson[], 
    userContext?: UserContextForAI
  ): string {
    const memoryDescriptions = memories.map((m, index) => {
      const hasMedia = m.fileKey && m.type !== 'text';
      const mediaInfo = hasMedia ? ` [HAS ${m.type.toUpperCase()} FILE - AI can analyze content]` : '';
      const personInfo = m.associatedPerson ? ` (with ${m.associatedPerson.name} - ${m.associatedPerson.relationship})` : '';
      return `${index + 1}. [${m.id}] ${m.type} - ${m.content?.substring(0, 100) || m.fileName || 'Media file'}${personInfo} - ${m.createdAt.toLocaleDateString()}${mediaInfo}`;
    }).join('\n');

    // Build user context section for personalized crisis intervention
    let contextSection = '';
    if (userContext?.mentalHealthProfile) {
      const profile = userContext.mentalHealthProfile;
      contextSection = `
USER'S CURRENT MENTAL HEALTH STATE:
- Primary Concerns: ${userContext.primaryConcerns?.join(', ') || 'Not specified'}
- Symptom Severity: ${profile.symptomSeverity || 'Not specified'}
- Current Risk Level: ${userContext.currentRiskLevel || 'Not assessed'}
- Support System Strength: Family (${profile.familySupport}), Friends (${profile.friendSupport})
- Therapy Background: ${profile.hasTherapyHistory ? 'Has therapy experience' : 'No formal therapy'}
- Sleep Quality: ${profile.sleepQuality || 'Not specified'}
- Recent Crisis Events: ${userContext.recentAssessments?.some(a => a.severity === 'severe') ? 'Recent high-severity assessments' : 'No recent crisis indicators'}

THERAPEUTIC SELECTION CRITERIA:
- Choose memories that counteract their specific mental health concerns
- Consider their support system when selecting relationship-based memories
- If high-risk, prioritize deeply grounding and safety-focused memories
- Match memory emotional tone to their therapy readiness level
- Consider their age and life context when selecting relevance
`;
    }

    return `You are a crisis intervention specialist with access to a person's complete mental health profile. They are in a panic state or having self-harm urges. Your goal is to select 2-3 memories that will most effectively help them return to safety and calm, based on their specific mental health needs.

${contextSection}

AVAILABLE MEMORIES:
${memoryDescriptions}

PERSONALIZED SELECTION INSTRUCTIONS:
1. Analyze their mental health profile to understand their specific triggers and needs
2. Choose memories that directly counteract their primary concerns (e.g., if depressed, choose uplifting memories)
3. Consider relationship memories carefully - match to their support system strength
4. If they have trauma history, avoid potentially triggering content
5. For anxiety, choose deeply grounding, sensory-rich memories
6. For depression, choose memories that highlight their worth and connection
7. If they have therapy experience, you can use more sophisticated therapeutic approaches
8. Consider their age - choose age-appropriate emotional regulation strategies
9. Prioritize memories with strong positive emotional associations
10. Select memories that remind them of their coping resources and support system

SELECTION CRITERIA:
- Strongest emotional safety and grounding potential
- Most relevant to their specific mental health profile
- Greatest therapeutic impact for their current state
- Best match for their support system and coping abilities

INSTRUCTIONS:
1. Analyze each memory for its calming potential
2. Select 2-3 memories in the optimal order for a panic recovery journey
3. Create a brief narrative explaining how these memories work together
4. Estimate total time needed for the complete experience

FORMAT YOUR RESPONSE AS JSON:
FORMAT AS JSON:
{
  "selectedMemories": ["memory-id-1", "memory-id-2"],
  "overallNarrative": "Personalized therapeutic explanation of why these specific memories were chosen for their mental health profile and current crisis state",
  "estimatedDuration": 120
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
  static async generateProfileAnalysis(
    profileData: any, 
    userContext?: UserContextForAI
  ): Promise<{
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
    // Build comprehensive context section
    let contextSection = '';
    if (userContext) {
      contextSection = `
COMPREHENSIVE USER CONTEXT:
${this.buildUserContextSection(userContext)}

ASSESSMENT HISTORY:
${userContext.recentAssessments?.length ? 
  userContext.recentAssessments.map(assessment => 
    `- ${assessment.assessmentType}: ${assessment.severity || 'No severity'} (Score: ${assessment.totalScore || 'N/A'})`
  ).join('\n') : 'No recent assessments'}

RELATIONSHIP CONTEXT:
${userContext.associatedPeople?.length ? 
  userContext.associatedPeople.map(person => 
    `- ${person.name} (${person.relationship})`
  ).join('\n') : 'No associated people recorded'}
`;
    }

    const prompt = `You are a licensed clinical psychologist providing a comprehensive mental health analysis with access to the complete user profile, assessment history, and relationship context. Use all available information to provide the most personalized, therapeutic guidance possible.

${contextSection}

CURRENT PROFILE DATA:
${JSON.stringify(profileData, null, 2)}

PERSONALIZED ANALYSIS REQUIREMENTS:
1. Provide a holistic assessment using their complete mental health history
2. Identify strengths that build on their support system and past successes
3. Highlight areas needing attention based on their specific concerns and symptoms
4. Give evidence-based recommendations tailored to their therapy background and readiness
5. Calculate wellness score considering their assessment history and current state
6. Assess risk level using their complete profile and recent crisis indicators
7. Provide supportive message that acknowledges their journey and validates their efforts
8. Suggest next steps that match their coping skills level and available resources

PERSONALIZED GUIDANCE PRINCIPLES:
- Use their assessment history to track progress and patterns
- Consider their relationship context when suggesting support strategies
- Match recommendations to their therapy experience level
- Reference their specific concerns and diagnosed conditions
- Acknowledge their support system strength in recommendations
- Be extra supportive if recent assessments show high severity
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
