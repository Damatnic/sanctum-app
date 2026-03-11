/**
 * Tests for /api/journals route handlers
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

import { GET, POST } from '@/app/api/journals/route';
import { NextRequest } from 'next/server';

const makeRequest = (method: string, body?: object) =>
  new NextRequest('http://localhost/api/journals', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'x-user-id': 'default-user' },
  });

describe('GET /api/journals', () => {
  test('returns empty list when no journals', async () => {
    mockPrisma.journalEntry.findMany.mockResolvedValue([]);

    const res = await GET(makeRequest('GET'));
    const data = await res.json();

    expect(data).toEqual([]);
  });

  test('returns journal entries with formatted createdAt', async () => {
    const now = new Date('2026-03-11T10:00:00.000Z');
    mockPrisma.journalEntry.findMany.mockResolvedValue([
      { id: 'j1', text: 'Today was great', mood: 'great', createdAt: now },
      { id: 'j2', text: 'Feeling reflective', mood: null, createdAt: now },
    ]);

    const res = await GET(makeRequest('GET'));
    const data = await res.json();

    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({
      id: 'j1',
      text: 'Today was great',
      mood: 'great',
      createdAt: now.toISOString(),
    });
    expect(data[1].mood).toBeNull();
    // createdAt should be ISO string
    expect(typeof data[0].createdAt).toBe('string');
  });

  test('limits to 50 most recent entries', async () => {
    mockPrisma.journalEntry.findMany.mockResolvedValue([]);

    await GET(makeRequest('GET'));

    expect(mockPrisma.journalEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );
  });

  test('returns 500 on database error', async () => {
    mockPrisma.journalEntry.findMany.mockRejectedValue(new Error('DB error'));

    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/journals', () => {
  test('creates a journal entry with text and mood', async () => {
    const now = new Date();
    mockPrisma.journalEntry.create.mockResolvedValue({
      id: 'j-new',
      text: 'Had a productive day',
      mood: 'great',
      createdAt: now,
    });

    const res = await POST(makeRequest('POST', { text: 'Had a productive day', mood: 'great' }));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toMatchObject({
      id: 'j-new',
      text: 'Had a productive day',
      mood: 'great',
    });
  });

  test('creates a journal entry without mood', async () => {
    const now = new Date();
    mockPrisma.journalEntry.create.mockResolvedValue({
      id: 'j-no-mood',
      text: 'Just writing',
      mood: null,
      createdAt: now,
    });

    const res = await POST(makeRequest('POST', { text: 'Just writing' }));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.mood).toBeNull();
  });

  test('returns 400 when text is missing', async () => {
    const res = await POST(makeRequest('POST', { mood: 'good' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/text/i);
  });

  test('returns 400 when text is empty string', async () => {
    const res = await POST(makeRequest('POST', { text: '' }));
    expect(res.status).toBe(400);
  });

  test('returns 400 when text is only whitespace', async () => {
    const res = await POST(makeRequest('POST', { text: '   ' }));
    expect(res.status).toBe(400);
  });

  test('returns 400 when text is not a string', async () => {
    const res = await POST(makeRequest('POST', { text: 42 }));
    expect(res.status).toBe(400);
  });

  test('createdAt in response is ISO string', async () => {
    const now = new Date('2026-03-11T12:00:00.000Z');
    mockPrisma.journalEntry.create.mockResolvedValue({
      id: 'j1', text: 'Entry', mood: null, createdAt: now,
    });

    const res = await POST(makeRequest('POST', { text: 'Entry' }));
    const data = await res.json();

    expect(data.createdAt).toBe(now.toISOString());
  });

  test('returns 500 on database error', async () => {
    mockPrisma.journalEntry.create.mockRejectedValue(new Error('DB error'));

    const res = await POST(makeRequest('POST', { text: 'Test' }));
    expect(res.status).toBe(500);
  });
});
