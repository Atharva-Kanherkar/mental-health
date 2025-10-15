# Medication Adherence System - Complete Analysis

**Date:** 2025-10-15  
**Issue:** Understanding how adherence is calculated and identifying edge cases

---

## 🔍 Current System Behavior

### How Adherence is Calculated

The `getAdherenceRate()` function in `medicationService.ts`:

```typescript
async getAdherenceRate(userId: string, medicationId?: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Count ALL logs in the time period
  const totalLogs = await prisma.medicationLog.count({ 
    where: { userId, scheduledTime: { gte: startDate } }
  });
  
  // Count only logs with status='taken'
  const takenLogs = await prisma.medicationLog.count({
    where: { userId, scheduledTime: { gte: startDate }, status: 'taken' }
  });

  const adherenceRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0;
}
```

**Key Point:** Adherence is calculated **ONLY from existing MedicationLog records**, not from the medication schedule itself.

---

## 🚨 Critical Finding: The System is Log-Based, Not Schedule-Based

### What This Means

1. **No logs = 100% adherence** (by default, because totalLogs = 0)
2. **Adherence only reflects what YOU manually log**, not what you should have taken
3. **There is NO automatic system that marks doses as missed**

### Your Specific Case

**Medication:** Once daily at 08:00  
**Action:** Logged as "taken" at 3:35 PM  
**Result:** 100% adherence

**Why?**
- You created 1 log entry with `status: 'taken'`
- `totalLogs = 1`, `takenLogs = 1`
- Adherence = `(1/1) * 100 = 100%`

The system doesn't know you were supposed to take it at 8:00 AM. It only sees one log entry marked as "taken."

---

## ⚠️ MAJOR EDGE CASES & PROBLEMS

### 1. **Forgotten Doses Don't Count as Missed**

**Scenario:**
- Medication scheduled for 8:00 AM
- User forgets to log it
- User never interacts with the app

**Expected Behavior:** Should count as missed  
**Actual Behavior:** Doesn't affect adherence at all (no log created)

**Impact:** Adherence rate artificially high

---

### 2. **User Can Log Whenever They Want**

**Scenario:**
- Medication scheduled for 8:00 AM
- User logs it as "taken" at 11:59 PM

**Expected Behavior:** Should be marked as "late" or have timestamp validation  
**Actual Behavior:** Accepted as normal "taken" dose, counts as 100% adherence

**Impact:** No distinction between on-time and late doses in adherence calculation

---

### 3. **User Can Log Future Doses**

**Scenario:**
- User logs tomorrow's 8:00 AM dose today

**Expected Behavior:** Should reject future timestamps  
**Actual Behavior:** Accepted (no validation preventing this)

**Impact:** User can artificially inflate adherence

---

### 4. **User Can Log Past Doses Retroactively**

**Scenario:**
- User missed doses for 3 days
- On day 4, logs all previous days as "taken"

**Expected Behavior:** System should track when log was created vs. when dose was supposedly taken  
**Actual Behavior:** All count as "taken," 100% adherence

**Impact:** No accountability for retroactive logging

---

### 5. **No Automatic Missed Dose Detection**

**Current State:**
- There are NO cron jobs
- There are NO background workers
- There are NO scheduled tasks
- The system NEVER automatically creates logs

**What This Means:**
- If user doesn't open the app, nothing happens
- Schedule is generated on-demand when user opens "Today's Schedule"
- Missed doses only appear if user manually marks them or if app logic prevents duplicate logging

---

### 6. **getTodaysSchedule Shows "Pending" Forever**

**How It Works:**
```typescript
const log = medication.logs.find(l => {
  const logTime = new Date(l.scheduledTime);
  const isSameDay = logTime >= today && logTime < tomorrow;
  const isSameTime = logTime.getHours() === hours && logTime.getMinutes() === minutes;
  return isSameDay && isSameTime;
});

status: log ? log.status : 'pending'
```

**Scenario:**
- 8:00 AM dose scheduled
- It's now 11:00 PM
- No log exists

**Expected:** Should show "missed"  
**Actual:** Shows "pending"

**Impact:** User can't see what they actually missed unless they manually mark it

---

### 7. **Multiple Logs for Same Scheduled Time**

