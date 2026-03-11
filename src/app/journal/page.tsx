'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DATA_VERSION = 2;

interface JournalEntry {
  id: number;
  date: string;
  text: string;
  mood?: string;
}

interface SanctumData {
  version: number;
  habits: any[];
  goals: any[];
  deadlines: any[];
  projects: any[];
  journal: JournalEntry[];
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

const MOODS = [
  { k: 'great', e: '😄', label: 'Great' },
  { k: 'good', e: '🙂', label: 'Good' },
  { k: 'okay', e: '😐', label: 'Okay' },
  { k: 'low', e: '😔', label: 'Low' },
  { k: 'rough', e: '😫', label: 'Rough' },
];

function Sidebar({ maxStreak, isOpen, isMobile }: { maxStreak: number; isOpen?: boolean; isMobile?: boolean }) {
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
      <div style={{ backgroundColor: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px', width: '100%', maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function JournalPage() {
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [moodFilter, setMoodFilter] = useState<string>('all');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({ text: '', mood: '' });
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);
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

  const loadData = () => {
    try {
      const saved = localStorage.getItem('sanctum-v2');
      if (saved) {
        const data: SanctumData = JSON.parse(saved);
        if (data.version === DATA_VERSION) {
          setJournal(data.journal || []);
          setHabits(data.habits || []);
        }
      }
    } catch (e) { console.error(e); }
    setIsLoaded(true);
  };

  const saveJournal = (entries: JournalEntry[]) => {
    try {
      const saved = localStorage.getItem('sanctum-v2');
      const data: SanctumData = saved ? JSON.parse(saved) : { version: DATA_VERSION, habits: [], goals: [], deadlines: [], projects: [], journal: [], mood: null, quoteIndex: 0, focusMinutes: 0, totalFocusSessions: 0, settings: { name: '', city: '', apiKey: '' } };
      data.journal = entries;
      localStorage.setItem('sanctum-v2', JSON.stringify(data));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (text: string) => {
    setToast({ show: true, text });
    setTimeout(() => setToast({ show: false, text: '' }), 2500);
  };

  const addEntry = () => {
    if (!newEntry.text.trim()) return;
    const entry: JournalEntry = { id: Date.now(), date: new Date().toISOString(), text: newEntry.text.trim(), mood: newEntry.mood || undefined };
    const updated = [entry, ...journal];
    setJournal(updated);
    saveJournal(updated);
    setNewEntry({ text: '', mood: '' });
    setActiveModal(null);
    showToast('📝 Entry saved!');
  };

  const deleteEntry = (id: number) => {
    const updated = journal.filter(e => e.id !== id);
    setJournal(updated);
    saveJournal(updated);
    setViewEntry(null);
    showToast('🗑️ Deleted');
  };

  const maxStreak = habits.length ? Math.max(...habits.map((h: any) => h.streak || 0)) : 0;

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthEntries = journal.filter(e => e.date.startsWith(thisMonth));

  const filteredJournal = journal
    .filter(e => {
      if (moodFilter !== 'all' && e.mood !== moodFilter) return false;
      if (search && !e.text.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getMoodEmoji = (mood?: string) => MOODS.find(m => m.k === mood)?.e || '📝';

  const formatEntryDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const day = d.toISOString().split('T')[0];
    if (day === today) return `Today, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    if (day === yesterday) return `Yesterday, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

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
      <Sidebar maxStreak={maxStreak} isOpen={sidebarOpen} isMobile={isMobile} />
      <main style={{ marginLeft: isMobile ? 0 : '220px', padding: isMobile ? '72px 16px 24px' : '32px', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>Journal</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Your thoughts, captured over time</p>
          </div>
          <button onClick={() => setActiveModal('addEntry')} style={btnPrimary}>+ New Entry</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Entries', value: journal.length, icon: '📝', color: '#7c3aed' },
            { label: 'This Month', value: thisMonthEntries.length, icon: '📅', color: '#06b6d4' },
            { label: 'Moods Tracked', value: journal.filter(e => e.mood).length, icon: '💚', color: '#10b981' },
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

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#64748b' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search entries..."
              style={{ ...inputStyle, paddingLeft: '36px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setMoodFilter('all')} style={{ padding: '8px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, backgroundColor: moodFilter === 'all' ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)', color: moodFilter === 'all' ? '#7c3aed' : '#64748b', border: moodFilter === 'all' ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>All Moods</button>
            {MOODS.map(m => (
              <button key={m.k} onClick={() => setMoodFilter(moodFilter === m.k ? 'all' : m.k)} style={{ padding: '8px 12px', borderRadius: '20px', fontSize: '13px', backgroundColor: moodFilter === m.k ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)', border: moodFilter === m.k ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>{m.e}</button>
            ))}
          </div>
        </div>

        {/* Entries */}
        {filteredJournal.length === 0 ? (
          <div onClick={() => setActiveModal('addEntry')} style={{ ...card, padding: '60px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.1)', cursor: 'pointer' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{journal.length === 0 ? 'No entries yet' : 'No matching entries'}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>{journal.length === 0 ? 'Write your first journal entry' : 'Try a different search or filter'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredJournal.map(entry => (
              <div key={entry.id} onClick={() => setViewEntry(entry)} style={{ ...card, padding: '20px', cursor: 'pointer', transition: 'border-color 0.15s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{getMoodEmoji(entry.mood)}</span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{formatEntryDate(entry.date)}</span>
                    {entry.mood && <span style={{ fontSize: '10px', fontWeight: 600, color: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: '10px' }}>{entry.mood}</span>}
                  </div>
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: '#cbd5e1', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any }}>{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Entry Modal */}
      {activeModal === 'addEntry' && (
        <Modal title="New Journal Entry" onClose={() => setActiveModal(null)}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mood (optional)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {MOODS.map(m => (
                <button key={m.k} onClick={() => setNewEntry(p => ({ ...p, mood: p.mood === m.k ? '' : m.k }))} style={{ flex: 1, padding: '10px 6px', borderRadius: '8px', backgroundColor: newEntry.mood === m.k ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)', border: newEntry.mood === m.k ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', textAlign: 'center' }}>
                  <span style={{ fontSize: '20px', display: 'block' }}>{m.e}</span>
                  <span style={{ fontSize: '9px', color: '#64748b' }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Entry</label>
            <textarea
              value={newEntry.text}
              onChange={e => setNewEntry({ ...newEntry, text: e.target.value })}
              placeholder="What's on your mind today?"
              style={{ ...inputStyle, height: '160px', resize: 'vertical' }}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setActiveModal(null)} style={btnSecondary}>Cancel</button>
            <button onClick={addEntry} style={{ ...btnPrimary, flex: 1 }}>Save Entry</button>
          </div>
        </Modal>
      )}

      {/* View Entry Modal */}
      {viewEntry && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{getMoodEmoji(viewEntry.mood)}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{formatEntryDate(viewEntry.date)}</div>
                  {viewEntry.mood && <span style={{ fontSize: '11px', fontWeight: 600, color: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.1)', padding: '2px 8px', borderRadius: '10px' }}>{viewEntry.mood}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => deleteEntry(viewEntry.id)} style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', cursor: 'pointer', fontSize: '14px' }}>🗑</button>
                <button onClick={() => setViewEntry(null)} style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', color: '#64748b', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
            <p style={{ fontSize: '15px', lineHeight: 1.8, color: '#e2e8f0', margin: 0, whiteSpace: 'pre-wrap' }}>{viewEntry.text}</p>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: `translateX(-50%) translateY(${toast.show ? 0 : 20}px)`, opacity: toast.show ? 1 : 0, backgroundColor: '#0d0d1a', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', padding: '12px 18px', fontSize: '13px', fontWeight: 500, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 200, transition: 'all 0.3s ease', pointerEvents: 'none', whiteSpace: 'nowrap' }}>{toast.text}</div>
    </div>
  );
}
