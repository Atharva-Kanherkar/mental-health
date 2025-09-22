import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { rewardController } from '../controllers/rewardController';

const router = Router();

// Apply authentication to all reward routes
router.use(requireAuth);

// ========== USER REWARD ROUTES ==========

// Get user's earned rewards
router.get('/my-rewards', rewardController.getUserRewards.bind(rewardController));

// Claim a reward (manual claiming system)
router.post('/claim', rewardController.claimReward.bind(rewardController));

// Get user's current points and level
router.get('/points', rewardController.getUserPoints.bind(rewardController));

// ========== STREAK ROUTES ==========

// Get all user streaks
router.get('/streaks', rewardController.getUserStreaks.bind(rewardController));

// Get specific streak by type
router.get('/streaks/:type', rewardController.getStreak.bind(rewardController));

// ========== ACHIEVEMENT ROUTES ==========

// Get all available achievements
router.get('/achievements', rewardController.getAllAchievements.bind(rewardController));

// Get user's unlocked achievements
router.get('/my-achievements', rewardController.getUserAchievements.bind(rewardController));

// Unlock achievement (manual unlocking - normally automatic)
router.post('/achievements/:achievementId/unlock', rewardController.unlockAchievement.bind(rewardController));

// ========== BEHAVIOR TRACKING ==========

// Track behavior for streak/achievement purposes
router.post('/track-behavior', rewardController.trackBehavior.bind(rewardController));

// ========== GAMIFICATION STATS ==========

// Get comprehensive gamification stats for user
router.get('/stats', rewardController.getGamificationStats.bind(rewardController));

// Get leaderboard
router.get('/leaderboard', rewardController.getLeaderboard.bind(rewardController));

// ========== REWARD CATALOG ==========

// Get all available rewards
router.get('/', rewardController.getAllRewards.bind(rewardController));

// Get specific reward details
router.get('/:rewardId', rewardController.getRewardById.bind(rewardController));

// ========== ADMIN ROUTES (TODO: Add admin middleware) ==========

// Create new reward (admin only)
router.post('/admin/rewards', rewardController.createReward.bind(rewardController));

// Update reward (admin only)
router.put('/admin/rewards/:rewardId', rewardController.updateReward.bind(rewardController));

// Deactivate reward (admin only)
router.delete('/admin/rewards/:rewardId', rewardController.deactivateReward.bind(rewardController));

// Create new achievement (admin only)
router.post('/admin/achievements', rewardController.createAchievement.bind(rewardController));

export default router;
