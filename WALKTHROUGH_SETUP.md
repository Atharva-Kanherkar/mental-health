# Memory Walkthrough Feature Setup

## Overview
The immersive memory walkthrough feature has been fully implemented with two pathways:

### Path A: Specific Memory Selection
- User selects a specific memory from their vault
- AI generates a personalized guided walkthrough experience
- Full-screen immersive interface with guided text and controls

### Path B: Panic Mode
1. User clicks "I am panicked" button
2. Guided breathing exercise (4-4-4-4 pattern)
3. AI selects and curates appropriate memories
4. Series of guided walkthroughs for therapeutic benefit

## API Key Setup

1. Get a Gemini API key from Google AI Studio:
   - Visit: https://aistudio.google.com/app/apikey
   - Create a new API key

2. Add to your environment variables:
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" >> .env
   ```

## Testing the Feature

1. Start the backend server:
   ```bash
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd frontend && npm run dev
   ```

3. Navigate to the dashboard and look for the "Memory Walkthrough" button

4. Test both pathways:
   - **Specific Memory**: Select a memory and follow the guided experience
   - **Panic Mode**: Click "I am panicked" → complete breathing → experience AI-curated journey

## Technical Implementation

### Backend (`/src`)
- **`services/geminiService.ts`**: AI integration with Gemini 2.5 Flash
- **`routes/walkthrough.ts`**: REST API endpoints for walkthrough functionality
- **Endpoints**:
  - `POST /api/walkthrough/memory/:memoryId` - Generate specific memory walkthrough
  - `POST /api/walkthrough/panic-mode` - Generate panic mode experience
  - `GET /api/walkthrough/available-memories` - Get available memories for selection

### Frontend (`/frontend`)
- **`app/walkthrough/page.tsx`**: Main orchestration component
- **`components/MemorySelection.tsx`**: Memory selection with panic mode option
- **`components/BreathingExercise.tsx`**: Animated breathing exercise
- **`components/ImmersiveWalkthrough.tsx`**: Full-screen guided experience
- **`lib/api-client.ts`**: API client methods for walkthrough functionality

## Key Features

### AI-Powered Content Generation
- Personalized walkthrough steps based on memory content and associated people
- Therapeutic panic mode selection algorithm
- Contextual breathing exercise integration

### Immersive Experience
- Full-screen interface with background imagery suggestions
- Progress tracking and step-by-step guidance
- Play/pause controls for user-paced experience

### Privacy & Security
- Only processes "server_managed" memories (smart memories)
- Respects user privacy levels and vault permissions
- Secure API endpoints with authentication middleware

## Troubleshooting

### Common Issues
1. **"No API key"**: Ensure GEMINI_API_KEY is set in your .env file
2. **"No memories available"**: Add some server-managed memories to your vault first
3. **Type errors**: All type conflicts have been resolved using Prisma-generated types

### Debug Mode
Check browser console and server logs for detailed error information during testing.
