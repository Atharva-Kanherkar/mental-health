
export interface Memory {
  id: string;
  type: "text" | "image" | "audio";
  content?: string;  // for text
  fileUrl?: string;  // for image/audio
  createdAt: Date;
}

//This is AI personna. Experimental.
export interface FavPersonPersona {
  tone?: string;        // e.g., "calm and supportive"
  style?: string;       // e.g., "short and encouraging"
  keyPhrases?: string[]; // ["You got this!", "Keep going!"]
  reminderPreferences?: {
    timeOfDay?: "morning" | "afternoon" | "evening";
    frequency?: "daily" | "weekly";
  };
  [key: string]: any;   // flexible future additions
}

export interface FavPerson {
  id: string;
  name: string;
  relationship: string;
  phoneNumber?: string;
  email?: string;
  priority: number;
  timezone?: string;

  supportMsg?: string;
  voiceNoteUrl?: string;
  videoNoteUrl?: string;
  photoUrl?: string;

  personaMetadata?: FavPersonPersona;

  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryVault {
  id: string;
  userId: string;
  favPeople: FavPerson[];
  memories: Memory[];
  createdAt: Date;
  updatedAt: Date;
}
