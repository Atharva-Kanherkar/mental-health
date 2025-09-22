import { z } from "zod";
import { GeminiService } from "./geminiService";
import prisma from "../prisma/client";
import { selectCompanionTemplate, shouldUseAIGeneration } from "./companionTemplates";
 
// export interface JournalAnalysis{
//  aiSentiment: string
//   aiMoodTags:string[] 
//   aiWellnessScore:number;   
//   aiInsights: string   
//   aiThemes: string[] 
// }

const JournalAnalysisSchema = z.object({
  aiSentiment: z.string().describe("A single word like 'Positive', 'Negative', 'Neutral', 'Mixed'."),
  aiMoodTags: z.array(z.string()).describe("An array of 1-5 lowercase keywords describing the mood (e.g., ['grateful', 'anxious', 'hopeful'])."),
  aiWellnessScore: z.number().min(0).max(100).describe("A score from 0-100 representing the overall mental wellness of this entry."),
  aiInsights: z.string().describe("A short, compassionate insight (1-2 sentences) for the user about their entry."),
  aiThemes: z.array(z.string()).describe("An array of 1-3 high-level themes identified (e.g., ['relationships', 'personal_growth', 'work_stress'])."),
  isSafetyRisk: z.boolean().describe("Set to true ONLY if there are clear indications of self-harm or immediate danger."),
  supportiveMessage: z.string().describe("A personalized, encouraging message (2-3 sentences) based on the user's current state and progress. Be warm, supportive, and contextually relevant.")
});

export type JournalAnalysis = z.infer<typeof JournalAnalysisSchema>;
interface RecentEntryContext {
  title: string;
  content: string;
  createdAt: string;
}

export class JournalService {
   
   static async getRecentEntriesForContext(userId: string): Promise<RecentEntryContext[]> {
     try {
       const entries = await prisma.journalEntry.findMany({
         where: { userId },
         orderBy: { createdAt: 'desc' },
         take: 3,
         select: {
           title: true,
           content: true,
           createdAt: true
         }
       });
       
       return entries.map(entry => ({
         title: entry.title,
         content: entry.content,
         createdAt: entry.createdAt.toISOString()
       }));
     } catch (error) {
       console.error('Error fetching recent entries:', error);
       return [];
     }
   }
    
   static async analyzeEntry(title : string, content : string, userId :string, mediaType? : string, mediaUrl?: String ) : Promise<JournalAnalysis>
   {
      const fullEntry = `Title:${title}\n\nContent:${content}`;

      // Get recent entries for context (last 3 entries)
      const recentEntries = await this.getRecentEntriesForContext(userId);

       const prompt = `
        You are a compassionate AI mental health assistant analyzing a journal entry.
        
        RECENT CONTEXT: ${recentEntries.length > 0 ? recentEntries.map((entry: RecentEntryContext, index: number) => 
          `${index + 1}. ${entry.title}: ${entry.content.substring(0, 150)}... [${new Date(entry.createdAt).toLocaleDateString()}]`
        ).join(' | ') : 'First entry.'}

        CURRENT ENTRY TO ANALYZE:
        ---
        ${fullEntry}
        ---

        Based on this entry and their recent patterns, provide analysis that:
        1. Acknowledges their current emotional state
        2. Recognizes any progress or patterns from recent entries
        3. Offers appropriate encouragement or support
        4. Celebrates positive moments or offers comfort during difficult times

        Respond ONLY with a valid JSON object that conforms to this structure:
        {
          "aiSentiment": "...",
          "aiMoodTags": [...],
          "aiWellnessScore": ...,
          "aiInsights": "...",
          "aiThemes": [...],
          "isSafetyRisk": ...,
          "supportiveMessage": "..."
        }

        For the supportiveMessage - Act as a caring AI companion named "Echo":
        - Use a warm, conversational tone as if you're a trusted friend
        - If they're struggling: "I can sense you're going through a tough time. I've noticed your strength in previous entries, and I believe in your resilience. You're not alone in this journey."
        - If they're positive: "Your positive energy is really shining through today! I love seeing this side of you. Keep nurturing these beautiful moments - they're building your inner strength."
        - If they're neutral: "I appreciate you showing up and sharing your thoughts today. Sometimes the quiet, steady moments are just as important as the big ones. You're doing great."
        - If they show improvement: "I've been following your journey, and I can see real growth happening. Look how far you've come from your earlier entries!"
        - Always end with a gentle question or encouragement for tomorrow
        - Keep it personal but professional, like a supportive coach
     `;
try{
  const aiResponse = await GeminiService.generateJson(prompt);
  const parsedData = JSON.parse(aiResponse);

  const validatedData = JournalAnalysisSchema.safeParse(parsedData);
  if (!validatedData.success) {
    console.error("Validation failed when parsing AI response:", validatedData.error);
    throw new Error("AI response failed schema validation.");
  }

  // Check if we should use a template for the supportive message to save costs
  const isFirstEntry = recentEntries.length === 0;
  const useAI = shouldUseAIGeneration(content, validatedData.data.aiSentiment, validatedData.data.aiWellnessScore);
  
  if (!useAI) {
    // Use template instead of AI-generated supportive message
    const templateMessage = selectCompanionTemplate(
      validatedData.data.aiSentiment,
      isFirstEntry,
      this.detectImprovement(recentEntries, validatedData.data.aiWellnessScore)
    );
    
    validatedData.data.supportiveMessage = templateMessage;
  }

  return validatedData.data;
}
catch(error){
  console.error("Error analyzing journal entry:", error);
  throw new Error("Failed to analyze journal entry.");
}
}
  static detectImprovement(recentEntries: RecentEntryContext[], currentWellnessScore?: number): boolean {
    if (!currentWellnessScore || recentEntries.length === 0) return false;
    
    // Simple improvement detection - can be enhanced later
    // For now, just check if current wellness score is significantly higher than average
    const recentAverage = 60; // Placeholder - would calculate from recent entries in real implementation
    return currentWellnessScore > recentAverage + 15;
  }

  static async updateStreaks(userId: string, entryData: any): Promise<void>{

  }

 
}