# Lunch with Gareth - Nostr Bill Splitting PWA

Lunch with Gareth is a React/TypeScript Progressive Web Application for splitting dining bills and requesting payments via Nostr zaps. It features receipt scanning, bill splitting calculations, and secure Nostr key management with local device encryption.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Setup
- Install dependencies: `npm install` -- takes 2 minutes. NEVER CANCEL. Set timeout to 180+ seconds.
- Check for npm audit issues (currently 3 moderate vulnerabilities - these are acceptable).

### Development Commands
- Development server: `npm run dev` -- starts in 0.5 seconds on http://localhost:8080
- Build for production: `npm run build` -- takes 6 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
- Build for development: `npm run build:dev` -- takes 6 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
- Preview built application: `npm run preview` -- starts immediately on http://localhost:4173
- Lint code: `npm run lint` -- takes 3 seconds (currently shows errors that need fixing)

### Critical Build Information
- NEVER CANCEL builds or long-running commands. All builds complete in under 10 seconds.
- Development server starts instantly and runs on port 8080.
- Preview server runs on port 4173.
- Build outputs to `dist/` directory.

## Validation

### Manual Testing Requirements
ALWAYS test these complete user scenarios after making changes:
1. **Initial Setup Flow**: Open app → Setup Nostr Identity → Generate/Import key → Enter device password
2. **Navigation Test**: Test all main app sections (scan, split, history, settings) if past setup
3. **Error Handling**: Verify error messages display correctly (e.g., password mismatch)

### Code Quality
- ALWAYS run `npm run lint` before committing - currently has 6 errors and 8 warnings that should be addressed
- Fix TypeScript errors for better code quality
- Address eslint warnings about react-refresh exports

### Browser Testing
- The application loads correctly in both dev and preview modes
- UI renders properly with purple/gradient theme
- Form interactions work (password fields, buttons, checkboxes)
- Error toast notifications display correctly

## Common Tasks

### Project Structure Overview
```
src/
├── components/
│   ├── features/        # Main app features
│   │   ├── AuthSetup.tsx      # Nostr key setup
│   │   ├── BiometricGate.tsx  # Biometric authentication
│   │   ├── ScanReceipt.tsx    # Receipt scanning
│   │   ├── SplitBill.tsx      # Bill splitting logic
│   │   ├── PaymentHistory.tsx # Payment tracking
│   │   ├── Settings.tsx       # App settings
│   │   └── WelcomeScreen.tsx  # Initial welcome flow
│   ├── layout/          # Layout components
│   └── ui/             # shadcn-ui components
├── lib/                # Utility libraries
│   ├── crypto.ts       # Cryptographic functions
│   ├── nostr.ts        # Nostr protocol integration
│   ├── webauthn.ts     # Biometric authentication
│   └── utils.ts        # General utilities
├── store/              # State management
│   └── auth.ts         # Authentication state (Zustand)
├── pages/              # Route components
│   ├── Index.tsx       # Main application entry
│   └── NotFound.tsx    # 404 page
└── types/              # TypeScript type definitions
```

### Key Technologies
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **UI Library**: shadcn-ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for auth state
- **Routing**: React Router DOM
- **Nostr Integration**: nostr-tools library
- **Forms**: React Hook Form with Zod validation

### Development Workflow
1. Start development server: `npm run dev`
2. Make changes to components in `src/`
3. Test changes in browser at http://localhost:8080
4. Run linting: `npm run lint` (fix errors before committing)
5. Build and test: `npm run build && npm run preview`

### Common File Locations
- Main app entry: `src/pages/Index.tsx`
- Authentication logic: `src/store/auth.ts` and `src/components/features/AuthSetup.tsx`
- UI components: `src/components/ui/` (shadcn-ui components)
- Styles: `src/index.css` (Tailwind with custom CSS variables)
- Configuration: `vite.config.ts`, `tailwind.config.ts`, `eslint.config.js`

### Troubleshooting
- If dependencies fail to install, try deleting `node_modules` and `package-lock.json`, then run `npm install`
- If dev server fails to start, check if port 8080 is available
- Current lint errors in PaymentHistory.tsx, SplitBill.tsx, and UI components need TypeScript fixes
- The app shows setup screen on first load - this is expected behavior

### Performance Notes
- Bundle size warning appears for chunks > 500KB - consider code splitting for production
- Development builds include more debug information and are larger
- Production builds are optimized and smaller

## Time Expectations
- npm install: ~2 minutes
- npm run dev: <1 second startup
- npm run build: ~6 seconds
- npm run build:dev: ~6 seconds
- npm run lint: ~3 seconds
- npm run preview: instant startup

NEVER CANCEL any of these commands - they all complete quickly.