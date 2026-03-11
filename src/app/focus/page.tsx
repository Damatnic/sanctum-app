'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DATA_VERSION = 2;

interface FocusSession {
  id: number;
  date: string;
  minutes: number;
  completedAt: string;
}

interface SanctumData {
  version: number;
  habits: any[];
  goals: any[];
  deadlines: any[];
  projects: any[];
  journal: any[];
  mood: string | null;
  quoteIndex: number;
  focusMinutes: number;
  totalFocusSessions: number;
  settings: { name: string; city: string; apiKey: string };
  focusSessions?: FocusSession[];
}

const navItems = [
  { href: '/', label: '📊 Dashboard' },
  { href: '/habits', label: '✓ Habits' },
  { href: '/goals', label: '🎯 Goals' },
  { href: '/focus', label: '⏱️ Focus' },
  { href: '/journal', label: '📝 Journal' },
  { href: '/projects', label: '📋 Projects' },
  { href: '/deadlines', label: '📅 Deadlines' },
];

function Sidebar({ maxStreak }: { maxStreak: number }) {
  const pathname = usePathname();
  return (
    <aside style={{ width: '220px', backgroundColor: '#0a0a14', borderRight: '1px solid rgba(255,255,255,0.06)', position: 'fixed', height: '100vh', display: 'flex', flexDirection: 'column', top: 0, left: 0, zIndex: 10 }}>
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🏛️</div>
        <span style={{ fontSize: '18px', fontWeight: 800, background: 'linear-gradient(90deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sanctum</span>
      </div>
      <nav style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: active ? '#7c3aed' : '#64748b', backgroundColor: active ? 'rgba(124,58,237,0.1)' : 'transparent', cursor: 'pointer', textDecoration: 'none', display: 'block' }}>{item.label}</Link>
          );
        })}
        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
        <Link href="/" style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#64748b', cursor: 'pointer', textDecoration: 'none', display: 'block' }}>⚙️ Settings</Link>
      </nav>
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.08))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px' }}>🔥</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>{maxStreak}</div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Day Streak</div>
        </div>
      </div>
    </aside>
  );
}

