/**
 * Tests for /api/goals/[id]/increment route handler
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
    goal: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: { findUnique: jest.fn(), create: jest.fn() },
  },
}));

jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string;
    _body: string;
    _headers: Record<string, string>;
    method: string;

    constructor(url: string, init?: RequestInit & { headers?: Record<string, string> }) {
      this.url = url;
      this.method = init?.method || 'POST';
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

import { POST } from '@/app/api/goals/[id]/increment/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const mockGoal = prisma.goal as jest.Mocked<typeof prisma.goal>;

const makeRequest = (body: object, userId = 'default-user') =>
  new NextRequest('http://localhost/api/goals/goal-id/increment', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
  });

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

const baseGoal = {
  id: 'goal-1',
  name: 'Read Books',
  icon: '📚',
  current: 5,
  target: 24,
  category: null,
  userId: 'default-user',
};

describe('POST /api/goals/[id]/increment', () => {
  test('increments goal by positive delta', async () => {
    mockGoal.findUnique.mockResolvedValue(baseGoal as any);
    mockGoal.update.mockResolvedValue({ ...baseGoal, current: 6 } as any);

    const res = await POST(makeRequest({ delta: 1 }), makeParams('goal-1'));
    const data = await res.json();

    expect(data.current).toBe(6);
    expect(mockGoal.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { current: 6 } })
    );
  });

  test('decrements goal by negative delta', async () => {
    mockGoal.findUnique.mockResolvedValue({ ...baseGoal, current: 10 } as any);
    mockGoal.update.mockResolvedValue({ ...baseGoal, current: 8 } as any);

    await POST(makeRequest({ delta: -2 }), makeParams('goal-1'));

    expect(mockGoal.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { current: 8 } })
    );
  });

  test('clamps to 0 on underflow (delta would go below 0)', async () => {
    mockGoal.findUnique.mockResolvedValue({ ...baseGoal, current: 2 } as any);
    mockGoal.update.mockResolvedValue({ ...baseGoal, current: 0 } as any);

    await POST(makeRequest({ delta: -10 }), makeParams('goal-1'));

    expect(mockGoal.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { current: 0 } })
    );
  });

  test('clamps to target on overflow (delta would exceed target)', async () => {
    mockGoal.findUnique.mockResolvedValue({ ...baseGoal, current: 22 } as any);
    mockGoal.update.mockResolvedValue({ ...baseGoal, current: 24 } as any);

    await POST(makeRequest({ delta: 100 }), makeParams('goal-1'));

    expect(mockGoal.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { current: 24 } })
    );
  });

  test('handles delta of 0 (no change)', async () => {
    mockGoal.findUnique.mockResolvedValue(baseGoal as any);
    mockGoal.update.mockResolvedValue(baseGoal as any);

    await POST(makeRequest({ delta: 0 }), makeParams('goal-1'));

    expect(mockGoal.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { current: 5 } })
    );
  });

  test('returns 400 when delta is missing', async () => {
    const res = await POST(makeRequest({}), makeParams('goal-1'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/delta/i);
  });

  test('returns 400 when delta is not a number', async () => {
    const res = await POST(makeRequest({ delta: 'five' }), makeParams('goal-1'));
    expect(res.status).toBe(400);
  });

  test('returns 400 when delta is null', async () => {
    const res = await POST(makeRequest({ delta: null }), makeParams('goal-1'));
    expect(res.status).toBe(400);
  });

  test('returns 404 when goal not found', async () => {
    mockGoal.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({ delta: 1 }), makeParams('nonexistent'));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('returns 403 when goal belongs to another user', async () => {
    mockGoal.findUnique.mockResolvedValue({ ...baseGoal, userId: 'other-user' } as any);

    const res = await POST(makeRequest({ delta: 1 }, 'different-user'), makeParams('goal-1'));
    expect(res.status).toBe(403);
  });

  test('returns correct goal shape', async () => {
    mockGoal.findUnique.mockResolvedValue(baseGoal as any);
    mockGoal.update.mockResolvedValue({ ...baseGoal, current: 6 } as any);

    const res = await POST(makeRequest({ delta: 1 }), makeParams('goal-1'));
    const data = await res.json();

    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('icon');
    expect(data).toHaveProperty('current');
    expect(data).toHaveProperty('target');
    expect(data).toHaveProperty('category');
  });

  test('returns 500 on database error', async () => {
    mockGoal.findUnique.mockRejectedValue(new Error('DB error'));

    const res = await POST(makeRequest({ delta: 1 }), makeParams('goal-1'));
    expect(res.status).toBe(500);
  });

  test('goal at exactly target stays at target when incremented', async () => {
    mockGoal.findUnique.mockResolvedValue({ ...baseGoal, current: 24 } as any);
    mockGoal.update.mockResolvedValue({ ...baseGoal, current: 24 } as any);

    await POST(makeRequest({ delta: 1 }), makeParams('goal-1'));

    expect(mockGoal.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { current: 24 } })
    );
  });

  test('large delta correctly clamped to target', async () => {
    mockGoal.findUnique.mockResolvedValue({ ...baseGoal, current: 5 } as any);
    mockGoal.update.mockResolvedValue({ ...baseGoal, current: 24 } as any);

    await POST(makeRequest({ delta: 9999 }), makeParams('goal-1'));

    expect(mockGoal.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { current: 24 } })
    );
  });
});
