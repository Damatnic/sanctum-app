'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { habitsApi, goalsApi, deadlinesApi, projectsApi, journalsApi, focusApi, moodsApi, settingsApi, statsApi, exportApi, syncFromApi } from '@/lib/api';

// IMPORTANT: Increment this when data structure changes to force reset
const DATA_VERSION = 2;

// Types
interface Habit {
  id: string;
  name: string;
  icon: string;
  streak: number;
  longestStreak?: number;
  todayCompleted: boolean;
  completions?: string[];
}

interface Goal {
  id: string;
  name: string;
  icon: string;
  current: number;
  target: number;
  category?: string;
}

interface Deadline {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  done: boolean;
}

interface Project {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  status: string;
}

interface JournalEntry {
  id: string;
  createdAt: string;
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

interface SanctumData {
  version: number;
  habits: Habit[];
  goals: Goal[];
  deadlines: Deadline[];
  projects: Project[];
  journal: JournalEntry[];
  mood: string | null;
  quoteIndex: number;
  focusMinutes: number;
  totalFocusSessions: number;
  settings: { name: string; city: string; apiKey: string };
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
];

// AI-suggested examples for empty states
const suggestedHabits = [
  { name: "Morning Meditation", icon: "🧘", desc: "Start your day with clarity" },
  { name: "Read 20 mins", icon: "📚", desc: "Build knowledge daily" },
  { name: "Exercise", icon: "💪", desc: "Move your body" },
  { name: "Drink 8 glasses", icon: "💧", desc: "Stay hydrated" },
  { name: "No phone before bed", icon: "📵", desc: "Better sleep quality" },
  { name: "Gratitude journal", icon: "🙏", desc: "Shift your mindset" },
];

const suggestedGoals = [
  { name: "Read 12 books this year", icon: "📖", target: 12 },
  { name: "Workout 100 times", icon: "🏋️", target: 100 },
  { name: "Save $5,000", icon: "💰", target: 5000 },
  { name: "Learn 500 vocab words", icon: "🎓", target: 500 },
  { name: "Complete 50 projects", icon: "✅", target: 50 },
  { name: "Meditate 30 days", icon: "🧘", target: 30 },
];

const journalPrompts = [
  "What are you grateful for today?",
  "What's one thing you learned recently?",
  "Describe a challenge you overcame.",
  "What would make today great?",
  "How are you feeling right now, and why?",
  "What's something you're looking forward to?",
  "What habit do you want to build?",
  "Reflect on a recent win, big or small.",
];

const projectIdeas = [
  { name: "Side Project", icon: "🚀", desc: "Build something you're passionate about", color: "violet" },
  { name: "Learn New Skill", icon: "🎯", desc: "Course or certification", color: "cyan" },
  { name: "Health Goal", icon: "❤️", desc: "Fitness, nutrition, or wellness", color: "rose" },
  { name: "Creative Work", icon: "🎨", desc: "Art, writing, or music", color: "amber" },
];

const emptyData: SanctumData = {
  version: DATA_VERSION,
  habits: [],
  goals: [],
  deadlines: [],
  projects: [],
  journal: [],
  mood: null,
  quoteIndex: 0,
  focusMinutes: 0,
  totalFocusSessions: 0,
  settings: { name: '', city: '', apiKey: '' }
};

export default function Home() {
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
  const [settings, setSettings] = useState({ name: '', city: '', apiKey: '' });
  const [journalInput, setJournalInput] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPreset, setTimerPreset] = useState(25);
  
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hey! I'm your AI coach. Ask me for motivation, productivity tips, or help with your goals. ✨" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  
  const [newHabit, setNewHabit] = useState({ name: '', icon: '✓' });
  const [newGoal, setNewGoal] = useState({ name: '', icon: '🎯', target: '' });
  const [newDeadline, setNewDeadline] = useState({ title: '', course: '', dueDate: '' });
  const [newProject, setNewProject] = useState({ name: '', desc: '', icon: '📁', color: 'violet', status: 'active' });
  
  const [toast, setToast] = useState({ show: false, icon: '', text: '' });
  const [confetti, setConfetti] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState<{ habitCompletions: number; focusMinutes: number; focusSessions: number } | null>(null);
  const [recentFocus, setRecentFocus] = useState<{ id: string; minutes: number; completed: boolean; date: string }[]>([]);

