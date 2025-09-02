# Agent Guidelines for 998-jc3dn

## Build/Lint/Test Commands

- **Build**: `npm run build` (only when prompted)
- **Dev server**: `npm run dev` (only when prompted)
- **Lint**: `npm run lint`
- **Format**: `npm run format`
- **Type check**: `npm run check` (TypeScript + ESLint) - run as final validation step
- **Clean**: `npm run clean`
- **Start production**: `npm run start`
- **Auth migration**: `npm run auth:migrate`

## Testing

- No test framework configured yet
- Test APIs manually with Postman/curl
- Consider Jest + React Testing Library for future component testing
- Always manually test API routes before deploying

## Code Style Guidelines

### Imports & Formatting

- Use `@/` alias for `src/` directory (no relative imports beyond current directory)
- Group: React/React-related → third-party libraries → internal modules
- Prettier: semicolons, double quotes, 2 spaces, 80 char width, ES5 trailing commas
- Use .prettierrc.json as source of truth

### Types & Naming

- Strict TypeScript enabled with full type checking
- camelCase for variables/functions, PascalCase for components/types
- Descriptive names, prefix unused params with `_`
- Define interfaces for API responses and component props

### Error Handling & Security

- Use try-catch in async functions with NextResponse.json error responses
- Never log/expose sensitive information
- Validate all user inputs and API requests
- Use proper HTTP status codes

### React & API Patterns

- Functional components with hooks (no classes)
- React Query for server state, Zustand for client state
- Next.js API routes with OpenAPI docs in JSDoc comments
- Follow class-variance-authority component patterns

## Project Structure

- `src/app/` - Next.js app router (auth/protected/admin/lecturer/student route groups)
- `src/components/` - shadcn/ui components
- `src/lib/` - utilities, `src/hooks/` - custom hooks, `src/types/` - type definitions
- `src/app/api/` - API routes organized by feature with RESTful conventions
