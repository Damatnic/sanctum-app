/**
 * Tests for /api/habits/[id]/toggle route handler
 */

jest.mock('@/lib/api-errors', () => ({
  isPrismaNotFound: jest.fn().mockReturnValue(false),
  isPrismaUniqueViolation: jest.fn().mockReturnValue(false),
  notFound: jest.fn().mockReturnValue({ status: 404, async json() { return { error: 'Not found' }; }, headers: { set: jest.fn() } }),
  forbidden: jest.fn().mockReturnValue({ status: 403, async json() { return { error: 'Forbidden' }; }, headers: { set: jest.fn() } }),
  badRequest: jest.fn((msg: string) => ({ status: 400, async json() { return { error: msg }; }, headers: { set: jest.fn() } })),
  handlePrismaError: jest.fn().mockReturnValue(null),
  isValidDate: jest.fn().mockReturnValue(true),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    habit: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    habitCompletion: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    user: { findUnique: jest.fn(), create: jest.fn() },
  },
}));

jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    _headers: Record<string, string>;

    constructor(url: string, init?: RequestInit & { headers?: Record<string, string> }) {
      this.url = url;
      this.method = init?.method || 'POST';
      this._headers = (init?.headers as Record<string, string>) || {};
    }

    headers = { get: (key: string) => (this as any)._headers[key] ?? null };

    async json() { return {}; }
  },
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      headers: { set: jest.fn(), get: jest.fn() },
      async json() { return data; },
    }),
  },
}));

import { POST } from '@/app/api/habits/[id]/toggle/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const mockHabit = prisma.habit as jest.Mocked<typeof prisma.habit>;
const mockCompletion = prisma.habitCompletion as jest.Mocked<typeof prisma.habitCompletion>;

const makeRequest = (userId = 'default-user') =>
  new NextRequest('http://localhost/api/habits/habit-id/toggle', {
    method: 'POST',
    headers: { 'x-user-id': userId },
  });

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

const baseHabit = {
  id: 'habit-1',
  name: 'Exercise',
  icon: '💪',
  streak: 5,
  longestStreak: 7,
  userId: 'default-user',
};

describe('POST /api/habits/[id]/toggle', () => {
  test('adds completion when not completed today', async () => {
    mockHabit.findUnique.mockResolvedValue(baseHabit as any);
    // findUnique for habitCompletion returns null (not completed today)
    mockCompletion.findUnique.mockResolvedValue(null);
    mockCompletion.create.mockResolvedValue({ id: 'comp-new' } as any);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    mockCompletion.findMany.mockResolvedValue([
      { id: 'c1', date: today },
      { id: 'c2', date: new Date(today.getTime() - 86400000) },
    ] as any);

    mockHabit.update.mockResolvedValue({ ...baseHabit, streak: 2, longestStreak: 7 } as any);

    const res = await POST(makeRequest(), makeParams('habit-1'));
    const data = await res.json();

    expect(mockCompletion.create).toHaveBeenCalled();
    expect(data.todayCompleted).toBe(true);
  });

  test('removes completion when already completed today', async () => {
    mockHabit.findUnique.mockResolvedValue(baseHabit as any);
    const existing = { id: 'comp-existing', habitId: 'habit-1' };
    mockCompletion.findUnique.mockResolvedValue(existing as any);
    mockCompletion.delete.mockResolvedValue(existing as any);
    mockCompletion.findMany.mockResolvedValue([]);
    mockHabit.update.mockResolvedValue({ ...baseHabit, streak: 0, longestStreak: 7 } as any);

    const res = await POST(makeRequest(), makeParams('habit-1'));
    const data = await res.json();

    expect(mockCompletion.delete).toHaveBeenCalledWith({ where: { id: 'comp-existing' } });
    expect(data.todayCompleted).toBe(false);
  });

  test('returns correct response shape', async () => {
    mockHabit.findUnique.mockResolvedValue(baseHabit as any);
    mockCompletion.findUnique.mockResolvedValue(null);
    mockCompletion.create.mockResolvedValue({ id: 'c-new' } as any);
    mockCompletion.findMany.mockResolvedValue([]);
    mockHabit.update.mockResolvedValue(baseHabit as any);

    const res = await POST(makeRequest(), makeParams('habit-1'));
    const data = await res.json();

    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('icon');
    expect(data).toHaveProperty('streak');
    expect(data).toHaveProperty('longestStreak');
    expect(data).toHaveProperty('todayCompleted');
    expect(data).toHaveProperty('completions');
    expect(Array.isArray(data.completions)).toBe(true);
  });

  test('updates longestStreak via Math.max in single update', async () => {
    mockHabit.findUnique.mockResolvedValue({ ...baseHabit, streak: 5, longestStreak: 7 } as any);
    mockCompletion.findUnique.mockResolvedValue(null);
    mockCompletion.create.mockResolvedValue({ id: 'c-new' } as any);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completions = Array.from({ length: 10 }, (_, i) => ({
      id: `c${i}`,
      date: new Date(today.getTime() - i * 86400000),
    }));

    mockCompletion.findMany.mockResolvedValue(completions as any);
    mockHabit.update.mockResolvedValue({ ...baseHabit, streak: 10, longestStreak: 10 } as any);

    const res = await POST(makeRequest(), makeParams('habit-1'));
    const data = await res.json();

    // Single update with Math.max(streak, longestStreak)
    expect(mockHabit.update).toHaveBeenCalledTimes(1);
    expect(mockHabit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { streak: expect.any(Number), longestStreak: expect.any(Number) },
      })
    );
    expect(data.longestStreak).toBe(10);
  });

  test('longestStreak stays high when new streak is lower', async () => {
    mockHabit.findUnique.mockResolvedValue({ ...baseHabit, streak: 7, longestStreak: 30 } as any);
    mockCompletion.findUnique.mockResolvedValue(null);
    mockCompletion.create.mockResolvedValue({ id: 'c-new' } as any);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Only 3 completions
    const completions = Array.from({ length: 3 }, (_, i) => ({
      id: `c${i}`,
      date: new Date(today.getTime() - i * 86400000),
    }));
    mockCompletion.findMany.mockResolvedValue(completions as any);
    mockHabit.update.mockResolvedValue({ ...baseHabit, streak: 3, longestStreak: 30 } as any);

    await POST(makeRequest(), makeParams('habit-1'));

    // longestStreak should be max(3, 30) = 30 (preserved)
    expect(mockHabit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { streak: 3, longestStreak: 30 },
      })
    );
  });

  test('returns 404 when habit not found', async () => {
    mockHabit.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams('nonexistent'));
    expect(res.status).toBe(404);
  });

  test('returns 403 when habit belongs to another user', async () => {
    mockHabit.findUnique.mockResolvedValue({ ...baseHabit, userId: 'other-user' } as any);

    const res = await POST(makeRequest('different-user'), makeParams('habit-1'));
    expect(res.status).toBe(403);
  });

  test('returns 500 on database error', async () => {
    mockHabit.findUnique.mockRejectedValue(new Error('DB error'));

    const res = await POST(makeRequest(), makeParams('habit-1'));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('completions in response are formatted as YYYY-MM-DD strings', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    mockHabit.findUnique.mockResolvedValue(baseHabit as any);
    mockCompletion.findUnique.mockResolvedValue(null);
    mockCompletion.create.mockResolvedValue({ id: 'c-new' } as any);
    mockCompletion.findMany.mockResolvedValue([{ id: 'c1', date: today }] as any);
    mockHabit.update.mockResolvedValue(baseHabit as any);

    const res = await POST(makeRequest(), makeParams('habit-1'));
    const data = await res.json();

    expect(data.completions[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
