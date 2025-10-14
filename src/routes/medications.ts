/**
 * Medication Routes
 * API endpoints for medication management
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { medicationController } from '../controllers/medicationController';

const router = Router();

// Apply authentication to all medication routes
router.use(requireAuth);

// ========== MEDICATION CRUD ==========

// Create a new medication
router.post('/', medicationController.createMedication.bind(medicationController));

// Get all user medications (supports ?activeOnly=true/false query param)
router.get('/', medicationController.getUserMedications.bind(medicationController));

// Get a specific medication by ID
router.get('/:id', medicationController.getMedicationById.bind(medicationController));

// Update a medication
router.put('/:id', medicationController.updateMedication.bind(medicationController));

// Delete a medication
router.delete('/:id', medicationController.deleteMedication.bind(medicationController));

// ========== MEDICATION LOGGING ==========

// Log medication dose (taken, missed, skipped, late)
router.post('/log', medicationController.logMedicationTaken.bind(medicationController));

// Get medication logs (supports ?medicationId=xxx&days=30 query params)
router.get('/logs', medicationController.getMedicationLogs.bind(medicationController));

// ========== SCHEDULE & ADHERENCE ==========

// Get today's medication schedule
router.get('/schedule/today', medicationController.getTodaysSchedule.bind(medicationController));

// Get adherence rate statistics (supports ?medicationId=xxx&days=30 query params)
router.get('/adherence', medicationController.getAdherenceRate.bind(medicationController));

// Get missed doses (supports ?days=7 query param)
router.get('/missed', medicationController.getMissedDoses.bind(medicationController));

// Get side effects summary (supports ?medicationId=xxx query param)
router.get('/side-effects', medicationController.getSideEffectsSummary.bind(medicationController));

export default router;
