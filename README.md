# Ethio-Maids Connection Platform
 [![CI](https://github.com/umero882/ethio-maids-staging/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/umero882/ethio-maids-staging/actions/workflows/ci.yml)
 [![Prerelease](https://img.shields.io/github/v/tag/umero882/ethio-maids-staging?label=prerelease&color=orange&sort=semver)](https://github.com/umero882/ethio-maids-staging/tags)

Contributing: see `CONTRIBUTING.md` (PR conventions, labels, prerelease flow).

Welcome to Ethio-Maids! This web application aims to bridge the gap between domestic helpers (maids) seeking employment and sponsors looking for reliable household assistance, with a particular focus on the Ethiopian community and their connection to the GCC region. The platform provides a user-friendly interface for maids to showcase their profiles and for sponsors to find suitable candidates based on their specific needs.

## ✨ Features

- **User Roles:**
  - **Maids:** Can create profiles detailing their experience, skills, nationality, expected salary, and availability.
  - **Sponsors:** Can browse maid profiles, post job vacancies, and filter candidates.
  - **Agencies:** (Potential future role) Can manage multiple maid profiles and facilitate placements.
- **Maid Listings:** A comprehensive view of available maids, with filtering options for country, experience, skills, and salary expectations.
- **Job Postings:** Sponsors can create detailed job postings outlining their requirements, location, and offered salary.
- **Profile Management:** Users can create, view, and update their profiles.
- **Search & Filtering:** Advanced search and filtering capabilities for both maids and jobs to help users find the best matches.
- **Responsive Design:** Fully responsive interface, ensuring a seamless experience across desktops, tablets, and mobile devices.
- **Modern UI/UX:** Built with a focus on clean aesthetics, intuitive navigation, and engaging animations.
- **Notifications:** (Conceptual) System for users to receive updates on job applications, new messages, or relevant maid profiles.
- **Currency Localization:** Salaries are displayed in the local currency of the user or a default GCC currency for guests.
- **Accessibility:** ARIA attributes and keyboard navigation for improved accessibility.
- **Error Handling:** Robust error boundaries to prevent app crashes.
- **Performance Optimizations:** Code splitting, lazy loading, and virtualized lists for smooth performance.
- **Progressive Web App:** PWA capabilities for better mobile experience and offline access.

## 🛠️ Tech Stack

- **Frontend:**
  - **React 18.2.0:** A JavaScript library for building user interfaces.
  - **Vite:** Next-generation frontend tooling for fast development and optimized builds.
  - **React Router 6.16.0:** For declarative routing in the React application.
  - **TailwindCSS 3.3.2:** A utility-first CSS framework for rapid UI development.
  - **shadcn/ui:** Beautifully designed components built with Radix UI and Tailwind CSS.
  - **Framer Motion 10.16.4:** For delightful animations and transitions.
  - **Lucide React 0.292.0:** A comprehensive library of simply beautiful icons.
  - **React Window:** For efficient rendering of large lists using virtualization.
  - **use-debounce:** For optimized search inputs.
- **Programming Language:** JavaScript (using .jsx for React components and .js for utilities).
- **Image Source:** Unsplash (for placeholder images).
- **Data Persistence (Initial):** `localStorage` for rapid prototyping.
- **Data Persistence (Recommended):** Supabase for a robust backend solution.
- **Payment Processing (Recommended):** Stripe Checkout (Client-only).
- **Testing:** Jest and React Testing Library for component testing.

## 📋 Environment Requirements

- **Node.js:** Version 20.x.x or higher. You can use [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) to manage Node.js versions.
- **npm (Node Package Manager):** Comes bundled with Node.js.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have Node.js (v20+) and npm installed on your system.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd ethio-maids
    ```

2.  **Install dependencies:**
    The environment handles `npm install` automatically when `package.json` is created or updated. If you are setting this up in a different environment, run:

    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Copy `.env.example` to `.env` and provide your Supabase credentials:
    ```bash
    cp .env.example .env
    # edit .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
    # set VITE_USE_MOCK_DATA=true to work with the local mock data
    ```

### Database Setup (FIXED)

**⚠️ Important: Use the fixed database setup to resolve registration issues!**

#### Quick Setup (Recommended)

```bash
# 1. Add to your .env file:
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# 2. Run automated setup
npm run db:setup

# 3. Test the setup
npm run db:test
```

#### Manual Setup (Alternative)

1. Ensure the Supabase environment variables are configured in your `.env` file:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY` (service role key)
   - `VITE_USE_MOCK_DATA=false`

2. Using the Supabase SQL editor, run the migrations in this order:
   1. `database/migrations/001_core_schema.sql`
   2. `database/migrations/002_security_policies.sql`
   3. **`database/migrations/003_functions_triggers_fixed.sql`** ⭐ **Use this fixed version**
   4. Continue with remaining migrations...

#### Troubleshooting

- **"Database error saving new user"**: Use the fixed migration files above
- **Registration fails**: Run `npm run db:diagnostic` to check setup
- **Need help**: See `database/DATABASE_FIX_GUIDE.md` for detailed instructions

### Database Migrations

```bash
# Automated setup (recommended)
npm run db:setup

# Manual migration (legacy)
npm run migrate

# Test database
npm run db:test

# Diagnostic check
npm run db:diagnostic
```

### Running the Development Server

The environment runs `npm run dev` automatically. If you are setting this up in a different environment, run:

```bash
npm run dev
```

This command will start the Vite development server. Open your browser and navigate to the URL provided in the terminal (usually `http://localhost:5173` or a similar port). The application will automatically reload if you change any of the source files.

## 📜 Available Scripts

In the project directory, you can run:

- ### `npm run dev`

  Runs the app in development mode using Vite.
  Open [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal) to view it in the browser.
  The page will reload if you make edits. You will also see any lint errors in the console.

- ### `npm run build`

  Builds the app for production to the `dist` folder.
  It correctly bundles React in production mode and optimizes the build for the best performance.
  The build is minified and the filenames include hashes.

- ### `npm run preview`

  Serves the production build locally from the `dist` folder. This is a good way to check if the production build works correctly before deploying.

- ### `npm run test`
  Runs the Jest test suite. The suite now includes tests for components, context providers, and service modules. To see a coverage report, run `npm run test -- --coverage`.

## 🏗️ Project Structure

```
ethio-maids/
├── public/                 # Static assets
│   ├── manifest.json       # PWA manifest file
│   └── ...                 # Other static assets
├── src/
│   ├── components/         # Reusable UI components (buttons, cards, layout, etc.)
│   │   ├── home/           # Components specific to the Home page
│   │   ├── jobs/           # Components specific to the Jobs page
│   │   ├── maids/          # Components specific to the Maids page
│   │   │   └── __tests__/  # Tests for maid components
│   │   ├── profile/        # Components specific to the User Profile page
│   │   ├── shared/         # Shared components used across pages
│   │   ├── ui/             # shadcn/ui components
│   │   └── ErrorBoundary.jsx # Error boundary component
│   ├── contexts/           # React Context API for global state (e.g., AuthContext)
│   ├── hooks/              # Custom React hooks (useLocalStorage, etc.)
│   ├── lib/                # Utility functions, helpers (e.g., cn, currencyUtils)
│   ├── pages/              # Page-level components (Home, Maids, Jobs, etc.)
│   ├── services/           # Service layer for API/data access
│   ├── App.jsx             # Main application component with routing
│   ├── index.css           # Global styles and TailwindCSS imports
│   └── main.jsx            # Main entry point of the React application
├── .gitignore              # Specifies intentionally untracked files that Git should ignore
├── index.html              # Main HTML file for Vite
├── package.json            # Project metadata and dependencies
├── postcss.config.js       # PostCSS configuration
├── README.md               # This file!
├── tailwind.config.js      # TailwindCSS configuration
└── vite.config.js          # Vite configuration
```

## 🔧 Recent Improvements

- **Service Layer**: Implemented a service layer for separating data access concerns from UI components
- **Error Boundary**: Added an error boundary component to gracefully handle runtime errors
- **Optimized Images**: Created a reusable optimized image component with lazy loading and fallbacks
- **Code Splitting**: Implemented React.lazy and Suspense for component-level code splitting
- **List Virtualization**: Added virtual scrolling for the maids listing page to improve performance with large datasets
- **Debounced Search**: Implemented debounced search to prevent excessive re-renders during typing
- **Persistent Filters**: Added localStorage persistence for filter settings
- **Keyboard Navigation**: Enhanced accessibility with keyboard navigation in the filter sheet
- **SEO Improvements**: Added comprehensive metadata to the index.html for better search engine visibility
- **PWA Support**: Added web manifest for Progressive Web App capabilities
- **Unit Tests**: Added Jest unit tests for components
- **Accessibility**: Enhanced ARIA attributes throughout the application

## 🛣️ Potential Future Enhancements

- **Full Supabase Integration:** Migrate from `localStorage` to Supabase for user authentication, database storage, and file storage.
- **Stripe Integration:** Implement payment processing for premium features or agency subscriptions.
- **Real-time Chat:** Allow maids and sponsors to communicate directly within the platform.
- **Advanced Search Algorithms:** Improve matching based on more nuanced criteria.
- **Admin Dashboard:** For platform management, user moderation, and analytics.
- **Background Checks/Verification:** Integrate services for verifying maid credentials.
- **Multilingual Support:** Offer the platform in multiple languages (including Amharic).
- **Agency Accounts:** Allow recruitment agencies to manage multiple maid profiles.
- **Web Workers:** Implement web workers for heavy computations to keep the UI responsive.
- **Server-Side Rendering:** Add SSR for improved SEO and initial load performance.
- **Offline Mode:** Enhance PWA capabilities with robust offline functionality.
- **End-to-End Testing:** Add Cypress tests for critical user flows.
- **Internationalization:** Add i18n support for multiple languages.

---

## Contributing

See `CONTRIBUTING.md` for PR conventions, labels, and the prerelease flow.

Thank you for checking out Ethio-Maids!
