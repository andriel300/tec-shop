/// <reference types="jest" />
// Mock the Prisma client globally to prevent type errors in the Jest environment
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}));
