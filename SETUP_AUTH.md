# Authentication Setup Guide

## Problem

You're seeing `Firebase: Error (auth/internal-error)` when trying to sign in. This is because Chrome extension authentication with Firebase requires additional OAuth configuration.

## Solution: Configure Google OAuth for Chrome Extension

### Step 1: Create OAuth 2.0 Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (`hireextension`)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - User Type: **External**
   - App name: `HireExtension`
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue

6. Create OAuth client ID:
   - Application type: **Chrome extension**
   - Name: `HireExtension`
   - Application ID: Get this from `chrome://extensions` (it's the ID shown under your extension)
   - Click **CREATE**

7. **Copy the Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)

### Step 2: Update Extension Manifest

Add the OAuth client ID to `wxt.config.ts`:

```typescript
export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'HireExtension',
    // ... other config ...
    oauth2: {
      client_id: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',
      scopes: [
        'openid',
        'email',
        'profile'
      ]
    }
  },
  // ... rest of config
});
```

### Step 3: Rebuild and Reload

```bash
pnpm build
```

Then reload the extension in Chrome:
- Go to `chrome://extensions/`
- Click the reload button on HireExtension
- Try signing in again

## Alternative: Simple Authentication (For Testing)

If you want to test without OAuth setup, I can implement a simpler email/password authentication flow. Let me know if you'd prefer that approach.

## Current Status

The code is ready to use Chrome Identity API authentication once you:
1. ✓ Have a Firebase project (done)
2. ⏳ Create OAuth 2.0 credentials in Google Cloud Console
3. ⏳ Add the client ID to wxt.config.ts
4. ⏳ Rebuild the extension

Let me know if you need help with any of these steps!
