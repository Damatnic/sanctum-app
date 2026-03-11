/**
 * Tests for /api/focus route handlers
 */

import { mockPrisma } from '../__mocks__/prisma';

jest.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
jest.mock('@/lib/user', () => ({
  getOrCreateUser: jest.fn().mockResolvedValue({ id: 'default-user' }),
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
      async json() { return data; },
    }),
  },
}));

import { GET, POST } from '@/app/api/focus/route';
import { NextRequest } from 'next/server';

const makeRequest = (method: string, body?: object) =>
  new NextRequest('http://localhost/api/focus', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'x-user-id': 'default-user' },
  });

describe('GET /api/focus', () => {
  test('returns aggregated focus stats', async () => {
    mockPrisma.focusSession.aggregate
      .mockResolvedValueOnce({ _sum: { minutes: 180 }, _count: { id: 8 } })  // total
      .mockResolvedValueOnce({ _sum: { minutes: 25 }, _count: { id: 1 } });  // today
    mockPrisma.focusSession.findMany.mockResolvedValue([]);

    const res = await GET(makeRequest('GET'));
    const data = await res.json();

    expect(data.totalMinutes).toBe(180);
    expect(data.totalSessions).toBe(8);
    expect(data.todayMinutes).toBe(25);
  });

  test('returns 0s when no sessions exist', async () => {
    mockPrisma.focusSession.aggregate
      .mockResolvedValueOnce({ _sum: { minutes: null }, _count: { id: 0 } })
      .mockResolvedValueOnce({ _sum: { minutes: null }, _count: { id: 0 } });
    mockPrisma.focusSession.findMany.mockResolvedValue([]);

    const res = await GET(makeRequest('GET'));
    const data = await res.json();

    expect(data.totalMinutes).toBe(0);
    expect(data.totalSessions).toBe(0);
    expect(data.todayMinutes).toBe(0);
  });

  test('returns recent sessions list', async () => {
    const sessions = [
      { id: 's1', minutes: 25, completed: true, createdAt: new Date('2026-03-10T10:00:00.000Z') },
      { id: 's2', minutes: 45, completed: true, createdAt: new Date('2026-03-09T14:00:00.000Z') },
    ];

    mockPrisma.focusSession.aggregate
      .mockResolvedValue({ _sum: { minutes: 70 }, _count: { id: 2 } });
    mockPrisma.focusSession.findMany.mockResolvedValue(sessions);

    const res = await GET(makeRequest('GET'));
    const data = await res.json();

    expect(data.recentSessions).toHaveLength(2);
    expect(data.recentSessions[0]).toMatchObject({ id: 's1', minutes: 25, completed: true });
  });

  test('returns 500 on database error', async () => {
    mockPrisma.focusSession.aggregate.mockRejectedValue(new Error('DB error'));

    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/focus', () => {
  test('logs a focus session', async () => {
    mockPrisma.focusSession.create.mockResolvedValue({
      id: 'f-new',
      minutes: 25,
      completed: true,
      createdAt: new Date('2026-03-11T10:00:00.000Z'),
    });

    const res = await POST(makeRequest('POST', { minutes: 25, completed: true }));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toMatchObject({ id: 'f-new', minutes: 25, completed: true });
  });

  test('returns 400 when minutes is missing', async () => {
    const res = await POST(makeRequest('POST', { completed: true }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/minutes/i);
  });

  test('returns 400 when minutes is 0', async () => {
    const res = await POST(makeRequest('POST', { minutes: 0 }));
    expect(res.status).toBe(400);
  });

  test('returns 400 when minutes is negative', async () => {
    const res = await POST(makeRequest('POST', { minutes: -5 }));
    expect(res.status).toBe(400);
  });

  test('returns 400 when minutes is a float', async () => {
    const res = await POST(makeRequest('POST', { minutes: 2.5 }));
    expect(res.status).toBe(400);
  });

  test('returns 400 when minutes exceeds 1440 (24h)', async () => {
    const res = await POST(makeRequest('POST', { minutes: 1441 }));
    expect(res.status).toBe(400);
  });

  test('accepts exactly 1440 minutes (24h)', async () => {
    mockPrisma.focusSession.create.mockResolvedValue({
      id: 'f-max', minutes: 1440, completed: true, createdAt: new Date(),
    });

    const res = await POST(makeRequest('POST', { minutes: 1440 }));
    expect(res.status).toBe(201);
  });

  test('defaults completed to true when not specified', async () => {
    mockPrisma.focusSession.create.mockResolvedValue({
      id: 'f1', minutes: 25, completed: true, createdAt: new Date(),
    });

    await POST(makeRequest('POST', { minutes: 25 }));

    expect(mockPrisma.focusSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ completed: true }),
      })
    );
  });

  test('allows logging incomplete sessions', async () => {
    mockPrisma.focusSession.create.mockResolvedValue({
      id: 'f-incomplete', minutes: 10, completed: false, createdAt: new Date(),
    });

    await POST(makeRequest('POST', { minutes: 10, completed: false }));

    expect(mockPrisma.focusSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ completed: false }),
      })
    );
  });

  test('returns 500 on database error', async () => {
    mockPrisma.focusSession.create.mockRejectedValue(new Error('DB error'));

    const res = await POST(makeRequest('POST', { minutes: 25 }));
    expect(res.status).toBe(500);
  });
});
