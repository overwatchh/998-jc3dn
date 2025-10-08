## Testing Setup

- Framework: Jest 30 + Testing Library
- Environment: jsdom
- Config files: `jest.config.ts`, `tests/setup/jest.setup.ts`
- Test dirs: `tests/**/*` and co-located under `src/` are supported

## Commands

- Install: `npm install`
- Run tests: `npm run test`
- Watch mode: `npm run test:watch`
- Coverage report: `npm run test:coverage`
- CI mode: `npm run test:ci`

## What is covered initially

- Attendance calculators: `calculateLectureAttendance`, `calculateSessionAttendance`
- Geo utils: `haversineDistance` (server and client versions)

## Writing Tests

- Place unit tests in `tests/unit` or next to the file under `src/**` using `*.test.ts(x)`
- Use path alias `@/` for imports (`@/lib/...`)
- Prefer pure/unit logic first; mock network/DB with thin seams

## Notes

- Next.js app code that depends on server runtime should be isolated; test pure helpers and hooks first.
- For components, use `@testing-library/react` and extend `jest-dom` matchers.


