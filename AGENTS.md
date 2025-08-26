# Agent Guidelines for 998-jc3dn

## Build/Lint/Test Commands
- **Build**: `npm run build`
- **Dev server**: `npm run dev`
- **Lint**: `npm run lint`
- **Format**: `npm run format`
- **Type check**: `npm run check` (runs TypeScript + ESLint)
- **Clean**: `npm run clean`
- **Start production**: `npm run start`

## Code Style Guidelines

### Imports
- Use absolute imports with `@/` alias for `src/` directory
- Group imports: React/React-related, third-party libraries, internal modules
- No relative imports beyond current directory

### Formatting
- Prettier config: semicolons, double quotes, 2 spaces, 80 char width
- No tabs, trailing commas in ES5 style, avoid arrow parens when possible

### Types & Naming
- Strict TypeScript with full type checking enabled
- camelCase for variables/functions, PascalCase for components/types
- Use descriptive names, prefix unused params with `_`
- Define interfaces for API responses and component props

### Error Handling
- Use try-catch in async functions with proper error responses
- Return NextResponse.json with appropriate status codes
- Log errors for debugging but don't expose sensitive info

### React Patterns
- Functional components with hooks (no classes)
- Use React Query for server state, Zustand for client state
- Proper TypeScript typing for all props and state
- Follow existing component patterns with class-variance-authority

### API Patterns
- Next.js API routes with OpenAPI documentation in JSDoc comments
- Use proper HTTP status codes and response formatting
- Validate requests with proper error handling

### Security
- Never log or expose sensitive information
- Use proper authentication patterns with better-auth
- Validate all user inputs and API requests