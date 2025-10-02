# Streaming Walkthrough Implementation Plan

## Overview
This document outlines the complete implementation of the new streaming walkthrough system (v2) that replaces the static slideshow experience with a real-time, conversational, AI-powered therapeutic session.

## Goals
1. ✅ Real-time streaming conversation (not batch generation)
2. ✅ Interactive two-way dialogue
3. ✅ Voice/audio layer for immersion
4. ✅ Zero perceived latency with smart UX patterns
5. ✅ Bulletproof backend with resilience patterns
6. ✅ No breaking changes to existing system

## Architecture

### Backend Stack
- **Streaming**: Server-Sent Events (SSE) for real-time AI responses
- **AI**: Google Gemini 2.5 Flash (streaming API)
- **Voice**: Google Cloud Text-to-Speech (free tier to start)
- **Resilience**: Circuit breaker, retry, rate limiting, fallbacks
- **State**: In-memory conversation context with Redis option

### Frontend Stack
- **UI**: Conversational chat-like interface
- **Streaming**: EventSource API for SSE
- **Audio**: HTML5 Audio API
- **State**: React hooks for streaming state management
- **UX**: Typing indicators, prefetching, skeleton loaders

## File Structure

### New Backend Files
```
src/
├── infrastructure/              [NEW FOLDER]
│   ├── circuitBreaker.ts       - Circuit breaker pattern
│   ├── retryHandler.ts         - Exponential backoff retry
│   ├── rateLimiter.ts          - Request rate limiting
│   ├── fallbackChain.ts        - Graceful degradation
│   └── healthMonitor.ts        - Service health checks
│
├── services/
│   ├── streamingWalkthroughService.ts  - Main streaming logic
│   ├── voiceService.ts                 - TTS integration
│   └── conversationStateManager.ts     - Session state
│
├── routes/
│   └── streamingWalkthrough.ts         - SSE endpoints
│
└── types/
    └── streaming.ts                    - TypeScript types
```

### New Frontend Files
```
frontend/
├── components/
│   ├── streaming/                      [NEW FOLDER]
│   │   ├── StreamingWalkthrough.tsx   - Main component
│   │   ├── ConversationalMessage.tsx  - Message bubble
│   │   ├── VoicePlayer.tsx            - Audio player
│   │   ├── TypingIndicator.tsx        - Loading animation
│   │   ├── QuickResponses.tsx         - Response buttons
│   │   └── BreathingPulse.tsx         - Breathing visual
│   │
├── hooks/
│   ├── useStreamingWalkthrough.ts     - SSE streaming hook
│   ├── useVoicePlayback.ts            - Audio control hook
│   └── useConversationState.ts        - Chat state
│
├── lib/
│   └── streamingClient.ts             - API client
│
└── app/
    └── walkthrough-v2/
        └── page.tsx                   - New page (v2)
```

## Implementation Order

### Phase 1: Backend Infrastructure ⚙️
**Files to create:**
1. `src/infrastructure/circuitBreaker.ts`
2. `src/infrastructure/retryHandler.ts`
3. `src/infrastructure/rateLimiter.ts`
4. `src/infrastructure/fallbackChain.ts`

**Testing:** Unit tests for each pattern

---

### Phase 2: Streaming Service 🔄
**Files to create:**
1. `src/types/streaming.ts` - Type definitions
2. `src/services/conversationStateManager.ts` - State management
3. `src/services/streamingWalkthroughService.ts` - Core logic

**Features:**
- Gemini streaming integration
- Context-aware prompting
- Conversation memory
- Predictive generation

---

### Phase 3: Voice Service 🔊
**Files to create:**
1. `src/services/voiceService.ts` - Google Cloud TTS

**Features:**
- Text-to-speech generation
- Voice caching
- SSML support for natural pauses
- Audio streaming

**Setup required:**
- Install `@google-cloud/text-to-speech`
- Configure Google Cloud credentials

---

### Phase 4: API Routes 🛣️
**Files to create:**
1. `src/routes/streamingWalkthrough.ts` - SSE endpoints

**Endpoints:**
- `POST /api/walkthrough-v2/start/:memoryId` - Start session
- `GET /api/walkthrough-v2/stream/:sessionId` - SSE stream
- `POST /api/walkthrough-v2/respond/:sessionId` - User input
- `GET /api/walkthrough-v2/voice/:messageId` - Get audio

**Testing:** Integration tests with SSE

---

### Phase 5: Frontend Components 🎨
**Files to create:**
1. `frontend/lib/streamingClient.ts`
2. `frontend/hooks/useStreamingWalkthrough.ts`
3. `frontend/hooks/useVoicePlayback.ts`
4. `frontend/components/streaming/TypingIndicator.tsx`
5. `frontend/components/streaming/ConversationalMessage.tsx`
6. `frontend/components/streaming/VoicePlayer.tsx`
7. `frontend/components/streaming/StreamingWalkthrough.tsx`
8. `frontend/app/walkthrough-v2/page.tsx`

**Features:**
- Real-time message streaming
- Word-by-word reveal animation
- Voice playback controls
- Quick response buttons
- Breathing animations during loading
- Skeleton loaders
- Ambient background continuity

---

### Phase 6: Integration & Polish ✨
**Tasks:**
1. End-to-end testing
2. Error handling edge cases
3. Performance optimization
4. Analytics tracking
5. Documentation

---

## Feature Flags

Add environment variable to toggle between v1 and v2:
```env
ENABLE_STREAMING_WALKTHROUGH=true
```

Frontend routing:
```tsx
const walkthroughPath = process.env.NEXT_PUBLIC_ENABLE_STREAMING
  ? '/walkthrough-v2'
  : '/walkthrough';
```

## Migration Strategy

1. **Week 1-2:** Build and test v2 internally
2. **Week 3:** Beta test with 10% of users
3. **Week 4:** Rollout to 50% of users
4. **Week 5:** Full rollout (100%)
5. **Week 6:** Deprecate v1 after monitoring

## Rollback Plan

If issues arise:
1. Set `ENABLE_STREAMING_WALKTHROUGH=false`
2. All users fall back to v1 (existing system)
3. No data loss, no breaking changes

## Dependencies to Install

### Backend
```bash
npm install @google-cloud/text-to-speech
```

### Frontend
No new dependencies needed (using native APIs)

## Environment Variables

Add to `.env`:
```env
# Google Cloud TTS
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
GCP_PROJECT_ID=your-project-id

# Feature flags
ENABLE_STREAMING_WALKTHROUGH=true

# Circuit breaker config
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=30000
CIRCUIT_BREAKER_RESET_TIMEOUT=60000
```

## Success Metrics

### Technical
- Latency: TTFT < 1s (99th percentile)
- Availability: 99.9% uptime
- Error rate: < 0.1%

### User Experience
- Session completion rate: +30%
- User satisfaction: +40%
- Perceived helpfulness: +50%

## Timeline

- **Phase 1:** 1 day (Infrastructure)
- **Phase 2:** 2 days (Streaming service)
- **Phase 3:** 1 day (Voice service)
- **Phase 4:** 1 day (API routes)
- **Phase 5:** 2 days (Frontend)
- **Phase 6:** 1 day (Testing)

**Total: 8 days**

## Next Steps

1. ✅ Create this plan document
2. ⏭️ Start Phase 1: Backend infrastructure
3. ⏭️ Continue sequentially through phases
4. ⏭️ Test thoroughly before rollout

---

*Last updated: 2025-10-02*
