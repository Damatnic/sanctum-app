/**
 * Tests for /api/deadlines route handlers
 */

jest.mock('@/lib/api-errors', () => ({
  isPrismaNotFound: jest.fn().mockReturnValue(false),
  isPrismaUniqueViolation: jest.fn().mockReturnValue(false),
  notFound: jest.fn().mockReturnValue({ status: 404, async json() { return { error: 'Not found' }; }, headers: { set: jest.fn() } }),
  forbidden: jest.fn().mockReturnValue({ status: 403, async json() { return { error: 'Forbidden' }; }, headers: { set: jest.fn() } }),
  badRequest: jest.fn((msg: string) => ({ status: 400, async json() { return { error: msg }; }, headers: { set: jest.fn() } })),
  handlePrismaError: jest.fn().mockReturnValue(null),
  isValidDate: (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    deadline: {
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

import { GET, POST } from '@/app/api/deadlines/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const mockDeadlineModel = prisma.deadline as jest.Mocked<typeof prisma.deadline>;

const makeRequest = (method: string, body?: object) =>
  new NextRequest('http://localhost/api/deadlines', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'default-user' },
  });

const mockDeadline = {
  id: 'd1', title: 'Final Exam', course: 'Statistics',
  dueDate: new Date('2026-05-15T00:00:00.000Z'), done: false,
};

describe('GET /api/deadlines', () => {
  test('returns empty list when no deadlines exist', async () => {
    mockDeadlineModel.findMany.mockResolvedValue([]);

    const res = await GET(makeRequest('GET'));
    const data = await res.json();

    expect(data).toEqual([]);
  });

  test('returns deadlines with formatted dueDate (YYYY-MM-DD)', async () => {
    mockDeadlineModel.findMany.mockResolvedValue([mockDeadline as any]);

    const res = await GET(makeRequest('GET'));
    const data = await res.json();

    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      id: 'd1', title: 'Final Exam', course: 'Statistics', dueDate: '2026-05-15', done: false,
    });
    // dueDate should NOT be a full ISO string
    expect(data[0].dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('fetches only non-archived deadlines', async () => {
    mockDeadlineModel.findMany.mockResolvedValue([]);

    await GET(makeRequest('GET'));

    expect(mockDeadlineModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ archived: false }),
      })
    );
  });

  test('orders deadlines by dueDate ascending', async () => {
    mockDeadlineModel.findMany.mockResolvedValue([]);

    await GET(makeRequest('GET'));

    expect(mockDeadlineModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { dueDate: 'asc' } })
    );
  });

  test('returns 500 on database error', async () => {
    mockDeadlineModel.findMany.mockRejectedValue(new Error('Connection error'));

    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('returns multiple deadlines', async () => {
    mockDeadlineModel.findMany.mockResolvedValue([
      { id: 'd1', title: 'Exam', course: 'Math', dueDate: new Date('2026-03-20T00:00:00.000Z'), done: false },
      { id: 'd2', title: 'Project', course: 'CS', dueDate: new Date('2026-04-01T00:00:00.000Z'), done: true },
    ] as any);

    const res = await GET(makeRequest('GET'));
    const data = await res.json();

    expect(data).toHaveLength(2);
    expect(data[1].done).toBe(true);
  });
});

describe('POST /api/deadlines', () => {
  test('creates a deadline with title and dueDate', async () => {
    mockDeadlineModel.create.mockResolvedValue({
      id: 'd-new', title: 'Term Paper', course: 'English',
      dueDate: new Date('2026-04-30T00:00:00.000Z'), done: false,
    } as any);

    const res = await POST(makeRequest('POST', {
      title: 'Term Paper', course: 'English', dueDate: '2026-04-30',
    }));
    const data = await res.json();

    expect(data).toMatchObject({
      id: 'd-new', title: 'Term Paper', course: 'English', dueDate: '2026-04-30', done: false,
    });
  });

  test('creates deadline without optional course', async () => {
    mockDeadlineModel.create.mockResolvedValue({
      id: 'd-no-course', title: 'Personal Project', course: null,
      dueDate: new Date('2026-06-01T00:00:00.000Z'), done: false,
    } as any);

    const res = await POST(makeRequest('POST', { title: 'Personal Project', dueDate: '2026-06-01' }));
    const data = await res.json();

    expect(data.title).toBe('Personal Project');
  });

  test('returns 400 when title is missing', async () => {
    const res = await POST(makeRequest('POST', { dueDate: '2026-04-30' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  test('returns 400 when dueDate is missing', async () => {
    const res = await POST(makeRequest('POST', { title: 'Exam' }));
    expect(res.status).toBe(400);
  });

  test('returns 400 when both title and dueDate are missing', async () => {
    const res = await POST(makeRequest('POST', { course: 'Math' }));
    expect(res.status).toBe(400);
  });

  test('stores dueDate as Date object in database', async () => {
    mockDeadlineModel.create.mockResolvedValue({
      id: 'd-date', title: 'Test', course: null,
      dueDate: new Date('2026-05-01T00:00:00.000Z'), done: false,
    } as any);

    await POST(makeRequest('POST', { title: 'Test', dueDate: '2026-05-01' }));

    expect(mockDeadlineModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dueDate: expect.any(Date) }),
      })
    );
  });

  test('returns 500 on database error', async () => {
    mockDeadlineModel.create.mockRejectedValue(new Error('DB error'));

    const res = await POST(makeRequest('POST', { title: 'Test', dueDate: '2026-05-01' }));
    expect(res.status).toBe(500);
  });
});
