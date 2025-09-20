# Better Auth Setup Guide for Mental Health App

## 🎉 What's Been Set Up

Your mental health app now has complete authentication support with:

- ✅ Email & Password authentication
- ✅ Google OAuth
- ✅ GitHub OAuth
- ✅ Session management
- ✅ Express.js integration
- ✅ TypeScript support

## 🔧 Configuration Required

### 1. Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Database
DATABASE_URL="your_postgresql_database_url_here"

# Better Auth (Backend API runs on port 4000)
BETTER_AUTH_URL="http://localhost:4000"
BETTER_AUTH_SECRET="generate_a_long_random_string_here"

# Google OAuth (callback: http://localhost:4000/api/auth/callback/google)
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"

# GitHub OAuth (callback: http://localhost:4000/api/auth/callback/github)
GITHUB_CLIENT_ID="your_github_client_id_here"
GITHUB_CLIENT_SECRET="your_github_client_secret_here"

# Frontend URL (Next.js frontend typically runs on port 3000)
FRONTEND_URL="http://localhost:3000"
```

### 2. OAuth Setup

#### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Set authorized redirect URI: `http://localhost:4000/api/auth/callback/google`
6. Copy Client ID and Client Secret to your `.env` file

#### GitHub OAuth Setup:
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:4000/api/auth/callback/github`
4. Copy Client ID and Client Secret to your `.env` file

## 🚀 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Sign up with email/password |
| POST | `/auth/signin` | Sign in with email/password |
| POST | `/auth/signout` | Sign out current user |
| GET | `/auth/session` | Get current session |
| GET | `/auth/profile` | Get current user profile |

### OAuth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/sign-in/google` | Initiate Google OAuth |
| GET | `/api/auth/sign-in/github` | Initiate GitHub OAuth |
| GET | `/api/auth/callback/google` | Google OAuth callback |
| GET | `/api/auth/callback/github` | GitHub OAuth callback |

## 📝 Usage Examples

### Sign Up
```javascript
const response = await fetch('http://localhost:4000/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepassword123'
    })
});
```

### Sign In
```javascript
const response = await fetch('http://localhost:4000/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
        email: 'john@example.com',
        password: 'securepassword123'
    })
});
```

### OAuth Sign In
```javascript
// Redirect to OAuth provider
window.location.href = 'http://localhost:4000/api/auth/sign-in/google';
```

### Get Session
```javascript
const response = await fetch('http://localhost:4000/auth/session', {
    credentials: 'include'
});
const data = await response.json();
console.log(data.session.user); // User info if logged in
```

## 🧪 Testing

1. Start your server:
```bash
npm run dev
```

2. Open browser and go to: `http://localhost:4000/auth-test.html`

3. Test the authentication features using the provided test interface.

## 📁 Files Created/Modified

- `/src/utils/auth.ts` - Better Auth configuration
- `/src/utils/auth-client.ts` - Client-side auth helper
- `/src/server.ts` - Updated server with Better Auth integration
- `/.env.example` - Environment variables template
- `/src/middleware/auth.ts` - Authentication middleware for protected routes

**Note**: We use Better Auth's native endpoints (`/api/auth/*`) directly. No custom controllers, services, or routes needed.

## 🔒 Security Notes

1. **Environment Variables**: Never commit real credentials to version control
2. **HTTPS**: Use HTTPS in production
3. **Secrets**: Generate strong, random secrets for production
4. **CORS**: Configure CORS properly for your frontend domain
5. **Session Security**: Sessions are handled securely by Better Auth

## 🚨 Troubleshooting

### Common Issues:

1. **OAuth not working**: Check your OAuth app settings and redirect URIs
2. **CORS errors**: Make sure your frontend URL is in the CORS configuration
3. **Database errors**: Ensure your DATABASE_URL is correct and database is running
4. **Session issues**: Check that cookies are being sent with `credentials: 'include'`

### Debug Mode:
Add this to your `.env` to enable debug logging:
```env
DEBUG=better-auth:*
```

## 🎯 Next Steps

1. Set up your `.env` file with real values
2. Configure OAuth providers if needed
3. Test the authentication flow
4. Integrate with your frontend application
5. Add additional Better Auth plugins as needed (2FA, magic links, etc.)

Your authentication system is now ready to use! 🎉
