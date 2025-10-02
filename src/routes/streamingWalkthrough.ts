/**
 * Streaming Walkthrough API Routes
 * Server-Sent Events (SSE) endpoints for real-time AI conversation
 */

import express from 'express';
import { requireAuth } from '../middleware/auth';
import db from '../prisma/client';
import { StreamingWalkthroughService } from '../services/streamingWalkthroughService';
import { VoiceService } from '../services/voiceService';
import { conversationStateManager } from '../services/conversationStateManager';
import { getUserContextForAI } from '../utils/userContextHelper';

const router = express.Router();

// Apply authentication middleware
router.use(requireAuth);

/**
 * POST /api/walkthrough-v2/start/:memoryId
 * Start a new streaming walkthrough session
 */
router.post('/start/:memoryId', async (req, res) => {
  try {
    const { memoryId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get memory
    const memory = await db.memory.findFirst({
      where: {
        id: memoryId,
        vault: { userId },
      },
      include: {
        associatedPerson: {
          select: {
            name: true,
            relationship: true,
          },
        },
      },
    });

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    // Only server-managed memories
    if (memory.privacyLevel !== 'server_managed') {
      return res.status(403).json({
        error: 'Streaming walkthroughs require smart memories',
      });
    }

    // Get user context
    const userContext = await getUserContextForAI(userId);

    // Start session
    const { sessionId, initialMessage } =
      await StreamingWalkthroughService.startSession(
        memory,
        userId,
        userContext || undefined
      );

    res.json({
      success: true,
      data: {
        sessionId,
        initialMessage,
      },
    });
  } catch (error) {
    console.error('Error starting streaming walkthrough:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start walkthrough session',
    });
  }
});

/**
 * GET /api/walkthrough-v2/stream/:sessionId
 * Server-Sent Events stream for AI responses
 */
router.get('/stream/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify session belongs to user
    const session = conversationStateManager.getSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // Stream response
    try {
      for await (const chunk of StreamingWalkthroughService.streamResponse(
        sessionId
      )) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);

        // If error, end stream
        if (chunk.type === 'error') {
          res.end();
          return;
        }

        // If end, close stream
        if (chunk.type === 'end') {
          res.end();
          return;
        }
      }
    } catch (streamError) {
      console.error('Stream error:', streamError);
      res.write(
        `data: ${JSON.stringify({ type: 'error', content: 'Stream error' })}\n\n`
      );
      res.end();
    }
  } catch (error) {
    console.error('Error in SSE stream:', error);
    res.status(500).json({ error: 'Stream error' });
  }
});

/**
 * POST /api/walkthrough-v2/respond/:sessionId
 * Send user response and get AI reply
 */
router.post('/respond/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, emotionalState } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify session
    const session = conversationStateManager.getSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update emotional state if provided
    if (emotionalState) {
      conversationStateManager.updateEmotionalState(sessionId, emotionalState);
    }

    // Set up SSE for response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream AI response
    for await (const chunk of StreamingWalkthroughService.streamResponse(
      sessionId,
      message
    )) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);

      if (chunk.type === 'error' || chunk.type === 'end') {
        res.end();
        return;
      }
    }
  } catch (error) {
    console.error('Error in respond:', error);
    res.status(500).json({ error: 'Failed to process response' });
  }
});

/**
 * GET /api/walkthrough-v2/voice/:sessionId/:messageId
 * Generate and serve voice audio for a message
 */
router.get('/voice/:sessionId/:messageId', async (req, res) => {
  try {
    const { sessionId, messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify session
    const session = conversationStateManager.getSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Find message
    const message = session.messages.find((m) => m.id === messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only generate voice for AI messages
    if (message.role !== 'ai') {
      return res.status(400).json({ error: 'Only AI messages have voice' });
    }

    // Generate voice with SSML for natural pauses
    const ssml = VoiceService.buildSSMLWithPauses(message.content);
    const { audio, mimeType } = await VoiceService.generateSpeechWithSSML(ssml);

    // Send audio
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', audio.length);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h
    res.send(audio);
  } catch (error) {
    console.error('Error generating voice:', error);
    res.status(500).json({ error: 'Failed to generate voice' });
  }
});

/**
 * POST /api/walkthrough-v2/phase/:sessionId
 * Update conversation phase
 */
router.post('/phase/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { phase } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify session
    const session = conversationStateManager.getSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update phase
    conversationStateManager.updatePhase(sessionId, phase);

    res.json({ success: true, phase });
  } catch (error) {
    console.error('Error updating phase:', error);
    res.status(500).json({ error: 'Failed to update phase' });
  }
});

/**
 * POST /api/walkthrough-v2/end/:sessionId
 * End session gracefully
 */
router.post('/end/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify session
    const session = conversationStateManager.getSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // End session
    await StreamingWalkthroughService.endSession(sessionId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

/**
 * GET /api/walkthrough-v2/session/:sessionId
 * Get session details and history
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get session
    const session = conversationStateManager.getSession(sessionId);
    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

/**
 * GET /api/walkthrough-v2/metrics
 * Get system metrics (admin only - add proper auth later)
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = StreamingWalkthroughService.getMetrics();
    const voiceMetrics = VoiceService.getCacheMetrics();

    res.json({
      success: true,
      data: {
        ...metrics,
        voice: voiceMetrics,
      },
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * POST /api/walkthrough-v2/voice/warm-cache
 * Pre-generate common phrases (run on server start)
 */
router.post('/voice/warm-cache', async (req, res) => {
  try {
    const phrases = VoiceService.getCommonPhrases();
    await VoiceService.warmCache(phrases);

    res.json({
      success: true,
      message: `Cached ${phrases.length} common phrases`,
    });
  } catch (error) {
    console.error('Error warming voice cache:', error);
    res.status(500).json({ error: 'Failed to warm cache' });
  }
});

export default router;
