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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        backgroundColor: '#0b0b18',
        borderRight: '1px solid rgba(255,255,255,0.055)'
      }}>
        {/* Logo */}
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', flexShrink: 0 }}>
            🏛️
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(to right, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Sanctum
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { icon: '📊', label: 'Dashboard', active: true },
            { icon: '✓', label: 'Habits' },
            { icon: '🎯', label: 'Goals' },
            { icon: '⏱️', label: 'Focus' },
            { icon: '📝', label: 'Journal' },
          ].map(item => (
            <button
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                backgroundColor: item.active ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: item.active ? '#7c3aed' : '#64748b',
                border: item.active ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <div style={{ height: '1px', margin: '12px 0', backgroundColor: 'rgba(255,255,255,0.055)' }} />
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', padding: '8px 12px', color: '#475569' }}>Life</div>

          {[
            { icon: '📋', label: 'Projects' },
            { icon: '📅', label: 'Deadlines' },
          ].map(item => (
            <button
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                backgroundColor: 'transparent',
                color: '#64748b',
                border: '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <div style={{ height: '1px', margin: '12px 0', backgroundColor: 'rgba(255,255,255,0.055)' }} />
          <button
            onClick={() => setSettingsModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              backgroundColor: 'transparent',
              color: '#64748b',
              border: '1px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        </nav>

        {/* Streak badge */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.055)' }}>
          <div style={{ borderRadius: '12px', padding: '16px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.1))', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="animate-streak-flame" style={{ fontSize: '28px' }}>🔥</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>{maxStreak}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#64748b' }}>Day Streak</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ marginLeft: '240px', flex: 1, padding: '24px', maxWidth: 'calc(100vw - 240px)', boxSizing: 'border-box' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>{getGreeting()}, {settings.name}.</h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, marginTop: '2px' }}>{formatDate()}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <StatPill icon="✓" value={`${habitsComplete}/${habits.length}`} label="habits" color="#10b981" />
            <StatPill icon="🎯" value={`${goalsProgress}%`} label="goals" color="#7c3aed" />
            <StatPill icon="⏱️" value={`${focusMinutes}m`} label="focus" color="#06b6d4" />
          </div>
        </header>

        {/* Weather + Quote — 3-col grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '24px' }}>
          {/* Weather */}
          <div style={{ borderRadius: '16px', padding: '16px', backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#475569', marginBottom: '12px' }}>Weather</div>
            {weather ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '40px' }}>{weather.current.icon}</span>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>{weather.current.temp}°F</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Feels {weather.current.feelsLike}°</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{weather.current.condition}</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: '#64748b' }}>Loading weather...</div>
            )}
          </div>

          {/* Quote */}
          <div style={{ borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0b0b18, #08081a)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <span style={{ position: 'absolute', top: '-20px', left: '8px', fontSize: '80px', fontWeight: 900, color: 'rgba(124,58,237,0.08)', lineHeight: 1 }}>"</span>
            <p style={{ fontSize: '16px', fontWeight: 500, lineHeight: 1.6, marginBottom: '8px', position: 'relative', zIndex: 1 }}>"{quote.text}"</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#7c3aed', margin: 0 }}>— {quote.author}</p>
            <button
              onClick={() => setQuoteIndex(i => i + 1)}
              style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.05)', color: '#64748b', border: 'none', fontSize: '16px' }}
            >↻</button>
          </div>
        </div>

        {/* Habits */}
        <section style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#475569', margin: 0 }}>Today&apos;s Habits</h2>
            <button onClick={() => setHabitModal(true)} style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Habit</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
            {habits.map(h => (
              <div
                key={h.id}
                onClick={() => toggleHabit(h.id)}
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                  backgroundColor: h.completedToday ? 'rgba(16,185,129,0.05)' : '#0b0b18',
                  border: h.completedToday ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.055)'
                }}
              >
                {h.completedToday && (
                  <div className="animate-check-pop" style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white', backgroundColor: '#10b981' }}>✓</div>
                )}
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{h.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</div>
                <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#f59e0b' }}>🔥 {h.streak}d</div>
              </div>
            ))}
            <div
              onClick={() => setHabitModal(true)}
              style={{ borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.055)', color: '#475569', minHeight: '100px' }}
            >
              <span style={{ fontSize: '24px', marginBottom: '4px' }}>+</span>
              <span style={{ fontSize: '12px' }}>Add</span>
            </div>
          </div>
        </section>

        {/* Goals + Focus */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px', marginBottom: '24px' }}>
          {/* Goals */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#475569', margin: 0 }}>Active Goals</h2>
              <button onClick={() => setGoalModal(true)} style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Goal</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {goals.map(g => {
                const pct = Math.round((g.current / g.target) * 100);
                return (
                  <div key={g.id} style={{ borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', backgroundColor: 'rgba(124,58,237,0.15)', flexShrink: 0 }}>{g.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>{g.name}</div>
                      <div style={{ height: '6px', borderRadius: '9999px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        <div style={{ height: '100%', borderRadius: '9999px', width: `${pct}%`, background: 'linear-gradient(90deg, #7c3aed, #06b6d4)', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#7c3aed' }}>{pct}%</div>
                      <div style={{ fontSize: '12px', color: '#475569' }}>{g.current}/{g.target}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Focus Timer */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#475569', margin: 0 }}>Focus Timer</h2>
            </div>
            <div style={{ borderRadius: '12px', padding: '24px', textAlign: 'center', backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: '#475569', marginBottom: '8px' }}>
                {timerRunning ? 'FOCUSING...' : 'READY TO FOCUS'}
              </div>
              <div style={{ fontSize: '48px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', marginBottom: '16px', background: 'linear-gradient(to right, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {formatTimer()}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                <button
                  onClick={() => setTimerRunning(r => !r)}
                  style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '14px', color: 'white', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #7c3aed, #9333ea)', transition: 'transform 0.15s' }}
                >{timerRunning ? 'Pause' : 'Start'}</button>
                <button
                  onClick={() => { setTimerRunning(false); setTimerSeconds(timerPreset * 60); }}
                  style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.055)' }}
                >Reset</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {[25, 45, 60].map(m => (
                  <button
                    key={m}
                    onClick={() => { setTimerPreset(m); setTimerSeconds(m * 60); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Mood */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#475569', margin: 0 }}>How are you feeling?</h2>
            </div>
            <div style={{ borderRadius: '12px', padding: '16px', backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
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
                    style={{
                      flex: 1,
                      padding: '12px 4px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: mood === m.key ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.02)',
                      border: mood === m.key ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.055)',
                      transition: 'transform 0.15s'
                    }}
                  >
                    <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>{m.emoji}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Journal */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#475569', margin: 0 }}>Quick Thought</h2>
            </div>
            <div style={{ borderRadius: '12px', padding: '16px', backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
              <textarea
                value={journalInput}
                onChange={e => setJournalInput(e.target.value)}
                placeholder="What's on your mind?"
                style={{ width: '100%', borderRadius: '12px', padding: '12px', fontSize: '14px', resize: 'none', height: '80px', outline: 'none', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)', color: '#cbd5e1', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <span style={{ fontSize: '12px', color: '#475569' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <button onClick={saveJournal} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: 'white', backgroundColor: '#7c3aed', border: 'none', cursor: 'pointer' }}>Save</button>
              </div>
            </div>
          </section>
        </div>

        {/* Deadlines + Projects */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Deadlines */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#475569', margin: 0 }}>Upcoming Deadlines</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {deadlines.filter(d => !d.done).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5).map(d => {
                const diff = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const urgency = diff <= 1 ? 'urgent' : diff <= 3 ? 'soon' : 'ok';
                const colors: Record<string, string> = { urgent: '#f43f5e', soon: '#f59e0b', ok: '#10b981' };
                const label = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d`;
                return (
                  <div
                    key={d.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)', borderLeft: `4px solid ${colors[urgency]}` }}
                  >
                    <button onClick={() => toggleDeadline(d.id)} style={{ width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0, backgroundColor: 'transparent', border: '2px solid rgba(255,255,255,0.055)', cursor: 'pointer' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                      <div style={{ fontSize: '12px', color: '#475569' }}>{d.course}</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', backgroundColor: `${colors[urgency]}20`, color: colors[urgency], flexShrink: 0 }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Projects */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#475569', margin: 0 }}>Projects</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {projects.slice(0, 4).map(p => {
                const colorMap: Record<string, string> = { violet: '#7c3aed', cyan: '#06b6d4', amber: '#f59e0b', emerald: '#10b981' };
                const statusColors: Record<string, string> = { active: '#10b981', paused: '#f59e0b', planning: '#3b82f6' };
                return (
                  <div key={p.name} style={{ borderRadius: '12px', padding: '16px', backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', backgroundColor: `${colorMap[p.color]}20` }}>{p.icon}</div>
                      <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '6px', backgroundColor: `${statusColors[p.status]}20`, color: statusColors[p.status] }}>{p.status}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.desc}</div>
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
        style={{ position: 'fixed', bottom: '24px', right: '24px', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', cursor: 'pointer', zIndex: 40, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #9333ea)', boxShadow: '0 4px 20px rgba(124,58,237,0.4)', transition: 'transform 0.2s' }}
      >🤖</button>

      {/* AI Coach Panel */}
      {chatOpen && (
        <div className="animate-scale-in" style={{ position: 'fixed', bottom: '96px', right: '24px', width: '384px', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', flexDirection: 'column', maxHeight: '500px', backgroundColor: '#0b0b18', border: '1px solid rgba(124,58,237,0.3)' }}>
          <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', flexShrink: 0 }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Nyx AI Coach</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Your motivation partner</div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '288px' }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ maxWidth: '85%', padding: '12px', borderRadius: '12px', fontSize: '14px', backgroundColor: msg.role === 'user' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)', marginLeft: msg.role === 'user' ? 'auto' : '0' }}>
                {msg.content}
              </div>
            ))}
            {chatLoading && <div className="animate-typing" style={{ padding: '12px', borderRadius: '12px', fontSize: '14px', backgroundColor: 'rgba(255,255,255,0.05)' }}>Thinking...</div>}
          </div>

          <div style={{ padding: '16px', display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.055)' }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Ask for motivation..."
              style={{ flex: 1, borderRadius: '12px', padding: '10px 16px', fontSize: '14px', outline: 'none', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9', fontFamily: 'inherit' }}
            />
            <button onClick={sendChat} disabled={chatLoading} style={{ padding: '10px 16px', borderRadius: '12px', fontWeight: 600, fontSize: '14px', color: 'white', backgroundColor: '#7c3aed', border: 'none', cursor: 'pointer', opacity: chatLoading ? 0.5 : 1 }}>➤</button>
          </div>
        </div>
      )}

      {/* Habit Modal */}
      {habitModal && <Modal title="Add New Habit" onClose={() => setHabitModal(false)}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#64748b' }}>Habit Name</label>
          <input value={newHabit.name} onChange={e => setNewHabit({ ...newHabit, name: e.target.value })} placeholder="e.g., Morning workout" style={{ width: '100%', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#64748b' }}>Icon (emoji)</label>
          <input value={newHabit.icon} onChange={e => setNewHabit({ ...newHabit, icon: e.target.value })} placeholder="e.g., 💪" maxLength={2} style={{ width: '100%', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setHabitModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none' }}>Cancel</button>
          <button onClick={addHabit} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 600, color: 'white', cursor: 'pointer', backgroundColor: '#7c3aed', border: 'none' }}>Add Habit</button>
        </div>
      </Modal>}

      {/* Goal Modal */}
      {goalModal && <Modal title="Add New Goal" onClose={() => setGoalModal(false)}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#64748b' }}>Goal</label>
          <input value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} placeholder="e.g., Read 24 books" style={{ width: '100%', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#64748b' }}>Target Number</label>
          <input value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: e.target.value })} placeholder="e.g., 24" type="number" style={{ width: '100%', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#64748b' }}>Icon (emoji)</label>
          <input value={newGoal.icon} onChange={e => setNewGoal({ ...newGoal, icon: e.target.value })} placeholder="e.g., 📚" maxLength={2} style={{ width: '100%', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setGoalModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: 'none' }}>Cancel</button>
          <button onClick={addGoal} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 600, color: 'white', cursor: 'pointer', backgroundColor: '#7c3aed', border: 'none' }}>Add Goal</button>
        </div>
      </Modal>}

      {/* Settings Modal */}
      {settingsModal && <Modal title="Settings" onClose={() => setSettingsModal(false)}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#64748b' }}>Your Name</label>
          <input value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} style={{ width: '100%', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#64748b' }}>City (for weather)</label>
          <input value={settings.city} onChange={e => setSettings({ ...settings, city: e.target.value })} style={{ width: '100%', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#64748b' }}>OpenAI API Key (for AI Coach)</label>
          <input value={settings.apiKey} onChange={e => setSettings({ ...settings, apiKey: e.target.value })} type="password" placeholder="sk-..." style={{ width: '100%', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.055)', color: '#f1f5f9', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <p style={{ fontSize: '12px', marginTop: '8px', color: '#475569' }}>Required for AI coach. Get key from platform.openai.com</p>
        </div>
        <button onClick={() => setSettingsModal(false)} style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 600, color: 'white', cursor: 'pointer', backgroundColor: '#7c3aed', border: 'none' }}>Save Settings</button>
      </Modal>}

      {/* Toast */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: `translateX(-50%) translateY(${toast.show ? '0' : '16px'})`,
        borderRadius: '12px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        zIndex: 100,
        opacity: toast.show ? 1 : 0,
        pointerEvents: toast.show ? 'auto' : 'none',
        transition: 'all 0.3s',
        backgroundColor: '#0b0b18',
        border: '1px solid rgba(124,58,237,0.3)'
      }}>
        <span style={{ fontSize: '20px' }}>{toast.icon}</span>
        <span style={{ fontSize: '14px', fontWeight: 500 }}>{toast.text}</span>
      </div>

      {/* Confetti */}
      {confetti && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 200 }}>
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', width: '12px', height: '12px', left: `${Math.random() * 100}%`, backgroundColor: ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e'][Math.floor(Math.random() * 5)], animation: `confetti-fall ${2 + Math.random() * 2}s linear forwards`, animationDelay: `${Math.random() * 0.5}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatPill({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '9999px', fontSize: '14px', fontWeight: 600, backgroundColor: '#0b0b18', border: `1px solid ${color}33`, color }}>
      <span>{icon}</span>
      <span>{value} {label}</span>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="animate-scale-in" style={{ borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '448px', backgroundColor: '#0b0b18', border: '1px solid rgba(255,255,255,0.055)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.05)', color: '#64748b', border: 'none', fontSize: '14px' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
