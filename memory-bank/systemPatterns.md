# System Patterns: Ethio-Maids Connection Platform

## System Architecture

The Ethio-Maids platform uses a modern frontend-centric architecture with the following characteristics:

- **Client-Side Application**: Built as a single-page application (SPA) using React
- **Component-Based Structure**: Organized around reusable UI components
- **Data Persistence**:
  - Initial implementation using localStorage for rapid prototyping
  - Planned migration to Supabase for robust backend solution
- **Routing**: Client-side routing with React Router
- **Styling**: Utility-first approach with TailwindCSS
- **UI Component Library**: shadcn/ui components built with Radix UI primitives

## Component Organization

The application follows a hierarchical component structure:

1. **Pages**: Top-level components representing entire screens/routes
   - Home, Maids, Jobs, Profile, Dashboard, etc.

2. **Feature Components**: Domain-specific components organized by feature
   - `/components/home/` - Components specific to the home page
   - `/components/maids/` - Components for the maids listing and filtering
   - `/components/jobs/` - Components for job listings and filtering
   - `/components/profile/` - Profile-related components
   - `/components/dashboard/` - Dashboard-specific components

3. **Shared Components**: Reusable components across features
   - `/components/shared/` - Shared utility components
   - `/components/ui/` - UI primitives from shadcn/ui

4. **Layout Components**: Structure and organize the page
   - Navbar, Footer, ProfileCompletionGateway, DashboardLayout

## Data Flow Patterns

### State Management

- **Context API**: Used for global state (e.g., AuthContext)
- **Component State**: Local state managed with React hooks (useState, useEffect)
- **Props Drilling**: For passing data down the component tree
- **Custom Hooks**: For reusable stateful logic

### Data Fetching

- Initial implementation uses mock data from `/src/data/` directory
- Future implementation will use Supabase for data fetching and persistence

## Key Design Patterns

### Component Patterns

- **Composition**: Building complex components from simpler ones
- **Container/Presentational Split**: Separating data fetching from presentation
- **Render Props**: Used in some UI components for flexible rendering
- **Controlled Components**: Form elements controlled by React state

### Structural Patterns

- **Gateway Pattern**: ProfileCompletionGateway ensuring profile completion before access
- **Page-Component Pattern**: Separating pages from reusable components
- **Feature-Based Organization**: Grouping components by domain feature

### UI Patterns

- **Responsive Design**: Adapting layout for different screen sizes
- **Component Library**: Using shadcn/ui for consistent design language
- **Utility-First CSS**: Using TailwindCSS for styling
- **Compound Components**: Building complex UI from smaller, specialized parts

## File Organization

```
ethio-maids/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── home/           # Home page components
│   │   ├── jobs/           # Job listing components
│   │   ├── maids/          # Maid listing components
│   │   ├── profile/        # Profile components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── shared/         # Shared components
│   │   └── ui/             # shadcn/ui components
│   ├── contexts/           # React Context for global state
│   ├── data/               # Mock data for development
│   ├── lib/                # Utility functions and helpers
│   ├── pages/              # Page components
│   │   └── dashboards/     # Dashboard page variants
│   ├── App.jsx             # Main application component with routing
│   └── main.jsx            # Application entry point
```

## Critical Implementation Paths

### Authentication Flow

1. User registration/login through AuthContext
2. Role-based redirection (maid, sponsor, agency)
3. Profile completion verification via ProfileCompletionGateway
4. Redirection to appropriate dashboard based on user role

### Profile Management

1. User role determines which profile form is displayed
2. Profile data collected through multi-step forms
3. Data validation before submission
4. Profile data stored (localStorage initially, Supabase in future)

### Search and Filtering

1. Data loaded from source (mock data or backend)
2. Filter state managed in parent components
3. Filter criteria applied to data
4. Filtered results displayed with appropriate UI components
5. Empty state handling for no results

### Dashboard Experience

1. Role-based dashboard routing
2. Dashboard layout wrapper for consistent UI
3. Dashboard-specific components loaded based on user role
4. Data visualization and management

## Code Conventions

### Component Structure

- Functional components with hooks
- Named exports for components
- JSX files for React components (.jsx extension)
- Props destructuring at component top level

### Styling Approach

- TailwindCSS utility classes for styling
- clsx/tailwind-merge for conditional class application
- Consistent use of shadcn/ui component library
- Responsive design using Tailwind breakpoints

### State Management

- Context API for global state
- useState/useReducer for component state
- Props for passing data down the component tree
- Custom hooks for reusable stateful logic

## Text Tag Rules

The project follows specific conventions for text tags to ensure consistency, accessibility, and compatibility. Detailed rules are available in `.clinerules-text-tags.md`.

### Text Formatting

- JSX single quotes for attributes (aligned with Prettier config)
- 2-space indentation for nested content
- Proper handling of special characters in JSX
- Semantic HTML tags for appropriate text content

### Component and UI Patterns

- Use Radix UI primitives for interactive text elements
- Follow shadcn/ui patterns for consistent text styling
- Ensure proper text contrast with background
- Maintain proper heading hierarchy

### Styling Approach

- Utilize Tailwind's typography classes consistently
- Use the project's color theme variables (primary, secondary, etc.)
- Apply responsive text sizing using Tailwind breakpoints
- Avoid inline styles for text elements

### Internationalization and Accessibility

- Structure text content to support future i18n
- Avoid hardcoded text concatenation
- Use proper date and number formatting with date-fns
- Include appropriate ARIA attributes for text elements
- Provide accessible labels for form elements

### Documentation

- Document complex text manipulation with appropriate comments
- Follow JSDoc patterns for text processing functions
