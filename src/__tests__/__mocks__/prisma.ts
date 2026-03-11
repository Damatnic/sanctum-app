// Shared Prisma mock for all tests
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  habit: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  habitCompletion: {
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  goal: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  deadline: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  project: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  journalEntry: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  focusSession: {
    findMany: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
  },
  moodLog: {
    findMany: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
    findFirst: jest.fn(),
  },
};
