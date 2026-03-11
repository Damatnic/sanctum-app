/**
 * Tests for /src/lib/api.ts - client-side API helpers
 */

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// We need to mock `window.open` for the export API
global.window = Object.assign(global.window || {}, {
  open: jest.fn(),
});

import {
  habitsApi,
  goalsApi,
  deadlinesApi,
  projectsApi,
  journalsApi,
  focusApi,
  moodsApi,
  settingsApi,
  syncFromApi,
} from '@/lib/api';

function mockSuccessResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
}

function mockErrorResponse(status: number, errorMsg: string) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: errorMsg }),
  });
}

function mockNetworkError() {
  return Promise.reject(new Error('Network error'));
}

// ─── habitsApi ──────────────────────────────────────────────────────────────

describe('habitsApi', () => {
  test('list() calls GET /api/habits', async () => {
    const habitsData = [{ id: '1', name: 'Run', icon: '🏃', streak: 3, todayCompleted: false }];
    mockFetch.mockReturnValue(mockSuccessResponse(habitsData));

    const result = await habitsApi.list();

    expect(mockFetch).toHaveBeenCalledWith('/api/habits', expect.objectContaining({
      headers: expect.objectContaining({ 'x-user-id': 'default-user' }),
    }));
    expect(result.data).toEqual(habitsData);
    expect(result.error).toBeUndefined();
  });

  test('create() calls POST /api/habits with body', async () => {
    const newHabit = { id: '2', name: 'Meditate', icon: '🧘', streak: 0, todayCompleted: false };
    mockFetch.mockReturnValue(mockSuccessResponse(newHabit));

    const result = await habitsApi.create({ name: 'Meditate', icon: '🧘' });

    expect(mockFetch).toHaveBeenCalledWith('/api/habits', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Meditate', icon: '🧘' }),
    }));
    expect(result.data).toEqual(newHabit);
  });

  test('toggle() calls POST /api/habits/:id/toggle', async () => {
    mockFetch.mockReturnValue(mockSuccessResponse({ id: '1', todayCompleted: true }));

    const result = await habitsApi.toggle('habit-123');

    expect(mockFetch).toHaveBeenCalledWith('/api/habits/habit-123/toggle', expect.objectContaining({
      method: 'POST',
    }));
    expect(result.data).toHaveProperty('todayCompleted', true);
  });

  test('update() calls PATCH /api/habits/:id', async () => {
    mockFetch.mockReturnValue(mockSuccessResponse({ id: '1', name: 'Updated' }));

    await habitsApi.update('habit-1', { name: 'Updated', icon: '✅' });

    expect(mockFetch).toHaveBeenCalledWith('/api/habits/habit-1', expect.objectContaining({
      method: 'PATCH',
    }));
  });

  test('delete() calls DELETE /api/habits/:id', async () => {
    mockFetch.mockReturnValue(mockSuccessResponse(null));

    await habitsApi.delete('habit-1');

    expect(mockFetch).toHaveBeenCalledWith('/api/habits/habit-1', expect.objectContaining({
      method: 'DELETE',
    }));
  });

  test('returns error on non-OK response', async () => {
    mockFetch.mockReturnValue(mockErrorResponse(500, 'Failed to fetch habits'));

    const result = await habitsApi.list();

    expect(result.error).toBe('Failed to fetch habits');
    expect(result.data).toBeUndefined();
  });

  test('returns error on network failure', async () => {
    mockFetch.mockReturnValue(mockNetworkError());

    const result = await habitsApi.list();

    expect(result.error).toBe('Network error');
    expect(result.data).toBeUndefined();
  });
});

// ─── goalsApi ───────────────────────────────────────────────────────────────

describe('goalsApi', () => {
  test('list() calls GET /api/goals', async () => {
    mockFetch.mockReturnValue(mockSuccessResponse([]));

    await goalsApi.list();
    expect(mockFetch).toHaveBeenCalledWith('/api/goals', expect.anything());
  });

  test('create() sends correct goal data', async () => {
    const goal = { id: 'g1', name: 'Read 24 Books', icon: '📚', current: 0, target: 24 };
    mockFetch.mockReturnValue(mockSuccessResponse(goal));

    const result = await goalsApi.create({ name: 'Read 24 Books', icon: '📚', target: 24 });

    expect(mockFetch).toHaveBeenCalledWith('/api/goals', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"name":"Read 24 Books"'),
    }));
    expect(result.data).toEqual(goal);
  });

  test('increment() sends delta to correct endpoint', async () => {
    mockFetch.mockReturnValue(mockSuccessResponse({ id: 'g1', current: 5 }));

    await goalsApi.increment('goal-abc', 3);

    expect(mockFetch).toHaveBeenCalledWith('/api/goals/goal-abc/increment', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ delta: 3 }),
    }));
  });

  test('increment() with negative delta', async () => {
    mockFetch.mockReturnValue(mockSuccessResponse({ id: 'g1', current: 2 }));

    await goalsApi.increment('goal-abc', -2);

    expect(mockFetch).toHaveBeenCalledWith('/api/goals/goal-abc/increment', expect.objectContaining({
      body: JSON.stringify({ delta: -2 }),
    }));
  });
});

// ─── deadlinesApi ───────────────────────────────────────────────────────────

