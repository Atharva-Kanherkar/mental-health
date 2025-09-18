# Authentication Middleware & Protected Routes Guide

## 🛡️ **What We've Set Up**

Your mental health app now has a complete authentication and authorization system with:

1. **Authentication Middleware** - Protects routes requiring login
2. **Onboarding Middleware** - Manages onboarding flow
3. **Protected Routes** - Secured endpoints for authenticated users
4. **User Context** - Access to current user in all protected routes

## 🔧 **Middleware Overview**

### 1. Authentication Middleware (`/src/middleware/auth.ts`)

```typescript
// Protects routes - requires valid session
export const requireAuth

// Optional auth - gets user if available, doesn't block if not
export const optionalAuth  

// Role-based auth (future extension)
export const requireRole
```

**How it works:**
- Extracts session from Better Auth
- Attaches `req.user` and `req.session` to request
- Returns 401 if not authenticated

### 2. Onboarding Middleware (`/src/middleware/onboarding.ts`)

```typescript
// Requires completed onboarding (has MemoryVault)
export const requireOnboarding

// Requires NO onboarding (prevents completed users from accessing onboarding)
export const requireNoOnboarding
```

**How it works:**
- Checks if user has a `MemoryVault` (indicates completed onboarding)
- Redirects appropriately based on onboarding status

## 🗺️ **Route Protection Levels**

### Level 1: Public Routes
```typescript
// No middleware needed
app.get('/health', handler)        // ✅ Anyone can access
app.use('/auth', authRoutes)       // ✅ Anyone can sign up/in
```

### Level 2: Authenticated Routes
```typescript
// Requires: requireAuth
app.use('/onboarding', requireAuth, routes)  // ✅ Must be logged in
```

### Level 3: Onboarded Routes  
```typescript
// Requires: requireAuth + requireOnboarding
app.use('/dashboard', requireAuth, requireOnboarding, routes)  // ✅ Must be logged in + onboarded
```

### Level 4: Onboarding-Only Routes
```typescript
// Requires: requireAuth + requireNoOnboarding  
app.use('/onboarding/complete', requireAuth, requireNoOnboarding, handler)  // ✅ Logged in but NOT onboarded
```

## 📋 **Available Endpoints**

### Authentication Endpoints (Public)
```
POST /auth/signup          - Create new account
POST /auth/signin          - Sign in to account  
POST /auth/signout         - Sign out
GET  /auth/session         - Get current session
GET  /auth/profile         - Get user profile
GET  /api/auth/sign-in/google    - Google OAuth
GET  /api/auth/sign-in/github    - GitHub OAuth
```

### Onboarding Endpoints (Protected)
```
GET  /onboarding/status    - Check onboarding status (any auth user)
GET  /onboarding/page      - Get onboarding data (non-onboarded only)
POST /onboarding/complete  - Complete onboarding (non-onboarded only)
PUT  /onboarding/profile   - Update profile during onboarding (non-onboarded only)
```

### Dashboard Endpoints (Protected + Onboarded)
```
GET  /dashboard/           - Get dashboard home (onboarded users only)
GET  /dashboard/profile    - Get detailed profile (onboarded users only)
```

## 💻 **How to Access User in Controllers**

### In Any Protected Route:
```typescript
export class MyController {
    static async myMethod(req: Request, res: Response) {
        // User is guaranteed to exist due to requireAuth middleware
        const userId = req.user!.id;
        const userName = req.user!.name;
        const userEmail = req.user!.email;
        
        // Use user data...
    }
}
```

### In Onboarded Routes:
```typescript
export class DashboardController {
    static async dashboard(req: Request, res: Response) {
        // Both user and memoryVault are guaranteed to exist
        const userId = req.user!.id;
        const memoryVaultId = req.memoryVault!.id;
        
        // User is definitely onboarded...
    }
}
```

## 🔄 **Onboarding Flow**

1. **User Signs Up/In**: → Authenticated, no MemoryVault
2. **Access Protected Route**: → Redirected to onboarding  
3. **Complete Onboarding**: → MemoryVault created
4. **Access Dashboard**: → Full access granted

### Flow Example:
```
1. POST /auth/signup                     → Success (authenticated)
2. GET  /dashboard/                      → 302 Redirect to /onboarding  
3. GET  /onboarding/page                 → Get onboarding form
4. POST /onboarding/complete             → MemoryVault created
5. GET  /dashboard/                      → Success (full access)
```

## 🚨 **Response Patterns**

### Authentication Required (401):
```json
{
    "success": false,
    "message": "Authentication required. Please log in."
}
```

### Onboarding Required (302):
```json
{
    "success": false,
    "message": "Onboarding required",
    "redirectTo": "/onboarding"
}
```

### Already Onboarded (302):
```json
{
    "success": false, 
    "message": "Onboarding already completed",
    "redirectTo": "/dashboard"  
}
```

## 🧪 **Testing**

1. **Start your server:**
```bash
npm run dev
```

2. **Open test interface:**
```
http://localhost:4000/protected-test.html
```

3. **Test the flow:**
   - Sign up/Sign in
   - Try accessing dashboard (should redirect to onboarding)
   - Complete onboarding  
   - Access dashboard (should work)

## 📁 **New Files Created**

- `/src/middleware/auth.ts` - Authentication middleware
- `/src/middleware/onboarding.ts` - Onboarding middleware  
- `/src/controllers/onboardingController.ts` - Onboarding logic
- `/src/routes/onboarding.ts` - Onboarding routes
- `/src/routes/dashboard.ts` - Dashboard routes
- `/public/protected-test.html` - Testing interface

## 🛠️ **Extending the System**

### Add New Protected Route:
```typescript
// 1. Create controller
export class MyController {
    static async myMethod(req: Request, res: Response) {
        const userId = req.user!.id;  // User guaranteed by middleware
        // Your logic here...
    }
}

// 2. Create routes with appropriate middleware
const router = Router();
router.use(requireAuth);                    // Require authentication
router.use(requireOnboarding);              // Require onboarding
router.get('/my-endpoint', MyController.myMethod);

// 3. Add to server
app.use('/my-routes', router);
```

### Add Role-Based Access:
```typescript
// Extend user type to include roles
// Use requireRole(['admin', 'user']) middleware
```

Your authentication system is now production-ready with proper middleware, user context, and onboarding flow! 🎉
