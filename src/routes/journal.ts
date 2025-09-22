import { Router } from 'express';
import { JournalController } from '../controllers/journalController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

/**
 * @route POST /api/journal
 * @desc Create a new journal entry with AI analysis
 * @access Private
 */
router.post('/', JournalController.createJournalEntry);

/**
 * @route GET /api/journal
 * @desc Get all journal entries for the authenticated user
 * @query page - Page number (default: 1)
 * @query limit - Entries per page (default: 10, max: 50)
 * @query mood - Filter by mood (1-10)
 * @query sentiment - Filter by sentiment ("positive", "neutral", "negative")
 * @access Private
 */
router.get('/', JournalController.getJournalEntries);

/**
 * @route GET /api/journal/:id
 * @desc Get a specific journal entry by ID
 * @access Private
 */
router.get('/:id', JournalController.getJournalEntryById);

/**
 * @route PUT /api/journal/:id
 * @desc Update a specific journal entry by ID
 * @access Private
 */
router.put('/:id', JournalController.updateJournalEntry);

/**
 * @route DELETE /api/journal/:id
 * @desc Delete a specific journal entry by ID
 * @access Private
 */
router.delete('/:id', JournalController.deleteJournalEntry);

export default router;