describe('deadlinesApi', () => {
  test('list() calls GET /api/deadlines', async () => {
    mockFetch.mockReturnValue(mockSuccessResponse([]));

    await deadlinesApi.list();
    expect(mockFetch).toHaveBeenCalledWith('/api/deadlines', expect.anything());
  });

  test('create() sends title, course, dueDate', async () => {
    const deadline = { id: 'd1', title: 'Final Exam', course: 'Math', dueDate: '2026-05-15', done: false };
    mockFetch.mockReturnValue(mockSuccessResponse(deadline));

    const result = await deadlinesApi.create({
      title: 'Final Exam', course: 'Math', dueDate: '2026-05-15',
    });

    expect(result.data).toEqual(deadline);
    expect(mockFetch).toHaveBeenCalledWith('/api/deadlines', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"title":"Final Exam"'),
    }));
  });

  test('update() calls PATCH with done:true', async () => {
    mockFetch.mockReturnValue(mockSuccessResponse({ id: 'd1', done: true }));

    await deadlinesApi.update('d1', { done: true });

    expect(mockFetch).toHaveBeenCalledWith('/api/deadlines/d1', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ done: true }),
    }));
  });

  test('delete() calls DELETE on correct endpoint', async () => {
    mockFetch.mockReturnValue(mockSuccessResponse({ success: true }));

    await deadlinesApi.delete('d1');

    expect(mockFetch).toHaveBeenCalledWith('/api/deadlines/d1', expect.objectContaining({
      method: 'DELETE',
    }));
  });
});

// ─── focusApi ───────────────────────────────────────────────────────────────

describe('focusApi', () => {
  test('stats() calls GET /api/focus', async () => {
    const stats = { totalMinutes: 120, totalSessions: 5, todayMinutes: 25 };
    mockFetch.mockReturnValue(mockSuccessResponse(stats));

    const result = await focusApi.stats();
    expect(result.data).toEqual(stats);
    expect(mockFetch).toHaveBeenCalledWith('/api/focus', expect.anything());
  });

  test('log() calls POST /api/focus with minutes and completed', async () => {
    mockFetch.mockReturnValue(mockSuccessResponse({ id: 'f1', minutes: 25 }));

    await focusApi.log(25, true);

    expect(mockFetch).toHaveBeenCalledWith('/api/focus', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ minutes: 25, completed: true }),
    }));
  });

  test('log() defaults completed to true', async () => {
    mockFetch.mockReturnValue(mockSuccessResponse({ id: 'f1' }));

    await focusApi.log(45);

    expect(mockFetch).toHaveBeenCalledWith('/api/focus', expect.objectContaining({
      body: JSON.stringify({ minutes: 45, completed: true }),
    }));
  });
});

// ─── settingsApi ────────────────────────────────────────────────────────────

describe('settingsApi', () => {
  test('get() calls GET /api/settings', async () => {
    mockFetch.mockReturnValue(mockSuccessResponse({ name: 'Nick', city: 'Chicago' }));

    const result = await settingsApi.get();
    expect(result.data).toEqual({ name: 'Nick', city: 'Chicago' });
  });

  test('save() calls POST /api/settings with data', async () => {
    mockFetch.mockReturnValue(mockSuccessResponse({ name: 'Nick', city: 'New York' }));

    await settingsApi.save({ name: 'Nick', city: 'New York' });

    expect(mockFetch).toHaveBeenCalledWith('/api/settings', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'Nick', city: 'New York' }),
    }));
  });
});

// ─── syncFromApi ────────────────────────────────────────────────────────────

describe('syncFromApi', () => {
  test('returns combined data from all APIs', async () => {
    const habits = [{ id: 'h1', name: 'Run' }];
    const goals = [{ id: 'g1', name: 'Books' }];
    const deadlines = [{ id: 'd1', title: 'Exam' }];
    const projects = [{ id: 'p1', name: 'App' }];
    const journals = [{ id: 'j1', text: 'Today was good' }];
    const focus = { totalMinutes: 100, totalSessions: 4, todayMinutes: 25 };
    const moods = [{ mood: 'great', date: '2026-01-01' }];

    // Each call to fetch returns different data based on URL
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/habits')) return mockSuccessResponse(habits);
      if (url.includes('/goals')) return mockSuccessResponse(goals);
      if (url.includes('/deadlines')) return mockSuccessResponse(deadlines);
      if (url.includes('/projects')) return mockSuccessResponse(projects);
      if (url.includes('/journals')) return mockSuccessResponse(journals);
      if (url.includes('/focus')) return mockSuccessResponse(focus);
      if (url.includes('/moods')) return mockSuccessResponse(moods);
      return mockSuccessResponse({});
    });

    const result = await syncFromApi();

    expect(result.habits).toEqual(habits);
    expect(result.goals).toEqual(goals);
    expect(result.deadlines).toEqual(deadlines);
    expect(result.projects).toEqual(projects);
    expect(result.journals).toEqual(journals);
    expect(result.focus).toEqual(focus);
    expect(result.moods).toEqual(moods);
    expect(result.todayMood).toBe('great');
  });

  test('returns empty defaults when APIs fail', async () => {
    mockFetch.mockReturnValue(mockErrorResponse(500, 'Server Error'));

    const result = await syncFromApi();

    expect(result.habits).toEqual([]);
    expect(result.goals).toEqual([]);
    expect(result.deadlines).toEqual([]);
    expect(result.projects).toEqual([]);
    expect(result.journals).toEqual([]);
    expect(result.focus).toEqual({ totalMinutes: 0, totalSessions: 0, todayMinutes: 0 });
    expect(result.moods).toEqual([]);
    expect(result.todayMood).toBeNull();
  });

  test('returns null todayMood when moods list is empty', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/moods')) return mockSuccessResponse([]);
      return mockSuccessResponse([]);
    });

    const result = await syncFromApi();
    expect(result.todayMood).toBeNull();
  });
});
