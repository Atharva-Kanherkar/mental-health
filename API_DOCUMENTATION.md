# Memory Vault API Documentation

This document describes the API endpoints for managing memories, favorite people, and memory vaults in the mental health application.

## Authentication

All API endpoints require authentication. Include the authentication token in your requests.

## Base URL

```
http://localhost:4000/api
```

## Memory Management

### Create Memory
**POST** `/memories`

Create a new memory in the user's vault.

**Request Body:**
```json
{
  "type": "text|image|audio",
  "content": "Memory content (required for text type)",
  "fileUrl": "https://example.com/file.jpg (required for image/audio type)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Memory created successfully",
  "data": {
    "memory": {
      "id": "memory-uuid",
      "type": "text",
      "content": "Memory content",
      "fileUrl": null,
      "createdAt": "2023-09-16T19:45:00.000Z"
    }
  }
}
```

### Get Memories
**GET** `/memories`

Retrieve all memories for the authenticated user with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `type` (optional): Filter by memory type (text|image|audio)

**Response:**
```json
{
  "success": true,
  "data": {
    "memories": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 25,
      "totalPages": 3
    }
  }
}
```

### Get Memory by ID
**GET** `/memories/:id`

Retrieve a specific memory by its ID.

### Update Memory
**PUT** `/memories/:id`

Update an existing memory.

**Request Body:**
```json
{
  "content": "Updated content (optional)",
  "fileUrl": "https://example.com/new-file.jpg (optional)"
}
```

### Delete Memory
**DELETE** `/memories/:id`

Delete a memory permanently.

## Favorite People Management

### Create Favorite Person
**POST** `/favorites`

Add a new favorite person to the user's vault.

**Request Body:**
```json
{
  "name": "John Doe",
  "relationship": "Friend",
  "phoneNumber": "+1234567890", // optional
  "email": "john@example.com", // optional
  "priority": 1, // 1-10, where 1 is highest priority
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
      "timeOfDay": "morning", // morning|afternoon|evening
      "frequency": "daily" // daily|weekly
    }
  }
}
```

### Get Favorite People
**GET** `/favorites`

Retrieve all favorite people for the authenticated user.

**Query Parameters:**
- `sortBy` (optional): Sort by field (priority|name|createdAt, default: priority)
- `order` (optional): Sort order (asc|desc, default: asc)

### Get Favorite Person by ID
**GET** `/favorites/:id`

Retrieve a specific favorite person by ID.

### Update Favorite Person
**PUT** `/favorites/:id`

Update an existing favorite person. All fields are optional.

### Delete Favorite Person
**DELETE** `/favorites/:id`

Remove a favorite person permanently.

## Memory Vault Operations

### Get Memory Vault
**GET** `/vault`

Retrieve the complete memory vault with all memories and favorite people.

**Response:**
```json
{
  "success": true,
  "data": {
    "memoryVault": {
      "id": "vault-uuid",
      "userId": "user-uuid",
      "createdAt": "2023-09-16T19:45:00.000Z",
      "updatedAt": "2023-09-16T19:45:00.000Z",
      "user": {
        "id": "user-uuid",
        "name": "User Name",
        "email": "user@example.com",
        "timezone": "America/New_York",
        "image": "https://example.com/avatar.jpg"
      },
      "memories": [...],
      "favPeople": [...]
    }
  }
}
```

### Get Vault Statistics
**GET** `/vault/stats`

Get statistical information about the memory vault.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "vaultId": "vault-uuid",
      "createdAt": "2023-09-16T19:45:00.000Z",
      "totalMemories": 15,
      "memoriesByType": {
        "text": 10,
        "image": 3,
        "audio": 2
      },
      "totalFavPeople": 5,
      "recentMemories": 3, // memories in last 7 days
      "vaultAge": 45 // days since vault creation
    }
  }
}
```

### Search Vault
**GET** `/vault/search`

Search through memories and favorite people.

**Query Parameters:**
- `q` (required): Search query
- `type` (optional): Search scope (memories|people|all, default: all)

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "search term",
    "searchResults": {
      "memories": [...], // if type includes memories
      "favPeople": [...] // if type includes people
    }
  }
}
```

### Delete Memory Vault
**DELETE** `/vault`

⚠️ **WARNING**: This permanently deletes the entire memory vault and all its contents (memories and favorite people). This action cannot be undone.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [...] // Validation errors if applicable
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

## Data Validation

All endpoints use Zod for request validation. The API will return detailed validation errors for invalid requests, including:

- Required field violations
- Type mismatches
- Format validation (e.g., email, URL)
- Range validation (e.g., priority 1-10)

## Notes

1. **Memory Types**: 
   - `text`: Requires `content` field
   - `image`/`audio`: Requires `fileUrl` field

2. **Priority System**: Priority values range from 1-10, where 1 is the highest priority.

3. **Timezones**: Use standard timezone identifiers (e.g., "America/New_York", "Europe/London").

4. **File Storage**: The API expects URLs for files. Implement your own file upload system and provide URLs to the API.

5. **AI Persona Metadata**: The `personaMetadata` field is flexible and allows additional custom properties for AI integration.
