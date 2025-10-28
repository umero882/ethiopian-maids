# Active Context: Ethio-Maids Connection Platform

## Current Work Focus

The Ethio-Maids platform is currently in the development phase with the following active focus areas:

1. **Core User Experience Implementation**: Building out the main user flows for maids and sponsors
2. **Profile Management**: Implementing profile creation, completion, and display functionality
3. **Role-Based Dashboard Development**: Creating specialized dashboards for different user roles
4. **Search and Filtering**: Developing robust search and filtering capabilities for maids and jobs
5. **Initial Data Management**: Using mock data with localStorage for rapid development

## Recent Changes

Based on the project structure and file organization, recent development appears to have included:

1. **Component Structure**: Establishment of a feature-based component organization
2. **UI Framework Implementation**: Integration of shadcn/ui components with Radix UI primitives
3. **Responsive Design**: Implementation of responsive layouts using TailwindCSS
4. **User Flow**: Development of the profile completion gateway system
5. **Mock Data Creation**: Addition of mock data for maids, jobs, and user profiles

## Next Steps

The immediate next steps for the project appear to be:

1. **Supabase Integration**: Begin migration from localStorage to Supabase for data persistence
2. **Authentication Implementation**: Complete the authentication flow using Supabase Auth
3. **Dashboard Functionality**: Enhance dashboard features for different user roles
4. **Search Optimization**: Refine search and filtering capabilities
5. **Testing Coverage**: Expand test coverage for components and features
6. **Stripe Integration**: Implement payment processing for premium features

## Active Decisions and Considerations

Current decision points and technical considerations include:

1. **Data Persistence Strategy**:
   - When and how to transition from localStorage to Supabase
   - Data migration approach for existing users (if any)

2. **Authentication Implementation**:
   - Role-based access control implementation
   - Profile completion enforcement strategy

3. **Component Architecture**:
   - Balance between reusable components and feature-specific components
   - State management approach for complex features

4. **Performance Optimization**:
   - Strategies for optimizing large lists (maids, jobs)
   - Image handling and optimization

5. **User Experience Flow**:
   - Profile completion gateway effectiveness
   - Dashboard organization for different user roles

6. **Text Tag Standards**:
   - Comprehensive text tag rules documented in `.clinerules-text-tags.md`
   - JSX single quotes for attributes (matching Prettier configuration)
   - Semantic HTML with proper heading hierarchy
   - ARIA attributes for improved accessibility
   - Consistent background image overlays for text readability
   - Text shadow and drop shadow utilities for improved contrast
   - Tailwind's typography classes with responsive sizing
   - Project color theme variables instead of hardcoded colors
   - Animation patterns using framer-motion for text elements
   - Preparation for future internationalization
   - Badge styling consistency for status indicators

## Important Patterns and Preferences

Based on the codebase, the following patterns and preferences have been established:

1. **Component Organization**:
   - Feature-based organization (home, maids, jobs, profile, etc.)
   - Shared UI components in the ui directory
   - Page-level components in the pages directory

2. **Styling Approach**:
   - TailwindCSS utility classes for styling
   - shadcn/ui components for consistent design
   - Responsive design using Tailwind breakpoints

3. **State Management**:
   - React Context API for global state
   - Component state with React hooks
   - Props drilling for component communication

4. **Code Conventions**:
   - Functional components with hooks
   - JSX files for React components
   - Named exports for components
   - Props destructuring at component level

5. **Testing Strategy**:
   - Jest and React Testing Library
   - Tests located in **tests** directories or alongside components

## Learnings and Project Insights

Key learnings and insights from the project development so far:

1. **User Role Complexity**:
   - Managing different user roles (maids, sponsors, agencies) requires careful consideration of UI and data access
   - Profile completion requirements vary by role

2. **Data Modeling**:
   - Mock data structure provides insights into the eventual database schema needs
   - Clear separation between different data entities (maids, jobs, sponsors, agencies)

3. **Component Reusability**:
   - Balance between specific and generic components affects development speed and maintenance
   - shadcn/ui provides a solid foundation but requires customization for specific needs

4. **Authentication Flow**:
   - Profile completion gateway creates a structured onboarding experience
   - Role-based redirection enhances user experience

5. **Search and Filtering**:
   - Complex filtering requirements need careful state management
   - Empty state handling is important for user experience
