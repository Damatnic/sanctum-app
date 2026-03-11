/**
 * Tests for /api/habits route handlers
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
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
    user: { findUnique: jest.fn(), create: jest.fn() },
  },
}));

jest.mock('@/lib/user', () => ({
  getOrCreateUser: jest.fn().mockResolvedValue({ id: 'default-user', name: 'Test User' }),
  DEFAULT_USER_ID: 'default-user',
}));

jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    _body: string;
    _headers: Record<string, string>;

    constructor(url: string, init?: RequestInit & { headers?: Record<string, string> }) {
      this.url = url;
      this.method = init?.method || 'GET';
      this._body = (init?.body as string) || '';
      this._headers = (init?.headers as Record<string, string>) || {};
    }

    headers = { get: (key: string) => (this as any)._headers[key] ?? null };

    async json() { return JSON.parse(this._body || '{}'); }
  },
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      headers: { set: jest.fn(), get: jest.fn() },
      async json() { return data; },
    }),
  },
}));

import { GET, POST } from '@/app/api/habits/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const mockHabit = prisma.habit as jest.Mocked<typeof prisma.habit>;

const makeRequest = (
  method: string,
  body?: object,
  headers: Record<string, string> = {}
) => new NextRequest('http://localhost/api/habits', {
  method,
  body: body ? JSON.stringify(body) : undefined,
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'default-user',
    ...headers,
  },
});

describe('GET /api/habits', () => {
  test('returns empty list when no habits exist', async () => {
    mockHabit.findMany.mockResolvedValue([]);

    const req = makeRequest('GET');
    const res = await GET(req);
    const data = await res.json();

    expect(data).toEqual([]);
    expect(mockHabit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'default-user', archived: false },
      })
    );
  });

  test('transforms habits with todayCompleted field', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    mockHabit.findMany.mockResolvedValue([
      {
        id: 'habit-1', name: 'Morning Run', icon: '🏃', streak: 3, longestStreak: 5,
        completions: [{ id: 'comp-1', date: today }],
      } as any,
    ]);

    const res = await GET(makeRequest('GET'));
    const data = await res.json();

    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      id: 'habit-1', name: 'Morning Run', icon: '🏃', streak: 3, longestStreak: 5,
      todayCompleted: true,
    });
    expect(data[0].completions).toBeInstanceOf(Array);
  });

  test('marks todayCompleted as false when no completion today', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    mockHabit.findMany.mockResolvedValue([
      {
        id: 'habit-2', name: 'Read', icon: '📚', streak: 0, longestStreak: 2,
        completions: [{ id: 'comp-1', date: yesterday }],
      } as any,
    ]);

    const res = await GET(makeRequest('GET'));
    const data = await res.json();

    expect(data[0].todayCompleted).toBe(false);
  });

  test('returns 500 on database error', async () => {
    mockHabit.findMany.mockRejectedValue(new Error('DB connection failed'));

    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('handles multiple habits correctly', async () => {
    mockHabit.findMany.mockResolvedValue([
      { id: 'h1', name: 'Run', icon: '🏃', streak: 1, longestStreak: 5, completions: [] } as any,
      { id: 'h2', name: 'Read', icon: '📚', streak: 7, longestStreak: 10, completions: [] } as any,
      { id: 'h3', name: 'Meditate', icon: '🧘', streak: 0, longestStreak: 0, completions: [] } as any,
    ]);

    const res = await GET(makeRequest('GET'));
    const data = await res.json();

    expect(data).toHaveLength(3);
    expect(data.every((h: any) => h.todayCompleted === false)).toBe(true);
  });
});

describe('POST /api/habits', () => {
  test('creates a habit with name and icon', async () => {
    mockHabit.create.mockResolvedValue({
      id: 'new-habit-1', name: 'Exercise', icon: '💪', streak: 0, longestStreak: 0,
    } as any);

    const req = makeRequest('POST', { name: 'Exercise', icon: '💪' });
    const res = await POST(req);
    const data = await res.json();

    expect(data).toMatchObject({
      id: 'new-habit-1', name: 'Exercise', icon: '💪', streak: 0, longestStreak: 0,
      todayCompleted: false, completions: [],
    });
    expect(mockHabit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Exercise', icon: '💪' }),
      })
    );
  });

  test('uses default icon when none provided', async () => {
    mockHabit.create.mockResolvedValue({
      id: 'new-habit-2', name: 'Hydration', icon: '✓', streak: 0, longestStreak: 0,
    } as any);

    const req = makeRequest('POST', { name: 'Hydration' });
    const res = await POST(req);
    const data = await res.json();

    expect(data.icon).toBe('✓');
    expect(mockHabit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ icon: '✓' }),
      })
    );
  });

  test('returns 400 when name is missing', async () => {
    const req = makeRequest('POST', { icon: '🏃' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/name/i);
  });

  test('returns 400 for empty name string', async () => {
    const req = makeRequest('POST', { name: '', icon: '🏃' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('returns 500 on database error', async () => {
    mockHabit.create.mockRejectedValue(new Error('DB error'));

    const req = makeRequest('POST', { name: 'Test Habit' });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('uses custom user id from header', async () => {
    mockHabit.create.mockResolvedValue({
      id: 'h-user', name: 'Run', icon: '🏃', streak: 0, longestStreak: 0,
    } as any);

    const req = makeRequest('POST', { name: 'Run' }, { 'x-user-id': 'custom-user-123' });
    await POST(req);

    expect(mockHabit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'custom-user-123' }),
      })
    );
  });
});
