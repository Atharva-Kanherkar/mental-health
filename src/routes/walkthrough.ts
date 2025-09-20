import express from 'express';
import { requireAuth } from '../middleware/auth';
import db from '../prisma/client';
import { GeminiService, MemoryWithPerson } from '../services/geminiService';
import { Memory, FavPerson } from '../generated/prisma';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * POST /api/walkthrough/memory/:memoryId
 * Generate a guided walkthrough for a specific memory
 */
router.post('/memory/:memoryId', async (req, res) => {
  try {
    const { memoryId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get the memory and verify ownership
    const memory = await db.memory.findFirst({
      where: {
        id: memoryId,
        vault: {
          userId: userId
        }
      },
      include: {
        associatedPerson: {
          select: {
            name: true,
            relationship: true
          }
        }
      }
    });

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    // Only generate walkthroughs for server-managed memories (smart memories)
    // Zero-knowledge memories can't be processed by AI for privacy reasons
    if (memory.privacyLevel !== 'server_managed') {
      return res.status(403).json({ 
        error: 'Walkthroughs are only available for smart memories that can be processed by AI' 
      });
    }

    // Generate walkthrough using Gemini AI (memory already includes associatedPerson)
    const walkthrough = await GeminiService.generateMemoryWalkthrough(memory);

    res.json({
      success: true,
      data: walkthrough
    });

  } catch (error) {
    console.error('Error generating memory walkthrough:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate walkthrough'
    });
  }
});

/**
 * POST /api/walkthrough/panic-mode
 * Generate a curated journey for panic mode using intelligent memory selection
 */
router.post('/panic-mode', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get all server-managed memories for this user
    const memories = await db.memory.findMany({
      where: {
        vault: {
          userId: userId
        },
        privacyLevel: 'server_managed' // Only smart memories can be processed
      },
      include: {
        associatedPerson: {
          select: {
            name: true,
            relationship: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (memories.length === 0) {
      return res.status(404).json({ 
        error: 'No smart memories available for panic mode. Please add some memories first.' 
      });
    }

    // Generate intelligent memory selection and overall narrative
    const panicModeData = await GeminiService.generatePanicModeWalkthrough(memories);

    // Generate individual walkthroughs for each selected memory
    const selectedMemoryObjects = memories.filter((m: MemoryWithPerson) => 
      panicModeData.selectedMemories.includes(m.id)
    );

    const walkthroughs = await Promise.all(
      selectedMemoryObjects.map((memory: MemoryWithPerson) => 
        GeminiService.generateMemoryWalkthrough(memory)
      )
    );

    res.json({
      success: true,
      data: {
        overallNarrative: panicModeData.overallNarrative,
        estimatedDuration: panicModeData.estimatedDuration,
        selectedMemories: panicModeData.selectedMemories,
        walkthroughs: walkthroughs
      }
    });

  } catch (error) {
    console.error('Error generating panic mode walkthrough:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate panic mode walkthrough'
    });
  }
});

/**
 * GET /api/walkthrough/available-memories
 * Get list of memories available for walkthrough (smart memories only)
 */
router.get('/available-memories', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get all server-managed memories
    const memories = await db.memory.findMany({
      where: {
        vault: {
          userId: userId
        },
        privacyLevel: 'server_managed'
      },
      include: {
        associatedPerson: {
          select: {
            name: true,
            relationship: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const availableMemories = memories.map((memory: MemoryWithPerson) => ({
      id: memory.id,
      type: memory.type,
      content: memory.content,
      fileName: memory.fileName,
      createdAt: memory.createdAt,
      associatedPerson: memory.associatedPerson,
      // Generate a preview title for selection
      preview: memory.content 
        ? memory.content.substring(0, 100) + (memory.content.length > 100 ? '...' : '')
        : memory.fileName || `${memory.type} memory`
    }));

    res.json({
      success: true,
      data: {
        memories: availableMemories,
        count: availableMemories.length
      }
    });

  } catch (error) {
    console.error('Error fetching available memories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available memories'
    });
  }
});

export default router;
