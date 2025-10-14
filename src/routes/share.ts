/**
 * Share Routes
 * Routes for report sharing functionality
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { shareController } from '../controllers/shareController';

const router = Router();

// ===== AUTHENTICATED ROUTES (User creates and manages share links) =====

// Create a new share link
router.post('/create', requireAuth, (req, res) => shareController.createShareLink(req, res));

// Get user's share links
router.get('/my-links', requireAuth, (req, res) => shareController.getMyShareLinks(req, res));

// Get share link statistics
router.get('/:token/stats', requireAuth, (req, res) => shareController.getShareLinkStats(req, res));

// Revoke a share link
router.delete('/:token', requireAuth, (req, res) => shareController.revokeShareLink(req, res));

// ===== PUBLIC ROUTES (Therapist views report - NO AUTH) =====

// View shared report (HTML)
router.get('/:token', (req, res) => shareController.viewSharedReport(req, res));

// Download report as PDF
router.get('/:token/pdf', (req, res) => shareController.downloadPDF(req, res));

export default router;