export default function FocusPage() {
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [totalFocusSessions, setTotalFocusSessions] = useState(0);
  const [habits, setHabits] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPreset, setTimerPreset] = useState(25);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [toast, setToast] = useState({ show: false, text: '' });

  const card = { backgroundColor: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' };
  const btnPrimary = { backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' };
  const btnSecondary = { backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' };

  const loadData = () => {
    try {
      const saved = localStorage.getItem('sanctum-v2');
      if (saved) {
        const data: SanctumData = JSON.parse(saved);
        if (data.version === DATA_VERSION) {
          setFocusSessions(data.focusSessions || []);
          setFocusMinutes(data.focusMinutes || 0);
          setTotalFocusSessions(data.totalFocusSessions || 0);
          setHabits(data.habits || []);
        }
      }
    } catch (e) { console.error(e); }
    setIsLoaded(true);
  };

  const saveData = (sessions: FocusSession[], minutes: number, total: number) => {
    try {
      const saved = localStorage.getItem('sanctum-v2');
      const data: SanctumData = saved ? JSON.parse(saved) : { version: DATA_VERSION, habits: [], goals: [], deadlines: [], projects: [], journal: [], mood: null, quoteIndex: 0, focusMinutes: 0, totalFocusSessions: 0, settings: { name: '', city: '', apiKey: '' } };
      data.focusSessions = sessions;
      data.focusMinutes = minutes;
      data.totalFocusSessions = total;
      localStorage.setItem('sanctum-v2', JSON.stringify(data));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  // Timer
  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(s => {
        if (s <= 1) {
          setTimerRunning(false);
          const newSession: FocusSession = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            minutes: timerPreset,
            completedAt: new Date().toISOString(),
          };
          setFocusSessions(prev => {
            const updated = [newSession, ...prev].slice(0, 50);
            const newMinutes = focusMinutes + timerPreset;
            const newTotal = totalFocusSessions + 1;
            setFocusMinutes(newMinutes);
            setTotalFocusSessions(newTotal);
            saveData(updated, newMinutes, newTotal);
            return updated;
          });
          setSessionCompleted(true);
          setTimeout(() => setSessionCompleted(false), 4000);
          showToast(`🎉 ${timerPreset}min session complete!`);
          return timerPreset * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerPreset]);

  const showToast = (text: string) => {
    setToast({ show: true, text });
    setTimeout(() => setToast({ show: false, text: '' }), 3000);
  };

  const formatTimer = () => `${Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:${(timerSeconds % 60).toString().padStart(2, '0')}`;

  const getToday = () => new Date().toISOString().split('T')[0];
  const getWeekStart = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  };

  const todaySessions = focusSessions.filter(s => s.date === getToday());
  const todayMinutes = todaySessions.reduce((a, s) => a + s.minutes, 0);
  const weekStart = getWeekStart();
  const weekSessions = focusSessions.filter(s => s.date >= weekStart);
  const weekMinutes = weekSessions.reduce((a, s) => a + s.minutes, 0);

  // Focus streak: consecutive days with at least 1 session
  const calcStreak = () => {
    const days = new Set(focusSessions.map(s => s.date));
    let streak = 0;
    const d = new Date();
    while (true) {
      const ds = d.toISOString().split('T')[0];
      if (!days.has(ds)) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };
  const focusStreak = calcStreak();
  const maxStreak = habits.length ? Math.max(...habits.map((h: any) => h.streak || 0)) : 0;

  const progress = ((timerPreset * 60 - timerSeconds) / (timerPreset * 60)) * 100;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (!isLoaded) return <div style={{ minHeight: '100vh', backgroundColor: '#080810' }} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#080810', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar maxStreak={maxStreak} />
      <main style={{ marginLeft: '220px', padding: '32px', flex: 1 }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>Focus</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Deep work sessions for maximum productivity</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '28px' }}>
          {/* Timer */}
          <div style={{ ...card, padding: '40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {sessionCompleted && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.15)', borderRadius: '12px', fontSize: '48px', animation: 'fadeIn 0.3s ease' }}>
                🎉
              </div>
            )}
            <div style={{ fontSize: '11px', fontWeight: 700, color: timerRunning ? '#7c3aed' : '#475569', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '24px' }}>
              {timerRunning ? '● Focusing...' : 'Ready to Focus'}
            </div>

            {/* SVG circle timer */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '32px' }}>
              <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle cx="100" cy="100" r="90" fill="none" stroke={timerRunning ? '#7c3aed' : 'rgba(124,58,237,0.3)'} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '44px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', background: 'linear-gradient(90deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{formatTimer()}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{timerPreset} min session</div>
              </div>
            </div>

            {/* Preset buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              {[25, 45, 60].map(m => (
                <button key={m} onClick={() => { setTimerPreset(m); if (!timerRunning) setTimerSeconds(m * 60); }} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, backgroundColor: timerPreset === m ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)', color: timerPreset === m ? '#7c3aed' : '#64748b', border: timerPreset === m ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>{m}m</button>
              ))}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button onClick={() => setTimerRunning(r => !r)} style={{ ...btnPrimary, padding: '12px 32px', fontSize: '15px', backgroundColor: timerRunning ? '#ef4444' : '#7c3aed', minWidth: '120px' }}>
                {timerRunning ? '⏸ Pause' : '▶ Start'}
              </button>
              <button onClick={() => { setTimerRunning(false); setTimerSeconds(timerPreset * 60); }} style={{ ...btnSecondary, padding: '12px 20px' }}>↺ Reset</button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Today', sessions: todaySessions.length, minutes: todayMinutes, icon: '☀️', color: '#f59e0b' },
              { label: 'This Week', sessions: weekSessions.length, minutes: weekMinutes, icon: '📅', color: '#06b6d4' },
              { label: 'All Time', sessions: totalFocusSessions, minutes: focusMinutes, icon: '🏆', color: '#7c3aed' },
            ].map(s => (
              <div key={s.label} style={{ ...card, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '28px' }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, marginTop: '2px' }}>{s.minutes}m</div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>{s.sessions} session{s.sessions !== 1 ? 's' : ''}</div>
                </div>
              </div>
            ))}

            <div style={{ ...card, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.05))', borderColor: 'rgba(245,158,11,0.2)' }}>
              <div style={{ fontSize: '32px' }}>🔥</div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Focus Streak</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>{focusStreak}d</div>
                <div style={{ fontSize: '12px', color: '#475569' }}>consecutive days</div>
              </div>
            </div>
          </div>
        </div>

        {/* Session History */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Session History</div>
          {focusSessions.length === 0 ? (
            <div style={{ ...card, padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏱️</div>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No sessions yet</div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Start your first focus session above</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {focusSessions.slice(0, 20).map(s => {
                const sessionDate = new Date(s.completedAt);
                const today = getToday();
                const sessionDay = s.date;
                const dayLabel = sessionDay === today ? 'Today' : sessionDay === new Date(Date.now() - 86400000).toISOString().split('T')[0] ? 'Yesterday' : sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <div key={s.id} style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>⏱️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{s.minutes} minute session</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{dayLabel} · {sessionDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#7c3aed', padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(124,58,237,0.1)' }}>{s.minutes}m</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Keyboard hint */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', fontSize: '11px', color: '#475569', backgroundColor: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
        Press Space to start/pause
      </div>

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: `translateX(-50%) translateY(${toast.show ? 0 : 20}px)`, opacity: toast.show ? 1 : 0, backgroundColor: '#0d0d1a', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', padding: '12px 18px', fontSize: '13px', fontWeight: 500, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 200, transition: 'all 0.3s ease', pointerEvents: 'none', whiteSpace: 'nowrap' }}>{toast.text}</div>
    </div>
  );
}
