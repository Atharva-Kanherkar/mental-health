# Therapist Report Sharing System

## Overview

A secure, password-protected system for users to share comprehensive mental health reports with their therapists. Reports are accessible via unique links with auto-generated memorable passwords.

---

## Architecture

### Flow Diagram

```
User taps "Share with Therapist" in Mobile App
    ↓
Backend generates comprehensive mental health report
    ↓
Creates unique shareable link with auto-generated password
    ↓
Link: https://api.my-echoes.app/share/abc123
Password: gentle-moon-7432
    ↓
Mobile shows QR code + password + copy buttons
    ↓
Therapist opens link → enters password → sees report
    ↓
Optional: Download as PDF
```

---

## Database Schema

### SharedReport Model

```prisma
model SharedReport {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Share token and password
  shareToken    String   @unique
  passwordHash  String

  // Report metadata
  reportType    String   // "weekly" | "monthly" | "comprehensive"
  reportData    Json     // Complete report data

  // Timestamps
  generatedAt   DateTime @default(now())
  expiresAt     DateTime
  accessedAt    DateTime?

  // Access control
  accessCount   Int      @default(0)
  maxAccess     Int      @default(10)
  isActive      Boolean  @default(true)

  @@index([shareToken])
  @@index([expiresAt])
  @@index([userId])
}
```

---

## Backend Components

### 1. Report Generation Service

**Location:** `/home/atharva/mental-health/src/services/reportGenerationService.ts`

**Key Features:**
- Generates comprehensive mental health reports
- Aggregates data from multiple sources:
  - Daily check-ins (mood, energy, stress, anxiety)
  - Journal entries with AI analysis
  - Behavioral patterns (exercise, self-care, etc.)
  - Standardized assessments (PHQ-9, GAD-7)
  - Safety indicators (self-harm, suicidal thoughts)
  - Correlations and predictions

**Report Types:**
- **Weekly:** Last 7 days
- **Monthly:** Last 30 days
- **Comprehensive:** Custom duration (default 30 days)

**API:**
```typescript
reportGenerationService.generateComprehensiveReport(userId: string, days: number): Promise<Report>
reportGenerationService.generateWeeklyReport(userId: string): Promise<Report>
reportGenerationService.generateMonthlyReport(userId: string): Promise<Report>
```

---

### 2. Share Link Service

**Location:** `/home/atharva/mental-health/src/services/shareLinkService.ts`

**Key Features:**
- Generates unique 64-character share tokens
- Creates memorable passwords (format: `adjective-noun-NNNN`)
  - Example: `gentle-moon-7432`, `calm-star-1845`
- Bcrypt password hashing (10 rounds)
- Tracks access count and timestamps
- 30-day default expiry
- Max 10 views per link

**Security Features:**
- Password verification using bcrypt
- Automatic expiry enforcement
- Access count limiting
- Link revocation by user
- Inactive link blocking

**API:**
```typescript
shareLinkService.createShareLink(userId, reportData, reportType, expiryDays): Promise<ShareLinkData>
shareLinkService.getSharedReport(shareToken, password): Promise<Report | null>
shareLinkService.revokeShareLink(shareToken, userId): Promise<boolean>
shareLinkService.getUserShareLinks(userId): Promise<any[]>
```

---

### 3. PDF Export Service

**Location:** `/home/atharva/mental-health/src/services/pdfExportService.ts`

**Key Features:**
- Generates beautiful HTML reports
- Converts HTML to PDF using Puppeteer
- Professional styling with color-coded sections
- Print-optimized layout
- Includes all report sections:
  - Executive summary with metrics
  - Mood trends with charts
  - Safety assessment
  - Behavioral patterns
  - Detected patterns and correlations
  - Clinical recommendations
  - Progress metrics

**API:**
```typescript
pdfExportService.generateReportPDF(report: Report): Promise<Buffer>
pdfExportService.generateHTMLReport(report: Report): string
```

---

### 4. Share Controller

**Location:** `/home/atharva/mental-health/src/controllers/shareController.ts`

**Endpoints:**