  // Request notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Check for upcoming deadlines and notify
  useEffect(() => {
    if (!deadlines.length || !('Notification' in window) || Notification.permission !== 'granted') return;
    
    const checkDeadlines = () => {
      const now = new Date();
      deadlines.filter(d => !d.done).forEach(d => {
        const due = new Date(d.dueDate);
        const hoursUntil = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntil > 0 && hoursUntil < 24) {
          const notifKey = `notified-${d.id}`;
          if (!sessionStorage.getItem(notifKey)) {
            new Notification('📅 Deadline Approaching', {
              body: `${d.title} is due in ${Math.round(hoursUntil)} hours`,
              icon: '🏛️'
            });
            sessionStorage.setItem(notifKey, 'true');
          }
        }
      });
    };
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 30 * 60 * 1000); // Check every 30 min
    return () => clearInterval(interval);
  }, [deadlines]);

  // Load data - try API first, fallback to localStorage
  useEffect(() => {
    async function loadData() {
      // First load localStorage for settings and instant display
      try {
        const saved = localStorage.getItem('sanctum-v2');
        if (saved) {
          const data: SanctumData = JSON.parse(saved);
          if (data.version === DATA_VERSION) {
            setQuoteIndex(data.quoteIndex || 0);
            setSettings(data.settings || { name: '', city: '', apiKey: '' });
            // Set localStorage data as initial (will be overwritten by API)
            setHabits(data.habits || []);
            setGoals(data.goals || []);
            setDeadlines(data.deadlines || []);
            setProjects(data.projects || []);
            setJournal(data.journal || []);
            setMood(data.mood);
            setFocusMinutes(data.focusMinutes || 0);
            setTotalFocusSessions(data.totalFocusSessions || 0);
          }
        }
      } catch (e) {
        console.error('localStorage load error:', e);
      }
      
      // Then fetch from API and update
      try {
        const [apiData, settingsRes, statsRes] = await Promise.all([
          syncFromApi(),
          settingsApi.get(),
          statsApi.get()
        ]);
        
        if (apiData.habits.length > 0 || apiData.goals.length > 0 || apiData.deadlines.length > 0) {
          // Transform habits for UI compatibility
          setHabits(apiData.habits.map((h: any) => ({
            id: h.id,
            name: h.name,
            icon: h.icon,
            streak: h.streak,
            longestStreak: h.longestStreak,
            todayCompleted: h.todayCompleted,
            completions: h.completions
          })));
          setGoals(apiData.goals);
          setDeadlines(apiData.deadlines);
          setProjects(apiData.projects);
          setJournal(apiData.journals.map((j: any) => ({ ...j, date: j.createdAt })));
          setFocusMinutes(apiData.focus.totalMinutes);
          setTotalFocusSessions(apiData.focus.totalSessions);
          if (apiData.todayMood) setMood(apiData.todayMood);
        }
        
        // Load settings from DB
        if (settingsRes.data) {
          setSettings(prev => ({ ...prev, name: settingsRes.data!.name, city: settingsRes.data!.city }));
        }
        
        // Load stats
        if (statsRes.data) {
          setWeeklyStats(statsRes.data.week);
          setRecentFocus(statsRes.data.recentFocus);
        }
      } catch (e) {
        console.error('API load error:', e);
      }
      
      setIsLoaded(true);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Save data
  useEffect(() => {
    if (!isLoaded) return;
    const data: SanctumData = {
      version: DATA_VERSION,
      habits, goals, deadlines, projects, journal, mood, quoteIndex, focusMinutes, totalFocusSessions, settings
    };
    localStorage.setItem('sanctum-v2', JSON.stringify(data));
  }, [habits, goals, deadlines, projects, journal, mood, quoteIndex, focusMinutes, totalFocusSessions, settings, isLoaded]);

  // Weather
  useEffect(() => {
    if (!settings.city) return;
    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?city=${encodeURIComponent(settings.city)}`);
        if (res.ok) setWeather(await res.json());
      } catch (e) { console.error('Weather error:', e); }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [settings.city]);

  // Timer
  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(s => {
        if (s <= 1) {
          setTimerRunning(false);
          setFocusMinutes(m => m + timerPreset);
          setTotalFocusSessions(n => n + 1);
          showToast('🎉', `${timerPreset}min focus complete!`);
          setConfetti(true);
          setTimeout(() => setConfetti(false), 3000);
          // Log to API (fire and forget)
          focusApi.log(timerPreset, true).catch(console.error);
          return timerPreset * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerPreset]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setActiveModal(null); setEditItem(null); setChatOpen(false); }
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

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  const formatDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const getToday = () => new Date().toISOString().split('T')[0];
  const formatTimer = () => `${Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:${(timerSeconds % 60).toString().padStart(2, '0')}`;

  // HABITS
  const toggleHabit = async (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    
    // Optimistic update
    const wasDone = habit.todayCompleted;
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      return { ...h, todayCompleted: !wasDone, streak: wasDone ? Math.max(0, h.streak - 1) : h.streak + 1 };
    }));
    
    if (!wasDone) {
      showToast('🔥', `${habit.name} done! ${habit.streak + 1} day streak`);
      if ((habit.streak + 1) % 7 === 0) { setConfetti(true); setTimeout(() => setConfetti(false), 3000); }
    }
    
    // API call
    const result = await habitsApi.toggle(id);
    if (result.data) {
      setHabits(prev => prev.map(h => h.id === id ? {
        id: result.data.id,
        name: result.data.name,
        icon: result.data.icon,
        streak: result.data.streak,
        longestStreak: result.data.longestStreak,
        todayCompleted: result.data.todayCompleted,
        completions: result.data.completions
      } : h));
    }
  };

  const addHabit = async () => {
    if (!newHabit.name.trim()) return;
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newItem = { id: tempId, name: newHabit.name.trim(), icon: newHabit.icon || '✓', streak: 0, todayCompleted: false };
    setHabits(prev => [...prev, newItem]);
    setNewHabit({ name: '', icon: '✓' });
    setActiveModal(null);
    showToast('✨', 'Habit added!');
    
    // API call
    const result = await habitsApi.create({ name: newHabit.name.trim(), icon: newHabit.icon });
    if (result.data) {
      setHabits(prev => prev.map(h => h.id === tempId ? { ...result.data, todayCompleted: result.data.todayCompleted } : h));
    }
  };

  const saveHabit = async () => {
    if (!editItem) return;
    setHabits(prev => prev.map(h => h.id === editItem.id ? editItem : h));
    setEditItem(null);
    showToast('✓', 'Saved!');
    
    await habitsApi.update(editItem.id, { name: editItem.name, icon: editItem.icon });
  };

  const deleteHabit = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setEditItem(null);
    showToast('🗑️', 'Deleted');
    
    await habitsApi.delete(id);
  };

  // GOALS
  const addGoal = async () => {
    if (!newGoal.name.trim()) return;
    
    const tempId = `temp-${Date.now()}`;
    const newItem = { id: tempId, name: newGoal.name.trim(), icon: newGoal.icon || '🎯', current: 0, target: parseInt(newGoal.target) || 100 };
    setGoals(prev => [...prev, newItem]);
    setNewGoal({ name: '', icon: '🎯', target: '' });
    setActiveModal(null);
    showToast('🎯', 'Goal added!');
    
    const result = await goalsApi.create({ name: newGoal.name.trim(), icon: newGoal.icon, target: parseInt(newGoal.target) || 100 });
    if (result.data) {
      setGoals(prev => prev.map(g => g.id === tempId ? result.data : g));
    }
  };

  const incrementGoal = async (id: string, amt: number) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    
    const curr = Math.min(goal.target, Math.max(0, goal.current + amt));
    setGoals(prev => prev.map(g => g.id !== id ? g : { ...g, current: curr }));
    
    if (curr === goal.target && goal.current < goal.target) {
      showToast('🎉', `Goal complete: ${goal.name}!`);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 3000);
    }
    
    await goalsApi.increment(id, amt);
  };

  const saveGoal = async () => {
    if (!editItem) return;
    setGoals(prev => prev.map(g => g.id === editItem.id ? editItem : g));
    setEditItem(null);
    showToast('✓', 'Saved!');
    
    await goalsApi.update(editItem.id, editItem);
  };

  const deleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    setEditItem(null);
    showToast('🗑️', 'Deleted');
    
    await goalsApi.delete(id);
  };

  // DEADLINES
  const addDeadline = async () => {
    if (!newDeadline.title.trim() || !newDeadline.dueDate) return;
    
    const tempId = `temp-${Date.now()}`;
    const newItem = { id: tempId, title: newDeadline.title.trim(), course: newDeadline.course.trim(), dueDate: newDeadline.dueDate, done: false };
    setDeadlines(prev => [...prev, newItem]);
    setNewDeadline({ title: '', course: '', dueDate: '' });
    setActiveModal(null);
    showToast('📅', 'Deadline added!');
    
    const result = await deadlinesApi.create({ title: newDeadline.title.trim(), course: newDeadline.course.trim(), dueDate: newDeadline.dueDate });
    if (result.data) {
      setDeadlines(prev => prev.map(d => d.id === tempId ? result.data : d));
    }
  };

  const toggleDeadline = async (id: string) => {
    const deadline = deadlines.find(d => d.id === id);
    if (!deadline) return;
    
    const newDone = !deadline.done;
    setDeadlines(prev => prev.map(d => d.id !== id ? d : { ...d, done: newDone }));
    if (newDone) showToast('✅', `${deadline.title} done!`);
    
    await deadlinesApi.update(id, { done: newDone });
  };

  const saveDeadline = async () => {
    if (!editItem) return;
    setDeadlines(prev => prev.map(d => d.id === editItem.id ? editItem : d));
    setEditItem(null);
    showToast('✓', 'Saved!');
    
    await deadlinesApi.update(editItem.id, editItem);
  };

  const deleteDeadline = async (id: string) => {
    setDeadlines(prev => prev.filter(d => d.id !== id));
    setEditItem(null);
    showToast('🗑️', 'Deleted');
    
    await deadlinesApi.delete(id);
  };

  // PROJECTS
  const addProject = async () => {
    if (!newProject.name.trim()) return;
    
    const tempId = `temp-${Date.now()}`;
    const newItem = { id: tempId, name: newProject.name.trim(), desc: newProject.desc.trim(), icon: newProject.icon || '📁', color: newProject.color, status: newProject.status };
    setProjects(prev => [...prev, newItem]);
    setNewProject({ name: '', desc: '', icon: '📁', color: 'violet', status: 'active' });
    setActiveModal(null);
    showToast('📋', 'Project added!');
    
    const result = await projectsApi.create(newItem);
    if (result.data) {
      setProjects(prev => prev.map(p => p.id === tempId ? result.data : p));
    }
  };

  const saveProject = async () => {
    if (!editItem) return;
    setProjects(prev => prev.map(p => p.id === editItem.id ? editItem : p));
    setEditItem(null);
    showToast('✓', 'Saved!');
    
    await projectsApi.update(editItem.id, editItem);
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setEditItem(null);
    showToast('🗑️', 'Deleted');
    
    await projectsApi.delete(id);
  };

  // JOURNAL
  const saveJournal = async () => {
    if (!journalInput.trim()) return;
    
    const tempId = `temp-${Date.now()}`;
    const newEntry = { id: tempId, createdAt: new Date().toISOString(), text: journalInput.trim(), mood: mood || undefined };
    setJournal(prev => [...prev, newEntry]);
    setJournalInput('');
    showToast('📝', 'Saved!');
    
    const result = await journalsApi.create({ text: journalInput.trim(), mood: mood || undefined });
    if (result.data) {
      setJournal(prev => prev.map(j => j.id === tempId ? { ...result.data, createdAt: result.data.createdAt } : j));
    }
    
    // Also log mood if set
    if (mood) {
      await moodsApi.log(mood);
    }
  };

  // RESET
  const resetAllData = () => {
    if (!confirm('Delete ALL data? This cannot be undone.')) return;
    localStorage.removeItem('sanctum-v2');
    localStorage.removeItem('sanctum-data');
    setHabits([]);
    setGoals([]);
    setDeadlines([]);
    setProjects([]);
    setJournal([]);
    setMood(null);
    setFocusMinutes(0);
    setTotalFocusSessions(0);
    setActiveModal(null);
    showToast('🗑️', 'All data cleared');
  };

  // AI
  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const ctx = `Date: ${formatDate()}\nHabits: ${habits.filter(h => h.todayCompleted).length}/${habits.length}\nMood: ${mood || 'N/A'}`;
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, context: ctx, apiKey: settings.apiKey }) });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.error ? `⚠️ ${data.error}` : data.reply }]);
    } catch { setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error' }]); }
    setChatLoading(false);
  };

  // Stats
  const todayHabits = habits.filter(h => h.todayCompleted).length;
  const avgGoals = goals.length ? Math.round(goals.reduce((s, g) => s + (g.current / g.target) * 100, 0) / goals.length) : 0;
  const maxStreak = habits.length ? Math.max(...habits.map(h => h.streak)) : 0;
  const quote = quotes[quoteIndex % quotes.length];

  // Styles
  const card = { backgroundColor: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' };
  const cardHover = { ...card, cursor: 'pointer', transition: 'all 0.15s ease' };
  const input = { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#e2e8f0', fontSize: '14px', width: '100%' };
  const btnPrimary = { backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer' };
  const btnSecondary = { backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer' };
  const label = { fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.5px' };
  const sectionTitle = { fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '1px', textTransform: 'uppercase' as const };

  if (!isLoaded) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', animation: 'pulse 2s infinite' }}>🏛️</div>
      <div style={{ color: '#64748b', fontSize: '14px' }}>Loading Sanctum...</div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#080810', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', backgroundColor: '#0a0a14', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 16px', zIndex: 60 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', color: '#e2e8f0', fontSize: '18px', cursor: 'pointer' }}>☰</button>
          <span style={{ marginLeft: '12px', fontSize: '16px', fontWeight: 700, background: 'linear-gradient(90deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sanctum</span>
          {isLoading && <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#7c3aed' }}>Syncing...</span>}
        </div>
      )}
      
      {/* Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 65 }} />
      )}
      
      {/* Sidebar */}
      <aside style={{ width: '220px', backgroundColor: '#0a0a14', borderRight: '1px solid rgba(255,255,255,0.06)', position: 'fixed', height: '100vh', display: isMobile && !sidebarOpen ? 'none' : 'flex', flexDirection: 'column', zIndex: 70, transform: isMobile ? 'translateX(0)' : undefined }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🏛️</div>
          <span style={{ fontSize: '18px', fontWeight: 800, background: 'linear-gradient(90deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sanctum</span>
        </div>
        
        <nav style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { href: '/', label: '📊 Dashboard' },
            { href: '/habits', label: '✓ Habits' },
            { href: '/goals', label: '🎯 Goals' },
            { href: '/focus', label: '⏱️ Focus' },
            { href: '/journal', label: '📝 Journal' },
            { href: '/projects', label: '📋 Projects' },
            { href: '/deadlines', label: '📅 Deadlines' },
          ].map((item, i) => (
            <Link key={item.href} href={item.href} style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: i === 0 ? '#7c3aed' : '#64748b', backgroundColor: i === 0 ? 'rgba(124,58,237,0.1)' : 'transparent', cursor: 'pointer', textDecoration: 'none', display: 'block' }}>{item.label}</Link>
          ))}
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
          <div onClick={() => setActiveModal('settings')} style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#64748b', cursor: 'pointer' }}>⚙️ Settings</div>
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.08))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px' }}>🔥</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>{maxStreak}</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Day Streak</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: isMobile ? 0 : '220px', padding: isMobile ? '72px 16px 24px' : '24px 32px', flex: 1, maxWidth: '1400px' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{getGreeting()}, {settings.name || 'there'}.</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>{formatDate()}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Pill icon="✓" value={habits.length ? `${todayHabits}/${habits.length}` : '—'} label="habits" color="#10b981" />
            <Pill icon="🎯" value={goals.length ? `${avgGoals}%` : '—'} label="goals" color="#7c3aed" />
            {weeklyStats && <Pill icon="📈" value={`${weeklyStats.habitCompletions}`} label="this week" color="#f59e0b" />}
            <Pill icon="⏱️" value={focusMinutes ? `${focusMinutes}m` : '—'} label="focus" color="#06b6d4" />
          </div>
        </header>

        {/* Weather + Quote */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '300px 1fr', gap: '20px', marginBottom: '24px' }}>
          <div style={{ ...card, padding: '16px' }}>
            <div style={sectionTitle}>Weather</div>
            {weather ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                <span style={{ fontSize: '36px' }}>{weather.current.icon}</span>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>{weather.current.temp}°F</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Feels {weather.current.feelsLike}°</div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '12px' }}>Set city in Settings →</p>
            )}
          </div>

          <div style={{ ...card, padding: '20px', position: 'relative', borderColor: 'rgba(124,58,237,0.25)' }}>
            <span style={{ position: 'absolute', top: '-8px', left: '12px', fontSize: '64px', color: 'rgba(124,58,237,0.08)', fontWeight: 900, lineHeight: 1 }}>"</span>
            <p style={{ fontSize: '16px', fontWeight: 500, lineHeight: 1.6, position: 'relative', zIndex: 1 }}>"{quote.text}"</p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#7c3aed', marginTop: '8px' }}>— {quote.author}</p>
            <button onClick={() => setQuoteIndex(i => i + 1)} style={{ position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}>↻</button>
          </div>
        </div>

        {/* Habits */}
        <section style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={sectionTitle}>Today's Habits</span>
            <button onClick={() => setActiveModal('addHabit')} style={{ ...btnSecondary, padding: '6px 12px', fontSize: '12px' }}>+ Add</button>
          </div>
          
          {habits.length === 0 ? (
            <div style={{ ...card, padding: '20px', border: '1px solid rgba(124,58,237,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '16px' }}>✨</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#a78bfa' }}>AI Suggestions</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {suggestedHabits.slice(0, 6).map((h, i) => (
                  <div key={i} onClick={() => { setNewHabit({ name: h.name, icon: h.icon }); setActiveModal('addHabit'); }} style={{ ...cardHover, padding: '12px', textAlign: 'center', backgroundColor: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.15)' }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{h.icon}</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0' }}>{h.name}</div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>{h.desc}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveModal('addHabit')} style={{ ...btnSecondary, width: '100%', marginTop: '12px', fontSize: '12px' }}>+ Create Custom Habit</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
              {habits.map(h => {
                const done = h.todayCompleted;
                return (
                  <div key={h.id} style={{ ...card, padding: '14px', position: 'relative', borderColor: done ? 'rgba(16,185,129,0.3)' : undefined, backgroundColor: done ? 'rgba(16,185,129,0.05)' : undefined }}>
                    <div onClick={() => toggleHabit(h.id)} style={{ cursor: 'pointer' }}>
                      {done && <div style={{ position: 'absolute', top: '8px', right: '8px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white', fontWeight: 700 }}>✓</div>}
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>{h.icon}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{h.name}</div>
                      <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>🔥 {h.streak}d</div>
                    </div>
                    <button onClick={() => { setEditItem(h); setActiveModal('editHabit'); }} style={{ position: 'absolute', bottom: '8px', right: '8px', width: '20px', height: '20px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '10px', opacity: 0.6 }}>✎</button>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* 7-Day Habit Calendar */}
          {habits.length > 0 && habits.some(h => h.completions && h.completions.length > 0) && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#10b981', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📅 Last 7 Days</div>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - i));
                  const dateStr = date.toISOString().split('T')[0];
                  const dayCompletions = habits.filter(h => h.completions?.includes(dateStr)).length;
                  const intensity = habits.length > 0 ? dayCompletions / habits.length : 0;
                  return (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#64748b', marginBottom: '4px' }}>{['S','M','T','W','T','F','S'][date.getDay()]}</div>
                      <div style={{ height: '28px', borderRadius: '4px', backgroundColor: intensity > 0.7 ? '#10b981' : intensity > 0.3 ? 'rgba(16,185,129,0.5)' : intensity > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', border: dateStr === new Date().toISOString().split('T')[0] ? '2px solid #10b981' : '1px solid transparent' }} />
                      <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>{dayCompletions}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Goals + Timer */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: '24px', marginBottom: '24px' }}>
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={sectionTitle}>Goals</span>
              <button onClick={() => setActiveModal('addGoal')} style={{ ...btnSecondary, padding: '6px 12px', fontSize: '12px' }}>+ Add</button>
            </div>
            
            {goals.length === 0 ? (
              <div style={{ ...card, padding: '16px', border: '1px solid rgba(6,182,212,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px' }}>🎯</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#22d3ee' }}>Goal Ideas</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {suggestedGoals.slice(0, 3).map((g, i) => (
                    <div key={i} onClick={() => { setNewGoal({ name: g.name, icon: g.icon, target: String(g.target) }); setActiveModal('addGoal'); }} style={{ ...cardHover, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(6,182,212,0.05)', borderColor: 'rgba(6,182,212,0.15)' }}>
                      <span style={{ fontSize: '18px' }}>{g.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600 }}>{g.name}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Target: {g.target}</div>
                      </div>
                      <span style={{ fontSize: '10px', color: '#22d3ee' }}>+ Add</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveModal('addGoal')} style={{ ...btnSecondary, width: '100%', marginTop: '10px', fontSize: '11px', padding: '8px' }}>+ Create Custom Goal</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {goals.map(g => {
                  const pct = Math.round((g.current / g.target) * 100);
                  return (
                    <div key={g.id} style={{ ...card, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{g.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{g.name}</div>
                        <div style={{ height: '5px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#10b981' : 'linear-gradient(90deg, #7c3aed, #06b6d4)', borderRadius: '3px', transition: 'width 0.3s' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => incrementGoal(g.id, -1)} style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}>−</button>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#7c3aed', minWidth: '50px', textAlign: 'center' }}>{g.current}/{g.target}</span>
                        <button onClick={() => incrementGoal(g.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}>+</button>
                      </div>
                      <button onClick={() => { setEditItem(g); setActiveModal('editGoal'); }} style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '10px' }}>✎</button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div style={{ marginBottom: '12px' }}><span style={sectionTitle}>Focus Timer</span></div>
            <div style={{ ...card, padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{timerRunning ? 'Focusing...' : 'Ready'}</div>
              <div style={{ fontSize: '42px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', background: 'linear-gradient(90deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{formatTimer()}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
                <button onClick={() => setTimerRunning(r => !r)} style={{ ...btnPrimary, backgroundColor: timerRunning ? '#ef4444' : '#7c3aed' }}>{timerRunning ? 'Pause' : 'Start'}</button>
                <button onClick={() => { setTimerRunning(false); setTimerSeconds(timerPreset * 60); }} style={btnSecondary}>Reset</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
                {[25, 45, 60].map(m => (
                  <button key={m} onClick={() => { setTimerPreset(m); if (!timerRunning) setTimerSeconds(m * 60); }} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, backgroundColor: timerPreset === m ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)', color: timerPreset === m ? '#7c3aed' : '#64748b', border: timerPreset === m ? '1px solid #7c3aed' : '1px solid transparent', cursor: 'pointer' }}>{m}m</button>
                ))}
              </div>
              
              {/* Focus History */}
              {recentFocus.length > 0 && (
                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Sessions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                    {recentFocus.slice(0, 8).map(s => (
                      <div key={s.id} title={new Date(s.date).toLocaleDateString()} style={{ width: '28px', height: '28px', borderRadius: '4px', backgroundColor: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 600, color: '#22d3ee' }}>{s.minutes}m</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Mood + Journal */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <section>
            <div style={{ marginBottom: '12px' }}><span style={sectionTitle}>How are you feeling?</span></div>
            <div style={{ ...card, padding: '14px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[{ k: 'great', e: '😄' }, { k: 'good', e: '🙂' }, { k: 'okay', e: '😐' }, { k: 'low', e: '😔' }, { k: 'rough', e: '😫' }].map(m => (
                  <button key={m.k} onClick={() => { setMood(m.k); showToast('💚', 'Mood logged'); }} style={{ flex: 1, padding: '12px 8px', borderRadius: '8px', backgroundColor: mood === m.k ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)', border: mood === m.k ? '1px solid #7c3aed' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', textAlign: 'center' }}>
                    <span style={{ fontSize: '22px', display: 'block' }}>{m.e}</span>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'capitalize' }}>{m.k}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div style={{ marginBottom: '12px' }}><span style={sectionTitle}>Quick Thought</span></div>
            <div style={{ ...card, padding: '14px' }}>
              <textarea value={journalInput} onChange={e => setJournalInput(e.target.value)} placeholder="What's on your mind?" style={{ ...input, height: '60px', resize: 'none' }} />
              {!journalInput && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {journalPrompts.slice(0, 3).map((prompt, i) => (
                    <button key={i} onClick={() => setJournalInput(prompt + "\n\n")} style={{ padding: '4px 8px', borderRadius: '12px', backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa', fontSize: '10px', cursor: 'pointer' }}>
                      💡 {prompt.slice(0, 25)}...
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <button onClick={saveJournal} style={{ ...btnPrimary, padding: '8px 14px', fontSize: '12px' }}>Save</button>
              </div>
            </div>
          </section>
        </div>

        {/* Deadlines + Projects */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={sectionTitle}>Deadlines</span>
              <button onClick={() => setActiveModal('addDeadline')} style={{ ...btnSecondary, padding: '6px 12px', fontSize: '12px' }}>+ Add</button>
            </div>
            
            {deadlines.filter(d => !d.done).length === 0 ? (
              <div onClick={() => setActiveModal('addDeadline')} style={{ ...cardHover, padding: '24px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📅</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Add a deadline</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {deadlines.filter(d => !d.done).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5).map(d => {
                  const diff = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000);
                  const color = diff < 0 ? '#f43f5e' : diff <= 1 ? '#f43f5e' : diff <= 3 ? '#f59e0b' : '#10b981';
                  const label = diff < 0 ? 'Overdue' : diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d`;
                  return (
                    <div key={d.id} style={{ ...card, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', borderLeft: `3px solid ${color}` }}>
                      <button onClick={() => toggleDeadline(d.id)} style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', cursor: 'pointer', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{d.title}</div>
                        {d.course && <div style={{ fontSize: '11px', color: '#64748b' }}>{d.course}</div>}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', backgroundColor: `${color}15`, color }}>{label}</span>
                      <button onClick={() => { setEditItem(d); setActiveModal('editDeadline'); }} style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '10px' }}>✎</button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={sectionTitle}>Projects</span>
              <button onClick={() => setActiveModal('addProject')} style={{ ...btnSecondary, padding: '6px 12px', fontSize: '12px' }}>+ Add</button>
            </div>
            
            {projects.length === 0 ? (
              <div style={{ ...card, padding: '14px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px' }}>📋</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#fbbf24' }}>Project Ideas</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '6px' }}>
                  {projectIdeas.map((p, i) => (
                    <div key={i} onClick={() => { setNewProject({ name: p.name, desc: p.desc, icon: p.icon, color: p.color, status: 'planning' }); setActiveModal('addProject'); }} style={{ ...cardHover, padding: '10px', backgroundColor: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.15)' }}>
                      <div style={{ fontSize: '16px', marginBottom: '4px' }}>{p.icon}</div>
                      <div style={{ fontSize: '11px', fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '9px', color: '#64748b' }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveModal('addProject')} style={{ ...btnSecondary, width: '100%', marginTop: '8px', fontSize: '10px', padding: '6px' }}>+ Custom Project</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px' }}>
                {projects.slice(0, 4).map(p => {
                  const colors: Record<string, string> = { violet: '#7c3aed', cyan: '#06b6d4', amber: '#f59e0b', emerald: '#10b981', rose: '#f43f5e', blue: '#3b82f6' };
                  const statusColors: Record<string, string> = { active: '#10b981', planning: '#3b82f6', paused: '#f59e0b', complete: '#7c3aed' };
                  return (
                    <div key={p.id} onClick={() => { setEditItem(p); setActiveModal('editProject'); }} style={{ ...cardHover, padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: `${colors[p.color] || colors.violet}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{p.icon}</div>
                        <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '2px 6px', borderRadius: '3px', backgroundColor: `${statusColors[p.status] || statusColors.active}15`, color: statusColors[p.status] || statusColors.active }}>{p.status}</span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.desc}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* AI FAB */}
      <button onClick={() => setChatOpen(true)} style={{ position: 'fixed', bottom: '24px', right: '24px', width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', border: 'none', cursor: 'pointer', fontSize: '22px', boxShadow: '0 4px 20px rgba(124,58,237,0.4)', zIndex: 40 }}>✨</button>

      {/* AI Chat */}
      {chatOpen && (
        <div style={{ position: 'fixed', bottom: '90px', right: '24px', width: '360px', backgroundColor: '#0d0d1a', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '14px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', flexDirection: 'column', maxHeight: '450px' }}>
          <div style={{ padding: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>✨</div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '14px' }}>AI Coach</div><div style={{ fontSize: '11px', color: '#64748b' }}>Your motivation partner</div></div>
            <button onClick={() => setChatOpen(false)} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px' }}>
            {chatMessages.map((m, i) => (
              <div key={i} style={{ maxWidth: '85%', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', backgroundColor: m.role === 'user' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)', marginLeft: m.role === 'user' ? 'auto' : 0 }}>{m.content}</div>
            ))}
            {chatLoading && <div style={{ padding: '10px', borderRadius: '10px', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.05)' }}>Thinking...</div>}
          </div>
          <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px' }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Ask anything..." style={{ ...input, flex: 1 }} />
            <button onClick={sendChat} disabled={chatLoading} style={{ ...btnPrimary, padding: '10px 14px' }}>➤</button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {activeModal === 'settings' && (
        <Modal title="Settings" onClose={() => setActiveModal(null)}>
          <Field label="Your Name"><input value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} style={input} placeholder="Nick" /></Field>
          <Field label="City (weather)"><input value={settings.city} onChange={e => setSettings({ ...settings, city: e.target.value })} style={input} placeholder="New York" /></Field>
          <Field label="OpenAI API Key"><input type="password" value={settings.apiKey} onChange={e => setSettings({ ...settings, apiKey: e.target.value })} style={input} placeholder="sk-..." /></Field>
          <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '16px' }}>Required for AI coach. Get from platform.openai.com</p>
          
          <div style={{ padding: '12px', backgroundColor: 'rgba(124,58,237,0.1)', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#a78bfa', marginBottom: '8px' }}>📊 Data Management</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => exportApi.download()} style={{ ...btnSecondary, flex: 1, fontSize: '11px', padding: '8px' }}>📥 Export Backup</button>
              <button onClick={() => { if ('Notification' in window) Notification.requestPermission(); showToast('🔔', 'Notifications enabled!'); }} style={{ ...btnSecondary, flex: 1, fontSize: '11px', padding: '8px' }}>🔔 Enable Alerts</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={resetAllData} style={{ ...btnSecondary, color: '#f43f5e' }}>Reset All Data</button>
            <button onClick={async () => { await settingsApi.save({ name: settings.name, city: settings.city }); showToast('✓', 'Settings saved!'); setActiveModal(null); }} style={{ ...btnPrimary, flex: 1 }}>Save</button>
          </div>
        </Modal>
      )}

      {activeModal === 'addHabit' && (
        <Modal title="Add Habit" onClose={() => setActiveModal(null)}>
          <Field label="Name"><input value={newHabit.name} onChange={e => setNewHabit({ ...newHabit, name: e.target.value })} style={input} placeholder="Morning workout" /></Field>
          <Field label="Icon"><input value={newHabit.icon} onChange={e => setNewHabit({ ...newHabit, icon: e.target.value })} style={input} placeholder="💪" maxLength={2} /></Field>
          <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => setActiveModal(null)} style={btnSecondary}>Cancel</button><button onClick={addHabit} style={{ ...btnPrimary, flex: 1 }}>Add</button></div>
        </Modal>
      )}

      {activeModal === 'editHabit' && editItem && (
        <Modal title="Edit Habit" onClose={() => { setActiveModal(null); setEditItem(null); }}>
          <Field label="Name"><input value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} style={input} /></Field>
          <Field label="Icon"><input value={editItem.icon} onChange={e => setEditItem({ ...editItem, icon: e.target.value })} style={input} maxLength={2} /></Field>
          <Field label="Streak"><input type="number" value={editItem.streak} onChange={e => setEditItem({ ...editItem, streak: parseInt(e.target.value) || 0 })} style={input} /></Field>
          <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => deleteHabit(editItem.id)} style={{ ...btnSecondary, color: '#f43f5e' }}>Delete</button><button onClick={() => { setActiveModal(null); setEditItem(null); }} style={btnSecondary}>Cancel</button><button onClick={saveHabit} style={{ ...btnPrimary, flex: 1 }}>Save</button></div>
        </Modal>
      )}

      {activeModal === 'addGoal' && (
        <Modal title="Add Goal" onClose={() => setActiveModal(null)}>
          <Field label="Goal"><input value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} style={input} placeholder="Read 24 books" /></Field>
          <Field label="Target"><input type="number" value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: e.target.value })} style={input} placeholder="24" /></Field>
          <Field label="Icon"><input value={newGoal.icon} onChange={e => setNewGoal({ ...newGoal, icon: e.target.value })} style={input} placeholder="📚" maxLength={2} /></Field>
          <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => setActiveModal(null)} style={btnSecondary}>Cancel</button><button onClick={addGoal} style={{ ...btnPrimary, flex: 1 }}>Add</button></div>
        </Modal>
      )}

      {activeModal === 'editGoal' && editItem && (
        <Modal title="Edit Goal" onClose={() => { setActiveModal(null); setEditItem(null); }}>
          <Field label="Goal"><input value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} style={input} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
            <Field label="Current"><input type="number" value={editItem.current} onChange={e => setEditItem({ ...editItem, current: parseInt(e.target.value) || 0 })} style={input} /></Field>
            <Field label="Target"><input type="number" value={editItem.target} onChange={e => setEditItem({ ...editItem, target: parseInt(e.target.value) || 1 })} style={input} /></Field>
          </div>
          <Field label="Icon"><input value={editItem.icon} onChange={e => setEditItem({ ...editItem, icon: e.target.value })} style={input} maxLength={2} /></Field>
          <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => deleteGoal(editItem.id)} style={{ ...btnSecondary, color: '#f43f5e' }}>Delete</button><button onClick={() => { setActiveModal(null); setEditItem(null); }} style={btnSecondary}>Cancel</button><button onClick={saveGoal} style={{ ...btnPrimary, flex: 1 }}>Save</button></div>
        </Modal>
      )}

      {activeModal === 'addDeadline' && (
        <Modal title="Add Deadline" onClose={() => setActiveModal(null)}>
          <Field label="Title"><input value={newDeadline.title} onChange={e => setNewDeadline({ ...newDeadline, title: e.target.value })} style={input} placeholder="Final Exam" /></Field>
          <Field label="Course (optional)"><input value={newDeadline.course} onChange={e => setNewDeadline({ ...newDeadline, course: e.target.value })} style={input} placeholder="Statistics" /></Field>
          <Field label="Due Date"><input type="date" value={newDeadline.dueDate} onChange={e => setNewDeadline({ ...newDeadline, dueDate: e.target.value })} style={input} /></Field>
          <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => setActiveModal(null)} style={btnSecondary}>Cancel</button><button onClick={addDeadline} style={{ ...btnPrimary, flex: 1 }}>Add</button></div>
        </Modal>
      )}

      {activeModal === 'editDeadline' && editItem && (
        <Modal title="Edit Deadline" onClose={() => { setActiveModal(null); setEditItem(null); }}>
          <Field label="Title"><input value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} style={input} /></Field>
          <Field label="Course"><input value={editItem.course} onChange={e => setEditItem({ ...editItem, course: e.target.value })} style={input} /></Field>
          <Field label="Due Date"><input type="date" value={editItem.dueDate} onChange={e => setEditItem({ ...editItem, dueDate: e.target.value })} style={input} /></Field>
          <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => deleteDeadline(editItem.id)} style={{ ...btnSecondary, color: '#f43f5e' }}>Delete</button><button onClick={() => { setActiveModal(null); setEditItem(null); }} style={btnSecondary}>Cancel</button><button onClick={saveDeadline} style={{ ...btnPrimary, flex: 1 }}>Save</button></div>
        </Modal>
      )}

      {activeModal === 'addProject' && (
        <Modal title="Add Project" onClose={() => setActiveModal(null)}>
          <Field label="Name"><input value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} style={input} placeholder="Website Redesign" /></Field>
          <Field label="Description"><input value={newProject.desc} onChange={e => setNewProject({ ...newProject, desc: e.target.value })} style={input} placeholder="Short description" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
            <Field label="Icon"><input value={newProject.icon} onChange={e => setNewProject({ ...newProject, icon: e.target.value })} style={input} placeholder="📁" maxLength={2} /></Field>
            <Field label="Color"><select value={newProject.color} onChange={e => setNewProject({ ...newProject, color: e.target.value })} style={input}><option value="violet">Violet</option><option value="cyan">Cyan</option><option value="amber">Amber</option><option value="emerald">Emerald</option><option value="rose">Rose</option><option value="blue">Blue</option></select></Field>
          </div>
          <Field label="Status"><select value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value })} style={input}><option value="active">Active</option><option value="planning">Planning</option><option value="paused">Paused</option><option value="complete">Complete</option></select></Field>
          <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => setActiveModal(null)} style={btnSecondary}>Cancel</button><button onClick={addProject} style={{ ...btnPrimary, flex: 1 }}>Add</button></div>
        </Modal>
      )}

      {activeModal === 'editProject' && editItem && (
        <Modal title="Edit Project" onClose={() => { setActiveModal(null); setEditItem(null); }}>
          <Field label="Name"><input value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} style={input} /></Field>
          <Field label="Description"><input value={editItem.desc} onChange={e => setEditItem({ ...editItem, desc: e.target.value })} style={input} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
            <Field label="Icon"><input value={editItem.icon} onChange={e => setEditItem({ ...editItem, icon: e.target.value })} style={input} maxLength={2} /></Field>
            <Field label="Color"><select value={editItem.color} onChange={e => setEditItem({ ...editItem, color: e.target.value })} style={input}><option value="violet">Violet</option><option value="cyan">Cyan</option><option value="amber">Amber</option><option value="emerald">Emerald</option><option value="rose">Rose</option><option value="blue">Blue</option></select></Field>
          </div>
          <Field label="Status"><select value={editItem.status} onChange={e => setEditItem({ ...editItem, status: e.target.value })} style={input}><option value="active">Active</option><option value="planning">Planning</option><option value="paused">Paused</option><option value="complete">Complete</option></select></Field>
          <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => deleteProject(editItem.id)} style={{ ...btnSecondary, color: '#f43f5e' }}>Delete</button><button onClick={() => { setActiveModal(null); setEditItem(null); }} style={btnSecondary}>Cancel</button><button onClick={saveProject} style={{ ...btnPrimary, flex: 1 }}>Save</button></div>
        </Modal>
      )}

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: `translateX(-50%) translateY(${toast.show ? 0 : 20}px)`, opacity: toast.show ? 1 : 0, backgroundColor: '#0d0d1a', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 100, transition: 'all 0.3s ease', pointerEvents: toast.show ? 'auto' : 'none' }}>
        <span style={{ fontSize: '18px' }}>{toast.icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 500 }}>{toast.text}</span>
      </div>

      {/* Confetti */}
      {confetti && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 200, overflow: 'hidden' }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', width: '8px', height: '8px', left: `${Math.random() * 100}%`, backgroundColor: ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e'][i % 5], animation: `confetti ${2 + Math.random() * 2}s linear forwards`, animationDelay: `${Math.random() * 0.5}s` }} />
          ))}
        </div>
      )}

      <style>{`@keyframes confetti { 0% { transform: translateY(-10px) rotate(0); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  );
}

function Pill({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#0d0d1a', border: `1px solid ${color}40`, borderRadius: '20px', fontSize: '13px', fontWeight: 600, color }}>
      <span>{icon}</span><span>{value} {label}</span>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px', width: '100%', maxWidth: '380px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      {children}
    </div>
  );
}
