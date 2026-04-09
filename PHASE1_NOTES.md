# Phase 1 Development Notes

## Completed

✓ WXT project initialized with React + TypeScript + Tailwind CSS
✓ Firebase integration (Auth, Firestore, Storage)
✓ Google Sign-In authentication flow
✓ Session persistence with chrome.storage
✓ Side panel UI with tab navigation
✓ Popup UI for quick access
✓ Background service worker
✓ Content script placeholder for Jobright
✓ TypeScript types for all data models
✓ React hooks for auth and resumes
✓ Storage utilities
✓ Project builds successfully

## Known Issues

1. OAuth2 client_id in manifest is placeholder - needs real Google OAuth client ID
2. Icons are auto-generated - custom icons can be added to `public/icon.png`
3. Firebase security rules need to be configured in Firebase Console

## Next Steps (Phase 2)

1. Implement Gemini API integration for PDF parsing
2. Build resume upload UI component
3. Create resume list and management UI
4. Test PDF upload and parsing flow
5. Implement resume rename/delete operations

## Testing Instructions

### Chrome
1. Run `pnpm dev`
2. Open chrome://extensions
3. Enable Developer mode
4. Click "Load unpacked"
5. Select `.output/chrome-mv3` folder
6. Click the extension icon or open side panel

### Firefox  
1. Run `pnpm dev:firefox`
2. Open about:debugging#/runtime/this-firefox
3. Click "Load Temporary Add-on"
4. Select any file in `.output/firefox-mv2` folder

## Firebase Setup Reminder

Before testing auth, configure Firebase:
1. Go to Firebase Console → Authentication
2. Enable Google Sign-In provider
3. Add authorized domain: `chrome-extension://<your-extension-id>`
4. Set up Firestore in test mode
5. Enable Storage with default rules
