/** @type {import('jest').Config} */
const shared = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: __dirname,
};

module.exports = {
  projects: [
    // Pure logic tests: service, schemas, error handling. No I/O.
    { ...shared, displayName: 'unit', testMatch: ['<rootDir>/tests/unit/**/*.test.ts'] },
    // HTTP tests through the real Express app with an in-memory repository.
    {
      ...shared,
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
    },
    // Repository tests against a real PostgreSQL database (DATABASE_URL). Run in CI.
    { ...shared, displayName: 'db', testMatch: ['<rootDir>/tests/db/**/*.test.ts'] },
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    // Process bootstrap and the Prisma adapter are covered by the db project instead.
    '!src/server.ts',
    '!src/tasks/prismaTask.repository.ts',
  ],
  coverageThreshold: {
    global: { branches: 90, functions: 90, lines: 90, statements: 90 },
  },
};
