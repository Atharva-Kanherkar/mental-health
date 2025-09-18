"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavPersonController = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
// Zod validation schemas
const PersonaMetadataSchema = zod_1.z.object({
    tone: zod_1.z.string().optional(),
    style: zod_1.z.string().optional(),
    keyPhrases: zod_1.z.array(zod_1.z.string()).optional(),
    reminderPreferences: zod_1.z.object({
        timeOfDay: zod_1.z.enum(['morning', 'afternoon', 'evening']).optional(),
        frequency: zod_1.z.enum(['daily', 'weekly']).optional(),
    }).optional(),
}).catchall(zod_1.z.any()); // Allow additional properties
const CreateFavPersonSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    relationship: zod_1.z.string().min(1, 'Relationship is required'),
    phoneNumber: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    priority: zod_1.z.number().int().min(1).max(10),
    timezone: zod_1.z.string().optional(),
    supportMsg: zod_1.z.string().optional(),
    voiceNoteUrl: zod_1.z.string().url().optional(),
    videoNoteUrl: zod_1.z.string().url().optional(),
    photoUrl: zod_1.z.string().url().optional(),
    personaMetadata: PersonaMetadataSchema.optional(),
});
const UpdateFavPersonSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    relationship: zod_1.z.string().min(1).optional(),
    phoneNumber: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    priority: zod_1.z.number().int().min(1).max(10).optional(),
    timezone: zod_1.z.string().optional(),
    supportMsg: zod_1.z.string().optional(),
    voiceNoteUrl: zod_1.z.string().url().optional(),
    videoNoteUrl: zod_1.z.string().url().optional(),
    photoUrl: zod_1.z.string().url().optional(),
    personaMetadata: PersonaMetadataSchema.optional(),
});
class FavPersonController {
    /**
     * Create a new favorite person in the user's vault
     */
    static async createFavPerson(req, res) {
        try {
            const userId = req.user.id;
            // Validate request body
            const validationResult = CreateFavPersonSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid input data',
                    errors: validationResult.error.issues
                });
            }
            const data = validationResult.data;
            // Check if user has a memory vault
            const memoryVault = await prisma.memoryVault.findUnique({
                where: { userId }
            });
            if (!memoryVault) {
                return res.status(404).json({
                    success: false,
                    message: 'Memory vault not found. Please complete onboarding first.'
                });
            }
            // Create the favorite person
            const favPerson = await prisma.favPerson.create({
                data: {
                    vaultId: memoryVault.id,
                    name: data.name,
                    relationship: data.relationship,
                    phoneNumber: data.phoneNumber,
                    email: data.email,
                    priority: data.priority,
                    timezone: data.timezone,
                    supportMsg: data.supportMsg,
                    voiceNoteUrl: data.voiceNoteUrl,
                    videoNoteUrl: data.videoNoteUrl,
                    photoUrl: data.photoUrl,
                    personaMetadata: data.personaMetadata || {}
                }
            });
            res.status(201).json({
                success: true,
                message: 'Favorite person created successfully',
                data: {
                    favPerson: {
                        id: favPerson.id,
                        name: favPerson.name,
                        relationship: favPerson.relationship,
                        phoneNumber: favPerson.phoneNumber,
                        email: favPerson.email,
                        priority: favPerson.priority,
                        timezone: favPerson.timezone,
                        supportMsg: favPerson.supportMsg,
                        voiceNoteUrl: favPerson.voiceNoteUrl,
                        videoNoteUrl: favPerson.videoNoteUrl,
                        photoUrl: favPerson.photoUrl,
                        personaMetadata: favPerson.personaMetadata,
                        createdAt: favPerson.createdAt,
                        updatedAt: favPerson.updatedAt
                    }
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
    /**
     * Get all favorite people for the authenticated user
     */
    static async getFavPeople(req, res) {
        try {
            const userId = req.user.id;
            const sortBy = req.query.sortBy || 'priority';
            const order = req.query.order || 'asc';
            // Check if user has a memory vault
            const memoryVault = await prisma.memoryVault.findUnique({
                where: { userId }
            });
            if (!memoryVault) {
                return res.status(404).json({
                    success: false,
                    message: 'Memory vault not found. Please complete onboarding first.'
                });
            }
            // Build order by clause
            const orderBy = {};
            if (sortBy === 'priority') {
                orderBy.priority = order;
            }
            else if (sortBy === 'name') {
                orderBy.name = order;
            }
            else if (sortBy === 'createdAt') {
                orderBy.createdAt = order;
            }
            else {
                orderBy.priority = 'asc'; // default
            }
            // Get favorite people
            const favPeople = await prisma.favPerson.findMany({
                where: { vaultId: memoryVault.id },
                orderBy
            });
            res.json({
                success: true,
                data: {
                    favPeople: favPeople.map(person => ({
                        id: person.id,
                        name: person.name,
                        relationship: person.relationship,
                        phoneNumber: person.phoneNumber,
                        email: person.email,
                        priority: person.priority,
                        timezone: person.timezone,
                        supportMsg: person.supportMsg,
                        voiceNoteUrl: person.voiceNoteUrl,
                        videoNoteUrl: person.videoNoteUrl,
                        photoUrl: person.photoUrl,
                        personaMetadata: person.personaMetadata,
                        createdAt: person.createdAt,
                        updatedAt: person.updatedAt
                    }))
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
    /**
     * Get a specific favorite person by ID
     */
    static async getFavPersonById(req, res) {
        try {
            const userId = req.user.id;
            const personId = req.params.id;
            if (!personId) {
                return res.status(400).json({
                    success: false,
                    message: 'Person ID is required'
                });
            }
            // Get user's memory vault
            const memoryVault = await prisma.memoryVault.findUnique({
                where: { userId }
            });
            if (!memoryVault) {
                return res.status(404).json({
                    success: false,
                    message: 'Memory vault not found'
                });
            }
            // Get the favorite person
            const favPerson = await prisma.favPerson.findFirst({
                where: {
                    id: personId,
                    vaultId: memoryVault.id
                }
            });
            if (!favPerson) {
                return res.status(404).json({
                    success: false,
                    message: 'Favorite person not found'
                });
            }
            res.json({
                success: true,
                data: {
                    favPerson: {
                        id: favPerson.id,
                        name: favPerson.name,
                        relationship: favPerson.relationship,
                        phoneNumber: favPerson.phoneNumber,
                        email: favPerson.email,
                        priority: favPerson.priority,
                        timezone: favPerson.timezone,
                        supportMsg: favPerson.supportMsg,
                        voiceNoteUrl: favPerson.voiceNoteUrl,
                        videoNoteUrl: favPerson.videoNoteUrl,
                        photoUrl: favPerson.photoUrl,
                        personaMetadata: favPerson.personaMetadata,
                        createdAt: favPerson.createdAt,
                        updatedAt: favPerson.updatedAt
                    }
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
    /**
     * Update a favorite person
     */
    static async updateFavPerson(req, res) {
        try {
            const userId = req.user.id;
            const personId = req.params.id;
            if (!personId) {
                return res.status(400).json({
                    success: false,
                    message: 'Person ID is required'
                });
            }
            // Validate request body
            const validationResult = UpdateFavPersonSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid input data',
                    errors: validationResult.error.issues
                });
            }
            const data = validationResult.data;
            // Get user's memory vault
            const memoryVault = await prisma.memoryVault.findUnique({
                where: { userId }
            });
            if (!memoryVault) {
                return res.status(404).json({
                    success: false,
                    message: 'Memory vault not found'
                });
            }
            // Check if person exists and belongs to user
            const existingPerson = await prisma.favPerson.findFirst({
                where: {
                    id: personId,
                    vaultId: memoryVault.id
                }
            });
            if (!existingPerson) {
                return res.status(404).json({
                    success: false,
                    message: 'Favorite person not found'
                });
            }
            // Build update data
            const updateData = {};
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined) {
                    updateData[key] = data[key];
                }
            });
            // Update the favorite person
            const updatedPerson = await prisma.favPerson.update({
                where: { id: personId },
                data: updateData
            });
            res.json({
                success: true,
                message: 'Favorite person updated successfully',
                data: {
                    favPerson: {
                        id: updatedPerson.id,
                        name: updatedPerson.name,
                        relationship: updatedPerson.relationship,
                        phoneNumber: updatedPerson.phoneNumber,
                        email: updatedPerson.email,
                        priority: updatedPerson.priority,
                        timezone: updatedPerson.timezone,
                        supportMsg: updatedPerson.supportMsg,
                        voiceNoteUrl: updatedPerson.voiceNoteUrl,
                        videoNoteUrl: updatedPerson.videoNoteUrl,
                        photoUrl: updatedPerson.photoUrl,
                        personaMetadata: updatedPerson.personaMetadata,
                        createdAt: updatedPerson.createdAt,
                        updatedAt: updatedPerson.updatedAt
                    }
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
    /**
     * Delete a favorite person
     */
    static async deleteFavPerson(req, res) {
        try {
            const userId = req.user.id;
            const personId = req.params.id;
            if (!personId) {
                return res.status(400).json({
                    success: false,
                    message: 'Person ID is required'
                });
            }
            // Get user's memory vault
            const memoryVault = await prisma.memoryVault.findUnique({
                where: { userId }
            });
            if (!memoryVault) {
                return res.status(404).json({
                    success: false,
                    message: 'Memory vault not found'
                });
            }
            // Check if person exists and belongs to user
            const existingPerson = await prisma.favPerson.findFirst({
                where: {
                    id: personId,
                    vaultId: memoryVault.id
                }
            });
            if (!existingPerson) {
                return res.status(404).json({
                    success: false,
                    message: 'Favorite person not found'
                });
            }
            // Delete the favorite person
            await prisma.favPerson.delete({
                where: { id: personId }
            });
            res.json({
                success: true,
                message: 'Favorite person deleted successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
}
exports.FavPersonController = FavPersonController;
