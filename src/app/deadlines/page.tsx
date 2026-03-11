'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DATA_VERSION = 2;

interface Deadline {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  done: boolean;
}

interface SanctumData {
  version: number;
  habits: any[];
  goals: any[];
  deadlines: Deadline[];
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

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Deadline | null>(null);
  const [newDeadline, setNewDeadline] = useState({ title: '', course: '', dueDate: '' });
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
          setDeadlines(data.deadlines || []);
          setHabits(data.habits || []);
        }
      }
    } catch (e) { console.error(e); }
    setIsLoaded(true);
  };

  const saveDeadlines = (dl: Deadline[]) => {
    try {
      const saved = localStorage.getItem('sanctum-v2');
      const data: SanctumData = saved ? JSON.parse(saved) : { version: DATA_VERSION, habits: [], goals: [], deadlines: [], projects: [], journal: [], mood: null, quoteIndex: 0, focusMinutes: 0, totalFocusSessions: 0, settings: { name: '', city: '', apiKey: '' } };
      data.deadlines = dl;
      localStorage.setItem('sanctum-v2', JSON.stringify(data));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (text: string) => {
    setToast({ show: true, text });
    setTimeout(() => setToast({ show: false, text: '' }), 2500);
  };

  const addDeadline = () => {
    if (!newDeadline.title.trim() || !newDeadline.dueDate) return;
    const updated = [...deadlines, { id: Date.now(), title: newDeadline.title.trim(), course: newDeadline.course.trim(), dueDate: newDeadline.dueDate, done: false }];
    setDeadlines(updated);
    saveDeadlines(updated);
    setNewDeadline({ title: '', course: '', dueDate: '' });
    setActiveModal(null);
    showToast('📅 Deadline added!');
  };

  const toggleDeadline = (id: number) => {
    const updated = deadlines.map(d => {
      if (d.id !== id) return d;
      if (!d.done) showToast(`✅ ${d.title} completed!`);
      return { ...d, done: !d.done };
    });
    setDeadlines(updated);
    saveDeadlines(updated);
  };

  const saveDeadline = () => {
    if (!editItem) return;
    const updated = deadlines.map(d => d.id === editItem.id ? editItem : d);
    setDeadlines(updated);
    saveDeadlines(updated);
    setEditItem(null);
    setActiveModal(null);
    showToast('✓ Saved!');
  };

  const deleteDeadline = (id: number) => {
    const updated = deadlines.filter(d => d.id !== id);
    setDeadlines(updated);
    saveDeadlines(updated);
    setEditItem(null);
    setActiveModal(null);
    showToast('🗑️ Deleted');
  };

  const getDiffInfo = (dueDate: string, done: boolean) => {
    if (done) return { diff: 0, color: '#10b981', label: 'Done', bg: 'rgba(16,185,129,0.1)' };
    const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
    if (diff < 0) return { diff, color: '#f43f5e', label: `${Math.abs(diff)}d overdue`, bg: 'rgba(244,63,94,0.1)' };
    if (diff === 0) return { diff, color: '#f43f5e', label: 'Today!', bg: 'rgba(244,63,94,0.1)' };
    if (diff === 1) return { diff, color: '#f59e0b', label: 'Tomorrow', bg: 'rgba(245,158,11,0.1)' };
    if (diff <= 3) return { diff, color: '#f59e0b', label: `${diff}d`, bg: 'rgba(245,158,11,0.1)' };
    if (diff <= 7) return { diff, color: '#06b6d4', label: `${diff}d`, bg: 'rgba(6,182,212,0.1)' };
    return { diff, color: '#10b981', label: `${diff}d`, bg: 'rgba(16,185,129,0.1)' };
  };

  const maxStreak = habits.length ? Math.max(...habits.map((h: any) => h.streak || 0)) : 0;

  const pending = deadlines.filter(d => !d.done);
  const completed = deadlines.filter(d => d.done);
  const overdue = pending.filter(d => new Date(d.dueDate) < new Date(new Date().toISOString().split('T')[0]));
  const dueThisWeek = pending.filter(d => {
    const diff = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000);
    return diff >= 0 && diff <= 7;
  });

  const sortDeadlines = (arr: Deadline[]) => {
    if (sortBy === 'date') return [...arr].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    // by status: overdue → today → soon → far
    return [...arr].sort((a, b) => {
      const da = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000);
      const db = Math.ceil((new Date(b.dueDate).getTime() - Date.now()) / 86400000);
      return da - db;
    });
  };

  const displayDeadlines = sortDeadlines(showCompleted ? deadlines : pending);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (!isLoaded) return <div style={{ minHeight: '100vh', backgroundColor: '#080810' }} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#080810', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar maxStreak={maxStreak} />
      <main style={{ marginLeft: '220px', padding: '32px', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>Deadlines</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Stay on top of everything due</p>
          </div>
          <button onClick={() => setActiveModal('addDeadline')} style={btnPrimary}>+ Add Deadline</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Total', value: deadlines.length, color: '#7c3aed', icon: '📅' },
            { label: 'Pending', value: pending.length, color: '#06b6d4', icon: '⏳' },
            { label: 'Overdue', value: overdue.length, color: '#f43f5e', icon: '🚨' },
            { label: 'Done', value: completed.length, color: '#10b981', icon: '✅' },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderColor: overdue.length > 0 && s.label === 'Overdue' ? 'rgba(244,63,94,0.3)' : undefined }}>
              <span style={{ fontSize: '24px' }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* This week callout */}
        {dueThisWeek.length > 0 && (
          <div style={{ ...card, padding: '16px 20px', marginBottom: '20px', borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>{dueThisWeek.length} deadline{dueThisWeek.length !== 1 ? 's' : ''} due this week</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{dueThisWeek.map(d => d.title).join(', ')}</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setSortBy('date')} style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, backgroundColor: sortBy === 'date' ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)', color: sortBy === 'date' ? '#7c3aed' : '#64748b', border: sortBy === 'date' ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>Sort by Date</button>
            <button onClick={() => setSortBy('status')} style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, backgroundColor: sortBy === 'status' ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)', color: sortBy === 'status' ? '#7c3aed' : '#64748b', border: sortBy === 'status' ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>Sort by Urgency</button>
          </div>
          <button
            onClick={() => setShowCompleted(s => !s)}
            style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, backgroundColor: showCompleted ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', color: showCompleted ? '#10b981' : '#64748b', border: showCompleted ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
          >
            {showCompleted ? '✓ Hiding Completed' : 'Show Completed'}
          </button>
        </div>

        {/* Deadlines List */}
        {displayDeadlines.length === 0 ? (
          <div onClick={() => setActiveModal('addDeadline')} style={{ ...card, padding: '60px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.1)', cursor: 'pointer' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No deadlines</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Click to add a deadline</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayDeadlines.map(d => {
              const info = getDiffInfo(d.dueDate, d.done);
              const isOverdue = !d.done && info.diff < 0;
              return (
                <div key={d.id} style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: `3px solid ${info.color}`, backgroundColor: isOverdue ? 'rgba(244,63,94,0.03)' : d.done ? 'rgba(16,185,129,0.02)' : undefined, opacity: d.done ? 0.7 : 1 }}>
                  {/* Checkbox */}
                  <button onClick={() => toggleDeadline(d.id)} style={{ width: '22px', height: '22px', borderRadius: '5px', border: d.done ? 'none' : '2px solid rgba(255,255,255,0.2)', backgroundColor: d.done ? '#10b981' : 'transparent', color: 'white', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                    {d.done ? '✓' : ''}
                  </button>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, textDecoration: d.done ? 'line-through' : 'none', color: d.done ? '#64748b' : isOverdue ? '#fca5a5' : '#e2e8f0' }}>{d.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      {d.course && <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{d.course}</span>}
                      {d.course && <span style={{ fontSize: '10px', color: '#475569' }}>·</span>}
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{formatDate(d.dueDate)}</span>
                    </div>
                  </div>

                  {/* Badge */}
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', backgroundColor: info.bg, color: info.color, whiteSpace: 'nowrap' }}>{info.label}</span>

                  {/* Edit */}
                  <button onClick={() => { setEditItem(d); setActiveModal('editDeadline'); }} style={{ width: '30px', height: '30px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}>✎</button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      {activeModal === 'addDeadline' && (
        <Modal title="Add Deadline" onClose={() => setActiveModal(null)}>
          <Field label="Title"><input value={newDeadline.title} onChange={e => setNewDeadline({ ...newDeadline, title: e.target.value })} onKeyDown={e => e.key === 'Enter' && addDeadline()} style={inputStyle} placeholder="Final Exam" /></Field>
          <Field label="Course (optional)"><input value={newDeadline.course} onChange={e => setNewDeadline({ ...newDeadline, course: e.target.value })} style={inputStyle} placeholder="Statistics 301" /></Field>
          <Field label="Due Date"><input type="date" value={newDeadline.dueDate} onChange={e => setNewDeadline({ ...newDeadline, dueDate: e.target.value })} style={inputStyle} /></Field>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setActiveModal(null)} style={btnSecondary}>Cancel</button>
            <button onClick={addDeadline} style={{ ...btnPrimary, flex: 1 }}>Add Deadline</button>
          </div>
        </Modal>
      )}

      {activeModal === 'editDeadline' && editItem && (
        <Modal title="Edit Deadline" onClose={() => { setActiveModal(null); setEditItem(null); }}>
          <Field label="Title"><input value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} style={inputStyle} /></Field>
          <Field label="Course"><input value={editItem.course} onChange={e => setEditItem({ ...editItem, course: e.target.value })} style={inputStyle} /></Field>
          <Field label="Due Date"><input type="date" value={editItem.dueDate} onChange={e => setEditItem({ ...editItem, dueDate: e.target.value })} style={inputStyle} /></Field>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => deleteDeadline(editItem.id)} style={{ ...btnSecondary, color: '#f43f5e' }}>Delete</button>
            <button onClick={() => { setActiveModal(null); setEditItem(null); }} style={btnSecondary}>Cancel</button>
            <button onClick={saveDeadline} style={{ ...btnPrimary, flex: 1 }}>Save</button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: `translateX(-50%) translateY(${toast.show ? 0 : 20}px)`, opacity: toast.show ? 1 : 0, backgroundColor: '#0d0d1a', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', padding: '12px 18px', fontSize: '13px', fontWeight: 500, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 200, transition: 'all 0.3s ease', pointerEvents: 'none', whiteSpace: 'nowrap' }}>{toast.text}</div>
    </div>
  );
}
