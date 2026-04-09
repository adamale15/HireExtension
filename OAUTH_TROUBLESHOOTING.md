# OAuth Authentication Troubleshooting

## Current Issue

You're seeing "This browser or app may not be secure" error when trying to sign in with Google.

## Root Cause

This happens because Google's OAuth flow is rejecting the authentication request from the Chrome extension context. This is a **configuration issue**, not a code issue.

## Step-by-Step Fix

### 1. Get Your Extension ID

1. Open Chrome and go to `chrome://extensions/`
2. Make sure "Developer mode" is ON (top right)
3. Find HireExtension in the list
4. Copy the **Extension ID** (it's a long string like `abcdefghijklmnopqrstuvwxyzabcdef`)

### 2. Configure OAuth in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project: **hireextension**
3. Navigate to: **APIs & Services** → **Credentials**
4. **Option A: If you already created an OAuth client**:
  - Click on your existing OAuth client ID
  - Under "Application type", it should say **Chrome app**
  - Under "Application ID", paste your Extension ID from step 1
  - Click **SAVE**
5. **Option B: If you need to create a new OAuth client**:
  - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
  - Application type: Select **Chrome app** (not "Web application"!)
  - Name: `HireExtension`
  - Application ID: Paste your Extension ID
  - Click **CREATE**
  - Copy the generated Client ID

### 3. Update Extension Config

The Client ID in your `wxt.config.ts` is currently:

```
462582287982-bp4s4mmnsco2ajsoivc7il13sdps2jvq.apps.googleusercontent.com
```

Make sure this matches the Client ID from Google Cloud Console.

### 4. Configure OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. If it says "Testing" status:
  - Click **ADD USERS**
  - Add your email address as a test user
  - Click **SAVE**

### 5. Rebuild and Reload

```bash
pnpm build
```

Then in Chrome:

- Go to `chrome://extensions/`
- Click the **reload** icon on HireExtension
- Try signing in again

## Common Mistakes

❌ **Wrong Application Type**: You created a "Web application" OAuth client instead of "Chrome app"
❌ **Wrong Extension ID**: The Extension ID in OAuth settings doesn't match the actual extension
❌ **Not a Test User**: Your email isn't added as a test user in OAuth consent screen
❌ **Wrong Client ID**: The client ID in wxt.config.ts doesn't match Google Cloud Console

## Verification Checklist

- Extension ID copied from `chrome://extensions/`
- OAuth client type is **Chrome app** (not Web application)
- Application ID in OAuth settings matches Extension ID
- Your email is added as a test user
- Client ID in wxt.config.ts matches Google Cloud Console
- Extension has been rebuilt with `pnpm build`
- Extension has been reloaded in Chrome

## Still Not Working?

If you're still getting the error after following all steps, let me know and I can implement an alternative authentication method (email/password) that doesn't require OAuth configuration.

## Debug Information

When you click "Sign in with Google", check the browser console for any errors:

1. Open the side panel
2. Right-click anywhere → **Inspect**
3. Go to **Console** tab
4. Try signing in
5. Share any error messages you see

