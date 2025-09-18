"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const memoryController_1 = require("../controllers/memoryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.requireAuth);
// Memory routes
router.post('/', memoryController_1.MemoryController.createMemory); // POST /api/memories
router.get('/', memoryController_1.MemoryController.getMemories); // GET /api/memories
router.get('/:id', memoryController_1.MemoryController.getMemoryById); // GET /api/memories/:id
router.put('/:id', memoryController_1.MemoryController.updateMemory); // PUT /api/memories/:id
router.delete('/:id', memoryController_1.MemoryController.deleteMemory); // DELETE /api/memories/:id
exports.default = router;
