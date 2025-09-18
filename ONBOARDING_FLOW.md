# Onboarding Flow Documentation

This document describes the step-by-step onboarding process for users to create their memory vault.

## Overview

The onboarding flow follows this exact sequence:
1. **User Signs Up** → Authentication handled by better-auth
2. **User sees onboarding** → Guided step-by-step process
3. **Step 1: Create Memory Vault** → One vault per user (enforced by DB)
4. **Step 2: Add Favorite People** → Add people one by one (reuses FavPersonController)
5. **Step 3: Add Memories** → Add memories one by one (reuses MemoryController)
6. **Step 4: Complete Onboarding** → Finalize and redirect to dashboard

## Architecture

The onboarding controller **delegates** to existing controllers for actual data creation:

- **OnboardingController.addFavoritePersonOnboarding()** → calls **FavPersonController.createFavPerson()**
- **OnboardingController.addMemoryOnboarding()** → calls **MemoryController.createMemory()**

This means:
- ✅ **No duplicate validation logic** - reuses existing Zod schemas
- ✅ **No duplicate creation logic** - same logic for onboarding and post-onboarding
- ✅ **Consistent behavior** - adding memories/people works the same way always
- ✅ **Future-proof** - users can add more memories/people after onboarding using regular API endpoints

## Database Constraints

- **One Memory Vault per User**: Enforced by `userId UNIQUE` constraint in MemoryVault table
- **User can have zero or one vault**: `memoryVault MemoryVault?` optional relation
- **Vault contains memories and favPeople**: One-to-many relationships

## API Endpoints

### 1. Check Onboarding Status
```
GET /onboarding/status
```
Returns whether user has completed onboarding (has a memory vault).

