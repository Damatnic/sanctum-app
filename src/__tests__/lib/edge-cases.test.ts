/**
 * Edge case and error handling tests
 * Tests boundary conditions, error states, and unusual inputs
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { habitsApi, goalsApi, deadlinesApi, projectsApi, journalsApi, moodsApi } from '@/lib/api';

function mockOk(data: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });
}

function mockErr(status: number, error: string) {
  return Promise.resolve({ ok: false, status, json: () => Promise.resolve({ error }) });
}

function mockNetworkErr() {
  return Promise.reject(new TypeError('Failed to fetch'));
}

function mockMalformedJSON() {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.reject(new SyntaxError('Unexpected token')),
  });
}

// ─── Error Handling ──────────────────────────────────────────────────────────

describe('API Error Handling', () => {
  test('returns error object on 400 response', async () => {
    mockFetch.mockReturnValueOnce(mockErr(400, 'Name is required'));
    const result = await habitsApi.create({ name: '' });
    expect(result.error).toBe('Name is required');
    expect(result.data).toBeUndefined();
  });

  test('returns error object on 404 response', async () => {
    mockFetch.mockReturnValueOnce(mockErr(404, 'Not found'));
    const result = await habitsApi.toggle('nonexistent-id');
    expect(result.error).toBe('Not found');
  });

  test('returns error object on 500 response', async () => {
    mockFetch.mockReturnValueOnce(mockErr(500, 'Internal server error'));
    const result = await habitsApi.list();
    expect(result.error).toBeTruthy();
  });

  test('returns "Network error" on fetch rejection', async () => {
    mockFetch.mockReturnValueOnce(mockNetworkErr());
    const result = await habitsApi.list();
    expect(result.error).toBe('Network error');
  });

  test('handles error response without JSON body', async () => {
    mockFetch.mockReturnValueOnce(Promise.resolve({
      ok: false,
      status: 503,
      json: () => Promise.reject(new Error('No JSON')),
    }));

    const result = await habitsApi.list();
    expect(result.error).toMatch(/503|request failed/i);
  });

  test('handles network timeout gracefully', async () => {
    mockFetch.mockReturnValueOnce(
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1))
    );

    const result = await habitsApi.list();
    expect(result.error).toBeTruthy();
    expect(result.data).toBeUndefined();
  });
});

// ─── Edge Cases: Goals ──────────────────────────────────────────────────────

describe('Goals - Edge Cases', () => {
  test('goal with target of 1', async () => {
    const goal = { id: 'g1', name: 'One Thing', current: 0, target: 1 };
    mockFetch.mockReturnValueOnce(mockOk({ ...goal, current: 1 }));

    const result = await goalsApi.increment('g1', 1);
    expect(result.data?.current).toBe(1); // exactly at target
  });

  test('goal at 0% progress', async () => {
    mockFetch.mockReturnValueOnce(mockOk([{ id: 'g1', current: 0, target: 100 }]));

    const result = await goalsApi.list();
    expect(result.data?.[0].current).toBe(0);
    const pct = (result.data?.[0].current / result.data?.[0].target) * 100;
    expect(pct).toBe(0);
  });

  test('goal at 100% progress', async () => {
    mockFetch.mockReturnValueOnce(mockOk([{ id: 'g1', current: 100, target: 100 }]));

    const result = await goalsApi.list();
    const pct = (result.data?.[0].current / result.data?.[0].target) * 100;
    expect(pct).toBe(100);
  });
});

// ─── Edge Cases: Deadlines ──────────────────────────────────────────────────

describe('Deadlines - Edge Cases', () => {
  test('overdue deadline (dueDate in the past)', async () => {
    const pastDate = '2020-01-01';
    mockFetch.mockReturnValueOnce(mockOk([{
      id: 'd1', title: 'Old Assignment', dueDate: pastDate, done: false,
    }]));

    const result = await deadlinesApi.list();
    const deadline = result.data?.[0];
    expect(deadline?.dueDate).toBe(pastDate);

    // Verify overdue logic: date difference should be negative
    const diff = Math.ceil((new Date(pastDate).getTime() - Date.now()) / 86400000);
    expect(diff).toBeLessThan(0);
  });

  test('deadline due today', async () => {
    const today = new Date().toISOString().split('T')[0];
    mockFetch.mockReturnValueOnce(mockOk([{
      id: 'd1', title: 'Today Task', dueDate: today, done: false,
    }]));

    const result = await deadlinesApi.list();
    expect(result.data?.[0].dueDate).toBe(today);
  });

  test('all deadlines completed', async () => {
    mockFetch.mockReturnValueOnce(mockOk([
      { id: 'd1', title: 'Done 1', dueDate: '2026-03-15', done: true },
      { id: 'd2', title: 'Done 2', dueDate: '2026-03-20', done: true },
    ]));

    const result = await deadlinesApi.list();
    const undone = result.data?.filter((d: any) => !d.done);
    expect(undone).toHaveLength(0);
  });

  test('deadline without course (optional field)', async () => {
    mockFetch.mockReturnValueOnce(mockOk([{
      id: 'd1', title: 'Personal Task', course: null, dueDate: '2026-05-01', done: false,
    }]));

    const result = await deadlinesApi.list();
    expect(result.data?.[0].course).toBeNull();
  });
});

// ─── Edge Cases: Habits ─────────────────────────────────────────────────────

describe('Habits - Edge Cases', () => {
  test('habit with very long name', async () => {
    const longName = 'A'.repeat(255);
    mockFetch.mockReturnValueOnce(mockOk({ id: 'h1', name: longName, icon: '✓', streak: 0, todayCompleted: false }));

    const result = await habitsApi.create({ name: longName });
    expect(result.data?.name).toBe(longName);
  });

  test('habit with emoji icon', async () => {
    mockFetch.mockReturnValueOnce(mockOk({ id: 'h1', name: 'Meditate', icon: '🧘‍♂️', streak: 0, todayCompleted: false }));

    const result = await habitsApi.create({ name: 'Meditate', icon: '🧘‍♂️' });
    expect(result.data?.icon).toBe('🧘‍♂️');
  });

  test('habit with zero streak', async () => {
    mockFetch.mockReturnValueOnce(mockOk([{ id: 'h1', name: 'New Habit', streak: 0, todayCompleted: false }]));

    const result = await habitsApi.list();
    expect(result.data?.[0].streak).toBe(0);
  });

  test('habit with very high streak', async () => {
    mockFetch.mockReturnValueOnce(mockOk([{ id: 'h1', name: 'Veteran Habit', streak: 365, todayCompleted: true }]));

    const result = await habitsApi.list();
    expect(result.data?.[0].streak).toBe(365);
  });
});

// ─── Edge Cases: Journals ────────────────────────────────────────────────────

describe('Journals - Edge Cases', () => {
  test('journal entry with special characters', async () => {
    const specialText = 'Today was <great> & "wonderful" — even "fantastic"! 🎉';
    mockFetch.mockReturnValueOnce(mockOk({ id: 'j1', text: specialText, mood: null, createdAt: new Date().toISOString() }));

    const result = await journalsApi.create({ text: specialText });
    expect(result.data?.text).toBe(specialText);
  });

  test('journal entry with multiline text', async () => {
    const multilineText = 'Line 1\nLine 2\nLine 3';
    mockFetch.mockReturnValueOnce(mockOk({ id: 'j1', text: multilineText, mood: null, createdAt: new Date().toISOString() }));

    const result = await journalsApi.create({ text: multilineText });
    expect(result.data?.text).toBe(multilineText);
  });

  test('empty journal list returns empty array', async () => {
    mockFetch.mockReturnValueOnce(mockOk([]));

    const result = await journalsApi.list();
    expect(result.data).toEqual([]);
  });
});

// ─── Edge Cases: Mood ────────────────────────────────────────────────────────

describe('Moods - Edge Cases', () => {
  test('valid mood values are accepted', async () => {
    const validMoods = ['great', 'good', 'okay', 'low', 'rough'];

    for (const mood of validMoods) {
      mockFetch.mockReturnValueOnce(mockOk({ id: `m-${mood}`, mood }));
      const result = await moodsApi.log(mood);
      expect(result.data?.mood).toBe(mood);
    }
  });
});

// ─── Edge Cases: Projects ────────────────────────────────────────────────────

describe('Projects - Edge Cases', () => {
  test('project status transitions', async () => {
    const statuses = ['planning', 'active', 'paused', 'complete'];

    for (const status of statuses) {
      mockFetch.mockReturnValueOnce(mockOk({ id: 'p1', name: 'App', status }));
      const result = await projectsApi.update('p1', { status });
      expect(result.data?.status).toBe(status);
    }
  });

  test('empty projects list', async () => {
    mockFetch.mockReturnValueOnce(mockOk([]));

    const result = await projectsApi.list();
    expect(result.data).toEqual([]);
  });
});