#### Authenticated Routes (User Management)

**POST /api/share/create**
```typescript
Body: {
  reportType: 'weekly' | 'monthly' | 'comprehensive',
  expiryDays: number (default: 30),
  days: number (default: 30)
}

Response: {
  success: true,
  data: {
    shareUrl: string,
    password: string,
    expiresAt: string,
    reportType: string,
    message: string
  }
}
```

**GET /api/share/my-links**
```typescript
Response: {
  success: true,
  data: Array<{
    id: string,
    shareToken: string,
    shareUrl: string,
    reportType: string,
    generatedAt: string,
    expiresAt: string,
    accessCount: number,
    maxAccess: number,
    isActive: boolean,
    isExpired: boolean,
    remainingAccess: number
  }>
}
```

**DELETE /api/share/:token**
```typescript
Response: {
  success: true,
  message: 'Share link revoked successfully'
}
```

**GET /api/share/:token/stats**
```typescript
Response: {
  success: true,
  data: {
    shareToken: string,
    reportType: string,
    generatedAt: string,
    expiresAt: string,
    accessedAt: string | null,
    accessCount: number,
    maxAccess: number,
    isActive: boolean,
    isExpired: boolean,
    remainingAccess: number,
    lastAccessed: string | null
  }
}
```

#### Public Routes (Therapist Access)

**GET /share/:token?password=xxx**
- Returns HTML report if password is valid
- Shows password prompt if no password provided
- Returns "Access Denied" if invalid

**GET /share/:token/pdf?password=xxx**
- Returns PDF file if password is valid
- Returns 401 error if invalid

---

## Mobile App Integration

### ShareModal Component

**Location:** `/home/atharva/mental-health/mobile/src/components/ShareModal.tsx`

**Features:**
- QR code display for easy sharing
- Copy buttons for link and password
- System share sheet integration (SMS/Email)
- Loading states and error handling
- Beautiful UI with proper spacing

**Usage Example:**
```typescript
import { ShareModal } from '../components/ShareModal';

const [showShareModal, setShowShareModal] = useState(false);

<TouchableOpacity onPress={() => setShowShareModal(true)}>
  <Text>Share with Therapist</Text>
</TouchableOpacity>

<ShareModal
  visible={showShareModal}
  onClose={() => setShowShareModal(false)}
  reportType="comprehensive"
  days={30}
/>
```

### API Service

**Location:** `/home/atharva/mental-health/mobile/src/services/api.ts`

**Methods:**
```typescript
api.share.createLink(reportType, expiryDays, days)
api.share.getMyLinks()
api.share.revokeLink(token)
api.share.getLinkStats(token)
```

---

## Security Features

### 1. Password Protection
- Auto-generated memorable passwords
- Bcrypt hashing (10 salt rounds)
- Password required for every access

### 2. Access Control
- Maximum 10 views per link
- 30-day automatic expiry
- User can revoke anytime
- Tracks access timestamps

### 3. Data Protection
- Unique 64-character tokens (cryptographically secure)
- No predictable URLs
- Report data stored as JSONB (encrypted at rest by PostgreSQL)
- Cascade delete on user deletion

### 4. Rate Limiting
- Prevents password brute-force attacks
- Implemented via existing infrastructure

---

## Example Usage

### For Users (Mobile App)

1. Navigate to Insights or Dashboard screen
2. Tap "Share with Therapist" button
3. Wait for report generation
4. View QR code and credentials
5. Share via:
   - QR code scan
   - Copy & paste link + password
   - System share (SMS/Email)

### For Therapists (Any Device)

1. Receive link and password from patient
2. Open link in any web browser
3. Enter password when prompted
4. View comprehensive HTML report
5. Optional: Download as PDF

---

## Report Contents

### Executive Summary
- Average mood (1-10)
- Average energy (1-10)
- Average stress (1-10)
- Average anxiety (1-10)
- Total check-ins and journal entries

### Mood Trends
- Daily mood/energy/stress/anxiety data
- Weekly averages
- Trend analysis (improving/stable/declining)