### 2. Get Onboarding Progress
```
GET /onboarding/progress
```
Returns current step and progress information.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "currentStep": "create-vault", // create-vault | add-people | add-memories | complete
    "progress": {
      "vaultCreated": false,
      "favPeopleCount": 0,
      "memoriesCount": 0
    },
    "nextAction": "Create your memory vault"
  }
}
```

### 3. Step 1: Create Memory Vault
```
POST /onboarding/create-vault
```

**Request Body:**
```json
{
  "timezone": "America/New_York" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Memory vault created successfully",
  "data": {
    "memoryVault": {
      "id": "vault-uuid",
      "userId": "user-uuid",
      "createdAt": "2023-09-17T10:00:00.000Z"
    },
    "nextStep": "Add your favorite people to your memory vault"
  }
}
```

**Important:** 
- User can only create ONE memory vault (database enforced)
- If vault already exists, returns error
- This step must be completed before adding people or memories

### 4. Step 2: Add Favorite Person
```
POST /onboarding/add-person
```

**Uses the same validation and logic as `POST /api/favorites`**

**Request Body:** (Identical to regular favorites API)
```json
{
  "name": "John Doe",
  "relationship": "Friend",
  "phoneNumber": "+1234567890", // optional
  "email": "john@example.com", // optional
  "priority": 1, // 1-10, required
  "timezone": "America/New_York", // optional
  "supportMsg": "You're doing great!", // optional
  "voiceNoteUrl": "https://example.com/voice.mp3", // optional
  "videoNoteUrl": "https://example.com/video.mp4", // optional
  "photoUrl": "https://example.com/photo.jpg", // optional
  "personaMetadata": { // optional AI persona settings
    "tone": "calm and supportive",
    "style": "short and encouraging",
    "keyPhrases": ["You got this!", "Keep going!"],
    "reminderPreferences": {
      "timeOfDay": "morning",
      "frequency": "daily"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Favorite person added successfully",
  "data": {
    "favPerson": {
      "id": "person-uuid",
      "name": "John Doe",
      "relationship": "Friend",
      "priority": 1,
      "createdAt": "2023-09-17T10:05:00.000Z"
    },
    "progress": {
      "totalFavPeople": 1,
      "nextStep": "Continue adding favorite people or move to memories"
    }
  }
}
```

**User can repeat this step multiple times to add multiple people.**

### 5. Step 3: Add Memory
```
POST /onboarding/add-memory
```

**Uses the same validation and logic as `POST /api/memories`**

**Request Body:** (Identical to regular memories API)
```json
{
  "type": "text", // text | image | audio
  "content": "My first memory...", // required for text
  "fileUrl": "https://example.com/image.jpg" // required for image/audio
}
```

**Response:**
```json
{
  "success": true,
  "message": "Memory added successfully",
  "data": {
    "memory": {
      "id": "memory-uuid",
      "type": "text",
      "content": "My first memory...",
      "createdAt": "2023-09-17T10:10:00.000Z"
    },
    "progress": {
      "totalMemories": 1,
      "nextStep": "Continue adding memories or complete onboarding"
    }
  }
}
```

**User can repeat this step multiple times to add multiple memories.**

### 6. Step 4: Complete Onboarding
```
POST /onboarding/complete
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully!",
  "data": {
    "memoryVault": {
      "id": "vault-uuid",
      "createdAt": "2023-09-17T10:00:00.000Z"
    },
    "summary": {
      "totalFavPeople": 3,
      "totalMemories": 5,
      "memoriesByType": {
        "text": 3,
        "image": 1,
        "audio": 1
      }
    },
    "redirectTo": "/dashboard"
  }
}
```

## Frontend Flow

### Recommended UI Flow:

1. **Welcome Screen**: Show user what they'll be creating
2. **Step 1 - Create Vault**: Simple form with timezone (optional)
3. **Step 2 - Add People**: 
   - Show "Add Person" form
   - After adding, show "Add Another?" or "Continue to Memories"
   - Display current count of added people
4. **Step 3 - Add Memories**:
   - Show memory type selector (text/image/audio)
   - Appropriate form based on type
   - After adding, show "Add Another?" or "Complete Onboarding"
   - Display current count of added memories
5. **Step 4 - Summary**: Show what was created, redirect to dashboard

### Progress Tracking:

Use `GET /onboarding/progress` to:
- Determine which step user is on
- Show progress indicators
- Resume onboarding where user left off
- Display counts of added items

## Error Handling

### Common Errors:

1. **Vault Already Exists**:
```json
{
  "success": false,
  "message": "User has already completed onboarding"
}
```

2. **No Vault Created**:
```json
{
  "success": false,
  "message": "Please create your memory vault first",
  "redirectTo": "/onboarding/create-vault"
}
```

3. **Validation Errors**:
```json
{
  "success": false,
  "message": "Invalid input data",
  "errors": [
    {
      "path": ["name"],
      "message": "Name is required"
    }
  ]
}
```

## Validation Rules

### Favorite Person:
- `name`: Required, min 1 character
- `relationship`: Required, min 1 character  
- `priority`: Required, integer 1-10
- `email`: Must be valid email format (if provided)
- `phoneNumber`: Optional string
- URLs: Must be valid URL format (if provided)

### Memory:
- `type`: Must be "text", "image", or "audio"
- `content`: Required for text memories
- `fileUrl`: Required for image/audio memories
- Cannot have both content and fileUrl for same memory

## Database Schema Alignment

This flow creates data exactly matching your Prisma schema:

- **User** → has optional **MemoryVault** (one-to-one)
- **MemoryVault** → has many **FavPerson** and **Memory** (one-to-many)
- **FavPerson** → belongs to one **MemoryVault**
- **Memory** → belongs to one **MemoryVault**

All fields match the types defined in `src/types/memoryVault.ts` and the Prisma schema.

## Post-Onboarding Usage

After completing onboarding, users can continue adding memories and favorite people using the regular API endpoints:

### Add More Memories (After Onboarding)
```
POST /api/memories
```
Uses **exactly the same** request/response format as onboarding, but without progress tracking.

### Add More Favorite People (After Onboarding)
```
POST /api/favorites
```
Uses **exactly the same** request/response format as onboarding, but without progress tracking.

### Full CRUD Operations Available
Once onboarded, users have access to:
- `GET /api/memories` - List all memories with pagination
- `PUT /api/memories/:id` - Update existing memories
- `DELETE /api/memories/:id` - Delete memories
- `GET /api/favorites` - List all favorite people
- `PUT /api/favorites/:id` - Update favorite people
- `DELETE /api/favorites/:id` - Delete favorite people
- `GET /api/vault` - Get complete vault overview
- `GET /api/vault/search` - Search through vault contents

## Key Benefits of This Architecture

1. **No Duplicate Code**: Onboarding reuses existing controller logic
2. **Consistent Validation**: Same Zod schemas everywhere
3. **Consistent Behavior**: Adding data works the same way during and after onboarding
4. **Easy Maintenance**: Changes to validation/logic apply everywhere
5. **Future Extensibility**: Easy to add new features to both flows

## Security

- All endpoints require authentication (`requireAuth` middleware)
- Onboarding endpoints require user to NOT be onboarded (`requireNoOnboarding` middleware)
- Each user can only access their own memory vault
- Database constraints prevent duplicate vaults per user
