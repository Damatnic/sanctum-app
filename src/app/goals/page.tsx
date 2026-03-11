'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DATA_VERSION = 2;

interface Goal {
  id: number;
  name: string;
  icon: string;
  current: number;
  target: number;
  category?: string;
}

interface SanctumData {
  version: number;
  habits: any[];
  goals: Goal[];
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

const CATEGORIES = ['Personal', 'Health', 'Learning', 'Finance', 'Career', 'Creative', 'Social'];

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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px', width: '100%', maxWidth: '420px' }}>
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

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({ name: '', icon: '🎯', target: '', category: 'Personal' });
  const [toast, setToast] = useState({ show: false, text: '' });

  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#e2e8f0', fontSize: '14px', width: '100%', boxSizing: 'border-box' as const };
  const btnPrimary = { backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' };
  const btnSecondary = { backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' };
  const card = { backgroundColor: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' };

  const loadData = () => {
    try {
      const saved = localStorage.getItem('sanctum-v2');
      if (saved) {
        const data: SanctumData = JSON.parse(saved);
        if (data.version === DATA_VERSION) {
          setGoals(data.goals || []);
          setHabits(data.habits || []);
        }
      }
    } catch (e) { console.error(e); }
    setIsLoaded(true);
  };

  const saveGoals = (newGoals: Goal[]) => {
    try {
      const saved = localStorage.getItem('sanctum-v2');
      const data: SanctumData = saved ? JSON.parse(saved) : { version: DATA_VERSION, habits: [], goals: [], deadlines: [], projects: [], journal: [], mood: null, quoteIndex: 0, focusMinutes: 0, totalFocusSessions: 0, settings: { name: '', city: '', apiKey: '' } };
      data.goals = newGoals;
      localStorage.setItem('sanctum-v2', JSON.stringify(data));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (text: string) => {
    setToast({ show: true, text });
    setTimeout(() => setToast({ show: false, text: '' }), 2500);
  };

  const incrementGoal = (id: number, amt: number) => {
    const updated = goals.map(g => {
      if (g.id !== id) return g;
      const curr = Math.min(g.target, Math.max(0, g.current + amt));
      if (curr === g.target && g.current < g.target) showToast(`🎉 Goal complete: ${g.name}!`);
      return { ...g, current: curr };
    });
    setGoals(updated);
    saveGoals(updated);
  };

  const addGoal = () => {
    if (!newGoal.name.trim()) return;
    const updated = [...goals, { id: Date.now(), name: newGoal.name.trim(), icon: newGoal.icon || '🎯', current: 0, target: parseInt(newGoal.target) || 100, category: newGoal.category }];
    setGoals(updated);
    saveGoals(updated);
    setNewGoal({ name: '', icon: '🎯', target: '', category: 'Personal' });
    setActiveModal(null);
    showToast('🎯 Goal added!');
  };

  const saveGoal = () => {
    if (!editItem) return;
    const updated = goals.map(g => g.id === editItem.id ? editItem : g);
    setGoals(updated);
    saveGoals(updated);
    setEditItem(null);
    setActiveModal(null);
    showToast('✓ Saved!');
  };

  const deleteGoal = (id: number) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    saveGoals(updated);
    setEditItem(null);
    setActiveModal(null);
    showToast('🗑️ Deleted');
  };

  const maxStreak = habits.length ? Math.max(...habits.map((h: any) => h.streak || 0)) : 0;

  const allCategories = ['all', ...Array.from(new Set(goals.map(g => g.category || 'Personal')))];
  const filteredGoals = filterCat === 'all' ? goals : goals.filter(g => (g.category || 'Personal') === filterCat);

  const totalComplete = goals.filter(g => g.current >= g.target).length;
  const avgProgress = goals.length ? Math.round(goals.reduce((s, g) => s + (g.current / g.target), 0) / goals.length * 100) : 0;

  const getMilestoneColor = (pct: number) => {
    if (pct >= 100) return '#10b981';
    if (pct >= 75) return '#7c3aed';
    if (pct >= 50) return '#06b6d4';
    if (pct >= 25) return '#f59e0b';
    return 'rgba(255,255,255,0.1)';
  };

  if (!isLoaded) return <div style={{ minHeight: '100vh', backgroundColor: '#080810' }} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#080810', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar maxStreak={maxStreak} />
      <main style={{ marginLeft: '220px', padding: '32px', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>Goals</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Track your progress toward what matters</p>
          </div>
          <button onClick={() => setActiveModal('addGoal')} style={btnPrimary}>+ Add Goal</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Goals', value: goals.length, icon: '🎯', color: '#7c3aed' },
            { label: 'Completed', value: totalComplete, icon: '✅', color: '#10b981' },
            { label: 'Avg Progress', value: `${avgProgress}%`, icon: '📈', color: '#06b6d4' },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {allCategories.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, backgroundColor: filterCat === c ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)', color: filterCat === c ? '#7c3aed' : '#64748b', border: filterCat === c ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', textTransform: 'capitalize' }}>{c === 'all' ? 'All Categories' : c}</button>
          ))}
        </div>

        {/* Goals */}
        {filteredGoals.length === 0 ? (
          <div onClick={() => setActiveModal('addGoal')} style={{ ...card, padding: '60px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.1)', cursor: 'pointer' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No goals yet</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Set a goal and start tracking progress</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredGoals.map(g => {
              const pct = Math.min(100, Math.round((g.current / g.target) * 100));
              const complete = pct >= 100;
              return (
                <div key={g.id} style={{ ...card, padding: '20px', borderColor: complete ? 'rgba(16,185,129,0.25)' : undefined }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{g.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700 }}>{g.name}</div>
                          {g.category && <span style={{ fontSize: '10px', fontWeight: 600, color: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: '10px' }}>{g.category}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: complete ? '#10b981' : '#7c3aed' }}>{pct}%</span>
                          <button onClick={() => { setEditItem(g); setActiveModal('editGoal'); }} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px' }}>✎</button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: complete ? '#10b981' : 'linear-gradient(90deg, #7c3aed, #06b6d4)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                      </div>

                      {/* Milestones */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        {[25, 50, 75, 100].map(milestone => {
                          const reached = pct >= milestone;
                          return (
                            <div key={milestone} style={{ flex: 1, textAlign: 'center' }}>
                              <div style={{ width: '100%', height: '4px', borderRadius: '2px', backgroundColor: reached ? getMilestoneColor(milestone) : 'rgba(255,255,255,0.06)', marginBottom: '4px' }} />
                              <span style={{ fontSize: '9px', color: reached ? getMilestoneColor(milestone) : '#475569', fontWeight: 600 }}>{milestone}%</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => incrementGoal(g.id, -10)} style={{ ...btnSecondary, padding: '6px 10px', fontSize: '12px' }}>−10</button>
                        <button onClick={() => incrementGoal(g.id, -1)} style={{ ...btnSecondary, padding: '6px 10px', fontSize: '12px' }}>−1</button>
                        <div style={{ flex: 1, textAlign: 'center', fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>{g.current} / {g.target}</div>
                        <button onClick={() => incrementGoal(g.id, 1)} style={{ ...btnPrimary, padding: '6px 10px', fontSize: '12px' }}>+1</button>
                        <button onClick={() => incrementGoal(g.id, 10)} style={{ ...btnPrimary, padding: '6px 10px', fontSize: '12px' }}>+10</button>
                        {complete && <span style={{ fontSize: '18px' }}>🏆</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      {activeModal === 'addGoal' && (
        <Modal title="Add Goal" onClose={() => setActiveModal(null)}>
          <Field label="Goal Name"><input value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && addGoal()} style={inputStyle} placeholder="Read 24 books this year" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Target"><input type="number" value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: e.target.value })} style={inputStyle} placeholder="100" /></Field>
            <Field label="Icon"><input value={newGoal.icon} onChange={e => setNewGoal({ ...newGoal, icon: e.target.value })} style={inputStyle} placeholder="📚" maxLength={2} /></Field>
          </div>
          <Field label="Category">
            <select value={newGoal.category} onChange={e => setNewGoal({ ...newGoal, category: e.target.value })} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setActiveModal(null)} style={btnSecondary}>Cancel</button>
            <button onClick={addGoal} style={{ ...btnPrimary, flex: 1 }}>Add Goal</button>
          </div>
        </Modal>
      )}

      {activeModal === 'editGoal' && editItem && (
        <Modal title="Edit Goal" onClose={() => { setActiveModal(null); setEditItem(null); }}>
          <Field label="Goal Name"><input value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} style={inputStyle} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Current"><input type="number" value={editItem.current} onChange={e => setEditItem({ ...editItem, current: parseInt(e.target.value) || 0 })} style={inputStyle} /></Field>
            <Field label="Target"><input type="number" value={editItem.target} onChange={e => setEditItem({ ...editItem, target: parseInt(e.target.value) || 1 })} style={inputStyle} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Icon"><input value={editItem.icon} onChange={e => setEditItem({ ...editItem, icon: e.target.value })} style={inputStyle} maxLength={2} /></Field>
            <Field label="Category">
              <select value={editItem.category || 'Personal'} onChange={e => setEditItem({ ...editItem, category: e.target.value })} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => deleteGoal(editItem.id)} style={{ ...btnSecondary, color: '#f43f5e' }}>Delete</button>
            <button onClick={() => { setActiveModal(null); setEditItem(null); }} style={btnSecondary}>Cancel</button>
            <button onClick={saveGoal} style={{ ...btnPrimary, flex: 1 }}>Save</button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: `translateX(-50%) translateY(${toast.show ? 0 : 20}px)`, opacity: toast.show ? 1 : 0, backgroundColor: '#0d0d1a', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', padding: '12px 18px', fontSize: '13px', fontWeight: 500, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 200, transition: 'all 0.3s ease', pointerEvents: 'none', whiteSpace: 'nowrap' }}>{toast.text}</div>
    </div>
  );
}
