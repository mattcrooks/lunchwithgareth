# Lunch with Gareth - GitHub Copilot Instructions

**Always follow these instructions first and fallback to additional search and context gathering only if the information in the instructions is incomplete or found to be in error.**

Lunch with Gareth is a mobile-first Progressive Web App (PWA) for splitting bills using Nostr (decentralized social protocol) and Bitcoin. Users can scan receipts with OCR, split costs among participants, and send payment requests via Nostr events.

## Working Effectively

### Prerequisites and Setup
- Install Node.js (the project uses Node.js modules and npm)
- **CRITICAL**: Work in the `copilot/fix-1` branch - this contains the actual source code
  - Main branch only contains README and LICENSE
  - Run: `git fetch origin && git checkout origin/copilot/fix-1`

### Build and Development Process
1. **Install Dependencies**:
   - `npm install` -- takes ~35 seconds. NEVER CANCEL.
   - Returns 287 packages with 0 vulnerabilities

2. **Start Development Server**:
   - `npm run dev` -- starts in ~200ms
   - Runs Vite dev server at http://localhost:5173/
   - Includes hot module replacement for fast development

3. **Build for Production**:
   - `npm run build` -- takes ~5 seconds. Uses TypeScript compilation + Vite build
   - Command: `tsc -b && vite build`
   - Creates `dist/` folder with production assets
   - **Known Issue**: Produces TailwindCSS warning about `border-border` utility class but build succeeds

4. **Preview Production Build**:
   - `npm run preview` -- starts in ~1 second
   - Serves built application at http://localhost:4173/

5. **Linting**:
   - `npm run lint` -- takes ~1.6 seconds
   - **Current Status**: 8 errors, 1 warning in ESLint
   - **Critical**: Run linting before commits as there are unresolved issues in:
     - `/src/components/ui/input.tsx` (empty interface)
     - `/src/features/contacts/ContactSelector.tsx` (missing dependencies)
     - `/src/features/receipt/CreateRequest.tsx` (unused variable)
     - `/src/lib/nostr.ts` (any types, unused variables)
     - `/src/lib/storage.ts` (unused variables)

## Application Architecture

### Technology Stack
- **Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 7.1.2
- **Styling**: TailwindCSS 4.1.12
- **State Management**: Zustand 5.0.7
- **Routing**: TanStack React Router 1.131.10
- **Data Fetching**: TanStack React Query 5.85.3
- **Database**: Dexie (IndexedDB wrapper) 4.0.11
- **Nostr Integration**: nostr-tools 2.16.2
- **Forms**: React Hook Form 7.62.0 with Zod validation
- **PWA**: Native manifest.json with service worker capabilities

### Project Structure
```
src/
├── app/                 # Main application shell
├── features/           # Feature-based modules
│   ├── auth/           # Nostr key authentication
│   ├── contacts/       # Nostr contact management
│   ├── history/        # Payment request history
│   ├── receipt/        # Receipt capture and OCR
│   ├── settings/       # App configuration
│   └── split/          # Bill splitting logic
├── components/         # Reusable UI components
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
└── main.tsx           # Application entry point
```

### Key Features
- **Receipt Scanning**: Camera/file upload with OCR processing
- **Nostr Integration**: Key generation, relay management, event publishing
- **Bill Splitting**: Equal splits with participant selection
- **Local Storage**: Dexie-based persistence for offline functionality
- **PWA Capabilities**: Installable, offline-ready mobile app

## Manual Validation Requirements

### End-to-End Testing Workflow
Always perform these validation steps after making changes:

1. **Authentication Flow**:
   - Load http://localhost:5173/
   - Click "Generate Keys" to create new Nostr keypair
   - Verify navigation to main app with user's public key displayed

2. **Core App Navigation**:
   - Test navigation between "Create Request", "History", "Settings"
   - Verify each section loads without errors

3. **Settings Validation**:
   - Check Nostr relay configuration (default: damus.io, nostr.wine, relay.nostr.info, offchain.pub)
   - Verify app settings (meal types, theme selection)
   - Test public key display and copy functionality

4. **Receipt Workflow**:
   - Navigate to "Create Request"
   - Verify 5-step process UI: Receipt → Details → Split → Contacts → Confirm
   - Test file upload interface for receipt capture

5. **PWA Functionality**:
   - Verify manifest.json is accessible at http://localhost:5173/manifest.json
   - Check mobile-responsive design
   - Test offline capabilities if service worker is implemented

### Visual Validation
- Authentication screen shows: title, key generation options, import functionality
- Main app shows: header with public key, navigation tabs, step-by-step process
- Settings show: account management, relay configuration, app preferences

## Important Development Notes

### Critical Issues to Address
- **Linting Errors**: 8 ESLint errors must be resolved before production
- **TailwindCSS**: Border utility class issue in build process
- **Dependencies**: All packages have 0 security vulnerabilities

### Branch Strategy
- **Source Code**: `copilot/fix-1` branch (contains full application)
- **Documentation**: `main` branch (README/LICENSE only)
- **Working Branch**: Use feature branches from `copilot/fix-1`

### Performance Characteristics
- **Install Time**: ~35 seconds for full dependency installation
- **Build Time**: ~5 seconds for production build
- **Dev Server**: Starts in ~200ms with hot reload
- **Lint Time**: ~1.6 seconds (with current errors)

### No Testing Infrastructure
- **Status**: No test framework currently configured
- **Recommendation**: Consider adding Vitest or Jest for unit testing
- **Manual Testing**: Critical for validating Nostr integration and PWA features

## Common Troubleshooting

### Build Issues
- If build fails with TailwindCSS errors, check for unsupported utility classes
- TypeScript errors: Run `tsc -b` separately to isolate compilation issues

### Development Server Issues  
- Port 5173 conflicts: Use `npm run dev -- --port 3000` for alternative port
- Hot reload not working: Clear browser cache and restart dev server

### Nostr Integration
- Key generation failures: Check browser crypto API support
- Relay connection issues: Verify relay URLs in settings are accessible

### PWA Issues
- Manifest not loading: Ensure public/manifest.json exists and is valid
- Install prompt not showing: Check HTTPS requirement for PWA features

## File Locations Reference

### Frequently Modified Files
- `src/features/auth/AuthScreen.tsx` - User authentication
- `src/features/receipt/ReceiptCapture.tsx` - Receipt scanning
- `src/features/settings/Settings.tsx` - App configuration
- `src/lib/nostr.ts` - Nostr protocol integration
- `src/lib/storage.ts` - Local data persistence

### Configuration Files
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Build configuration
- `tailwind.config.js` - Styling configuration
- `eslint.config.js` - Code quality rules
- `tsconfig.*.json` - TypeScript configuration

### Asset Files
- `public/manifest.json` - PWA configuration
- `public/vite.svg` - App icon (placeholder)
- `src/index.css` - Global styles and CSS variables

## Quick Command Reference

```bash
# Setup (run once)
git fetch origin && git checkout origin/copilot/fix-1
npm install

# Development (daily workflow)
npm run dev          # Start dev server (200ms)
npm run lint         # Check code quality (1.6s, has errors)
npm run build        # Build for production (5s)
npm run preview      # Test production build (1s)

# Manual testing
open http://localhost:5173/   # Dev server
open http://localhost:4173/   # Preview server
```

Remember: Always test the complete authentication and navigation flow after making changes. The app's core value is in its Nostr integration and PWA capabilities.