# HireExtension

AI-powered job matching assistant for Jobright.ai

## Features

- 🎯 AI-powered job matching and categorization
- 📄 Multi-resume management with Firebase Storage
- ✨ Resume tailoring with Google Gemini
- 🔗 LinkedIn hiring manager finder
- 🔐 Google Sign-In authentication
- 🌐 Cross-browser support (Chrome, Firefox, Edge)

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Add your Firebase configuration to `.env.local` (already configured)

3. Add your Gemini API key in the extension Settings after installation

### Run Development Server

```bash
# Chrome
pnpm dev

# Firefox
pnpm dev:firefox
```

### Build for Production

```bash
# Chrome
pnpm build

# Firefox
pnpm build:firefox
```

### Create Distribution Package

```bash
pnpm zip
```

## Project Structure

```
src/
  entrypoints/
    background.ts          # Service worker
    content.ts             # Content script for Jobright/LinkedIn
    sidepanel/             # Main UI
    popup/                 # Quick status popup
  components/              # React components
  lib/                     # Utilities (Firebase, Gemini, etc.)
  hooks/                   # React hooks
  assets/                  # Icons and images
```

## Documentation

- [Product Requirements](prd.md)
- [User Flows](userflow.md)
- [Build Plan](.cursor/plans/hireextension_build_plan_0bd09221.plan.md)