### Safety Assessment
- Risk level (low/moderate/high/critical)
- Self-harm thoughts count
- Suicidal thoughts count
- Self-harm actions count

### Behavioral Patterns
- Exercise frequency
- Self-care practice
- Social connection
- Healthy eating
- Medication adherence

### Detected Patterns
- Gratitude themes
- Challenge patterns
- Behavioral trends
- Impact on mood

### Correlations
- Statistical correlations between behaviors and mental health metrics
- Strength and direction indicators

### Journal Insights
- Total entries
- Average wellness score
- Common themes
- Sentiment distribution

### Standardized Assessments
- PHQ-9, GAD-7, etc.
- Scores and interpretations
- Historical trends

### Clinical Recommendations
- AI-generated recommendations
- Safety alerts
- Treatment suggestions
- Behavioral interventions

### Progress Metrics
- Mood change over time
- Energy improvement
- Stress reduction
- Behavioral improvements

---

## Dependencies

### Backend
- `bcrypt` (^6.0.0) - Password hashing
- `@types/bcrypt` (^6.0.0) - TypeScript types
- `puppeteer` (^24.22.0) - PDF generation
- Existing: Prisma, Express, PostgreSQL

### Mobile
- `react-native-qrcode-svg` - QR code display
- `expo-clipboard` - Clipboard operations
- `expo-sharing` - System share sheet
- Existing: Axios, React Native

---

## Testing

### Backend Testing

```bash
# Create a share link
curl -X POST http://localhost:8080/api/share/create \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reportType": "comprehensive", "expiryDays": 30, "days": 30}'

# View report (replace TOKEN and PASSWORD)
curl "http://localhost:8080/share/TOKEN?password=PASSWORD"

# Download PDF
curl "http://localhost:8080/share/TOKEN/pdf?password=PASSWORD" -o report.pdf

# Get user's links
curl http://localhost:8080/api/share/my-links \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN"

# Revoke link
curl -X DELETE http://localhost:8080/api/share/TOKEN \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN"
```

### Mobile Testing

```typescript
// In any screen (e.g., InsightsScreen.tsx)
import { ShareModal } from '../components/ShareModal';

const [showShare, setShowShare] = useState(false);

// Add button
<Button title="Share Report" onPress={() => setShowShare(true)} />

// Add modal
<ShareModal
  visible={showShare}
  onClose={() => setShowShare(false)}
  reportType="comprehensive"
/>
```

---

## Maintenance

### Cleanup Job

Run periodically to delete expired links:

```typescript
import { shareLinkService } from './services/shareLinkService';

// In a cron job or scheduled task
await shareLinkService.cleanupExpiredLinks();
```

### Monitoring

Check share link usage:
```sql
-- Active links count
SELECT COUNT(*) FROM "SharedReport" WHERE "isActive" = true AND "expiresAt" > NOW();

-- Most accessed links
SELECT "userId", "reportType", "accessCount", "generatedAt"
FROM "SharedReport"
ORDER BY "accessCount" DESC
LIMIT 10;

-- Expired but not cleaned up
SELECT COUNT(*) FROM "SharedReport" WHERE "expiresAt" < NOW();
```

---

## Future Enhancements

1. **Customizable Reports**
   - Let users choose which sections to include
   - Privacy controls for sensitive data

2. **Link Analytics**
   - Track when therapist viewed report
   - Geographic access tracking
   - Device/browser information

3. **Notification System**
   - Notify user when therapist views report
   - Expiry reminders

4. **Multi-Therapist Support**
   - Different links for different therapists
   - Custom expiry per therapist

5. **Export Formats**
   - Excel/CSV export
   - JSON API for integration

6. **Advanced Security**
   - Two-factor authentication
   - IP whitelisting
   - Time-based access windows

---

## Support

For issues or questions:
- Check logs: `/var/log/mental-health/`
- Database queries: Use Prisma Studio (`npx prisma studio`)
- API testing: Use Postman or curl
- Mobile debugging: React Native Debugger

---

## License

Confidential - Mental Health Platform
