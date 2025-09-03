// Mock the Prisma client globally to prevent type errors in the Jest environment
jest.mock('@generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}));
