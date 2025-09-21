import z from "zod";
import { GeminiService } from "./geminiService";
 
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
  isSafetyRisk: z.boolean().describe("Set to true ONLY if there are clear indications of self-harm or immediate danger.")
});

type JournalAnalysis = z.infer<typeof JournalAnalysisSchema>;
export class JournalService {
    
   static async analyzeEntry(title : string, content : string, userId :string, mediaType? : string, mediaUrl?: String ) : Promise<JournalAnalysis>
   {
      const fullEntry = `Title:${title}\n\nContent:${content}`;

       const prompt = `
        You are a compassionate AI mental health assistant.
        Analyze the following journal entry. This is the persons daily entry. 
        Respond ONLY with a valid JSON object that conforms to this structure:
        {
          "aiSentiment": "...",
          "aiMoodTags": [...],
          "aiWellnessScore": ...,
          "aiInsights": "...",
          "aiThemes": [...],
          "isSafetyRisk": ...
        }

        Journal Entry to Analyze:
        ---
        ${fullEntry}
        ---
     `;
try{
  const aiResponse = await GeminiService.generateJson(prompt);
  const parsedData = JSON.parse(aiResponse);

  const validatedData = JournalAnalysisSchema.safeParse(parsedData);
  if (!validatedData.success) {
    console.error("Validation failed when parsing AI response:", validatedData.error);
    throw new Error("AI response failed schema validation.");
  }
  return validatedData.data;
}
catch(error){
  console.error("Error analyzing journal entry:", error);
  throw new Error("Failed to analyze journal entry.");
}
}

 
}