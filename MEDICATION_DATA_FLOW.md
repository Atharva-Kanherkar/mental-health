# Complete Medication Schedule Data Flow

**Purpose:** End-to-end documentation of how medication schedule data flows from backend to mobile UI  
**Status:** Current as of commit `78f8a86`

---

## 🔄 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER OPENS SCHEDULE SCREEN                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  MedicationScheduleScreen.tsx                                   │
│  - useFocusEffect triggers                                      │
│  - setLoading(true) → forces React re-render                    │
│  - loadSchedule() called                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  API Call: GET /api/medications/schedule/today                  │
│  - Headers: Authorization: Bearer <token>                       │
│  - Mobile app → Backend API                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Backend: medicationController.ts                               │
│  - getTodaysSchedule endpoint                                   │
│  - Extracts userId from JWT token                               │
│  - Calls medicationService.getTodaysSchedule(userId)            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Backend: medicationService.ts → getTodaysSchedule()            │
│                                                                 │
│  Step 1: Fetch all active medications for user                  │
│    - SELECT * FROM Medication WHERE userId AND isActive         │
│    - Includes: scheduledTimes array (e.g., ["08:00", "20:00"]) │
│                                                                 │
│  Step 2: Fetch today's medication logs                          │
│    - SELECT * FROM MedicationLog WHERE userId AND today         │
│    - Returns: id, medicationId, scheduledTime, status, etc.     │
│                                                                 │
│  Step 3: Build schedule array by iterating medications          │
│    For each medication:                                         │
│      For each scheduledTime in medication.scheduledTimes:       │
│        1. Parse time (e.g., "08:00")                            │
│        2. Convert to today's ISO datetime                       │
│        3. Look for matching log:                                │
│           - Same day (isSameDay check)                          │
│           - Same time (hours + minutes match)                   │
│        4. Determine status:                                     │
│           - If log exists → use log.status ("taken"/"late")     │
│           - If no log → status = "pending"                      │
│        5. Build schedule item object                            │
│                                                                 │
│  Step 4: Return flat array sorted by scheduledTime              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  API Response Format:                                           │
│  {                                                              │
│    "success": true,                                             │
│    "schedule": [                                                │
│      {                                                          │
│        "medicationId": "uuid",                                  │
│        "medicationName": "Vitamin D",                           │
│        "dosage": "1000",                                        │
│        "dosageUnit": "IU",                                      │
│        "scheduledTime": "2025-01-18T08:00:00.000Z",             │
│        "status": "taken",  ← from log or "pending"              │
│        "logId": "uuid"     ← null if not logged yet             │
│      },                                                         │
│      {                                                          │
│        "medicationId": "uuid",                                  │
│        "medicationName": "Vitamin D",                           │
│        "dosage": "1000",                                        │
│        "dosageUnit": "IU",                                      │
│        "scheduledTime": "2025-01-18T20:00:00.000Z",             │
│        "status": "pending", ← no log found                      │
│        "logId": null        ← no log ID                         │
│      }                                                          │
│    ],                                                           │
│    "count": 2                                                   │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: MedicationScheduleScreen.tsx                         │
│  - setSchedule(data.schedule) → updates state                   │
│  - setLoading(false) → hides spinner                            │
│  - Component re-renders with fresh data                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  UI Rendering Logic                                             │
│                                                                 │
│  For each item in schedule array:                               │
│    1. Format time: "8:00 AM" (from ISO string)                  │
│    2. Show status badge: "pending" | "taken" | "late"           │
│    3. Check isDoseActionable(scheduledTime):                    │
│       - Calculate minutes until dose                            │
│       - If ≤ 60 minutes → show button                           │
│       - If > 60 minutes → hide button, show hint                │
│    4. Button logic:                                             │
│       - If logId exists → show edit icon (pencil)               │
│       - If no logId → show checkmark icon                       │
│       - If status is missed/skipped → disable button            │
│    5. Visual indicators:                                        │
│       - Logged doses: checkmark badge next to status            │
│       - Future doses: italic hint "Available 1 hour before"     │
│                                                                 │
│  Summary Calculation:                                           │
│    - Taken: schedule.filter(s => s.status === 'taken').length   │
│    - Pending: schedule.filter(s => s.status === 'pending').l... │
│    - Late: schedule.filter(s => s.status === 'late').length     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Logging a Dose Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  USER TAPS "MARK AS TAKEN" BUTTON                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Check if already logged (logId exists?)                        │
│  - If YES → Show "Edit Dose Log" alert                          │
│  - If NO → Navigate to LogDoseScreen                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  LogDoseScreen.tsx                                              │
│  - Pre-fill medicationId, medicationName, scheduledTime         │
│  - If editing: pre-fill existing log data (status, etc.)        │
│  - User selects:                                                │
│    * Status: taken / late / missed / skipped                    │
│    * Effectiveness: 1-5 stars                                   │
│    * Side effects: text input (optional)                        │
│    * Notes: text input (optional)                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Real-time Validation (before API call)                         │
│  - Check if scheduledTime is > 24 hours in future               │
│  - If YES → show error "Cannot log future doses"                │
│  - If NO → proceed with API call                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  API Call: POST /api/medications/log                            │
│  Body: {                                                        │
│    medicationId: "uuid",                                        │
│    scheduledTime: "2025-01-18T08:00:00.000Z",                   │
│    status: "taken",                                             │
│    effectiveness: 4,                                            │
│    sideEffects: "Mild headache",                                │
│    notes: "Took with breakfast"                                 │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Backend: medicationController.ts → logDose endpoint            │
│  - Zod validation: prevent future logging (> 24h)               │
│  - Extract userId from JWT                                      │
│  - Call medicationService.logDose(userId, data)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Backend: medicationService.ts → logDose()                      │
│                                                                 │
│  Step 1: Check for existing log (duplicate prevention)          │
│    - Query: MedicationLog WHERE medicationId AND scheduledTime  │
│    - Match: same day + same hour + same minute                  │
│                                                                 │
│  Step 2a: If existing log found → UPDATE                        │
│    - UPDATE MedicationLog SET status, effectiveness, etc.       │
│    - Return updated log                                         │
│                                                                 │
│  Step 2b: If no existing log → CREATE                           │
│    - Calculate auto-late status:                                │
│      * If logged >2 hours after scheduledTime → status = "late" │
│      * Otherwise → use user-provided status                     │
│    - INSERT INTO MedicationLog                                  │
│    - Return new log                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  API Response:                                                  │
│  {                                                              │
│    "success": true,                                             │
│    "log": {                                                     │
│      "id": "uuid",                                              │
│      "medicationId": "uuid",                                    │
│      "scheduledTime": "2025-01-18T08:00:00.000Z",               │
│      "loggedAt": "2025-01-18T08:05:32.123Z",                    │
│      "status": "taken",                                         │
│      "effectiveness": 4,                                        │
│      "sideEffects": "Mild headache",                            │
│      "notes": "Took with breakfast"                             │
│    }                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: LogDoseScreen.tsx                                    │
│  - Show success message                                         │
│  - navigation.goBack() → return to MedicationScheduleScreen     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  MedicationScheduleScreen.tsx                                   │
│  - useFocusEffect detects screen is in focus                    │
│  - setLoading(true) → force re-render                           │
│  - loadSchedule() → fetches fresh data from API                 │
│  - Backend now returns that dose with status="taken" + logId    │
│  - UI updates: checkmark badge, "1 taken" in summary            │
│  - Button changes to edit icon (pencil)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Smart State Fetching Strategy

### Problem Solved
Previously, the UI didn't update after logging because:
1. Navigation returned to screen without triggering reload
2. useFocusEffect ran but React skipped re-render (same object reference)
3. Summary counts calculated from stale state

### Solution: Force Reload on Focus
```typescript
useFocusEffect(
  useCallback(() => {
    setLoading(true);  // ← Forces React to re-render
    loadSchedule();    // ← Fetches fresh data
  }, [])
);
```

**Why this works:**
- `setLoading(true)` changes state → triggers React reconciliation
- Component re-renders with loading spinner
- API call fetches fresh data from backend
- `setSchedule(data)` updates with new array reference
- React sees new reference → re-renders UI with updated data
- Summary recalculates from fresh schedule array

---

## ⏰ Time-Based Button Logic

### isDoseActionable() Function
```typescript
const isDoseActionable = (scheduledTime: string): boolean => {
  const now = new Date();
  const scheduledDate = new Date(scheduledTime);
  const diffInMinutes = (scheduledDate.getTime() - now.getTime()) / (1000 * 60);
  
  // Allow logging if dose is past due OR within 60 minutes
  return diffInMinutes <= 60;
};
```

**Logic:**
- Calculate time difference in minutes
- If `diffInMinutes ≤ 60` → dose is actionable
  - Includes past doses (negative difference)
  - Includes doses within 1 hour
- If `diffInMinutes > 60` → dose is too far in future

**Examples:**
| Current Time | Scheduled Time | Diff (min) | Actionable? | Button Shows? |
|--------------|----------------|------------|-------------|---------------|
| 12:00 PM     | 8:00 AM        | -240       | ✅ Yes      | ✅ Yes (late) |
| 12:00 PM     | 12:30 PM       | 30         | ✅ Yes      | ✅ Yes        |
| 12:00 PM     | 12:45 PM       | 45         | ✅ Yes      | ✅ Yes        |
| 12:00 PM     | 1:00 PM        | 60         | ✅ Yes      | ✅ Yes        |
| 12:00 PM     | 1:15 PM        | 75         | ❌ No       | ❌ No (hint)  |
| 12:00 PM     | 10:00 PM       | 600        | ❌ No       | ❌ No (hint)  |

---

## 🎨 UI State Indicators

### Status Badge Colors
```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'taken':
      return theme.colors.success;  // Green
    case 'late':
      return theme.colors.warning;  // Yellow/Orange
    case 'missed':
      return theme.colors.error;    // Red
    case 'skipped':
      return theme.colors.text.secondary;  // Gray
    default:
      return theme.colors.text.secondary;  // Gray (pending)
  }
};
```

### Button States
| Condition | Icon | Color | Action | Enabled? |
|-----------|------|-------|--------|----------|
| Not logged, actionable | `checkmark-circle` | Green | Log dose | ✅ Yes |
| Already logged | `create-outline` | Gray | Edit log | ✅ Yes |
| Status = missed | `checkmark-circle` | Gray | - | ❌ Disabled |
| Status = skipped | `checkmark-circle` | Gray | - | ❌ Disabled |
| Not actionable (>1h future) | - | - | Hidden | N/A |

### Visual Feedback
- **Logged doses:** Checkmark badge (✓) next to status text
- **Future doses:** Italic hint "Available 1 hour before dose time"
- **Late doses:** Yellow/orange status badge
- **Disabled buttons:** Gray background, no touch feedback

---

## 🔍 Backend Matching Logic

### How Logs Match Schedule Times
```typescript
// Check if log matches this scheduled time
const isSameDay = /* date comparison logic */;
const scheduledHour = parseInt(time.split(':')[0]);
const scheduledMinute = parseInt(time.split(':')[1]);
const logHour = logDate.getHours();
const logMinute = logDate.getMinutes();

const isSameTime = scheduledHour === logHour && scheduledMinute === logMinute;

if (isSameDay && isSameTime) {
  // Match found!
  status = log.status;
  logId = log.id;
}
```

**Why this works:**
- Medication has `scheduledTimes: ["08:00", "20:00"]`
- Log has `scheduledTime: "2025-01-18T08:00:00.000Z"`
- Backend compares hours + minutes from both
- Timezone-safe (both converted to same timezone)

---

## 📊 Summary Count Calculation

**Frontend Logic:**
```typescript
const taken = schedule.filter(s => s.status === 'taken').length;
const pending = schedule.filter(s => s.status === 'pending').length;
const late = schedule.filter(s => s.status === 'late').length;
const missed = schedule.filter(s => s.status === 'missed').length;
```

**Updates in Real-Time:**
- Runs every time `schedule` state changes
- After logging → fresh data → new counts
- No manual refresh needed (React reactive)

---

## 🧪 Edge Cases Handled

1. ✅ **Same dose logged twice:** Backend updates existing log instead of creating duplicate
2. ✅ **Logging 10 hours early:** Frontend validation prevents button from showing
3. ✅ **Logging 5 hours late:** Backend auto-calculates status as "late"
4. ✅ **Future dose >24h:** Backend Zod validation rejects API request
5. ✅ **Timezone differences:** All times stored/compared as ISO UTC
6. ✅ **Multiple doses same medication:** Each scheduledTime creates separate schedule item
7. ✅ **Editing logged dose:** Shows edit icon, navigates with logId pre-filled
8. ✅ **Missed/skipped doses:** Button disabled but visible (can't change status)

---

## 🚀 Performance Optimizations

### Efficient Data Fetching
- Single API call fetches all medications + logs
- Backend joins data in memory (no N+1 queries)
- Prisma `include` loads relations in one query

### Smart Re-rendering
- `useFocusEffect` with `useCallback` prevents infinite loops
- Only re-fetches when screen comes into focus
- Pull-to-refresh available for manual reload

### Minimal State Updates
- `setSchedule()` only called when data changes
- Summary counts calculated from existing state (no extra API calls)
- Button logic uses computed values (no state needed)

---

## 📝 Future Enhancements

### Considered for v2
1. **Optimistic Updates:** Update UI before API response, rollback on error
2. **WebSocket Real-time:** Push updates if user logs from multiple devices
3. **Offline Queue:** Queue log requests when offline, sync when online
4. **Custom Time Windows:** User setting to adjust "actionable" window (30/60/90 min)
5. **Notification Integration:** Show button when user taps push notification
6. **Adherence Streaks:** Show "X days in a row" badge on schedule screen

---

**Status:** ✅ Production Ready  
**Last Updated:** 2025-01-XX  
**Version:** v1.0 (post-state-refresh-fix)
