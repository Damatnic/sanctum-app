/**
 * Tests for /api/goals route handlers
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    goal: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
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

import { GET, POST } from '@/app/api/goals/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get typed mock references
const mockGoal = prisma.goal as jest.Mocked<typeof prisma.goal>;

const makeRequest = (method: string, body?: object, headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost/api/goals', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'default-user', ...headers },
  });

describe('GET /api/goals', () => {
  test('returns empty list when no goals exist', async () => {
    mockGoal.findMany.mockResolvedValue([]);

    const res = await GET(makeRequest('GET'));
    const data = await res.json();

    expect(data).toEqual([]);
  });

  test('returns goals with correct shape', async () => {
    mockGoal.findMany.mockResolvedValue([
      { id: 'g1', name: 'Read 24 books', icon: '📚', current: 3, target: 24, category: 'education' } as any,
      { id: 'g2', name: 'Workout 100 times', icon: '🏋️', current: 0, target: 100, category: null } as any,
    ]);

    const res = await GET(makeRequest('GET'));
    const data = await res.json();

    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ id: 'g1', name: 'Read 24 books', current: 3, target: 24 });
    expect(data[1]).toMatchObject({ id: 'g2', name: 'Workout 100 times', current: 0 });
  });

  test('only fetches non-archived goals for the user', async () => {
    mockGoal.findMany.mockResolvedValue([]);

    await GET(makeRequest('GET'));

    expect(mockGoal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ archived: false }),
      })
    );
  });

  test('returns 500 on database error', async () => {
    mockGoal.findMany.mockRejectedValue(new Error('Connection lost'));

    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});

describe('POST /api/goals', () => {
  test('creates a goal with all fields', async () => {
    const createdGoal = {
      id: 'g-new', name: 'Run 500km', icon: '🏃', current: 0, target: 500, category: 'fitness',
    };
    mockGoal.create.mockResolvedValue(createdGoal as any);

    const res = await POST(makeRequest('POST', {
      name: 'Run 500km', icon: '🏃', target: 500, category: 'fitness',
    }));
    const data = await res.json();

    expect(data).toMatchObject(createdGoal);
  });

  test('uses default values for optional fields', async () => {
    mockGoal.create.mockResolvedValue({
      id: 'g-default', name: 'My Goal', icon: '🎯', current: 0, target: 100, category: null,
    } as any);

    await POST(makeRequest('POST', { name: 'My Goal' }));

    expect(mockGoal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ icon: '🎯', target: 100, current: 0 }),
      })
    );
  });

  test('returns 400 when name is missing', async () => {
    const res = await POST(makeRequest('POST', { target: 50 }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('returns 500 on database error', async () => {
    mockGoal.create.mockRejectedValue(new Error('DB error'));

    const res = await POST(makeRequest('POST', { name: 'Test Goal' }));
    expect(res.status).toBe(500);
  });

  test('allows creating goal with current > 0', async () => {
    mockGoal.create.mockResolvedValue({
      id: 'g-partial', name: 'Existing Progress', icon: '✅', current: 50, target: 100, category: null,
    } as any);

    await POST(makeRequest('POST', { name: 'Existing Progress', current: 50, target: 100 }));

    expect(mockGoal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ current: 50 }),
      })
    );
  });
});