**Scenario:**
- User logs 8:00 AM dose as "taken"
- User accidentally logs it again

**Expected Behavior:** Prevent duplicates or replace existing log  
**Actual Behavior:** Creates second log entry

**Impact:** 
- `totalLogs = 2`, `takenLogs = 2`
- Still 100%, but inflated total count
- Can skew long-term statistics

---

### 8. **Status Field is User-Controlled**

**Current Schema:**
```typescript
status: 'taken' | 'missed' | 'skipped' | 'late'
```

**Problem:**
- User can manually set any status
- No automatic logic determines if dose was "late"
- "missed" and "skipped" must be manually selected

**Expected:** System should auto-calculate based on time difference  
**Actual:** Entirely manual

---

### 9. **Adherence Calculation Doesn't Weight Recent vs. Old**

**Scenario:**
- User had 90% adherence 2 months ago
- User has 50% adherence this week

**Expected:** Recent adherence more important for current health status  
**Actual:** All days in the window weighted equally

**Impact:** Can't distinguish improving vs. declining adherence

---

### 10. **No Grace Period or Late Window**

**Medical Reality:**
- Many medications have tolerance windows (e.g., ±2 hours is still effective)
- Some medications are strict (e.g., hormonal birth control)

**Current System:**
- No concept of "late but acceptable"
- No medication-specific rules

**Impact:** Can't model real-world medication timing requirements

---

## 📊 How Each Status Actually Works

### "taken"
- **Set by:** User manually selects "Taken"
- **Counted in adherence:** YES (numerator)
- **takenAt field:** Should be set to actual time, but not enforced

### "missed"
- **Set by:** User manually selects "Missed"
- **Counted in adherence:** YES (denominator only, reduces adherence %)
- **Auto-created:** NEVER

### "skipped"
- **Set by:** User manually selects "Skipped"
- **Counted in adherence:** YES (denominator only, reduces adherence %)
- **Semantic difference from missed:** Intentional vs. unintentional (but no functional difference)

