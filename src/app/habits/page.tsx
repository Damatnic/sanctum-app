'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DATA_VERSION = 2;

interface Habit {
  id: number;
  name: string;
  icon: string;
  streak: number;
  completedToday: boolean;
  lastCompleted?: string;
  completionDates?: string[];
}

interface SanctumData {
  version: number;
  habits: Habit[];
  goals: any[];
  deadlines: any[];
  projects: any[];
  journal: any[];
  mood: string | null;
  quoteIndex: number;
  focusMinutes: number;
  totalFocusSessions: number;
  settings: { name: string; city: string; apiKey: string };
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

function Sidebar({ maxStreak, isOpen, onClose, isMobile }: { maxStreak: number; isOpen?: boolean; onClose?: () => void; isMobile?: boolean }) {
  const pathname = usePathname();
  if (isMobile && !isOpen) return null;
  return (
    <aside style={{ width: '220px', backgroundColor: '#0a0a14', borderRight: '1px solid rgba(255,255,255,0.06)', position: 'fixed', height: '100vh', display: 'flex', flexDirection: 'column', top: 0, left: 0, zIndex: 70 }}>
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

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'done' | 'pending'>('all');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Habit | null>(null);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '✓' });
  const [toast, setToast] = useState({ show: false, text: '' });
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' as const };
  const btnPrimary = { backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' };
  const btnSecondary = { backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' };
  const card = { backgroundColor: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' };

  const getToday = () => new Date().toISOString().split('T')[0];

  const loadData = () => {
    try {
      const saved = localStorage.getItem('sanctum-v2');
      if (saved) {
        const data: SanctumData = JSON.parse(saved);
        if (data.version === DATA_VERSION) {
          setHabits(data.habits || []);
        }
      }
    } catch (e) { console.error(e); }
    setIsLoaded(true);
  };

  const saveHabits = (newHabits: Habit[]) => {
    try {
      const saved = localStorage.getItem('sanctum-v2');
      const data: SanctumData = saved ? JSON.parse(saved) : { version: DATA_VERSION, habits: [], goals: [], deadlines: [], projects: [], journal: [], mood: null, quoteIndex: 0, focusMinutes: 0, totalFocusSessions: 0, settings: { name: '', city: '', apiKey: '' } };
      data.habits = newHabits;
      localStorage.setItem('sanctum-v2', JSON.stringify(data));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (text: string) => {
    setToast({ show: true, text });
    setTimeout(() => setToast({ show: false, text: '' }), 2500);
  };

  const toggleHabit = (id: number) => {
    const today = getToday();
    const updated = habits.map(h => {
      if (h.id !== id) return h;
      const done = h.lastCompleted === today;
      const dates = h.completionDates || [];
      if (done) {
        return { ...h, lastCompleted: undefined, streak: Math.max(0, h.streak - 1), completionDates: dates.filter(d => d !== today) };
      }
      showToast(`🔥 ${h.name} done! ${h.streak + 1} day streak`);
      return { ...h, lastCompleted: today, streak: h.streak + 1, completionDates: [...dates.filter(d => d !== today), today] };
    });
    setHabits(updated);
    saveHabits(updated);
  };

  const addHabit = () => {
    if (!newHabit.name.trim()) return;
    const updated = [...habits, { id: Date.now(), name: newHabit.name.trim(), icon: newHabit.icon || '✓', streak: 0, completedToday: false, completionDates: [] }];
    setHabits(updated);
    saveHabits(updated);
    setNewHabit({ name: '', icon: '✓' });
    setActiveModal(null);
    showToast('✨ Habit added!');
  };

  const saveHabit = () => {
    if (!editItem) return;
    const updated = habits.map(h => h.id === editItem.id ? editItem : h);
    setHabits(updated);
    saveHabits(updated);
    setEditItem(null);
    setActiveModal(null);
    showToast('✓ Saved!');
  };

  const deleteHabit = (id: number) => {
    const updated = habits.filter(h => h.id !== id);
    setHabits(updated);
    saveHabits(updated);
    setEditItem(null);
    setActiveModal(null);
    showToast('🗑️ Deleted');
  };

  // Stats
  const today = getToday();
  const completedToday = habits.filter(h => h.lastCompleted === today).length;
  const completionRate = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;
  const longestStreak = habits.length ? Math.max(...habits.map(h => h.streak)) : 0;
  const maxStreak = longestStreak;
  const currentStreak = habits.length ? Math.max(...habits.map(h => h.lastCompleted === today ? h.streak : 0)) : 0;

  // Heatmap: last 12 weeks (84 days)
  const heatmapDays = Array.from({ length: 84 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i));
    return d.toISOString().split('T')[0];
  });

  const getCompletionsForDay = (dateStr: string) => {
    return habits.filter(h => (h.completionDates || []).includes(dateStr) || h.lastCompleted === dateStr).length;
  };

  const heatmapIntensity = (count: number) => {
    if (count === 0) return 'rgba(255,255,255,0.04)';
    if (count === 1) return 'rgba(124,58,237,0.3)';
    if (count === 2) return 'rgba(124,58,237,0.5)';
    if (count === 3) return 'rgba(124,58,237,0.7)';
    return '#7c3aed';
  };

  const filteredHabits = habits.filter(h => {
    if (filter === 'done') return h.lastCompleted === today;
    if (filter === 'pending') return h.lastCompleted !== today;
    return true;
  });

  if (!isLoaded) return <div style={{ minHeight: '100vh', backgroundColor: '#080810' }} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#080810', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {isMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '56px', backgroundColor: '#0a0a14', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 16px', zIndex: 60 }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', color: '#e2e8f0', fontSize: '18px', cursor: 'pointer' }}>☰</button>
          <span style={{ marginLeft: '12px', fontSize: '16px', fontWeight: 700, background: 'linear-gradient(90deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sanctum</span>
        </div>
      )}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 65 }} />
      )}
      <Sidebar maxStreak={maxStreak} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
      <main style={{ marginLeft: isMobile ? 0 : '220px', padding: isMobile ? '72px 16px 24px' : '32px', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>Habits</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Build consistency, one day at a time</p>
          </div>
          <button onClick={() => setActiveModal('addHabit')} style={btnPrimary}>+ Add Habit</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Completion Rate', value: `${completionRate}%`, sub: `${completedToday}/${habits.length} today`, color: '#10b981', icon: '✅' },
            { label: 'Longest Streak', value: `${longestStreak}d`, sub: 'all-time best', color: '#f59e0b', icon: '🏆' },
            { label: 'Current Streak', value: `${currentStreak}d`, sub: 'active now', color: '#7c3aed', icon: '🔥' },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div style={{ ...card, padding: '24px', marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Activity — Last 12 Weeks</div>
          <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(84, 12px)', gap: '3px' }}>
              {heatmapDays.map(day => {
                const count = getCompletionsForDay(day);
                return (
                  <div key={day} title={`${day}: ${count} habits`} style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: heatmapIntensity(count), flexShrink: 0 }} />
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '10px', color: '#475569' }}>Less</span>
            {[0, 1, 2, 3, 4].map(n => <div key={n} style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: heatmapIntensity(n) }} />)}
            <span style={{ fontSize: '10px', color: '#475569' }}>More</span>
          </div>
        </div>

        {/* Filter + Habits List */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '1px', textTransform: 'uppercase' }}>All Habits</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'done', 'pending'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, backgroundColor: filter === f ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)', color: filter === f ? '#7c3aed' : '#64748b', border: filter === f ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', textTransform: 'capitalize' }}>{f}</button>
            ))}
          </div>
        </div>

        {filteredHabits.length === 0 ? (
          <div onClick={() => setActiveModal('addHabit')} style={{ ...card, padding: '48px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.1)', cursor: 'pointer' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✨</div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>No habits yet</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Click to add your first habit</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredHabits.map(h => {
              const done = h.lastCompleted === today;
              return (
                <div key={h.id} style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderColor: done ? 'rgba(16,185,129,0.25)' : undefined, backgroundColor: done ? 'rgba(16,185,129,0.03)' : undefined }}>
                  <button onClick={() => toggleHabit(h.id)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: done ? 'none' : '2px solid rgba(255,255,255,0.2)', backgroundColor: done ? '#10b981' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{done ? '✓' : ''}</button>
                  <div style={{ fontSize: '24px' }}>{h.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, textDecoration: done ? 'line-through' : 'none', color: done ? '#64748b' : '#e2e8f0' }}>{h.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{done ? 'Completed today' : 'Not done yet'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '20px', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <span style={{ fontSize: '14px' }}>🔥</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>{h.streak}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>days</span>
                  </div>
                  <button onClick={() => { setEditItem(h); setActiveModal('editHabit'); }} style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}>✎</button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      {activeModal === 'addHabit' && (
        <Modal title="Add Habit" onClose={() => setActiveModal(null)}>
          <Field label="Habit Name"><input value={newHabit.name} onChange={e => setNewHabit({ ...newHabit, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && addHabit()} style={inputStyle} placeholder="Morning workout" /></Field>
          <Field label="Icon"><input value={newHabit.icon} onChange={e => setNewHabit({ ...newHabit, icon: e.target.value })} style={inputStyle} placeholder="💪" maxLength={2} /></Field>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setActiveModal(null)} style={btnSecondary}>Cancel</button>
            <button onClick={addHabit} style={{ ...btnPrimary, flex: 1 }}>Add Habit</button>
          </div>
        </Modal>
      )}

      {activeModal === 'editHabit' && editItem && (
        <Modal title="Edit Habit" onClose={() => { setActiveModal(null); setEditItem(null); }}>
          <Field label="Name"><input value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} style={inputStyle} /></Field>
          <Field label="Icon"><input value={editItem.icon} onChange={e => setEditItem({ ...editItem, icon: e.target.value })} style={inputStyle} maxLength={2} /></Field>
          <Field label="Streak (days)"><input type="number" value={editItem.streak} onChange={e => setEditItem({ ...editItem, streak: parseInt(e.target.value) || 0 })} style={inputStyle} /></Field>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => deleteHabit(editItem.id)} style={{ ...btnSecondary, color: '#f43f5e' }}>Delete</button>
            <button onClick={() => { setActiveModal(null); setEditItem(null); }} style={btnSecondary}>Cancel</button>
            <button onClick={saveHabit} style={{ ...btnPrimary, flex: 1 }}>Save</button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: `translateX(-50%) translateY(${toast.show ? 0 : 20}px)`, opacity: toast.show ? 1 : 0, backgroundColor: '#0d0d1a', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', padding: '12px 18px', fontSize: '13px', fontWeight: 500, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 200, transition: 'all 0.3s ease', pointerEvents: 'none', whiteSpace: 'nowrap' }}>{toast.text}</div>
    </div>
  );
}
