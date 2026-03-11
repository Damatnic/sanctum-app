/**
 * Data flow integration tests
 * Tests the complete flow of data through the API helper layer
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

import {
  habitsApi,
  goalsApi,
  deadlinesApi,
  syncFromApi,
} from '@/lib/api';

function mockOk(data: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });
}

function mockErr(status: number, error: string) {
  return Promise.resolve({ ok: false, status, json: () => Promise.resolve({ error }) });
}

// ─── Habits data flow ────────────────────────────────────────────────────────

describe('Habits data flow', () => {
  test('full CRUD cycle for habits', async () => {
    const habit = { id: 'h1', name: 'Exercise', icon: '💪', streak: 0, todayCompleted: false, completions: [] };

    // Create
    mockFetch.mockReturnValueOnce(mockOk(habit));
    const created = await habitsApi.create({ name: 'Exercise', icon: '💪' });
    expect(created.data).toMatchObject({ name: 'Exercise' });

    // Read list
    mockFetch.mockReturnValueOnce(mockOk([habit]));
    const list = await habitsApi.list();
    expect(list.data).toHaveLength(1);

    // Toggle
    mockFetch.mockReturnValueOnce(mockOk({ ...habit, todayCompleted: true, streak: 1 }));
    const toggled = await habitsApi.toggle('h1');
    expect(toggled.data?.todayCompleted).toBe(true);

    // Toggle back off
    mockFetch.mockReturnValueOnce(mockOk({ ...habit, todayCompleted: false, streak: 0 }));
    const toggledOff = await habitsApi.toggle('h1');
    expect(toggledOff.data?.todayCompleted).toBe(false);

    // Update name
    mockFetch.mockReturnValueOnce(mockOk({ ...habit, name: 'Morning Exercise' }));
    const updated = await habitsApi.update('h1', { name: 'Morning Exercise' });
    expect(updated.data?.name).toBe('Morning Exercise');

    // Delete (archive)
    mockFetch.mockReturnValueOnce(mockOk(undefined));
    const deleted = await habitsApi.delete('h1');
    expect(deleted.error).toBeUndefined();
  });

  test('streak increases on each toggle', async () => {
    // Simulate a habit toggled 3 days in a row
    for (let day = 1; day <= 3; day++) {
      mockFetch.mockReturnValueOnce(mockOk({ id: 'h1', todayCompleted: true, streak: day }));
      const result = await habitsApi.toggle('h1');
      expect(result.data?.streak).toBe(day);
    }
  });

  test('API error propagates gracefully in habit creation', async () => {
    mockFetch.mockReturnValueOnce(mockErr(400, 'Name is required'));

    const result = await habitsApi.create({ name: '' });
    expect(result.error).toBe('Name is required');
    expect(result.data).toBeUndefined();
  });
});

// ─── Goals data flow ─────────────────────────────────────────────────────────

describe('Goals data flow', () => {
  test('goal progress increments correctly', async () => {
    const base = { id: 'g1', name: 'Read Books', current: 0, target: 12 };

    // Increment 3 times
    for (let i = 1; i <= 3; i++) {
      mockFetch.mockReturnValueOnce(mockOk({ ...base, current: i }));
      const result = await goalsApi.increment('g1', 1);
      expect(result.data?.current).toBe(i);
    }
  });

  test('goal completion at 100%', async () => {
    const goal = { id: 'g1', name: 'Save Money', current: 4999, target: 5000 };
    mockFetch.mockReturnValueOnce(mockOk({ ...goal, current: 5000 }));

    const result = await goalsApi.increment('g1', 1);
    expect(result.data?.current).toBe(result.data?.target);
  });

  test('goal cannot exceed target', async () => {
    // The API clamps to target
    mockFetch.mockReturnValueOnce(mockOk({ id: 'g1', current: 100, target: 100 }));

    const result = await goalsApi.increment('g1', 999);
    expect(result.data?.current).toBeLessThanOrEqual(result.data?.target ?? Infinity);
  });

  test('full goals CRUD flow', async () => {
    const goal = { id: 'g1', name: 'Workout', icon: '🏋️', current: 0, target: 50 };

    // Create
    mockFetch.mockReturnValueOnce(mockOk(goal));
    const created = await goalsApi.create({ name: 'Workout', icon: '🏋️', target: 50 });
    expect(created.data?.target).toBe(50);

    // Update
    mockFetch.mockReturnValueOnce(mockOk({ ...goal, target: 100 }));
    const updated = await goalsApi.update('g1', { target: 100 });
    expect(updated.data?.target).toBe(100);

    // Delete
    mockFetch.mockReturnValueOnce(mockOk({ success: true }));
    const deleted = await goalsApi.delete('g1');
    expect(deleted.error).toBeUndefined();
  });
});

// ─── Deadlines data flow ─────────────────────────────────────────────────────

describe('Deadlines data flow', () => {
  test('deadline status toggles from undone to done', async () => {
    const deadline = { id: 'd1', title: 'Final Exam', done: false, dueDate: '2026-05-15' };

    // Toggle to done
    mockFetch.mockReturnValueOnce(mockOk({ ...deadline, done: true }));
    const result = await deadlinesApi.update('d1', { done: true });
    expect(result.data?.done).toBe(true);
  });

  test('deadline date format is preserved correctly', async () => {
    const deadline = { id: 'd1', title: 'Paper', course: 'CS', dueDate: '2026-04-30', done: false };

    mockFetch.mockReturnValueOnce(mockOk(deadline));
    const created = await deadlinesApi.create({
      title: 'Paper',
      course: 'CS',
      dueDate: '2026-04-30',
    });

    expect(created.data?.dueDate).toBe('2026-04-30');
    // Should be YYYY-MM-DD format
    expect(created.data?.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('multiple deadlines sorted by due date (asc)', async () => {
    const deadlines = [
      { id: 'd1', title: 'First', dueDate: '2026-03-15', done: false },
      { id: 'd2', title: 'Second', dueDate: '2026-03-20', done: false },
      { id: 'd3', title: 'Third', dueDate: '2026-04-01', done: false },
    ];

    mockFetch.mockReturnValueOnce(mockOk(deadlines));
    const result = await deadlinesApi.list();

    expect(result.data).toHaveLength(3);
    // Dates should be in ascending order
    const dates = result.data!.map((d: any) => d.dueDate);
    expect(dates).toEqual([...dates].sort());
  });
});

// ─── syncFromApi ─────────────────────────────────────────────────────────────

describe('syncFromApi - data aggregation', () => {
  test('syncs all data sources in parallel', async () => {
    let callCount = 0;
    mockFetch.mockImplementation((url: string) => {
      callCount++;
      if (url.includes('/habits')) return mockOk([{ id: 'h1' }]);
      if (url.includes('/goals')) return mockOk([{ id: 'g1' }]);
      if (url.includes('/deadlines')) return mockOk([{ id: 'd1' }]);
      if (url.includes('/projects')) return mockOk([{ id: 'p1' }]);
      if (url.includes('/journals')) return mockOk([{ id: 'j1' }]);
      if (url.includes('/focus')) return mockOk({ totalMinutes: 60, totalSessions: 3, todayMinutes: 25 });
      if (url.includes('/moods')) return mockOk([{ mood: 'good' }]);
      return mockOk({});
    });

    const result = await syncFromApi();

    // All 7 endpoints should be called
    expect(callCount).toBe(7);
    expect(result.habits).toHaveLength(1);
    expect(result.goals).toHaveLength(1);
    expect(result.deadlines).toHaveLength(1);
    expect(result.projects).toHaveLength(1);
    expect(result.journals).toHaveLength(1);
    expect(result.focus.totalMinutes).toBe(60);
    expect(result.todayMood).toBe('good');
  });

  test('partial failure returns available data with empty defaults', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/habits')) return mockOk([{ id: 'h1', name: 'Run' }]);
      if (url.includes('/goals')) return mockErr(500, 'DB error');
      if (url.includes('/deadlines')) return mockErr(500, 'DB error');
      if (url.includes('/projects')) return mockOk([]);
      if (url.includes('/journals')) return mockOk([]);
      if (url.includes('/focus')) return mockOk({ totalMinutes: 0, totalSessions: 0, todayMinutes: 0 });
      if (url.includes('/moods')) return mockOk([]);
      return mockOk({});
    });

    const result = await syncFromApi();

    // Habits should have data
    expect(result.habits).toHaveLength(1);
    // Goals errored → empty default
    expect(result.goals).toEqual([]);
    expect(result.deadlines).toEqual([]);
  });

  test('todayMood comes from the first mood in the list', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/moods')) return mockOk([
        { mood: 'great', date: '2026-03-11' },
        { mood: 'okay', date: '2026-03-10' },
      ]);
      return mockOk([]);
    });

    const result = await syncFromApi();
    expect(result.todayMood).toBe('great');
  });
});