### "late"
- **Set by:** User manually selects "Late"
- **Counted in adherence:** YES (but unclear if it counts as taken or not)
- **Auto-determined:** NO (should be based on time difference, but isn't)

### "pending"
- **Set by:** Default when no log exists
- **Counted in adherence:** NO (not in database, only in UI)
- **Shown in:** Today's schedule view only

---

## 🔧 What Should Happen vs. What Actually Happens

| Scenario | Expected | Actual | Impact |
|----------|----------|--------|--------|
| User forgets dose entirely | Auto-mark as missed after X hours | Stays "pending" in UI, no log created | Adherence artificially high |
| User takes dose 5 hours late | Auto-mark as "late" | User must manually select "late" | No automatic tracking |
| User logs dose at 11:59 PM for 8:00 AM schedule | Warn or auto-mark late | Accepted as normal | Can't distinguish timing |
| User logs tomorrow's dose today | Reject or warn | Accepted | Can game the system |
| User logs same dose twice | Prevent duplicate | Creates 2 logs | Inflated counts |
| Medication ended 2 weeks ago | Stop generating schedule | Still appears if isActive=true | Stale data |
| User manually marks "missed" | Reduces adherence | ✅ Correctly reduces | Works as expected |

---

## 💡 Recommended Improvements

### High Priority

1. **Automatic Missed Dose Detection**
   ```typescript
   // Add a background job that runs every hour
   async function markMissedDoses() {
     const now = new Date();
     const cutoffTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours grace
     
     // Find all active medications
     // For each scheduled time in the past 24 hours
     // If no log exists and scheduledTime + grace period < now
     // Create log with status='missed'
   }
   ```

2. **Prevent Future Logging**
   ```typescript
   if (data.scheduledTime > new Date()) {
     throw new Error('Cannot log doses scheduled in the future');
   }
   ```

3. **Auto-Calculate "Late" Status**
   ```typescript
   const timeDiff = data.takenAt - data.scheduledTime;
   const threshold = 2 * 60 * 60 * 1000; // 2 hours
   
   if (timeDiff > threshold) {
     data.status = 'late';
   } else {
     data.status = 'taken';
   }
   ```

4. **Prevent Duplicate Logs**
   ```typescript
   // Before creating log, check if one exists
   const existing = await prisma.medicationLog.findFirst({
     where: {
       medicationId,
       scheduledTime: {
         gte: scheduledTimeStart, // Same hour/minute that day
         lt: scheduledTimeEnd
       }
     }
   });
   
   if (existing) {
     // Update existing instead of creating new
   }
   ```

### Medium Priority

5. **Schedule-Based Adherence Calculation**
   ```typescript
   // Calculate expected doses from medication.scheduledTimes
   // Compare against actual logs
   // This gives true adherence even without manual logging
   ```

6. **Weighted Adherence (Recent > Old)**
   ```typescript
   // Apply exponential decay to older logs
   // Last 7 days = 100% weight
   // 8-14 days ago = 75% weight
   // 15-30 days ago = 50% weight
   ```

7. **Medication-Specific Timing Rules**
   ```prisma
   model Medication {
     // ...
     timingFlexibility Int? // Minutes of acceptable delay
     criticalTiming Boolean @default(false) // Strict timing required
   }
   ```

### Low Priority

8. **Log Creation Timestamp**
   ```prisma
   model MedicationLog {
     // ...
     loggedAt DateTime @default(now()) // When user created the log
     takenAt DateTime? // When they claim they took it
   }
   ```

9. **Adherence Trends**
   ```typescript
   // Track adherence by week
   // Show improving/declining trend
   // Alert on sudden drops
   ```

---

## 🎯 Immediate Next Steps

### Option A: Keep Current System (Manual)
**Pros:**
- No breaking changes
- User maintains full control
- Simple implementation

**Cons:**
- Adherence data unreliable
- Requires user discipline
- Can't detect true missed doses

**Best for:** Users who are already diligent

---

### Option B: Add Automatic Missed Detection
**Pros:**
- Accurate adherence tracking
- No user action needed for missed doses
- Better medical value

**Cons:**
- Requires background job infrastructure
- More complex
- May overwhelm forgetful users with "missed" notifications

**Implementation:** Add cron job or scheduled function

---

### Option C: Hybrid Approach
**Pros:**
- User can manually log OR system auto-detects
- Most flexible
- Best user experience

**Cons:**
- Most complex to implement
- Need clear rules for auto vs. manual

**Recommended Flow:**
1. User opens app
2. System checks for unlogged doses > 2 hours past scheduled time
3. Auto-create logs with status='missed'
4. Show notification: "We noticed you missed your 8:00 AM dose. Mark as taken if you took it late?"
5. User can update to "taken" if they actually took it

---

## 🧪 Testing Scenarios

To properly test the system, try these scenarios:

1. **Scenario: Normal Usage**
   - Create medication: once daily at 8:00 AM
   - Log at 8:05 AM as "taken"
   - Check adherence: Should be 100%

2. **Scenario: Late Logging**
   - Same medication
   - Log at 10:00 PM as "taken"
   - Check: Does it show as "late"? (Currently: No)

3. **Scenario: Forgotten Dose**
   - Same medication
   - Don't log anything
   - Wait 24 hours
   - Check adherence: Should drop (Currently: Stays 100%)

4. **Scenario: Retroactive Logging**
   - Same medication
   - 3 days later, log all 3 missed days as "taken"
   - Check: System accepts all (Should it?)

5. **Scenario: Duplicate Logging**
   - Log same dose twice
   - Check: Creates 2 entries (Should prevent)

---

## 📝 Summary

**Your 100% adherence with a late dose is CORRECT given current system design.**

The system is **log-based**, not **schedule-based**:
- ✅ You created a log entry
- ✅ Log status = "taken"
- ✅ Adherence = taken logs / total logs = 1/1 = 100%

**But this reveals fundamental issues:**
1. No automatic missed dose detection
2. No timing validation
3. No duplicate prevention
4. Adherence only reflects what user manually logs
5. Can be gamed (intentionally or unintentionally)

**For a mental health app, accurate medication tracking is critical.** Consider implementing at least the high-priority improvements, especially automatic missed dose detection.

---

**Would you like me to implement any of these improvements?** I'd recommend starting with:
1. Automatic "late" status calculation
2. Prevent future dose logging
3. Duplicate log prevention

These can be done without major architecture changes.
