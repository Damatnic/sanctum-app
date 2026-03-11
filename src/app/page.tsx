'use client';

import { useState, useEffect, useCallback } from 'react';

// Types
interface Habit {
  id: number;
  name: string;
  icon: string;
  streak: number;
  completedToday: boolean;
  history: string[];
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
  name: string;
  desc: string;
  icon: string;
  color: string;
  status: string;
}

interface JournalEntry {
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
    humidity: string;
    windSpeed: string;
  };
  forecast: Array<{ high: string; low: string; icon: string }>;
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
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
];

// Default data
const defaultHabits: Habit[] = [
  { id: 1, name: 'Morning workout', icon: '💪', streak: 12, completedToday: false, history: [] },
  { id: 2, name: 'Read 30 mins', icon: '📚', streak: 8, completedToday: false, history: [] },
  { id: 3, name: 'Meditate', icon: '🧘', streak: 5, completedToday: false, history: [] },
  { id: 4, name: 'No social media', icon: '📵', streak: 3, completedToday: false, history: [] },
  { id: 5, name: 'Drink 8 glasses', icon: '💧', streak: 15, completedToday: false, history: [] },
];

const defaultGoals: Goal[] = [
  { id: 1, name: 'Complete AI Data Specialist degree', icon: '🎓', current: 65, target: 100 },
  { id: 2, name: 'Ship Astral Core V2', icon: '🚀', current: 85, target: 100 },
  { id: 3, name: 'Read 24 books', icon: '📖', current: 4, target: 24 },
  { id: 4, name: 'Workout 150 days', icon: '🏋️', current: 42, target: 150 },
];

const defaultDeadlines: Deadline[] = [
  { id: 1, title: 'Stats Final Exam', course: 'Intro to Stats', dueDate: '2026-03-13', done: false },
  { id: 2, title: 'Case Study', course: 'Data Viz', dueDate: '2026-03-11', done: false },
  { id: 3, title: 'Lesson 7 Quiz', course: 'Advanced SQL', dueDate: '2026-03-12', done: false },
  { id: 4, title: 'HW 11 ANOVA', course: 'Intro to Stats', dueDate: '2026-03-12', done: false },
];

const defaultProjects: Project[] = [
  { name: 'Astral Core V2', desc: 'AI mental health platform', icon: '🌟', color: 'violet', status: 'active' },
  { name: 'Astral Tether', desc: 'Peer support mobile app', icon: '🔗', color: 'cyan', status: 'active' },
  { name: 'Sloth Chronicles', desc: "Children's book series", icon: '🦥', color: 'amber', status: 'active' },
  { name: 'Fractured Epoch', desc: '12-book multiverse saga', icon: '⚔️', color: 'emerald', status: 'planning' },
  { name: 'Sanctum', desc: 'Life management dashboard', icon: '🏛️', color: 'violet', status: 'active' },
];

