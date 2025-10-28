# Technical Context: Ethio-Maids Connection Platform

## Technology Stack

### Frontend

- **Framework**: React 18.2.0
- **Build Tool**: Vite 4.4.5
- **Language**: JavaScript (JSX for React components)
- **Routing**: React Router 6.16.0
- **Styling**: TailwindCSS 3.3.3 with utility-first approach
- **UI Component Library**: shadcn/ui components built with Radix UI primitives
- **Animation**: Framer Motion 10.16.4
- **Icons**: Lucide React 0.285.0
- **Date Handling**: date-fns 2.30.0, react-day-picker 8.9.1
- **Data Visualization**: Recharts 2.12.7

### State Management

- **Global State**: React Context API
- **Local State**: React Hooks (useState, useEffect)

### Current Data Persistence

- **Local Storage**: For rapid prototyping and development

### Planned Backend Integration

- **Backend Service**: Supabase (planned, version 2.30.0 installed)
- **Authentication**: Supabase Auth
- **Database**: Supabase Postgres
- **Payment Processing**: Stripe (planned, @stripe/stripe-js 3.5.0 installed)

### Development Tools

- **Package Manager**: npm
- **Linting**: ESLint 8.57.1 with react-app, prettier, and jsx-a11y plugins
- **Formatting**: Prettier 3.2.5
- **Testing**: Jest 29.7.0, React Testing Library 15.0.7
- **Type Checking**: None currently (TypeScript dependencies present but not implemented)
- **Code Transformation**: Babel 7.24.6 with React and env presets

## Environment Requirements

- **Node.js**: Version 20.x.x or higher (specified in .nvmrc)
- **npm**: Node Package Manager (comes bundled with Node.js)
- **Browser**: Modern web browser with JavaScript enabled

## Development Workflow

### Scripts

- `npm run dev`: Start the development server with Vite
- `npm run build`: Build the production-ready application
- `npm run preview`: Preview the production build locally
- `npm run lint`: Run ESLint to check for code issues
- `npm run format`: Format code with Prettier
- `npm run test`: Run Jest tests

### Development Server

- Default development server runs on http://localhost:5173
- Hot module replacement for immediate feedback during development

## Technical Constraints

### Browser Compatibility

- Modern browsers supported (Chrome, Firefox, Safari, Edge)
- No explicit support for legacy browsers

### Performance Considerations

- Bundle size optimization through Vite
- Component-level code splitting

### Data Limitations

- Currently using mock data for development
- Local storage limited by browser constraints (typically 5-10MB)
- Future migration to Supabase will address these limitations

## Dependencies

### Core Dependencies

```
react: ^18.2.0
react-dom: ^18.2.0
react-router-dom: ^6.16.0
framer-motion: ^10.16.4
lucide-react: ^0.285.0
clsx: ^2.0.0
tailwind-merge: ^1.14.0
```

### UI Component Dependencies

```
@radix-ui/* (various UI primitives)
class-variance-authority: ^0.7.0
tailwindcss-animate: ^1.0.7
cmdk: ^0.2.0
date-fns: ^2.30.0
react-day-picker: ^8.9.1
```

### Future/Planned Dependencies

```
@supabase/supabase-js: 2.30.0
@stripe/stripe-js: ^3.5.0
recharts: ^2.12.7
```

### Developer Dependencies

```
vite: ^4.4.5
@vitejs/plugin-react: ^4.0.3
eslint: ^8.57.1
prettier: ^3.2.5
jest: ^29.7.0
@testing-library/react: ^15.0.7
tailwindcss: ^3.3.3
autoprefixer: ^10.4.16
postcss: ^8.4.31
```

## Tool Usage Patterns

### Component Creation

- Functional components with hooks
- Props destructuring at component top level
- Custom hooks for reusable logic
- shadcn/ui components extended as needed

### Styling

- TailwindCSS utility classes directly in JSX
- cn/clsx for conditional class application
- Global styles in index.css
- Component-specific styles inline with components

### Testing

- Jest for running tests
- React Testing Library for component testing
- Tests located alongside components or in **tests** directories

### Data Handling

- Mock data in src/data/ directory
- Data transformation in component or custom hooks
- Future: Supabase queries for data fetching and persistence

### Routing

- React Router for client-side routing
- Route definitions in App.jsx
- Path parameters for dynamic routes

### Build Process

- Vite for development and production builds
- PostCSS for processing TailwindCSS
- Babel for JavaScript transpilation
- ESLint and Prettier for code quality

## File Structure Conventions

- **Components**: Organized by feature domain (home, jobs, maids, profile, etc.)
- **Pages**: Top-level components for each route
- **Contexts**: Global state management with React Context API
- **Lib**: Utility functions and helpers
- **Data**: Mock data for development
- **UI Components**: Generic UI components in components/ui directory
