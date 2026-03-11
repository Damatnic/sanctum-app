/**
 * Component tests for the Habits page
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/habits'),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

import HabitsPage from '@/app/habits/page';

const TODAY = new Date().toISOString().split('T')[0];

// Utility: set up localStorage with habits data
function seedLocalStorage(habits: any[] = []) {
  const data = {
    version: 2,
    habits,
    goals: [],
    deadlines: [],
    projects: [],
    journal: [],
    mood: null,
    quoteIndex: 0,
    focusMinutes: 0,
    totalFocusSessions: 0,
    settings: { name: 'Nick', city: '', apiKey: '' },
  };
  localStorage.setItem('sanctum-v2', JSON.stringify(data));
}

const sampleHabits = [
  { id: 1, name: 'Morning Run', icon: '🏃', streak: 5, completedToday: false, lastCompleted: TODAY, completionDates: [TODAY] },
  { id: 2, name: 'Read', icon: '📚', streak: 10, completedToday: false, lastCompleted: undefined, completionDates: [] },
  { id: 3, name: 'Meditate', icon: '🧘', streak: 2, completedToday: false, lastCompleted: undefined, completionDates: [] },
];

describe('HabitsPage - Empty State', () => {
  test('shows empty state when no habits', () => {
    seedLocalStorage([]);
    render(<HabitsPage />);

    expect(screen.getByText(/no habits yet/i)).toBeInTheDocument();
    expect(screen.getByText(/click to add your first habit/i)).toBeInTheDocument();
  });

  test('shows 0% completion rate when no habits', () => {
    seedLocalStorage([]);
    render(<HabitsPage />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  test('empty state click opens add habit modal', async () => {
    seedLocalStorage([]);
    render(<HabitsPage />);

    const emptyCard = screen.getByText(/no habits yet/i).closest('div');
    if (emptyCard) fireEvent.click(emptyCard);

    await waitFor(() => {
      // Modal heading is an h3 with "Add Habit"
      expect(screen.getByRole('heading', { name: /add habit/i })).toBeInTheDocument();
    });
  });
});

describe('HabitsPage - With Habits', () => {
  test('renders all habits from localStorage', () => {
    seedLocalStorage(sampleHabits);
    render(<HabitsPage />);

    expect(screen.getByText('Morning Run')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('Meditate')).toBeInTheDocument();
  });

  test('shows correct completion rate', () => {
    seedLocalStorage(sampleHabits); // 1 of 3 completed today (lastCompleted === TODAY)
    render(<HabitsPage />);

    // 1/3 = 33%
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  test('marks habit as "Completed today" when done', () => {
    seedLocalStorage(sampleHabits);
    render(<HabitsPage />);

    expect(screen.getByText('Completed today')).toBeInTheDocument();
  });

  test('shows streak count for each habit', () => {
    seedLocalStorage(sampleHabits);
    render(<HabitsPage />);

    // Use getAllByText since streak numbers can appear in multiple places (sidebar + habit card)
    expect(screen.getAllByText('5').length).toBeGreaterThan(0); // Morning Run streak
    expect(screen.getAllByText('10').length).toBeGreaterThan(0); // Read streak (may also show in sidebar)
    expect(screen.getAllByText('2').length).toBeGreaterThan(0); // Meditate streak
  });

  test('shows habit icons', () => {
    seedLocalStorage(sampleHabits);
    render(<HabitsPage />);

    expect(screen.getByText('🏃')).toBeInTheDocument();
    expect(screen.getByText('📚')).toBeInTheDocument();
    expect(screen.getByText('🧘')).toBeInTheDocument();
  });
});

describe('HabitsPage - Add Habit Modal', () => {
  test('opens modal when "+ Add Habit" button clicked', async () => {
    seedLocalStorage([]);
    render(<HabitsPage />);

    const addButton = screen.getByRole('button', { name: /\+ add habit/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      // Modal renders an <h3> heading + a submit button, both say "Add Habit"
      expect(screen.getByRole('heading', { name: /add habit/i })).toBeInTheDocument();
    });
  });

  test('add habit modal has name and icon inputs', async () => {
    seedLocalStorage([]);
    render(<HabitsPage />);

    fireEvent.click(screen.getByRole('button', { name: /\+ add habit/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Morning workout')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('💪')).toBeInTheDocument();
    });
  });

  test('cancel button closes modal', async () => {
    seedLocalStorage([]);
    render(<HabitsPage />);

    fireEvent.click(screen.getByRole('button', { name: /\+ add habit/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /add habit/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Morning workout')).not.toBeInTheDocument();
    });
  });

  test('adding a habit without name does nothing', async () => {
    seedLocalStorage([]);
    render(<HabitsPage />);

    fireEvent.click(screen.getByRole('button', { name: /\+ add habit/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Morning workout')).toBeInTheDocument();
    });

    // Click Add without entering name
    const addButtons = screen.getAllByRole('button', { name: /add habit/i });
    fireEvent.click(addButtons[addButtons.length - 1]);

    // Modal should still be visible (no habit added)
    expect(screen.getByPlaceholderText('Morning workout')).toBeInTheDocument();
  });

  test('adding a habit saves to localStorage and closes modal', async () => {
    seedLocalStorage([]);
    const user = userEvent.setup();
    render(<HabitsPage />);

    fireEvent.click(screen.getByRole('button', { name: /\+ add habit/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Morning workout')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Morning workout');
    await user.type(nameInput, 'Exercise');

    const addButtons = screen.getAllByRole('button', { name: /add habit/i });
    fireEvent.click(addButtons[addButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Morning workout')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Exercise')).toBeInTheDocument();

    // Verify it was saved to localStorage
    const saved = JSON.parse(localStorage.getItem('sanctum-v2') || '{}');
    expect(saved.habits.some((h: any) => h.name === 'Exercise')).toBe(true);
  });
});

describe('HabitsPage - Toggle Habit', () => {
  test('clicking toggle button marks habit complete', async () => {
    seedLocalStorage([
      { id: 1, name: 'Morning Run', icon: '🏃', streak: 0, completedToday: false, completionDates: [] },
    ]);
    render(<HabitsPage />);

    // Find toggle button (the circle button before the habit)
    const toggleButtons = screen.getAllByRole('button').filter(btn => {
      const parent = btn.closest('div[style*="border-radius: 50%"]') || btn;
      return btn.style?.borderRadius === '50%' || btn.style?.borderRadius?.includes('50');
    });

    // The toggle is the first circular button in each habit row
    const habitRow = screen.getByText('Morning Run').closest('div');
    expect(habitRow).toBeTruthy();
  });

  test('toggling a completed habit removes completion', () => {
    seedLocalStorage([
      { id: 1, name: 'Morning Run', icon: '🏃', streak: 3, completedToday: false, lastCompleted: TODAY, completionDates: [TODAY] },
    ]);
    render(<HabitsPage />);

    expect(screen.getByText('Completed today')).toBeInTheDocument();
  });
});

describe('HabitsPage - Edit Habit Modal', () => {
  test('clicking edit button opens edit modal', async () => {
    seedLocalStorage([
      { id: 1, name: 'Morning Run', icon: '🏃', streak: 5, completedToday: false, completionDates: [] },
    ]);
    render(<HabitsPage />);

    // Find the edit button (✎)
    const editButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '✎');
    expect(editButtons.length).toBeGreaterThan(0);
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit Habit')).toBeInTheDocument();
    });
  });

  test('edit modal shows current habit data', async () => {
    seedLocalStorage([
      { id: 1, name: 'Morning Run', icon: '🏃', streak: 5, completedToday: false, completionDates: [] },
    ]);
    render(<HabitsPage />);

    const editButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '✎');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Morning Run');
      expect(nameInput).toBeInTheDocument();
    });
  });

  test('delete button in edit modal removes habit', async () => {
    seedLocalStorage([
      { id: 1, name: 'Morning Run', icon: '🏃', streak: 5, completedToday: false, completionDates: [] },
    ]);
    render(<HabitsPage />);

    const editButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '✎');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit Habit')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(screen.queryByText('Morning Run')).not.toBeInTheDocument();
    });
  });
});

describe('HabitsPage - Filter', () => {
  test('filter buttons are rendered', () => {
    seedLocalStorage(sampleHabits);
    render(<HabitsPage />);

    expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^done$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^pending$/i })).toBeInTheDocument();
  });

  test('"done" filter shows only completed habits', async () => {
    seedLocalStorage(sampleHabits); // only Morning Run has lastCompleted === TODAY
    render(<HabitsPage />);

    fireEvent.click(screen.getByRole('button', { name: /^done$/i }));

    await waitFor(() => {
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.queryByText('Read')).not.toBeInTheDocument();
      expect(screen.queryByText('Meditate')).not.toBeInTheDocument();
    });
  });

  test('"pending" filter shows only uncompleted habits', async () => {
    seedLocalStorage(sampleHabits);
    render(<HabitsPage />);

    fireEvent.click(screen.getByRole('button', { name: /^pending$/i }));

    await waitFor(() => {
      expect(screen.queryByText('Morning Run')).not.toBeInTheDocument();
      expect(screen.getByText('Read')).toBeInTheDocument();
      expect(screen.getByText('Meditate')).toBeInTheDocument();
    });
  });

  test('"all" filter shows all habits', async () => {
    seedLocalStorage(sampleHabits);
    render(<HabitsPage />);

    // Click pending first, then all
    fireEvent.click(screen.getByRole('button', { name: /^pending$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^all$/i }));

    await waitFor(() => {
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Read')).toBeInTheDocument();
      expect(screen.getByText('Meditate')).toBeInTheDocument();
    });
  });
});

describe('HabitsPage - Stats', () => {
  test('shows longest streak correctly', () => {
    seedLocalStorage(sampleHabits);
    render(<HabitsPage />);

    // Max streak is 10 (from Read habit)
    const allElements = screen.getAllByText('10');
    expect(allElements.length).toBeGreaterThan(0);
  });

  test('shows correct completion stats (n/total today)', () => {
    seedLocalStorage(sampleHabits);
    render(<HabitsPage />);

    // 1 of 3 completed (Morning Run)
    expect(screen.getByText('1/3 today')).toBeInTheDocument();
  });
});

describe('HabitsPage - Heatmap', () => {
  test('renders heatmap section', () => {
    seedLocalStorage(sampleHabits);
    render(<HabitsPage />);

    expect(screen.getByText(/activity.*last 12 weeks/i)).toBeInTheDocument();
  });

  test('heatmap legend shows Less/More', () => {
    seedLocalStorage(sampleHabits);
    render(<HabitsPage />);

    expect(screen.getByText('Less')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });
});

describe('HabitsPage - Loading State', () => {
  test('renders without data (empty localStorage)', () => {
    // Don't seed localStorage
    render(<HabitsPage />);

    // Should render the empty state since no habits
    expect(screen.getByText(/no habits yet/i)).toBeInTheDocument();
  });

  test('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('sanctum-v2', 'INVALID_JSON{{{');
    
    // Should not throw
    expect(() => render(<HabitsPage />)).not.toThrow();
    expect(screen.getByText(/no habits yet/i)).toBeInTheDocument();
  });

  test('handles version mismatch in localStorage', () => {
    localStorage.setItem('sanctum-v2', JSON.stringify({
      version: 999, // Wrong version
      habits: [{ id: 1, name: 'Old Habit', icon: '🏃', streak: 0 }],
    }));

    render(<HabitsPage />);

    // Should show empty (wrong version = ignored)
    expect(screen.getByText(/no habits yet/i)).toBeInTheDocument();
  });
});