export default function Home() {
  // State
  const [habits, setHabits] = useState<Habit[]>(defaultHabits);
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [deadlines, setDeadlines] = useState<Deadline[]>(defaultDeadlines);
  const [projects] = useState<Project[]>(defaultProjects);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [settings, setSettings] = useState({ name: 'Nick', city: 'Waukesha, WI', apiKey: '' });
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPreset, setTimerPreset] = useState(25);
  
  // AI Coach state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hey Nick! I'm your AI coach. Ask me for motivation, productivity tips, or just vent about what's on your mind. 🌙" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Modals
  const [habitModal, setHabitModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '' });
  const [newGoal, setNewGoal] = useState({ name: '', icon: '', target: '' });
  
  // Toast
  const [toast, setToast] = useState({ show: false, icon: '', text: '' });
  
  // Confetti
  const [confetti, setConfetti] = useState(false);
  
  // Journal input
  const [journalInput, setJournalInput] = useState('');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sanctum-data');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.habits) setHabits(data.habits);
      if (data.goals) setGoals(data.goals);
      if (data.deadlines) setDeadlines(data.deadlines);
      if (data.journal) setJournal(data.journal);
      if (data.mood) setMood(data.mood);
      if (data.quoteIndex) setQuoteIndex(data.quoteIndex);
      if (data.focusMinutes) setFocusMinutes(data.focusMinutes);
      if (data.settings) setSettings(data.settings);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('sanctum-data', JSON.stringify({
      habits, goals, deadlines, journal, mood, quoteIndex, focusMinutes, settings
    }));
  }, [habits, goals, deadlines, journal, mood, quoteIndex, focusMinutes, settings]);

  // Fetch weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?city=${encodeURIComponent(settings.city)}`);
        if (res.ok) {
          const data = await res.json();
          setWeather(data);
        }
      } catch (e) {
        console.error('Weather fetch failed', e);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [settings.city]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      setFocusMinutes(m => m + timerPreset);
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
        setSettingsModal(false);
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

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  };

  const formatTimer = () => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Habit functions
  const toggleHabit = (id: number) => {
    setHabits(habits.map(h => {
      if (h.id === id) {
        const completed = !h.completedToday;
        const newStreak = completed ? h.streak + 1 : Math.max(0, h.streak - 1);
        if (completed) {
          showToast('🔥', `${h.name} complete! ${newStreak} day streak!`);
          if (newStreak % 7 === 0) triggerConfetti();
        }
        return { ...h, completedToday: completed, streak: newStreak };
      }
      return h;
    }));
  };

  const addHabit = () => {
    if (!newHabit.name) return;
    setHabits([...habits, {
      id: Date.now(),
      name: newHabit.name,
      icon: newHabit.icon || '✓',
      streak: 0,
      completedToday: false,
      history: []
    }]);
    setNewHabit({ name: '', icon: '' });
    setHabitModal(false);
    showToast('✨', 'New habit added!');
  };

  const addGoal = () => {
    if (!newGoal.name) return;
    setGoals([...goals, {
      id: Date.now(),
      name: newGoal.name,
      icon: newGoal.icon || '🎯',
      current: 0,
      target: parseInt(newGoal.target) || 100
    }]);
    setNewGoal({ name: '', icon: '', target: '' });
    setGoalModal(false);
    showToast('🎯', 'New goal added!');
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

  const saveJournal = () => {
    if (!journalInput.trim()) return;
    setJournal([...journal, {
      date: new Date().toISOString(),
      text: journalInput,
      mood: mood || undefined
    }]);
    setJournalInput('');
    showToast('📝', 'Thought saved!');
  };

  const selectMood = (m: string) => {
    setMood(m);
    showToast('💚', 'Mood logged!');
  };

  // AI Chat
  const sendChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(msgs => [...msgs, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      // Build context
      const habitsComplete = habits.filter(h => h.completedToday).length;
      const context = `
Today's date: ${formatDate()}
Habits completed today: ${habitsComplete}/${habits.length}
Current mood: ${mood || 'not logged'}
Focus time today: ${focusMinutes} minutes
Active goals: ${goals.map(g => `${g.name} (${Math.round(g.current/g.target*100)}%)`).join(', ')}
Upcoming deadlines: ${deadlines.filter(d => !d.done).slice(0, 3).map(d => d.title).join(', ')}
      `;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context,
          apiKey: settings.apiKey
        })
      });

      const data = await res.json();
      
      if (data.error) {
        setChatMessages(msgs => [...msgs, { 
          role: 'assistant', 
          content: `⚠️ ${data.error}. Add your OpenAI API key in Settings to enable AI coaching.`
        }]);
      } else {
        setChatMessages(msgs => [...msgs, { role: 'assistant', content: data.reply }]);
      }
    } catch (e) {
      setChatMessages(msgs => [...msgs, { 
        role: 'assistant', 
        content: '⚠️ Connection error. Check your internet and try again.'
      }]);
    }
    
    setChatLoading(false);
  };

  // Quick prompts for AI
  const quickPrompts = [
    { icon: '🔥', text: 'Motivate me', prompt: 'Give me a quick burst of motivation to push through right now.' },
    { icon: '🎯', text: 'Focus tip', prompt: 'What\'s one thing I can do right now to improve my focus?' },
    { icon: '💪', text: 'Habit advice', prompt: 'How can I build better habits and maintain my streaks?' },
    { icon: '📊', text: 'Review my day', prompt: 'Based on my progress today, what should I focus on next?' },
  ];

  // Stats
  const habitsComplete = habits.filter(h => h.completedToday).length;
  const goalsProgress = goals.length ? Math.round(goals.reduce((sum, g) => sum + (g.current / g.target) * 100, 0) / goals.length) : 0;
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  const quote = quotes[quoteIndex % quotes.length];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-[var(--card)] border-r border-[var(--border)] fixed h-screen flex flex-col z-50">
        <div className="p-5 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center text-lg">
            🏛️
          </div>
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Sanctum
          </span>
        </div>
        
        <nav className="flex-1 p-3 flex flex-col gap-1">
          <NavItem icon="📊" label="Dashboard" active />
          <NavItem icon="✓" label="Habits" />
          <NavItem icon="🎯" label="Goals" />
          <NavItem icon="⏱️" label="Focus" />
          <NavItem icon="📝" label="Journal" />
          <div className="h-px bg-[var(--border)] my-3" />
          <div className="text-[0.6rem] font-bold tracking-widest uppercase text-slate-600 px-3 py-2">Life</div>
          <NavItem icon="📋" label="Projects" />
          <NavItem icon="📅" label="Deadlines" />
          <div className="h-px bg-[var(--border)] my-3" />
          <button 
            onClick={() => setSettingsModal(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
          <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl animate-streak-flame">🔥</div>
            <div className="text-3xl font-extrabold text-amber-400">{maxStreak}</div>
            <div className="text-[0.6rem] font-semibold tracking-widest uppercase text-slate-500">Day Streak</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60 p-6 max-w-5xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{getGreeting()}, {settings.name}.</h1>
            <p className="text-sm text-slate-500">{formatDate()}</p>
          </div>
          <div className="flex gap-3">
            <StatPill icon="✓" value={`${habitsComplete}/${habits.length}`} label="habits" color="emerald" />
            <StatPill icon="🎯" value={`${goalsProgress}%`} label="goals" color="violet" />
            <StatPill icon="⏱️" value={`${focusMinutes}m`} label="focus" color="cyan" />
          </div>
        </header>

        {/* Weather + Quote */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Weather */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
            <div className="text-xs font-bold tracking-widest uppercase text-slate-600 mb-3">Weather</div>
            {weather ? (
              <div className="flex items-center gap-4">
                <span className="text-4xl">{weather.current.icon}</span>
                <div>
                  <div className="text-2xl font-bold">{weather.current.temp}°F</div>
                  <div className="text-xs text-slate-500">Feels {weather.current.feelsLike}°</div>
                  <div className="text-xs text-slate-400">{weather.current.condition}</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">Loading...</div>
            )}
          </div>

          {/* Quote */}
          <div className="col-span-2 bg-gradient-to-br from-[var(--card)] to-[var(--bg-alt)] border border-[var(--border-accent)] rounded-2xl p-5 relative overflow-hidden">
            <span className="absolute -top-5 left-2 text-8xl font-black text-violet-500/10">"</span>
            <p className="text-lg font-medium leading-relaxed mb-2 relative z-10">"{quote.text}"</p>
            <p className="text-sm font-semibold text-violet-400">— {quote.author}</p>
            <button 
              onClick={() => setQuoteIndex(i => i + 1)}
              className="absolute top-4 right-4 w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-slate-500 hover:bg-violet-500/20 hover:text-violet-400 transition-all"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Habits */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold tracking-widest uppercase text-slate-600">Today's Habits</h2>
            <button onClick={() => setHabitModal(true)} className="text-xs font-semibold text-violet-400 hover:text-cyan-400 transition-colors">
              + Add Habit
            </button>
          </div>
          <div className="grid grid-cols-6 gap-3">
            {habits.map(h => (
              <div
                key={h.id}
                onClick={() => toggleHabit(h.id)}
                className={`relative bg-[var(--card)] border rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 ${
                  h.completedToday 
                    ? 'border-emerald-500/30 bg-gradient-to-br from-[var(--card)] to-emerald-500/5' 
                    : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                }`}
              >
                {h.completedToday && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[0.6rem] font-bold text-white animate-check-pop">
                    ✓
                  </div>
                )}
                <div className="text-2xl mb-2">{h.icon}</div>
                <div className="text-sm font-semibold truncate">{h.name}</div>
                <div className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                  🔥 {h.streak}d
                </div>
              </div>
            ))}
            <div
              onClick={() => setHabitModal(true)}
              className="bg-white/[0.02] border-2 border-dashed border-[var(--border)] rounded-xl p-4 flex flex-col items-center justify-center text-slate-600 hover:border-violet-500 hover:text-violet-400 cursor-pointer transition-all min-h-[100px]"
            >
              <span className="text-2xl mb-1">+</span>
              <span className="text-xs">Add</span>
            </div>
          </div>
        </section>

        {/* Two Column: Goals + Focus */}
        <div className="grid grid-cols-5 gap-6 mb-6">
          {/* Goals */}
          <section className="col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase text-slate-600">Active Goals</h2>
              <button onClick={() => setGoalModal(true)} className="text-xs font-semibold text-violet-400 hover:text-cyan-400 transition-colors">
                + Add Goal
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {goals.map(g => {
                const pct = Math.round((g.current / g.target) * 100);
                return (
                  <div key={g.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4 hover:border-[var(--border-hover)] transition-all">
                    <div className="w-10 h-10 bg-violet-500/15 rounded-lg flex items-center justify-center text-xl">
                      {g.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold mb-1.5">{g.name}</div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-violet-400">{pct}%</div>
                      <div className="text-xs text-slate-600">{g.current}/{g.target}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Focus Timer */}
          <section className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase text-slate-600">Focus Timer</h2>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 text-center">
              <div className="text-xs font-semibold tracking-widest uppercase text-slate-600 mb-2">
                {timerRunning ? 'FOCUSING...' : timerSeconds < timerPreset * 60 ? 'PAUSED' : 'READY TO FOCUS'}
              </div>
              <div className="text-5xl font-extrabold bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent tabular-nums mb-4">
                {formatTimer()}
              </div>
              <div className="flex justify-center gap-3 mb-4">
                <button
                  onClick={() => setTimerRunning(r => !r)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:scale-105 hover:shadow-lg hover:shadow-violet-500/30 transition-all"
                >
                  {timerRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={() => { setTimerRunning(false); setTimerSeconds(timerPreset * 60); }}
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-white/5 border border-[var(--border)] text-slate-400 hover:bg-white/10 transition-all"
                >
                  Reset
                </button>
              </div>
              <div className="flex justify-center gap-2">
                {[25, 45, 60].map(m => (
                  <button
                    key={m}
                    onClick={() => { setTimerPreset(m); setTimerSeconds(m * 60); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      timerPreset === m 
                        ? 'bg-violet-500/20 border-violet-500 text-violet-400 border' 
                        : 'bg-white/[0.03] border border-[var(--border)] text-slate-500 hover:border-violet-500 hover:text-violet-400'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Mood + Journal */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Mood */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase text-slate-600">How are you feeling?</h2>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
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
                    className={`flex-1 p-3 rounded-xl text-center transition-all hover:-translate-y-0.5 ${
                      mood === m.key 
                        ? 'border-violet-500 bg-violet-500/15 border' 
                        : 'bg-white/[0.02] border border-[var(--border)] hover:border-[var(--border-hover)]'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{m.emoji}</span>
                    <span className="text-[0.6rem] font-semibold text-slate-500">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Journal */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase text-slate-600">Quick Thought</h2>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
              <textarea
                value={journalInput}
                onChange={e => setJournalInput(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-white/[0.02] border border-[var(--border)] rounded-xl p-3 text-sm text-slate-200 resize-none h-20 focus:border-violet-500 focus:outline-none transition-colors placeholder:text-slate-600"
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-slate-600">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <button
                  onClick={saveJournal}
                  className="px-4 py-2 bg-violet-500 rounded-lg text-xs font-semibold text-white hover:bg-violet-600 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Deadlines + Projects */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Deadlines */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase text-slate-600">Upcoming Deadlines</h2>
            </div>
            <div className="flex flex-col gap-2">
              {deadlines.filter(d => !d.done).sort((a, b) => 
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
              ).slice(0, 5).map(d => {
                const diff = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const urgency = diff <= 1 ? 'urgent' : diff <= 3 ? 'soon' : 'ok';
                const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d`;
                return (
                  <div
                    key={d.id}
                    className={`flex items-center gap-3 p-3 bg-[var(--card)] border rounded-xl transition-all hover:border-[var(--border-hover)] ${
                      urgency === 'urgent' ? 'border-l-4 border-l-rose-500 border-[var(--border)]' :
                      urgency === 'soon' ? 'border-l-4 border-l-amber-500 border-[var(--border)]' :
                      'border-l-4 border-l-emerald-500 border-[var(--border)]'
                    }`}
                  >
                    <button
                      onClick={() => toggleDeadline(d.id)}
                      className="w-5 h-5 border-2 border-[var(--border)] rounded hover:border-emerald-500 transition-colors flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{d.title}</div>
                      <div className="text-xs text-slate-600">{d.course}</div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      urgency === 'urgent' ? 'bg-rose-500/15 text-rose-400' :
                      urgency === 'soon' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Projects */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase text-slate-600">Projects</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {projects.slice(0, 4).map(p => (
                <div key={p.name} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--border-hover)] transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                      p.color === 'violet' ? 'bg-violet-500/15' :
                      p.color === 'cyan' ? 'bg-cyan-500/15' :
                      p.color === 'amber' ? 'bg-amber-500/15' :
                      'bg-emerald-500/15'
                    }`}>
                      {p.icon}
                    </div>
                    <span className={`text-[0.55rem] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                      p.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
                      p.status === 'paused' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-blue-500/15 text-blue-400'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-500 line-clamp-1">{p.desc}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* AI Coach FAB */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-violet-500/30 hover:scale-110 transition-transform z-40"
      >
        🤖
      </button>

      {/* AI Coach Panel */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-[var(--card)] border border-[var(--border-accent)] rounded-2xl shadow-2xl z-50 flex flex-col max-h-[500px] animate-scale-in">
          <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center text-lg">
              🤖
            </div>
            <div className="flex-1">
              <div className="font-semibold">Nyx AI Coach</div>
              <div className="text-xs text-slate-500">Your motivation partner</div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-slate-300">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 max-h-72">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] p-3 rounded-xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-violet-500/20 ml-auto' 
                    : 'bg-white/5'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="bg-white/5 p-3 rounded-xl text-sm max-w-[85%]">
                <span className="animate-typing">Thinking...</span>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-[var(--border)]">
            {quickPrompts.map(p => (
              <button
                key={p.text}
                onClick={() => { setChatInput(p.prompt); }}
                className="flex-shrink-0 px-3 py-1.5 bg-white/5 border border-[var(--border)] rounded-lg text-xs font-medium text-slate-400 hover:border-violet-500 hover:text-violet-400 transition-all flex items-center gap-1.5"
              >
                <span>{p.icon}</span>
                <span>{p.text}</span>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-[var(--border)] flex gap-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Ask for motivation..."
              className="flex-1 bg-white/5 border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none transition-colors placeholder:text-slate-600"
            />
            <button
              onClick={sendChat}
              disabled={chatLoading}
              className="px-4 py-2.5 bg-violet-500 rounded-xl font-semibold text-sm text-white hover:bg-violet-600 transition-colors disabled:opacity-50"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {habitModal && (
        <Modal title="Add New Habit" onClose={() => setHabitModal(false)}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-2">Habit Name</label>
            <input
              value={newHabit.name}
              onChange={e => setNewHabit({ ...newHabit, name: e.target.value })}
              placeholder="e.g., Morning workout"
              className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:border-violet-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-500 mb-2">Icon (emoji)</label>
            <input
              value={newHabit.icon}
              onChange={e => setNewHabit({ ...newHabit, icon: e.target.value })}
              placeholder="e.g., 💪"
              maxLength={2}
              className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:border-violet-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setHabitModal(false)} className="flex-1 py-3 bg-white/5 rounded-xl font-semibold text-slate-400">
              Cancel
            </button>
            <button onClick={addHabit} className="flex-1 py-3 bg-violet-500 rounded-xl font-semibold text-white">
              Add Habit
            </button>
          </div>
        </Modal>
      )}

      {goalModal && (
        <Modal title="Add New Goal" onClose={() => setGoalModal(false)}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-2">Goal</label>
            <input
              value={newGoal.name}
              onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
              placeholder="e.g., Read 24 books"
              className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:border-violet-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-2">Target Number</label>
            <input
              value={newGoal.target}
              onChange={e => setNewGoal({ ...newGoal, target: e.target.value })}
              placeholder="e.g., 24"
              type="number"
              className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:border-violet-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-500 mb-2">Icon (emoji)</label>
            <input
              value={newGoal.icon}
              onChange={e => setNewGoal({ ...newGoal, icon: e.target.value })}
              placeholder="e.g., 📚"
              maxLength={2}
              className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:border-violet-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setGoalModal(false)} className="flex-1 py-3 bg-white/5 rounded-xl font-semibold text-slate-400">
              Cancel
            </button>
            <button onClick={addGoal} className="flex-1 py-3 bg-violet-500 rounded-xl font-semibold text-white">
              Add Goal
            </button>
          </div>
        </Modal>
      )}

      {settingsModal && (
        <Modal title="Settings" onClose={() => setSettingsModal(false)}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-2">Your Name</label>
            <input
              value={settings.name}
              onChange={e => setSettings({ ...settings, name: e.target.value })}
              className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:border-violet-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-2">City (for weather)</label>
            <input
              value={settings.city}
              onChange={e => setSettings({ ...settings, city: e.target.value })}
              className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:border-violet-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-500 mb-2">OpenAI API Key (for AI Coach)</label>
            <input
              value={settings.apiKey}
              onChange={e => setSettings({ ...settings, apiKey: e.target.value })}
              type="password"
              placeholder="sk-..."
              className="w-full bg-white/5 border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:border-violet-500 focus:outline-none transition-colors"
            />
            <p className="text-xs text-slate-600 mt-2">Required for AI motivation coach. Get key from platform.openai.com</p>
          </div>
          <button onClick={() => setSettingsModal(false)} className="w-full py-3 bg-violet-500 rounded-xl font-semibold text-white">
            Save Settings
          </button>
        </Modal>
      )}

      {/* Toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--card)] border border-[var(--border-accent)] rounded-xl px-5 py-3 flex items-center gap-3 shadow-2xl z-[100] transition-all duration-300 ${
        toast.show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      }`}>
        <span className="text-xl">{toast.icon}</span>
        <span className="text-sm font-medium">{toast.text}</span>
      </div>

      {/* Confetti */}
      {confetti && (
        <div className="fixed inset-0 pointer-events-none z-[200]">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e'][Math.floor(Math.random() * 5)],
                animation: `confetti-fall ${2 + Math.random() * 2}s linear forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Components
function NavItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <button className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active 
        ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30' 
        : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
    }`}>
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function StatPill({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  const colorClasses = {
    emerald: 'text-emerald-400 border-emerald-500/20',
    violet: 'text-violet-400 border-violet-500/20',
    cyan: 'text-cyan-400 border-cyan-500/20',
  }[color] || 'text-slate-400 border-slate-500/20';

  return (
    <div className={`flex items-center gap-2 px-4 py-2 bg-[var(--card)] border rounded-full text-sm font-semibold ${colorClasses}`}>
      <span>{icon}</span>
      <span>{value} {label}</span>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-slate-500 hover:bg-rose-500/20 hover:text-rose-400 transition-all">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
