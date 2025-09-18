# Onboarding Flow Test Examples

## Example Walkthrough

Here's how the onboarding flow works in practice:

### 1. Check Initial Status
```bash
GET /onboarding/status
# Response: User not onboarded yet
```

### 2. Get Progress
```bash
GET /onboarding/progress
# Response: 
{
  "currentStep": "create-vault",
  "progress": { "vaultCreated": false }
}
```

### 3. Create Memory Vault (Step 1)
```bash
POST /onboarding/create-vault
Content-Type: application/json

{
  "timezone": "America/New_York"
}

# Response:
{
  "success": true,
  "message": "Memory vault created successfully",
  "data": {
    "memoryVault": { "id": "vault-123", "userId": "user-456" },
    "nextStep": "Add your favorite people to your memory vault"
  }
}
```

### 4. Add First Favorite Person (Step 2)
```bash
POST /onboarding/add-person
Content-Type: application/json

{
  "name": "Mom",
  "relationship": "Mother",
  "priority": 1,
  "supportMsg": "You're amazing, sweetheart!"
}

# Response:
{
  "success": true,
  "message": "Favorite person added successfully",
  "data": {
    "favPerson": { "id": "person-789", "name": "Mom" },
    "progress": { "totalFavPeople": 1 }
  }
}
```

### 5. Add Second Favorite Person
```bash
POST /onboarding/add-person
Content-Type: application/json

{
  "name": "Best Friend",
  "relationship": "Friend",
  "priority": 2,
  "email": "friend@example.com"
}

# Response: progress.totalFavPeople: 2
```

### 6. Add First Memory (Step 3)
```bash
POST /onboarding/add-memory
Content-Type: application/json

{
  "type": "text",
  "content": "My first day at college was amazing. I felt nervous but excited..."
}

# Response:
{
  "success": true,
  "message": "Memory added successfully",
  "data": {
    "memory": { "id": "memory-101", "type": "text" },
    "progress": { "totalMemories": 1 }
  }
}
```

### 7. Add Photo Memory
```bash
POST /onboarding/add-memory
Content-Type: application/json

{
  "type": "image",
  "fileUrl": "https://mycloud.com/photos/graduation.jpg"
}

# Response: progress.totalMemories: 2
```

### 8. Complete Onboarding (Step 4)
```bash
POST /onboarding/complete

# Response:
{
  "success": true,
  "message": "Onboarding completed successfully!",
  "data": {
    "summary": {
      "totalFavPeople": 2,
      "totalMemories": 2,
      "memoriesByType": { "text": 1, "image": 1, "audio": 0 }
    },
    "redirectTo": "/dashboard"
  }
}
```

### 9. Check Final Status
```bash
GET /onboarding/status
# Response: User is now onboarded, has memory vault
```

## Key Validation Points

### Memory Vault Creation
- ✅ Only one vault per user (database enforced)
- ✅ Trying to create second vault returns error
- ✅ Timezone is optional

### Adding People
- ✅ Requires vault to exist first
- ✅ Name and relationship are required
- ✅ Priority must be 1-10
- ✅ Email validation if provided
- ✅ Can add multiple people

### Adding Memories
- ✅ Requires vault to exist first
- ✅ Text memories need content
- ✅ Image/audio memories need fileUrl
- ✅ Can add multiple memories
- ✅ Supports all three types (text, image, audio)

### Final Completion
- ✅ Shows summary of what was created
- ✅ Provides redirect to dashboard
- ✅ User is now considered "onboarded"

## Error Cases

### Try to create vault twice:
```bash
POST /onboarding/create-vault
# Second attempt returns:
{
  "success": false,
  "message": "User has already completed onboarding"
}
```

### Try to add person without vault:
```bash
# If vault not created yet
POST /onboarding/add-person
# Returns:
{
  "success": false,
  "message": "Please create your memory vault first",
  "redirectTo": "/onboarding/create-vault"
}
```

### Invalid data:
```bash
POST /onboarding/add-person
{
  "name": "", # Empty name
  "priority": 15 # Out of range
}
# Returns validation errors
```

This flow ensures exactly what you wanted:
1. ✅ User signs up
2. ✅ Sees step-by-step onboarding  
3. ✅ Creates exactly ONE memory vault
4. ✅ Adds favorite people one by one
5. ✅ Adds memories one by one
6. ✅ All data matches your Prisma schema and types
7. ✅ Database enforces one vault per user
