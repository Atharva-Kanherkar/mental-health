"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryVaultController = void 0;
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
class MemoryVaultController {
    /**
     * Get the complete memory vault for the authenticated user
     */
    static async getMemoryVault(req, res) {
        try {
            const userId = req.user.id;
            // Get the memory vault with all relations
            const memoryVault = await prisma.memoryVault.findUnique({
                where: { userId },
                include: {
                    memories: {
                        orderBy: { createdAt: 'desc' }
                    },
                    favPeople: {
                        orderBy: { priority: 'asc' }
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            timezone: true,
                            image: true
                        }
                    }
                }
            });
            if (!memoryVault) {
                return res.status(404).json({
                    success: false,
                    message: 'Memory vault not found. Please complete onboarding first.'
                });
            }
            res.json({
                success: true,
                data: {
                    memoryVault: {
                        id: memoryVault.id,
                        userId: memoryVault.userId,
                        createdAt: memoryVault.createdAt,
                        updatedAt: memoryVault.updatedAt,
                        user: memoryVault.user,
                        memories: memoryVault.memories.map(memory => ({
                            id: memory.id,
                            type: memory.type,
                            content: memory.content,
                            fileUrl: memory.fileUrl,
                            createdAt: memory.createdAt
                        })),
                        favPeople: memoryVault.favPeople.map(person => ({
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
     * Get memory vault statistics
     */
    static async getVaultStats(req, res) {
        try {
            const userId = req.user.id;
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
            // Get counts and statistics
            const [totalMemories, textMemories, imageMemories, audioMemories, totalFavPeople, recentMemories] = await Promise.all([
                prisma.memory.count({ where: { vaultId: memoryVault.id } }),
                prisma.memory.count({ where: { vaultId: memoryVault.id, type: 'text' } }),
                prisma.memory.count({ where: { vaultId: memoryVault.id, type: 'image' } }),
                prisma.memory.count({ where: { vaultId: memoryVault.id, type: 'audio' } }),
                prisma.favPerson.count({ where: { vaultId: memoryVault.id } }),
                prisma.memory.count({
                    where: {
                        vaultId: memoryVault.id,
                        createdAt: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                        }
                    }
                })
            ]);
            res.json({
                success: true,
                data: {
                    stats: {
                        vaultId: memoryVault.id,
                        createdAt: memoryVault.createdAt,
                        totalMemories,
                        memoriesByType: {
                            text: textMemories,
                            image: imageMemories,
                            audio: audioMemories
                        },
                        totalFavPeople,
                        recentMemories, // memories in last 7 days
                        vaultAge: Math.floor((Date.now() - memoryVault.createdAt.getTime()) / (1000 * 60 * 60 * 24)) // days
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
     * Delete the entire memory vault and all its contents
     * WARNING: This is a destructive operation
     */
    static async deleteMemoryVault(req, res) {
        try {
            const userId = req.user.id;
            // Check if user has a memory vault
            const memoryVault = await prisma.memoryVault.findUnique({
                where: { userId }
            });
            if (!memoryVault) {
                return res.status(404).json({
                    success: false,
                    message: 'Memory vault not found'
                });
            }
            // Delete all related data in a transaction
            await prisma.$transaction(async (tx) => {
                // Delete all memories
                await tx.memory.deleteMany({
                    where: { vaultId: memoryVault.id }
                });
                // Delete all favorite people
                await tx.favPerson.deleteMany({
                    where: { vaultId: memoryVault.id }
                });
                // Delete the memory vault itself
                await tx.memoryVault.delete({
                    where: { id: memoryVault.id }
                });
            });
            res.json({
                success: true,
                message: 'Memory vault and all its contents have been permanently deleted'
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
     * Search memories and favorite people
     */
    static async searchVault(req, res) {
        try {
            const userId = req.user.id;
            const query = req.query.q;
            const type = req.query.type; // 'memories', 'people', or 'all'
            if (!query || query.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }
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
            const searchResults = {};
            // Search memories if requested
            if (!type || type === 'all' || type === 'memories') {
                const memories = await prisma.memory.findMany({
                    where: {
                        vaultId: memoryVault.id,
                        OR: [
                            { content: { contains: query, mode: 'insensitive' } },
                            { type: { contains: query, mode: 'insensitive' } }
                        ]
                    },
                    orderBy: { createdAt: 'desc' }
                });
                searchResults.memories = memories.map(memory => ({
                    id: memory.id,
                    type: memory.type,
                    content: memory.content,
                    fileUrl: memory.fileUrl,
                    createdAt: memory.createdAt
                }));
            }
            // Search favorite people if requested
            if (!type || type === 'all' || type === 'people') {
                const favPeople = await prisma.favPerson.findMany({
                    where: {
                        vaultId: memoryVault.id,
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { relationship: { contains: query, mode: 'insensitive' } },
                            { supportMsg: { contains: query, mode: 'insensitive' } }
                        ]
                    },
                    orderBy: { priority: 'asc' }
                });
                searchResults.favPeople = favPeople.map(person => ({
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
                }));
            }
            res.json({
                success: true,
                data: {
                    query,
                    searchResults
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
}
exports.MemoryVaultController = MemoryVaultController;
