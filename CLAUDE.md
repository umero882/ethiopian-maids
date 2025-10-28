# Ethio Maids - Project Information for Claude

## Project Overview
A React-based Ethiopian maid service platform built with Vite, featuring dashboards for different user types (agencies, maids, sponsors).

## Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS
- **UI Components**: Radix UI, Lucide React
- **State Management**: React Context
- **Database**: PostgreSQL (via Supabase)
- **Testing**: Jest, Playwright
- **Other**: Framer Motion, React Router, Socket.io

## Development Commands
```bash
# Development
npm run dev                 # Start development server
npm run dev:open           # Start dev server and open browser
npm run dev:full           # Start both frontend and backend

# Building & Production
npm run build              # Build for production
npm run preview            # Preview production build
npm run production:build   # Production build with checks
npm run production:deploy  # Build and deploy

# Linting & Formatting
npm run lint               # Run ESLint (max 600 warnings)
npm run lint:ci            # Run ESLint quietly for CI
npm run format             # Format with Prettier

# Testing
npm test                   # Run tests with cleanup
npm run test:direct        # Run Jest directly
npm run test:e2e           # Run Playwright E2E tests
npm run test:e2e:ui        # Run E2E tests with UI
npm run test:coverage      # Run tests with coverage
npm run test:watch         # Run tests in watch mode

# Database
npm run migrate            # Run database migrations
npm run db:setup           # Setup database
npm run db:test            # Test database connection
npm run schema:check       # Check schema readiness

# Security & Analysis
npm run security:audit     # Run security audit
npm run analyze:bundle     # Analyze bundle size
npm run analyze:deps       # Check dependencies
npm run performance:audit  # Run Lighthouse audit
```

## Project Structure
- `src/components/` - Reusable UI components
- `src/pages/` - Page components
- `src/contexts/` - React contexts for state management
- `src/services/` - API and business logic services
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions
- `database/` - Database migrations and scripts
- `scripts/` - Build and deployment scripts

## Key Features
- Multi-user dashboards (Agency, Maid, Sponsor)
- Real-time chat functionality
- Profile completion flows
- Stripe payment integration
- Image upload and compression
- Responsive design with mobile navigation

## Testing Notes
- Uses Jest for unit testing with custom test utilities
- Playwright for E2E testing
- Memory management configured for large test suites
- Test cleanup scripts to prevent memory leaks

## Deployment
- Configured for Vercel deployment
- Environment validation scripts
- Production readiness checks