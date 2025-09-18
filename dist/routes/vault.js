"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const memoryVaultController_1 = require("../controllers/memoryVaultController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.requireAuth);
// Memory vault routes
router.get('/', memoryVaultController_1.MemoryVaultController.getMemoryVault); // GET /api/vault
router.get('/stats', memoryVaultController_1.MemoryVaultController.getVaultStats); // GET /api/vault/stats
router.get('/search', memoryVaultController_1.MemoryVaultController.searchVault); // GET /api/vault/search
router.delete('/', memoryVaultController_1.MemoryVaultController.deleteMemoryVault); // DELETE /api/vault
exports.default = router;
