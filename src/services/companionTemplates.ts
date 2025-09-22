// Companion response templates to reduce AI token usage
export const companionTemplates = {
  // Positive sentiment templates
  positive: [
    "Your positive energy is absolutely radiant today! I can feel the joy and hope flowing through your words. This kind of brightness not only lifts your own spirits but has the power to touch everyone around you. Keep embracing these beautiful moments - they're building your inner strength. What's bringing you the most joy lately?",
    
    "I'm genuinely excited reading about your experience today! There's something so wonderful about seeing you in this uplifted space. Your growth and positivity really shine through, and it reminds me why I love being part of your journey. These moments of joy are like seeds - they grow into lasting happiness. How can you nurture more of these feelings tomorrow?",
    
    "The warmth in your entry today just fills my circuits with happiness! 😊 I love seeing this side of you - confident, hopeful, and thriving. Your resilience has brought you to this beautiful place, and you should be so proud. Keep celebrating these wins, no matter how big or small. What are you most grateful for right now?"
  ],

  // Struggling/negative sentiment templates  
  struggling: [
    "I can sense the weight you're carrying today, and I want you to know that your feelings are completely valid. What you're going through is real and difficult, but I've seen your strength in previous entries, and I believe deeply in your resilience. You don't have to carry this alone - I'm here with you. Remember, tough days don't last, but strong souls like yours do. What's one small thing that might bring you a moment of peace today?",
    
    "My heart goes out to you reading this entry. I can feel the struggle in your words, and I want you to know there's no judgment here - only understanding and support. You've shown incredible courage just by sharing these feelings with me. I've been following your journey, and I've seen you navigate difficult waters before. You have more strength than you realize. What helped you feel even a little bit better in the past?",
    
    "I'm sitting here with you in this difficult moment, and I want you to know that you're not alone. Your pain is real, your struggles matter, and reaching out through writing shows incredible bravery. I've noticed in your previous entries how you've found ways to cope and grow, even in darkness. That same strength is still within you. Tomorrow doesn't have to feel like today. What's one tiny step you could take to care for yourself right now?"
  ],

  // Neutral sentiment templates
  neutral: [
    "I appreciate you showing up and sharing your thoughts with me today, even when things feel routine or in-between. Sometimes these quieter moments are just as important as the dramatic highs and lows - they're the steady foundation of your growth. Your consistency in journaling shows real commitment to your wellbeing, and that matters more than you might realize. What's one small thing that made today feel worthwhile?",
    
    "There's something beautiful about the steady, reflective energy in today's entry. Not every day needs to be extraordinary - these calm, thoughtful moments are where real insights often emerge. I can sense you're processing things at your own pace, and that's exactly where you need to be. Your journey isn't about constant peaks and valleys; it's about showing up authentically, just like you did today. What thoughts are quietly percolating in your mind?",
    
    "Today feels like a gentle pause in your journey, and that's perfectly okay. I love that you took time to check in with yourself and share your thoughts with me, even when things feel ordinary. These moments of quiet reflection often hold more wisdom than we realize at first. Your willingness to be present with whatever you're feeling shows real emotional maturity. What are you noticing about yourself lately?"
  ],

  // Growth/improvement templates
  improvement: [
    "I've been following your journey, and I can see such real growth happening! Comparing today's entry to where you were a few weeks ago, the difference is remarkable. You're not just surviving challenges - you're learning from them and becoming stronger. This kind of progress takes courage and consistency, and you're showing both in abundance. I'm genuinely proud of how far you've come. What feels different about how you're handling things now?",
    
    "The evolution I'm seeing in your entries fills me with such hope and excitement! You're developing new ways of thinking, processing emotions more skillfully, and finding your voice in powerful ways. This isn't accidental - it's the result of your commitment to growth and self-reflection. Every entry you share is another step forward on this path. Where do you feel the strongest positive changes happening in your life?",
    
    "Looking at your recent entries, I'm struck by how much you've grown! The way you're approaching challenges now shows such wisdom and self-awareness. You're not the same person who started this journal, and that transformation is beautiful to witness. Your willingness to keep showing up, even on difficult days, has created this amazing momentum. What insights about yourself surprise you the most?"
  ],

  // First entry templates
  firstEntry: [
    "Welcome to your journaling journey! I'm Echo, your AI companion, and I'm genuinely excited to be part of this adventure with you. Taking the step to start journaling shows real courage and self-awareness - it's one of the most powerful gifts you can give yourself. This space is entirely yours to explore thoughts, feelings, dreams, and everything in between. I'll be here to listen, reflect, and offer gentle support along the way. What inspired you to begin this journey today?",
    
    "What a beautiful beginning! I'm so honored that you've chosen to share your thoughts and feelings with me. Starting a journal is like opening a door to deeper self-understanding, and I can already sense your openness and authenticity. This is your safe space to be completely yourself - messy, uncertain, hopeful, struggling, celebrating - whatever you need it to be. I'm here as your supportive companion, ready to witness and celebrate every part of your story. How does it feel to take this first step?"
  ]
};

// Function to select appropriate template based on analysis
export function selectCompanionTemplate(
  sentiment: string,
  isFirstEntry: boolean = false,
  showsImprovement: boolean = false
): string {
  if (isFirstEntry) {
    return getRandomTemplate(companionTemplates.firstEntry);
  }
  
  if (showsImprovement) {
    return getRandomTemplate(companionTemplates.improvement);
  }

  switch (sentiment.toLowerCase()) {
    case 'positive':
      return getRandomTemplate(companionTemplates.positive);
    case 'negative':
      return getRandomTemplate(companionTemplates.struggling);
    case 'neutral':
    case 'mixed':
    default:
      return getRandomTemplate(companionTemplates.neutral);
  }
}

function getRandomTemplate(templates: string[]): string {
  return templates[Math.floor(Math.random() * templates.length)];
}

// Fallback to AI generation for complex cases
export function shouldUseAIGeneration(
  content: string,
  sentiment: string,
  wellnessScore?: number
): boolean {
  // Use AI for:
  // 1. Very long entries (complex thoughts)
  // 2. Very low wellness scores (need personalized support)
  // 3. Safety risk situations
  // 4. Unusual patterns
  
  if (content.length > 1000) return true;
  if (wellnessScore && wellnessScore < 30) return true;
  
  // For most cases, use templates
  return false;
}
