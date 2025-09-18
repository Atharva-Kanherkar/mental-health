"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const favPersonController_1 = require("../controllers/favPersonController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.requireAuth);
// Favorite people routes
router.post('/', favPersonController_1.FavPersonController.createFavPerson); // POST /api/favorites
router.get('/', favPersonController_1.FavPersonController.getFavPeople); // GET /api/favorites
router.get('/:id', favPersonController_1.FavPersonController.getFavPersonById); // GET /api/favorites/:id
router.put('/:id', favPersonController_1.FavPersonController.updateFavPerson); // PUT /api/favorites/:id
router.delete('/:id', favPersonController_1.FavPersonController.deleteFavPerson); // DELETE /api/favorites/:id
exports.default = router;
