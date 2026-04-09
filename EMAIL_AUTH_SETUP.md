# Quick Fix: Enable Email/Password Authentication

Since Google Sign-In is having issues with Chrome extension security restrictions, let's enable email/password authentication as a working alternative.

## Steps to Enable Email/Password Auth

1. **Go to Firebase Console**:
  - [https://console.firebase.google.com/](https://console.firebase.google.com/)
  - Select your project: **hireextension**
2. **Navigate to Authentication**:
  - Click **Authentication** in left sidebar
  - Click **Sign-in method** tab
3. **Enable Email/Password**:
  - Find **Email/Password** in the providers list
  - Click on it
  - Toggle **Enable** to ON
  - Click **Save**
4. **Reload extension and sign up**:
  - You'll be able to create an account with email/password
  - This works 100% reliably in Chrome extensions

## Why Email/Password?

- No OAuth popup restrictions
- No external authentication flow
- Works immediately in all browsers
- Perfect for testing and development

Once you enable it in Firebase, I'll add a simple sign-up/sign-in form to the extension!

Let me know when you've enabled Email/Password, and I'll update the UI.