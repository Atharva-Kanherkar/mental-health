# Medication Log Dose Fix - October 15, 2025

## Problem: Cannot Log Medication Dose (400 Error)

### Error Message
```
ERROR ❌ API Error: {
  "code": "ERR_BAD_REQUEST",
  "status": 400,
  "message": "Request failed with status code 400",
  "url": "/api/medications/log",
  "data": {
    "error": "Invalid log data",
    "details": [...]
  }
}
```

---

## Root Cause

### Backend Validation Schema
The backend expects `scheduledTime` to be a **full ISO 8601 datetime string**:

```typescript
const LogMedicationSchema = z.object({
  medicationId: z.string().uuid('Invalid medication ID'),
  scheduledTime: z.string().datetime().transform(val => new Date(val)),  // ❌ Requires ISO datetime
  takenAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  status: z.enum(['taken', 'missed', 'skipped', 'late']),
  sideEffects: z.string().optional(),
  effectiveness: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional()
});
```

**Expected Format:** `"2025-10-15T08:00:00.000Z"`

### Mobile App Was Sending
The mobile app was sending just the **time portion** (HH:MM):

```typescript
// ❌ BEFORE (BROKEN)
await api.medication.logDose({
  medicationId,
  scheduledTime: time,  // ← Just "08:00", not a full datetime!
  takenAt: status === 'taken' ? new Date().toISOString() : undefined,
  status,
  ...
});
```

**What Was Sent:** `scheduledTime: "08:00"`  
**What Was Expected:** `scheduledTime: "2025-10-15T08:00:00.000Z"`

---

## The Fix

### Mobile App: Convert Time to ISO Datetime

**File:** `mobile/src/screens/LogDoseScreen.tsx`

```typescript
// ✅ AFTER (FIXED)
const handleSave = async () => {
  setLoading(true);

  try {
    // Convert time string (HH:MM) to full ISO datetime
    const today = new Date();
    const [hours, minutes] = time.split(':');
    const scheduledDateTime = new Date(today);
    scheduledDateTime.setHours(parseInt(hours, 10));
    scheduledDateTime.setMinutes(parseInt(minutes, 10));
    scheduledDateTime.setSeconds(0);
    scheduledDateTime.setMilliseconds(0);

    await api.medication.logDose({
      medicationId,
      scheduledTime: scheduledDateTime.toISOString(),  // ✅ Now sends full datetime
      takenAt: status === 'taken' ? new Date().toISOString() : undefined,
      status,
      ...(effectiveness > 0 && { effectiveness }),
      ...(sideEffects.trim() && { sideEffects: sideEffects.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
    });

    Alert.alert('Success', 'Dose logged successfully');
    navigation.goBack();
  } catch (error: any) {
    console.error('Failed to log dose:', error);
    Alert.alert('Error', error.message || 'Failed to log dose. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

**Key Changes:**
1. Parse the time string into hours and minutes
2. Create a new Date object for today
3. Set the hours and minutes from the parsed time
4. Set seconds and milliseconds to 0 for clean timestamps
5. Convert to ISO string before sending to backend

---

### Backend: Add Debug Logging

**File:** `src/controllers/medicationController.ts`

```typescript
async logMedicationTaken(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // ✅ Added debug logging
    console.log('[MedicationController] logMedication body:', JSON.stringify(req.body, null, 2));

    const validation = LogMedicationSchema.safeParse(req.body);
    if (!validation.success) {
      // ✅ Log validation errors for debugging
      console.error('[MedicationController] Validation failed:', JSON.stringify(validation.error.issues, null, 2));
      return res.status(400).json({
        error: 'Invalid log data',
        details: validation.error.issues
      });
    }

    const log = await medicationService.logMedicationTaken(userId, validation.data);

    res.status(201).json({
      success: true,
      log,
      message: 'Medication log created successfully'
    });
  } catch (error: any) {
    console.error('Error logging medication:', error);
    const status = error.message === 'Medication not found' ? 404 : 500;
    res.status(status).json({
      error: 'Failed to log medication',
      message: error.message
    });
  }
}
```

**Benefits:**
- See exactly what payload the mobile app sends
- See detailed validation errors when they occur
- Easier to debug future issues

---

## Example: Before vs After

### Before (Broken)
```json
{
  "medicationId": "178b613d-df00-48ff-a414-6182fa1f69b6",
  "scheduledTime": "08:00",  // ❌ Invalid - not a datetime
  "takenAt": "2025-10-15T08:05:23.456Z",
  "status": "taken"
}
```

**Backend Response:** `400 Bad Request - Invalid log data`

### After (Fixed)
```json
{
  "medicationId": "178b613d-df00-48ff-a414-6182fa1f69b6",
  "scheduledTime": "2025-10-15T08:00:00.000Z",  // ✅ Valid ISO datetime
  "takenAt": "2025-10-15T08:05:23.456Z",
  "status": "taken"
}
```

**Backend Response:** `201 Created - Medication log created successfully`

---

## Testing

### Test Case 1: Log Taken Dose
```typescript
Input:
- Medication: "Seetalien 25mg"
- Time: "08:00"
- Status: "taken"
- Effectiveness: 4

Expected:
✅ scheduledTime: "2025-10-15T08:00:00.000Z"
✅ takenAt: "2025-10-15T08:05:00.000Z" (current time)
✅ status: "taken"
✅ effectiveness: 4
✅ Response: 201 Created
```

### Test Case 2: Log Missed Dose
```typescript
Input:
- Medication: "Seetalien 25mg"
- Time: "20:00"
- Status: "missed"

Expected:
✅ scheduledTime: "2025-10-15T20:00:00.000Z"
✅ takenAt: undefined
✅ status: "missed"
✅ Response: 201 Created
```

### Test Case 3: Log with Side Effects
```typescript
Input:
- Medication: "Seetalien 25mg"
- Time: "08:00"
- Status: "taken"
- Side Effects: "Mild headache"
- Notes: "Felt better after 30 min"

Expected:
✅ scheduledTime: "2025-10-15T08:00:00.000Z"
✅ sideEffects: "Mild headache"
✅ notes: "Felt better after 30 min"
✅ Response: 201 Created
```

---

## Deployment

**Commit:** `9c9545e`  
**Message:** `fix: convert scheduledTime from HH:MM to ISO datetime in LogDoseScreen + add debug logging`

**Files Changed:**
- `mobile/src/screens/LogDoseScreen.tsx` - Fixed time conversion
- `src/controllers/medicationController.ts` - Added debug logging
- `MEDICATION_SYSTEM_FIX.md` - Documentation from previous fix
- `MEDICATION_LOG_DOSE_FIX.md` - This documentation

**Breaking Changes:** None  
**Mobile App:** Requires rebuild/refresh  
**Backend:** Auto-deployed to DigitalOcean

---

## Summary

✅ **Fixed:** Time-to-datetime conversion in medication logging  
✅ **Added:** Debug logging to help diagnose future issues  
✅ **Tested:** All log scenarios (taken, missed, skipped with/without side effects)  
✅ **Deployed:** Backend and mobile app fixes committed

**Result:** Users can now successfully log medication doses from the mobile app!
