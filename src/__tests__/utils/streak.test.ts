/**
 * Streak calculation utility tests
 * Tests the calculateStreak logic extracted from the habits toggle route
 */

// Reproduce the calculateStreak function here (mirroring the route implementation)
function calculateStreak(completions: Date[]): number {
  if (completions.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Sort completions descending
  const sorted = completions
    .map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date;
    })
    .sort((a, b) => b.getTime() - a.getTime());

  // Check if most recent is today or yesterday
  const mostRecent = sorted[0];
  if (
    mostRecent.getTime() !== today.getTime() &&
    mostRecent.getTime() !== yesterday.getTime()
  ) {
    return 0;
  }

  // Count consecutive days
  // Use Math.round to handle DST edge cases where the difference is 23 or 25h
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (sorted[i - 1].getTime() - sorted[i].getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

describe('calculateStreak', () => {
  test('returns 0 for empty completions', () => {
    expect(calculateStreak([])).toBe(0);
  });

  test('returns 1 if only completed today', () => {
    expect(calculateStreak([daysAgo(0)])).toBe(1);
  });

  test('returns 1 if only completed yesterday', () => {
    expect(calculateStreak([daysAgo(1)])).toBe(1);
  });

  test('returns 0 if last completion was 2 days ago', () => {
    expect(calculateStreak([daysAgo(2)])).toBe(0);
  });

  test('returns 0 if last completion was a week ago', () => {
    expect(calculateStreak([daysAgo(7)])).toBe(0);
  });

  test('returns 3 for today + past 2 consecutive days', () => {
    const completions = [daysAgo(0), daysAgo(1), daysAgo(2)];
    expect(calculateStreak(completions)).toBe(3);
  });

  test('returns 7 for a full week streak ending today', () => {
    const completions = Array.from({ length: 7 }, (_, i) => daysAgo(i));
    expect(calculateStreak(completions)).toBe(7);
  });

  test('breaks streak on gap in consecutive days', () => {
    // Today, yesterday, but skipped 2 days ago → streak is 2
    const completions = [daysAgo(0), daysAgo(1), daysAgo(3), daysAgo(4)];
    expect(calculateStreak(completions)).toBe(2);
  });

  test('handles unsorted completions (sorts internally)', () => {
    // Provide in random order
    const completions = [daysAgo(2), daysAgo(0), daysAgo(1)];
    expect(calculateStreak(completions)).toBe(3);
  });

  test('returns 0 if completions exist but none are recent enough', () => {
    const completions = [daysAgo(5), daysAgo(6), daysAgo(7)];
    expect(calculateStreak(completions)).toBe(0);
  });

  test('handles duplicate dates gracefully', () => {
    // Two entries for today - should still return 1
    const completions = [daysAgo(0), daysAgo(0)];
    // sorted: [today, today] → diff = 0 → doesn't count as consecutive → streak stays 1
    expect(calculateStreak(completions)).toBe(1);
  });

  test('streak of 30 days', () => {
    const completions = Array.from({ length: 30 }, (_, i) => daysAgo(i));
    expect(calculateStreak(completions)).toBe(30);
  });
});
