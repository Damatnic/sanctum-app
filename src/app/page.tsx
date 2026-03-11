'use client';

import { useState, useEffect } from 'react';

// Types
interface Habit {
  id: number;
  name: string;
  icon: string;
  streak: number;
  completedToday: boolean;
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
];

// Default data
const defaultHabits: Habit[] = [
  { id: 1, name: 'Morning workout', icon: '💪', streak: 12, completedToday: false },
  { id: 2, name: 'Read 30 mins', icon: '📚', streak: 8, completedToday: false },
  { id: 3, name: 'Meditate', icon: '🧘', streak: 5, completedToday: false },
  { id: 4, name: 'No social media', icon: '📵', streak: 3, completedToday: false },
  { id: 5, name: 'Drink 8 glasses', icon: '💧', streak: 15, completedToday: false },
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
];

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>(defaultHabits);
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [deadlines, setDeadlines] = useState<Deadline[]>(defaultDeadlines);
  const [projects] = useState<Project[]>(defaultProjects);
  const [mood, setMood] = useState<string | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [settings, setSettings] = useState({ name: 'Nick', city: 'Waukesha, WI', apiKey: '' });
  const [journalInput, setJournalInput] = useState('');
  
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPreset, setTimerPreset] = useState(25);
  
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hey Nick! I'm your AI coach. Ask me for motivation, productivity tips, or just vent. 🌙" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  const [habitModal, setHabitModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '' });
  const [newGoal, setNewGoal] = useState({ name: '', icon: '', target: '' });
  
  const [toast, setToast] = useState({ show: false, icon: '', text: '' });
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sanctum-data');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.habits) setHabits(data.habits);
      if (data.goals) setGoals(data.goals);
      if (data.deadlines) setDeadlines(data.deadlines);
      if (data.mood) setMood(data.mood);
      if (data.quoteIndex !== undefined) setQuoteIndex(data.quoteIndex);
      if (data.focusMinutes) setFocusMinutes(data.focusMinutes);
      if (data.settings) setSettings(data.settings);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sanctum-data', JSON.stringify({
      habits, goals, deadlines, mood, quoteIndex, focusMinutes, settings
    }));
  }, [habits, goals, deadlines, mood, quoteIndex, focusMinutes, settings]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?city=${encodeURIComponent(settings.city)}`);
        if (res.ok) setWeather(await res.json());
      } catch (e) { console.error('Weather fetch failed', e); }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [settings.city]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(s => s - 1), 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      setFocusMinutes(m => m + timerPreset);
      showToast('🎉', `${timerPreset} minute focus session complete!`);
      triggerConfetti();
      setTimerSeconds(timerPreset * 60);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, timerPreset]);

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
    setHabits([...habits, { id: Date.now(), name: newHabit.name, icon: newHabit.icon || '✓', streak: 0, completedToday: false }]);
    setNewHabit({ name: '', icon: '' });
    setHabitModal(false);
    showToast('✨', 'New habit added!');
  };

  const addGoal = () => {
    if (!newGoal.name) return;
    setGoals([...goals, { id: Date.now(), name: newGoal.name, icon: newGoal.icon || '🎯', current: 0, target: parseInt(newGoal.target) || 100 }]);
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
    setJournalInput('');
    showToast('📝', 'Thought saved!');
  };

  const selectMood = (m: string) => {
    setMood(m);
    showToast('💚', 'Mood logged!');
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(msgs => [...msgs, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const context = `Today: ${formatDate()}\nHabits: ${habits.filter(h => h.completedToday).length}/${habits.length}\nMood: ${mood || 'not logged'}\nFocus: ${focusMinutes}m`;
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

  const habitsComplete = habits.filter(h => h.completedToday).length;
  const goalsProgress = goals.length ? Math.round(goals.reduce((sum, g) => sum + (g.current / g.target) * 100, 0) / goals.length) : 0;
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
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
        
        <nav className="flex-1 p-3 flex flex-col gap-1">
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
            <div className="text-2xl animate-streak-flame">🔥</div>
            <div className="text-3xl font-extrabold" style={{ color: '#f59e0b' }}>{maxStreak}</div>
            <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#64748b' }}>Day Streak</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60 p-6 max-w-5xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{getGreeting()}, {settings.name}.</h1>
            <p className="text-sm" style={{ color: '#64748b' }}>{formatDate()}</p>
          </div>
          <div className="flex gap-3">
            <StatPill icon="✓" value={`${habitsComplete}/${habits.length}`} label="habits" color="#10b981" />
            <StatPill icon="🎯" value={`${goalsProgress}%`} label="goals" color="#7c3aed" />
            <StatPill icon="⏱️" value={`${focusMinutes}m`} label="focus" color="#06b6d4" />
          </div>
        </header>

        {/* Weather + Quote */}
        <div className="grid grid-cols-3 gap-4 mb-6">
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
            ) : <div className="text-sm" style={{ color: '#64748b' }}>Loading...</div>}
          </div>

          <div className="col-span-2 rounded-2xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b0b18, #08081a)', border: '1px solid rgba(124,58,237,0.3)' }}>
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
            <button onClick={() => setHabitModal(true)} className="text-xs font-semibold transition-colors" style={{ color: '#7c3aed' }}>+ Add Habit</button>
          </div>
          <div className="grid grid-cols-6 gap-3">
            {habits.map(h => (
              <div
                key={h.id}
                onClick={() => toggleHabit(h.id)}
                className="relative rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: h.completedToday ? 'rgba(16,185,129,0.05)' : '#0b0b18',
                  border: h.completedToday ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.055)'
                }}
              >
                {h.completedToday && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white animate-check-pop" style={{ backgroundColor: '#10b981' }}>✓</div>
                )}
                <div className="text-2xl mb-2">{h.icon}</div>
                <div className="text-sm font-semibold truncate">{h.name}</div>
                <div className="text-xs flex items-center gap-1 mt-1" style={{ color: '#f59e0b' }}>🔥 {h.streak}d</div>
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
        </section>

        {/* Goals + Focus */}
        <div className="grid grid-cols-5 gap-6 mb-6">
          <section className="col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#475569' }}>Active Goals</h2>
              <button onClick={() => setGoalModal(true)} className="text-xs font-semibold" style={{ color: '#7c3aed' }}>+ Add Goal</button>
            </div>
            <div className="flex flex-col gap-3">
              {goals.map(g => {
                const pct = Math.round((g.current / g.target) * 100);
                return (
                  <div key={g.id} className="rounded-xl p-4 flex items-center gap-4 transition-all" style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: 'rgba(124,58,237,0.15)' }}>{g.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold mb-1.5">{g.name}</div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: '#7c3aed' }}>{pct}%</div>
                      <div className="text-xs" style={{ color: '#475569' }}>{g.current}/{g.target}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#475569' }}>Focus Timer</h2>
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
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
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
                    onClick={() => { setTimerPreset(m); setTimerSeconds(m * 60); }}
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

        {/* Mood + Journal */}
        <div className="grid grid-cols-2 gap-6 mb-6">
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

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#475569' }}>Quick Thought</h2>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
              <textarea
                value={journalInput}
                onChange={e => setJournalInput(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full rounded-xl p-3 text-sm resize-none h-20 focus:outline-none transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)', color: '#cbd5e1' }}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs" style={{ color: '#475569' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <button onClick={saveJournal} className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#7c3aed' }}>Save</button>
              </div>
            </div>
          </section>
        </div>

        {/* Deadlines + Projects */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#475569' }}>Upcoming Deadlines</h2>
            </div>
            <div className="flex flex-col gap-2">
              {deadlines.filter(d => !d.done).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5).map(d => {
                const diff = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const urgency = diff <= 1 ? 'urgent' : diff <= 3 ? 'soon' : 'ok';
                const colors = { urgent: '#f43f5e', soon: '#f59e0b', ok: '#10b981' };
                const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d`;
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)', borderLeft: `4px solid ${colors[urgency]}` }}
                  >
                    <button onClick={() => toggleDeadline(d.id)} className="w-5 h-5 rounded flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.055)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{d.title}</div>
                      <div className="text-xs" style={{ color: '#475569' }}>{d.course}</div>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: `${colors[urgency]}15`, color: colors[urgency] }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: '#475569' }}>Projects</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {projects.slice(0, 4).map(p => {
                const colorMap: Record<string, string> = { violet: '#7c3aed', cyan: '#06b6d4', amber: '#f59e0b', emerald: '#10b981' };
                const statusColors: Record<string, string> = { active: '#10b981', paused: '#f59e0b', planning: '#3b82f6' };
                return (
                  <div key={p.name} className="rounded-xl p-4 transition-all" style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${colorMap[p.color]}15` }}>{p.icon}</div>
                      <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${statusColors[p.status]}15`, color: statusColors[p.status] }}>{p.status}</span>
                    </div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs truncate" style={{ color: '#64748b' }}>{p.desc}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* AI Coach FAB */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-transform hover:scale-110 z-40"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
      >🤖</button>

      {/* AI Coach Panel */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-96 rounded-2xl shadow-2xl z-50 flex flex-col max-h-[500px] animate-scale-in" style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>🤖</div>
            <div className="flex-1">
              <div className="font-semibold">Nyx AI Coach</div>
              <div className="text-xs" style={{ color: '#64748b' }}>Your motivation partner</div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ color: '#64748b' }}>✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 max-h-72">
            {chatMessages.map((msg, i) => (
              <div key={i} className="max-w-[85%] p-3 rounded-xl text-sm" style={{ backgroundColor: msg.role === 'user' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)', marginLeft: msg.role === 'user' ? 'auto' : '0' }}>
                {msg.content}
              </div>
            ))}
            {chatLoading && <div className="p-3 rounded-xl text-sm animate-typing" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>Thinking...</div>}
          </div>

          <div className="p-4 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.055)' }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Ask for motivation..."
              className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }}
            />
            <button onClick={sendChat} disabled={chatLoading} className="px-4 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50" style={{ backgroundColor: '#7c3aed' }}>➤</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {habitModal && <Modal title="Add New Habit" onClose={() => setHabitModal(false)}>
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Habit Name</label>
          <input value={newHabit.name} onChange={e => setNewHabit({ ...newHabit, name: e.target.value })} placeholder="e.g., Morning workout" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
        </div>
        <div className="mb-6">
          <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Icon (emoji)</label>
          <input value={newHabit.icon} onChange={e => setNewHabit({ ...newHabit, icon: e.target.value })} placeholder="e.g., 💪" maxLength={2} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setHabitModal(false)} className="flex-1 py-3 rounded-xl font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>Cancel</button>
          <button onClick={addHabit} className="flex-1 py-3 rounded-xl font-semibold text-white" style={{ backgroundColor: '#7c3aed' }}>Add Habit</button>
        </div>
      </Modal>}

      {goalModal && <Modal title="Add New Goal" onClose={() => setGoalModal(false)}>
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Goal</label>
          <input value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} placeholder="e.g., Read 24 books" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Target Number</label>
          <input value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: e.target.value })} placeholder="e.g., 24" type="number" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
        </div>
        <div className="mb-6">
          <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Icon (emoji)</label>
          <input value={newGoal.icon} onChange={e => setNewGoal({ ...newGoal, icon: e.target.value })} placeholder="e.g., 📚" maxLength={2} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setGoalModal(false)} className="flex-1 py-3 rounded-xl font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>Cancel</button>
          <button onClick={addGoal} className="flex-1 py-3 rounded-xl font-semibold text-white" style={{ backgroundColor: '#7c3aed' }}>Add Goal</button>
        </div>
      </Modal>}

      {settingsModal && <Modal title="Settings" onClose={() => setSettingsModal(false)}>
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>Your Name</label>
          <input value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>City (for weather)</label>
          <input value={settings.city} onChange={e => setSettings({ ...settings, city: e.target.value })} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
        </div>
        <div className="mb-6">
          <label className="block text-xs font-semibold mb-2" style={{ color: '#64748b' }}>OpenAI API Key (for AI Coach)</label>
          <input value={settings.apiKey} onChange={e => setSettings({ ...settings, apiKey: e.target.value })} type="password" placeholder="sk-..." className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9' }} />
          <p className="text-xs mt-2" style={{ color: '#475569' }}>Required for AI coach. Get key from platform.openai.com</p>
        </div>
        <button onClick={() => setSettingsModal(false)} className="w-full py-3 rounded-xl font-semibold text-white" style={{ backgroundColor: '#7c3aed' }}>Save Settings</button>
      </Modal>}

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
      <div className="rounded-2xl p-6 w-full max-w-md animate-scale-in" style={{ backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#64748b' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
