'use client';

import { useState, useEffect } from 'react';

// Types
interface Habit {
  id: number;
  name: string;
  icon: string;
  streak: number;
  completedToday: boolean;
  lastCompleted?: string;
}

interface Goal {
  id: number;
  name: string;
  icon: string;
  current: number;
  target: number;
}

interface Deadline {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  done: boolean;
}

interface Project {
  id: number;
  name: string;
  desc: string;
  icon: string;
  color: string;
  status: string;
}

interface JournalEntry {
  id: number;
  date: string;
  text: string;
  mood?: string;
}

interface Weather {
  current: {
    temp: string;
    feelsLike: string;
    condition: string;
    icon: string;
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Quotes
const quotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
];

export default function Home() {
  // State - start empty, load from localStorage
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [totalFocusSessions, setTotalFocusSessions] = useState(0);
  const [settings, setSettings] = useState({ name: 'User', city: 'New York', apiKey: '' });
  const [journalInput, setJournalInput] = useState('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPreset, setTimerPreset] = useState(25);
  
  // AI Coach state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hey! I'm your AI coach. Ask me for motivation, productivity tips, or help with your goals. ✨" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Modals
  const [habitModal, setHabitModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [deadlineModal, setDeadlineModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [editGoalModal, setEditGoalModal] = useState<Goal | null>(null);
  const [editHabitModal, setEditHabitModal] = useState<Habit | null>(null);
  const [editDeadlineModal, setEditDeadlineModal] = useState<Deadline | null>(null);
  const [editProjectModal, setEditProjectModal] = useState<Project | null>(null);
  
  // New item forms
  const [newHabit, setNewHabit] = useState({ name: '', icon: '✓' });
  const [newGoal, setNewGoal] = useState({ name: '', icon: '🎯', target: '' });
  const [newDeadline, setNewDeadline] = useState({ title: '', course: '', dueDate: '' });
  const [newProject, setNewProject] = useState({ name: '', desc: '', icon: '📁', color: 'violet', status: 'active' });
  
  // Toast & Confetti
  const [toast, setToast] = useState({ show: false, icon: '', text: '' });
  const [confetti, setConfetti] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sanctum-data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.habits?.length) setHabits(data.habits);
        if (data.goals?.length) setGoals(data.goals);
        if (data.deadlines?.length) setDeadlines(data.deadlines);
        if (data.projects?.length) setProjects(data.projects);
        if (data.journal?.length) setJournal(data.journal);
        if (data.mood) setMood(data.mood);
        if (data.quoteIndex !== undefined) setQuoteIndex(data.quoteIndex);
        if (data.focusMinutes) setFocusMinutes(data.focusMinutes);
        if (data.totalFocusSessions) setTotalFocusSessions(data.totalFocusSessions);
        if (data.settings) setSettings({ ...settings, ...data.settings });
      } catch (e) {
        console.error('Failed to load data', e);
      }
    }
    setIsFirstLoad(false);
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (isFirstLoad) return;
    localStorage.setItem('sanctum-data', JSON.stringify({
      habits, goals, deadlines, projects, journal, mood, quoteIndex, focusMinutes, totalFocusSessions, settings
    }));
  }, [habits, goals, deadlines, projects, journal, mood, quoteIndex, focusMinutes, totalFocusSessions, settings, isFirstLoad]);

  // Fetch weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?city=${encodeURIComponent(settings.city)}`);
        if (res.ok) setWeather(await res.json());
      } catch (e) { console.error('Weather fetch failed', e); }
    };
    if (settings.city) {
      fetchWeather();
      const interval = setInterval(fetchWeather, 600000);
      return () => clearInterval(interval);
    }
  }, [settings.city]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(s => s - 1), 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      setFocusMinutes(m => m + timerPreset);
      setTotalFocusSessions(s => s + 1);
      showToast('🎉', `${timerPreset} minute focus session complete!`);
      triggerConfetti();
      setTimerSeconds(timerPreset * 60);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, timerPreset]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setHabitModal(false);
        setGoalModal(false);
        setDeadlineModal(false);
        setProjectModal(false);
        setSettingsModal(false);
        setEditGoalModal(null);
        setEditHabitModal(null);
        setEditDeadlineModal(null);
        setEditProjectModal(null);
        setChatOpen(false);
      }
      if (e.key === ' ' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setTimerRunning(r => !r);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Helper functions
  const showToast = (icon: string, text: string) => {
    setToast({ show: true, icon, text });
    setTimeout(() => setToast({ show: false, icon: '', text: '' }), 3000);
  };

  const triggerConfetti = () => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 3000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = () => new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const formatTimer = () => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getToday = () => new Date().toISOString().split('T')[0];

  // HABIT FUNCTIONS
  const toggleHabit = (id: number) => {
    const today = getToday();
    setHabits(habits.map(h => {
      if (h.id === id) {
        const wasCompletedToday = h.lastCompleted === today;
        if (wasCompletedToday) {
          // Uncomplete
          return { ...h, completedToday: false, streak: Math.max(0, h.streak - 1), lastCompleted: undefined };
        } else {
          // Complete
          const newStreak = h.streak + 1;
          showToast('🔥', `${h.name} complete! ${newStreak} day streak!`);
          if (newStreak % 7 === 0) triggerConfetti();
          return { ...h, completedToday: true, streak: newStreak, lastCompleted: today };
        }
      }
      return h;
    }));
  };

  const addHabit = () => {
    if (!newHabit.name.trim()) return;
    setHabits([...habits, { 
      id: Date.now(), 
      name: newHabit.name.trim(), 
      icon: newHabit.icon || '✓', 
      streak: 0, 
      completedToday: false 
    }]);
    setNewHabit({ name: '', icon: '✓' });
    setHabitModal(false);
    showToast('✨', 'New habit added!');
  };

  const updateHabit = () => {
    if (!editHabitModal) return;
    setHabits(habits.map(h => h.id === editHabitModal.id ? editHabitModal : h));
    setEditHabitModal(null);
    showToast('✓', 'Habit updated!');
  };

  const deleteHabit = (id: number) => {
    setHabits(habits.filter(h => h.id !== id));
    setEditHabitModal(null);
    showToast('🗑️', 'Habit deleted');
  };

  // GOAL FUNCTIONS
  const addGoal = () => {
    if (!newGoal.name.trim()) return;
    setGoals([...goals, { 
      id: Date.now(), 
      name: newGoal.name.trim(), 
      icon: newGoal.icon || '🎯', 
      current: 0, 
      target: parseInt(newGoal.target) || 100 
    }]);
    setNewGoal({ name: '', icon: '🎯', target: '' });
    setGoalModal(false);
    showToast('🎯', 'New goal added!');
  };

  const updateGoal = () => {
    if (!editGoalModal) return;
    setGoals(goals.map(g => g.id === editGoalModal.id ? editGoalModal : g));
    setEditGoalModal(null);
    showToast('✓', 'Goal updated!');
  };

  const incrementGoal = (id: number, amount: number) => {
    setGoals(goals.map(g => {
      if (g.id === id) {
        const newCurrent = Math.min(g.target, Math.max(0, g.current + amount));
        if (newCurrent === g.target && g.current !== g.target) {
          showToast('🎉', `Goal complete: ${g.name}!`);
          triggerConfetti();
        }
        return { ...g, current: newCurrent };
      }
      return g;
    }));
  };

  const deleteGoal = (id: number) => {
    setGoals(goals.filter(g => g.id !== id));
    setEditGoalModal(null);
    showToast('🗑️', 'Goal deleted');
  };

  // DEADLINE FUNCTIONS
  const addDeadline = () => {
    if (!newDeadline.title.trim() || !newDeadline.dueDate) return;
    setDeadlines([...deadlines, {
      id: Date.now(),
      title: newDeadline.title.trim(),
      course: newDeadline.course.trim(),
      dueDate: newDeadline.dueDate,
      done: false
    }]);
    setNewDeadline({ title: '', course: '', dueDate: '' });
    setDeadlineModal(false);
    showToast('📅', 'Deadline added!');
  };

  const toggleDeadline = (id: number) => {
    setDeadlines(deadlines.map(d => {
      if (d.id === id) {
        if (!d.done) showToast('✅', `${d.title} complete!`);
        return { ...d, done: !d.done };
      }
      return d;
    }));
  };

  const updateDeadline = () => {
    if (!editDeadlineModal) return;
    setDeadlines(deadlines.map(d => d.id === editDeadlineModal.id ? editDeadlineModal : d));
    setEditDeadlineModal(null);
    showToast('✓', 'Deadline updated!');
  };

  const deleteDeadline = (id: number) => {
    setDeadlines(deadlines.filter(d => d.id !== id));
    setEditDeadlineModal(null);
    showToast('🗑️', 'Deadline deleted');
  };

  // PROJECT FUNCTIONS
  const addProject = () => {
    if (!newProject.name.trim()) return;
    setProjects([...projects, {
      id: Date.now(),
      name: newProject.name.trim(),
      desc: newProject.desc.trim(),
      icon: newProject.icon || '📁',
      color: newProject.color,
      status: newProject.status
    }]);
    setNewProject({ name: '', desc: '', icon: '📁', color: 'violet', status: 'active' });
    setProjectModal(false);
    showToast('📋', 'Project added!');
  };

  const updateProject = () => {
    if (!editProjectModal) return;
    setProjects(projects.map(p => p.id === editProjectModal.id ? editProjectModal : p));
    setEditProjectModal(null);
    showToast('✓', 'Project updated!');
  };

  const deleteProject = (id: number) => {
    setProjects(projects.filter(p => p.id !== id));
    setEditProjectModal(null);
    showToast('🗑️', 'Project deleted');
  };

  // JOURNAL
  const saveJournal = () => {
    if (!journalInput.trim()) return;
    setJournal([...journal, {
      id: Date.now(),
      date: new Date().toISOString(),
      text: journalInput.trim(),
      mood: mood || undefined
    }]);
    setJournalInput('');
    showToast('📝', 'Thought saved!');
  };

  const selectMood = (m: string) => {
    setMood(m);
    showToast('💚', 'Mood logged!');
  };

  // AI CHAT
  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(msgs => [...msgs, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const context = `Today: ${formatDate()}\nHabits: ${habits.filter(h => h.completedToday).length}/${habits.length}\nGoals: ${goals.length} active\nMood: ${mood || 'not logged'}\nFocus: ${focusMinutes}m today`;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, context, apiKey: settings.apiKey })
      });
      const data = await res.json();
      setChatMessages(msgs => [...msgs, { role: 'assistant', content: data.error ? `⚠️ ${data.error}` : data.reply }]);
    } catch {
      setChatMessages(msgs => [...msgs, { role: 'assistant', content: '⚠️ Connection error.' }]);
    }
    setChatLoading(false);
  };

  // Stats
  const habitsComplete = habits.filter(h => h.lastCompleted === getToday()).length;
  const goalsProgress = goals.length ? Math.round(goals.reduce((sum, g) => sum + (g.current / g.target) * 100, 0) / goals.length) : 0;
  const maxStreak = habits.length ? habits.reduce((max, h) => Math.max(max, h.streak), 0) : 0;
  const quote = quotes[quoteIndex % quotes.length];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 fixed h-screen flex flex-col z-50" style={{ backgroundColor: '#0b0b18', borderRight: '1px solid rgba(255,255,255,0.055)' }}>
        <div className="p-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
            🏛️
          </div>
          <span className="text-lg font-extrabold tracking-tight" style={{ background: 'linear-gradient(to right, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Sanctum
          </span>
        </div>
        
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {[
            { icon: '📊', label: 'Dashboard', active: true },
            { icon: '✓', label: 'Habits' },
            { icon: '🎯', label: 'Goals' },
            { icon: '⏱️', label: 'Focus' },
            { icon: '📝', label: 'Journal' },
          ].map(item => (
            <button
              key={item.label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: item.active ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: item.active ? '#7c3aed' : '#64748b',
                border: item.active ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent'
              }}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          
          <div className="h-px my-3" style={{ backgroundColor: 'rgba(255,255,255,0.055)' }} />
          <div className="text-xs font-bold tracking-widest uppercase px-3 py-2" style={{ color: '#475569' }}>Life</div>
          
          {[
            { icon: '📋', label: 'Projects' },
            { icon: '📅', label: 'Deadlines' },
          ].map(item => (
            <button
              key={item.label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
              style={{ color: '#64748b' }}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          
          <div className="h-px my-3" style={{ backgroundColor: 'rgba(255,255,255,0.055)' }} />
          <button
            onClick={() => setSettingsModal(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
            style={{ color: '#64748b' }}
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.055)' }}>
          <div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.1))', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="text-2xl" style={{ animation: maxStreak > 0 ? 'streak-flame 1s ease-in-out infinite' : 'none' }}>🔥</div>
            <div className="text-3xl font-extrabold" style={{ color: '#f59e0b' }}>{maxStreak}</div>
            <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#64748b' }}>Day Streak</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: '240px', padding: '24px', maxWidth: '1100px', width: '100%' }}>
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{getGreeting()}, {settings.name}.</h1>
            <p className="text-sm" style={{ color: '#64748b' }}>{formatDate()}</p>
          </div>
          <div className="flex gap-3">
            <StatPill icon="✓" value={habits.length > 0 ? `${habitsComplete}/${habits.length}` : '—'} label="habits" color="#10b981" />
            <StatPill icon="🎯" value={goals.length > 0 ? `${goalsProgress}%` : '—'} label="goals" color="#7c3aed" />
            <StatPill icon="⏱️" value={focusMinutes > 0 ? `${focusMinutes}m` : '—'} label="focus" color="#06b6d4" />
          </div>
        </header>

        {/* Weather + Quote Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '24px' }}>
          {/* Weather */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#475569' }}>Weather</div>
            {weather ? (
              <div className="flex items-center gap-4">
                <span className="text-4xl">{weather.current.icon}</span>
                <div>
                  <div className="text-2xl font-bold">{weather.current.temp}°F</div>
                  <div className="text-xs" style={{ color: '#64748b' }}>Feels {weather.current.feelsLike}°</div>
                  <div className="text-xs" style={{ color: '#94a3b8' }}>{weather.current.condition}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm" style={{ color: '#64748b' }}>Set your city in Settings</div>
            )}
          </div>

          {/* Quote */}
          <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b0b18, #08081a)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <span className="absolute -top-5 left-2 text-8xl font-black" style={{ color: 'rgba(124,58,237,0.08)' }}>"</span>
            <p className="text-lg font-medium leading-relaxed mb-2 relative z-10">"{quote.text}"</p>
            <p className="text-sm font-semibold" style={{ color: '#7c3aed' }}>— {quote.author}</p>
            <button
              onClick={() => setQuoteIndex(i => i + 1)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-violet-500/20"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#64748b' }}
            >↻</button>
          </div>
        </div>

        {/* Habits */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#475569' }}>Today's Habits</h2>
            <button onClick={() => setHabitModal(true)} className="text-xs font-semibold transition-colors hover:text-cyan-400" style={{ color: '#7c3aed' }}>+ Add Habit</button>
          </div>
          
          {habits.length === 0 ? (
            <div 
              onClick={() => setHabitModal(true)}
              className="rounded-xl p-8 text-center cursor-pointer transition-all hover:border-violet-500"
              style={{ backgroundColor: '#0b0b18', border: '2px dashed rgba(255,255,255,0.1)' }}
            >
              <div className="text-4xl mb-2">✨</div>
              <div className="text-sm font-medium" style={{ color: '#64748b' }}>Add your first habit to start tracking</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {habits.map(h => (
                <div
                  key={h.id}
                  className="relative rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 group"
                  style={{
                    backgroundColor: h.lastCompleted === getToday() ? 'rgba(16,185,129,0.08)' : '#0b0b18',
                    border: h.lastCompleted === getToday() ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.055)'
                  }}
                >
                  <div onClick={() => toggleHabit(h.id)}>
                    {h.lastCompleted === getToday() && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#10b981' }}>✓</div>
                    )}
                    <div className="text-2xl mb-2">{h.icon}</div>
                    <div className="text-sm font-semibold truncate">{h.name}</div>
                    <div className="text-xs flex items-center gap-1 mt-1" style={{ color: '#f59e0b' }}>🔥 {h.streak}d</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditHabitModal(h); }}
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-xs transition-all"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
                  >✎</button>
                </div>
              ))}
              <div
                onClick={() => setHabitModal(true)}
                className="rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-violet-500"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.055)', color: '#475569', minHeight: '100px' }}
              >
                <span className="text-2xl mb-1">+</span>
                <span className="text-xs">Add</span>
              </div>
            </div>
          )}
        </section>

        {/* Goals + Focus Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px', marginBottom: '24px' }}>
          {/* Goals */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#475569' }}>Goals</h2>
              <button onClick={() => setGoalModal(true)} className="text-xs font-semibold hover:text-cyan-400 transition-colors" style={{ color: '#7c3aed' }}>+ Add Goal</button>
            </div>
            
            {goals.length === 0 ? (
              <div 
                onClick={() => setGoalModal(true)}
                className="rounded-xl p-6 text-center cursor-pointer transition-all hover:border-violet-500"
                style={{ backgroundColor: '#0b0b18', border: '2px dashed rgba(255,255,255,0.1)' }}
              >
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-sm font-medium" style={{ color: '#64748b' }}>Set your first goal</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {goals.map(g => {
                  const pct = Math.round((g.current / g.target) * 100);
                  return (
                    <div key={g.id} className="rounded-xl p-4 flex items-center gap-4 transition-all group" style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: 'rgba(124,58,237,0.15)' }}>{g.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate mb-1.5">{g.name}</div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct >= 100 ? '#10b981' : 'linear-gradient(90deg, #7c3aed, #06b6d4)' }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => incrementGoal(g.id, -1)} className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>−</button>
                        <div className="text-center min-w-[50px]">
                          <div className="text-sm font-bold" style={{ color: pct >= 100 ? '#10b981' : '#7c3aed' }}>{g.current}/{g.target}</div>
                        </div>
                        <button onClick={() => incrementGoal(g.id, 1)} className="w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>+</button>
                      </div>
                      <button
                        onClick={() => setEditGoalModal(g)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-xs transition-all"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
                      >✎</button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Focus Timer */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#475569' }}>Focus Timer</h2>
              {totalFocusSessions > 0 && <span className="text-xs" style={{ color: '#64748b' }}>{totalFocusSessions} sessions</span>}
            </div>
            <div className="rounded-xl p-6 text-center" style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
              <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#475569' }}>
                {timerRunning ? 'FOCUSING...' : 'READY TO FOCUS'}
              </div>
              <div className="text-5xl font-extrabold tabular-nums mb-4" style={{ background: 'linear-gradient(to right, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {formatTimer()}
              </div>
              <div className="flex justify-center gap-3 mb-4">
                <button
                  onClick={() => setTimerRunning(r => !r)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-105"
                  style={{ background: timerRunning ? '#ef4444' : 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
                >{timerRunning ? 'Pause' : 'Start'}</button>
                <button
                  onClick={() => { setTimerRunning(false); setTimerSeconds(timerPreset * 60); }}
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.055)' }}
                >Reset</button>
              </div>
              <div className="flex justify-center gap-2">
                {[25, 45, 60].map(m => (
                  <button
                    key={m}
                    onClick={() => { setTimerPreset(m); if (!timerRunning) setTimerSeconds(m * 60); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: timerPreset === m ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                      color: timerPreset === m ? '#7c3aed' : '#64748b',
                      border: timerPreset === m ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.055)'
                    }}
                  >{m}m</button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Mood + Journal Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Mood */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#475569' }}>How are you feeling?</h2>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
              <div className="flex justify-between gap-2">
                {[
                  { key: 'great', emoji: '😄', label: 'Great' },
                  { key: 'good', emoji: '🙂', label: 'Good' },
                  { key: 'okay', emoji: '😐', label: 'Okay' },
                  { key: 'low', emoji: '😔', label: 'Low' },
                  { key: 'rough', emoji: '😫', label: 'Rough' },
                ].map(m => (
                  <button
                    key={m.key}
                    onClick={() => selectMood(m.key)}
                    className="flex-1 p-3 rounded-xl text-center transition-all hover:-translate-y-0.5"
                    style={{
                      backgroundColor: mood === m.key ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.02)',
                      border: mood === m.key ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.055)'
                    }}
                  >
                    <span className="text-2xl block mb-1">{m.emoji}</span>
                    <span className="text-xs font-semibold" style={{ color: '#64748b' }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Journal */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#475569' }}>Quick Thought</h2>
              {journal.length > 0 && <span className="text-xs" style={{ color: '#64748b' }}>{journal.length} entries</span>}
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
              <textarea
                value={journalInput}
                onChange={e => setJournalInput(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full rounded-xl p-3 text-sm resize-none h-20 focus:outline-none transition-colors focus:border-violet-500"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)', color: '#cbd5e1' }}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs" style={{ color: '#475569' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <button onClick={saveJournal} className="px-4 py-2 rounded-lg text-xs font-semibold text-white hover:bg-violet-600 transition-colors" style={{ backgroundColor: '#7c3aed' }}>Save</button>
              </div>
            </div>
          </section>
        </div>

        {/* Deadlines + Projects Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Deadlines */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#475569' }}>Deadlines</h2>
              <button onClick={() => setDeadlineModal(true)} className="text-xs font-semibold hover:text-cyan-400 transition-colors" style={{ color: '#7c3aed' }}>+ Add</button>
            </div>
            
            {deadlines.length === 0 ? (
              <div 
                onClick={() => setDeadlineModal(true)}
                className="rounded-xl p-6 text-center cursor-pointer transition-all hover:border-violet-500"
                style={{ backgroundColor: '#0b0b18', border: '2px dashed rgba(255,255,255,0.1)' }}
              >
                <div className="text-3xl mb-2">📅</div>
                <div className="text-sm font-medium" style={{ color: '#64748b' }}>Add a deadline</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {deadlines.filter(d => !d.done).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5).map(d => {
                  const diff = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const urgency = diff <= 1 ? 'urgent' : diff <= 3 ? 'soon' : 'ok';
                  const colors: Record<string, string> = { urgent: '#f43f5e', soon: '#f59e0b', ok: '#10b981' };
                  const label = diff < 0 ? 'Overdue' : diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d`;
                  return (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all group"
                      style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)', borderLeft: `4px solid ${colors[diff < 0 ? 'urgent' : urgency]}` }}
                    >
                      <button 
                        onClick={() => toggleDeadline(d.id)} 
                        className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center hover:border-emerald-500 transition-colors" 
                        style={{ border: '2px solid rgba(255,255,255,0.15)' }} 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{d.title}</div>
                        {d.course && <div className="text-xs" style={{ color: '#475569' }}>{d.course}</div>}
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: `${colors[diff < 0 ? 'urgent' : urgency]}15`, color: colors[diff < 0 ? 'urgent' : urgency] }}>{label}</span>
                      <button
                        onClick={() => setEditDeadlineModal(d)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-xs transition-all"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}
                      >✎</button>
                    </div>
                  );
                })}
                {deadlines.filter(d => d.done).length > 0 && (
                  <div className="text-xs mt-2" style={{ color: '#475569' }}>
                    ✓ {deadlines.filter(d => d.done).length} completed
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Projects */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#475569' }}>Projects</h2>
              <button onClick={() => setProjectModal(true)} className="text-xs font-semibold hover:text-cyan-400 transition-colors" style={{ color: '#7c3aed' }}>+ Add</button>
            </div>
            
            {projects.length === 0 ? (
              <div 
                onClick={() => setProjectModal(true)}
                className="rounded-xl p-6 text-center cursor-pointer transition-all hover:border-violet-500"
                style={{ backgroundColor: '#0b0b18', border: '2px dashed rgba(255,255,255,0.1)' }}
              >
                <div className="text-3xl mb-2">📋</div>
                <div className="text-sm font-medium" style={{ color: '#64748b' }}>Add a project</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {projects.slice(0, 4).map(p => {
                  const colorMap: Record<string, string> = { violet: '#7c3aed', cyan: '#06b6d4', amber: '#f59e0b', emerald: '#10b981', rose: '#f43f5e', blue: '#3b82f6' };
                  const statusColors: Record<string, string> = { active: '#10b981', paused: '#f59e0b', planning: '#3b82f6', complete: '#7c3aed' };
                  return (
                    <div 
                      key={p.id} 
                      className="rounded-xl p-4 transition-all cursor-pointer hover:border-white/20 group" 
                      style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}
                      onClick={() => setEditProjectModal(p)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${colorMap[p.color] || colorMap.violet}15` }}>{p.icon}</div>
                        <span className="text-[0.55rem] font-bold tracking-wider uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${statusColors[p.status] || statusColors.active}15`, color: statusColors[p.status] || statusColors.active }}>{p.status}</span>
                      </div>
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      <div className="text-xs truncate" style={{ color: '#64748b' }}>{p.desc}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* AI Coach FAB - Better Icon */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 z-40"
        style={{ 
          background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', 
          boxShadow: '0 4px 20px rgba(124,58,237,0.4), 0 0 40px rgba(6,182,212,0.2)',
          animation: 'pulse-glow 2s ease-in-out infinite'
        }}
      >
        <span style={{ fontSize: '24px' }}>✨</span>
      </button>

      {/* AI Coach Panel */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-96 rounded-2xl shadow-2xl z-50 flex flex-col" style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(124,58,237,0.3)', maxHeight: '500px' }}>
          <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>✨</div>
            <div className="flex-1">
              <div className="font-semibold">AI Coach</div>
              <div className="text-xs" style={{ color: '#64748b' }}>Your motivation partner</div>
            </div>
            <button onClick={() => setChatOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: '#64748b' }}>✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ maxHeight: '300px' }}>
            {chatMessages.map((msg, i) => (
              <div key={i} className="max-w-[85%] p-3 rounded-xl text-sm" style={{ backgroundColor: msg.role === 'user' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)', marginLeft: msg.role === 'user' ? 'auto' : '0' }}>
                {msg.content}
              </div>
            ))}
            {chatLoading && <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>Thinking...</div>}
          </div>

          <div className="p-4 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.055)' }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Ask for motivation..."
              className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }}
            />
            <button onClick={sendChat} disabled={chatLoading} className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50 hover:bg-violet-600 transition-colors" style={{ backgroundColor: '#7c3aed' }}>➤</button>
          </div>
        </div>
      )}

      {/* MODALS */}
      
      {/* Add Habit Modal */}
      {habitModal && (
        <Modal title="Add New Habit" onClose={() => setHabitModal(false)}>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Habit Name</label>
            <input value={newHabit.name} onChange={e => setNewHabit({ ...newHabit, name: e.target.value })} placeholder="e.g., Morning workout" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Icon (emoji)</label>
            <input value={newHabit.icon} onChange={e => setNewHabit({ ...newHabit, icon: e.target.value })} placeholder="💪" maxLength={2} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setHabitModal(false)} className="flex-1 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>Cancel</button>
            <button onClick={addHabit} className="flex-1 py-3 rounded-xl font-semibold text-white hover:bg-violet-600 transition-colors" style={{ backgroundColor: '#7c3aed' }}>Add Habit</button>
          </div>
        </Modal>
      )}

      {/* Edit Habit Modal */}
      {editHabitModal && (
        <Modal title="Edit Habit" onClose={() => setEditHabitModal(null)}>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Habit Name</label>
            <input value={editHabitModal.name} onChange={e => setEditHabitModal({ ...editHabitModal, name: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Icon</label>
            <input value={editHabitModal.icon} onChange={e => setEditHabitModal({ ...editHabitModal, icon: e.target.value })} maxLength={2} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Current Streak</label>
            <input type="number" value={editHabitModal.streak} onChange={e => setEditHabitModal({ ...editHabitModal, streak: parseInt(e.target.value) || 0 })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => deleteHabit(editHabitModal.id)} className="py-3 px-4 rounded-xl font-semibold hover:bg-rose-500/20 transition-colors" style={{ color: '#f43f5e' }}>Delete</button>
            <button onClick={() => setEditHabitModal(null)} className="flex-1 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>Cancel</button>
            <button onClick={updateHabit} className="flex-1 py-3 rounded-xl font-semibold text-white hover:bg-violet-600 transition-colors" style={{ backgroundColor: '#7c3aed' }}>Save</button>
          </div>
        </Modal>
      )}

      {/* Add Goal Modal */}
      {goalModal && (
        <Modal title="Add New Goal" onClose={() => setGoalModal(false)}>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Goal</label>
            <input value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} placeholder="e.g., Read 24 books" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Target Number</label>
            <input value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: e.target.value })} placeholder="24" type="number" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Icon</label>
            <input value={newGoal.icon} onChange={e => setNewGoal({ ...newGoal, icon: e.target.value })} placeholder="📚" maxLength={2} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setGoalModal(false)} className="flex-1 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>Cancel</button>
            <button onClick={addGoal} className="flex-1 py-3 rounded-xl font-semibold text-white hover:bg-violet-600 transition-colors" style={{ backgroundColor: '#7c3aed' }}>Add Goal</button>
          </div>
        </Modal>
      )}

      {/* Edit Goal Modal */}
      {editGoalModal && (
        <Modal title="Edit Goal" onClose={() => setEditGoalModal(null)}>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Goal</label>
            <input value={editGoalModal.name} onChange={e => setEditGoalModal({ ...editGoalModal, name: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Current</label>
              <input type="number" value={editGoalModal.current} onChange={e => setEditGoalModal({ ...editGoalModal, current: parseInt(e.target.value) || 0 })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Target</label>
              <input type="number" value={editGoalModal.target} onChange={e => setEditGoalModal({ ...editGoalModal, target: parseInt(e.target.value) || 1 })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Icon</label>
            <input value={editGoalModal.icon} onChange={e => setEditGoalModal({ ...editGoalModal, icon: e.target.value })} maxLength={2} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => deleteGoal(editGoalModal.id)} className="py-3 px-4 rounded-xl font-semibold hover:bg-rose-500/20 transition-colors" style={{ color: '#f43f5e' }}>Delete</button>
            <button onClick={() => setEditGoalModal(null)} className="flex-1 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>Cancel</button>
            <button onClick={updateGoal} className="flex-1 py-3 rounded-xl font-semibold text-white hover:bg-violet-600 transition-colors" style={{ backgroundColor: '#7c3aed' }}>Save</button>
          </div>
        </Modal>
      )}

      {/* Add Deadline Modal */}
      {deadlineModal && (
        <Modal title="Add Deadline" onClose={() => setDeadlineModal(false)}>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Title</label>
            <input value={newDeadline.title} onChange={e => setNewDeadline({ ...newDeadline, title: e.target.value })} placeholder="e.g., Final Exam" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Course/Category (optional)</label>
            <input value={newDeadline.course} onChange={e => setNewDeadline({ ...newDeadline, course: e.target.value })} placeholder="e.g., Statistics" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Due Date</label>
            <input type="date" value={newDeadline.dueDate} onChange={e => setNewDeadline({ ...newDeadline, dueDate: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDeadlineModal(false)} className="flex-1 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>Cancel</button>
            <button onClick={addDeadline} className="flex-1 py-3 rounded-xl font-semibold text-white hover:bg-violet-600 transition-colors" style={{ backgroundColor: '#7c3aed' }}>Add Deadline</button>
          </div>
        </Modal>
      )}

      {/* Edit Deadline Modal */}
      {editDeadlineModal && (
        <Modal title="Edit Deadline" onClose={() => setEditDeadlineModal(null)}>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Title</label>
            <input value={editDeadlineModal.title} onChange={e => setEditDeadlineModal({ ...editDeadlineModal, title: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Course/Category</label>
            <input value={editDeadlineModal.course} onChange={e => setEditDeadlineModal({ ...editDeadlineModal, course: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Due Date</label>
            <input type="date" value={editDeadlineModal.dueDate} onChange={e => setEditDeadlineModal({ ...editDeadlineModal, dueDate: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => deleteDeadline(editDeadlineModal.id)} className="py-3 px-4 rounded-xl font-semibold hover:bg-rose-500/20 transition-colors" style={{ color: '#f43f5e' }}>Delete</button>
            <button onClick={() => setEditDeadlineModal(null)} className="flex-1 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>Cancel</button>
            <button onClick={updateDeadline} className="flex-1 py-3 rounded-xl font-semibold text-white hover:bg-violet-600 transition-colors" style={{ backgroundColor: '#7c3aed' }}>Save</button>
          </div>
        </Modal>
      )}

      {/* Add Project Modal */}
      {projectModal && (
        <Modal title="Add Project" onClose={() => setProjectModal(false)}>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Project Name</label>
            <input value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} placeholder="e.g., Website Redesign" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Description</label>
            <input value={newProject.desc} onChange={e => setNewProject({ ...newProject, desc: e.target.value })} placeholder="Short description" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Icon</label>
              <input value={newProject.icon} onChange={e => setNewProject({ ...newProject, icon: e.target.value })} placeholder="📁" maxLength={2} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Color</label>
              <select value={newProject.color} onChange={e => setNewProject({ ...newProject, color: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }}>
                <option value="violet">Violet</option>
                <option value="cyan">Cyan</option>
                <option value="amber">Amber</option>
                <option value="emerald">Emerald</option>
                <option value="rose">Rose</option>
                <option value="blue">Blue</option>
              </select>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Status</label>
            <select value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }}>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="paused">Paused</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setProjectModal(false)} className="flex-1 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>Cancel</button>
            <button onClick={addProject} className="flex-1 py-3 rounded-xl font-semibold text-white hover:bg-violet-600 transition-colors" style={{ backgroundColor: '#7c3aed' }}>Add Project</button>
          </div>
        </Modal>
      )}

      {/* Edit Project Modal */}
      {editProjectModal && (
        <Modal title="Edit Project" onClose={() => setEditProjectModal(null)}>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Project Name</label>
            <input value={editProjectModal.name} onChange={e => setEditProjectModal({ ...editProjectModal, name: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Description</label>
            <input value={editProjectModal.desc} onChange={e => setEditProjectModal({ ...editProjectModal, desc: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Icon</label>
              <input value={editProjectModal.icon} onChange={e => setEditProjectModal({ ...editProjectModal, icon: e.target.value })} maxLength={2} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Color</label>
              <select value={editProjectModal.color} onChange={e => setEditProjectModal({ ...editProjectModal, color: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }}>
                <option value="violet">Violet</option>
                <option value="cyan">Cyan</option>
                <option value="amber">Amber</option>
                <option value="emerald">Emerald</option>
                <option value="rose">Rose</option>
                <option value="blue">Blue</option>
              </select>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Status</label>
            <select value={editProjectModal.status} onChange={e => setEditProjectModal({ ...editProjectModal, status: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }}>
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="paused">Paused</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => deleteProject(editProjectModal.id)} className="py-3 px-4 rounded-xl font-semibold hover:bg-rose-500/20 transition-colors" style={{ color: '#f43f5e' }}>Delete</button>
            <button onClick={() => setEditProjectModal(null)} className="flex-1 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>Cancel</button>
            <button onClick={updateProject} className="flex-1 py-3 rounded-xl font-semibold text-white hover:bg-violet-600 transition-colors" style={{ backgroundColor: '#7c3aed' }}>Save</button>
          </div>
        </Modal>
      )}

      {/* Settings Modal */}
      {settingsModal && (
        <Modal title="Settings" onClose={() => setSettingsModal(false)}>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Your Name</label>
            <input value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>City (for weather)</label>
            <input value={settings.city} onChange={e => setSettings({ ...settings, city: e.target.value })} placeholder="New York" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>OpenAI API Key (for AI Coach)</label>
            <input value={settings.apiKey} onChange={e => setSettings({ ...settings, apiKey: e.target.value })} type="password" placeholder="sk-..." className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
            <p className="text-xs mt-2" style={{ color: '#475569' }}>Required for AI coach. Get from platform.openai.com</p>
          </div>
          <button onClick={() => setSettingsModal(false)} className="w-full py-3 rounded-xl font-semibold text-white hover:bg-violet-600 transition-colors" style={{ backgroundColor: '#7c3aed' }}>Save Settings</button>
        </Modal>
      )}

      {/* Toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl px-5 py-3 flex items-center gap-3 shadow-2xl z-[100] transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`} style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(124,58,237,0.3)' }}>
        <span className="text-xl">{toast.icon}</span>
        <span className="text-sm font-medium">{toast.text}</span>
      </div>

      {/* Confetti */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-[200]">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="absolute w-3 h-3" style={{ left: `${Math.random() * 100}%`, backgroundColor: ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e'][Math.floor(Math.random() * 5)], animation: `confetti-fall ${2 + Math.random() * 2}s linear forwards`, animationDelay: `${Math.random() * 0.5}s` }} />
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes streak-flame {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.1); filter: brightness(1.3); }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 4px 20px rgba(124,58,237,0.4), 0 0 40px rgba(6,182,212,0.2); }
          50% { box-shadow: 0 4px 30px rgba(124,58,237,0.6), 0 0 60px rgba(6,182,212,0.3); }
        }
      `}</style>
    </div>
  );
}

function StatPill({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: '#0b0b18', border: `1px solid ${color}33`, color }}>
      <span>{icon}</span>
      <span>{value} {label}</span>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#64748b' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
