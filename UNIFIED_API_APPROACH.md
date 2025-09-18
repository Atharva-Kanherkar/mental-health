# Unified Memory & Favorites Management

This document shows how the same API endpoints work during onboarding and after onboarding.

## During Onboarding

### Add Person During Onboarding
```bash
POST /onboarding/add-person
{
  "name": "Mom",
  "relationship": "Mother", 
  "priority": 1,
  "supportMsg": "You're amazing!"
}

# Response includes onboarding progress:
{
  "success": true,
  "message": "Favorite person created successfully",
  "data": {
    "favPerson": { "id": "person-123", "name": "Mom" },
    "progress": {
      "totalFavPeople": 1,
      "nextStep": "Continue adding favorite people or move to memories"
    }
  }
}
```

### Add Memory During Onboarding
```bash
POST /onboarding/add-memory
{
  "type": "text",
  "content": "My first day at college..."
}

# Response includes onboarding progress:
{
  "success": true, 
  "message": "Memory created successfully",
  "data": {
    "memory": { "id": "memory-456", "type": "text" },
    "progress": {
      "totalMemories": 1,
      "nextStep": "Continue adding memories or complete onboarding"
    }
  }
}
```

## After Onboarding (10 Days Later)

### Add Person After Onboarding
```bash
POST /api/favorites
{
  "name": "New Friend",
  "relationship": "Friend",
  "priority": 3,
  "email": "friend@example.com"
}

# Response is the same format, but no progress tracking:
{
  "success": true,
  "message": "Favorite person created successfully",
  "data": {
    "favPerson": {
      "id": "person-789",
      "name": "New Friend",
      "relationship": "Friend",
      "priority": 3,
      "email": "friend@example.com",
      "createdAt": "2023-09-27T10:00:00.000Z"
    }
  }
}
```

### Add Memory After Onboarding
```bash
POST /api/memories
{
  "type": "image",
  "fileUrl": "https://mycloud.com/vacation-photo.jpg"
}

# Response is the same format, but no progress tracking:
{
  "success": true,
  "message": "Memory created successfully", 
  "data": {
    "memory": {
      "id": "memory-101",
      "type": "image",
      "fileUrl": "https://mycloud.com/vacation-photo.jpg",
      "createdAt": "2023-09-27T10:05:00.000Z"
    }
  }
}
```

## Key Points

### ✅ Same Validation
Both onboarding and regular endpoints use **identical validation**:
- Name and relationship required for people
- Priority must be 1-10
- Text memories need content, image/audio need fileUrl
- Email format validation
- URL format validation

### ✅ Same Database Operations
Both flows create data in **exactly the same way**:
- Same Prisma queries
- Same database constraints
- Same error handling
- Same data structure

### ✅ Same Security
Both flows have **identical security**:
- Authentication required
- User can only access their own vault
- Same permission checks

### ✅ Additional Features After Onboarding
Once onboarded, users get additional capabilities:

```bash
# Update existing favorite person
PUT /api/favorites/person-123
{
  "supportMsg": "Updated support message",
  "priority": 2
}

# Delete a memory
DELETE /api/memories/memory-456

# Get all memories with filtering
GET /api/memories?type=text&page=1&limit=5

# Search across vault
GET /api/vault/search?q=college&type=all
```

## Architectural Benefits

1. **No Code Duplication**: Onboarding delegates to existing controllers
2. **Consistent Experience**: Same behavior during and after onboarding  
3. **Easy Testing**: Test once, works everywhere
4. **Maintainable**: Change validation once, applies everywhere
5. **Extensible**: Add new features to both flows simultaneously

## Example User Journey

1. **Day 1**: User onboards, adds 2 favorite people, 3 memories
2. **Day 10**: User adds new memory using `/api/memories` 
3. **Day 15**: User updates favorite person using `/api/favorites/:id`
4. **Day 20**: User searches for old memories using `/api/vault/search`
5. **Day 30**: User adds another favorite person using `/api/favorites`

All operations use the same underlying logic, ensuring consistency and reliability throughout the user's journey.
