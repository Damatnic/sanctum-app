'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DATA_VERSION = 2;

interface Project {
  id: number;
  name: string;
  desc: string;
  icon: string;
  color: string;
  status: string;
}

interface SanctumData {
  version: number;
  habits: any[];
  goals: any[];
  deadlines: any[];
  projects: Project[];
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

const COLOR_MAP: Record<string, string> = { violet: '#7c3aed', cyan: '#06b6d4', amber: '#f59e0b', emerald: '#10b981', rose: '#f43f5e', blue: '#3b82f6' };
const STATUS_COLORS: Record<string, string> = { active: '#10b981', planning: '#3b82f6', paused: '#f59e0b', complete: '#7c3aed' };
const STATUS_LABELS: Record<string, string> = { active: 'Active', planning: 'Planning', paused: 'Paused', complete: 'Complete' };

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
      <div style={{ backgroundColor: '#0d0d1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px', width: '100%', maxWidth: '400px' }}>
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({ name: '', desc: '', icon: '📁', color: 'violet', status: 'active' });
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
          setProjects(data.projects || []);
          setHabits(data.habits || []);
        }
      }
    } catch (e) { console.error(e); }
    setIsLoaded(true);
  };

  const saveProjects = (newProjects: Project[]) => {
    try {
      const saved = localStorage.getItem('sanctum-v2');
      const data: SanctumData = saved ? JSON.parse(saved) : { version: DATA_VERSION, habits: [], goals: [], deadlines: [], projects: [], journal: [], mood: null, quoteIndex: 0, focusMinutes: 0, totalFocusSessions: 0, settings: { name: '', city: '', apiKey: '' } };
      data.projects = newProjects;
      localStorage.setItem('sanctum-v2', JSON.stringify(data));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (text: string) => {
    setToast({ show: true, text });
    setTimeout(() => setToast({ show: false, text: '' }), 2500);
  };

  const addProject = () => {
    if (!newProject.name.trim()) return;
    const updated = [...projects, { id: Date.now(), name: newProject.name.trim(), desc: newProject.desc.trim(), icon: newProject.icon || '📁', color: newProject.color, status: newProject.status }];
    setProjects(updated);
    saveProjects(updated);
    setNewProject({ name: '', desc: '', icon: '📁', color: 'violet', status: 'active' });
    setActiveModal(null);
    showToast('📋 Project added!');
  };

  const saveProject = () => {
    if (!editItem) return;
    const updated = projects.map(p => p.id === editItem.id ? editItem : p);
    setProjects(updated);
    saveProjects(updated);
    setEditItem(null);
    setActiveModal(null);
    showToast('✓ Saved!');
  };

  const deleteProject = (id: number) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveProjects(updated);
    setEditItem(null);
    setActiveModal(null);
    showToast('🗑️ Deleted');
  };

  const maxStreak = habits.length ? Math.max(...habits.map((h: any) => h.streak || 0)) : 0;
  const filteredProjects = filterStatus === 'all' ? projects : projects.filter(p => p.status === filterStatus);

  const statusCounts: Record<string, number> = {};
  projects.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });

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
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>Projects</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Everything you're working on</p>
          </div>
          <button onClick={() => setActiveModal('addProject')} style={btnPrimary}>+ Add Project</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} style={{ ...card, padding: '16px', textAlign: 'center', borderColor: `${color}25` }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color }}>{statusCounts[status] || 0}</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{STATUS_LABELS[status]}</div>
            </div>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {['all', 'active', 'planning', 'paused', 'complete'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, backgroundColor: filterStatus === s ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)', color: filterStatus === s ? '#7c3aed' : '#64748b', border: filterStatus === s ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', textTransform: 'capitalize' }}>{s === 'all' ? 'All' : STATUS_LABELS[s]}</button>
          ))}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div onClick={() => setActiveModal('addProject')} style={{ ...card, padding: '60px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.1)', cursor: 'pointer' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{projects.length === 0 ? 'No projects yet' : 'No projects matching filter'}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Click to add your first project</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredProjects.map(p => {
              const color = COLOR_MAP[p.color] || COLOR_MAP.violet;
              const statusColor = STATUS_COLORS[p.status] || STATUS_COLORS.active;
              return (
                <div key={p.id} onClick={() => { setEditItem(p); setActiveModal('editProject'); }} style={{ ...card, padding: '20px', cursor: 'pointer', borderColor: `${color}20`, transition: 'all 0.15s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{p.icon}</div>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 10px', borderRadius: '20px', backgroundColor: `${statusColor}15`, color: statusColor }}>{STATUS_LABELS[p.status] || p.status}</span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{p.name}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{p.desc || 'No description'}</div>
                  <div style={{ marginTop: '14px', height: '3px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: p.status === 'complete' ? '100%' : p.status === 'active' ? '60%' : p.status === 'paused' ? '40%' : '20%', backgroundColor: color, borderRadius: '2px', opacity: 0.6 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      {activeModal === 'addProject' && (
        <Modal title="Add Project" onClose={() => setActiveModal(null)}>
          <Field label="Name"><input value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && addProject()} style={inputStyle} placeholder="My Awesome Project" /></Field>
          <Field label="Description"><input value={newProject.desc} onChange={e => setNewProject({ ...newProject, desc: e.target.value })} style={inputStyle} placeholder="What's this project about?" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Icon"><input value={newProject.icon} onChange={e => setNewProject({ ...newProject, icon: e.target.value })} style={inputStyle} placeholder="📁" maxLength={2} /></Field>
            <Field label="Color">
              <select value={newProject.color} onChange={e => setNewProject({ ...newProject, color: e.target.value })} style={inputStyle}>
                {Object.keys(COLOR_MAP).map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Status">
            <select value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value })} style={inputStyle}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setActiveModal(null)} style={btnSecondary}>Cancel</button>
            <button onClick={addProject} style={{ ...btnPrimary, flex: 1 }}>Add Project</button>
          </div>
        </Modal>
      )}

      {activeModal === 'editProject' && editItem && (
        <Modal title="Edit Project" onClose={() => { setActiveModal(null); setEditItem(null); }}>
          <Field label="Name"><input value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} style={inputStyle} /></Field>
          <Field label="Description"><input value={editItem.desc} onChange={e => setEditItem({ ...editItem, desc: e.target.value })} style={inputStyle} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Icon"><input value={editItem.icon} onChange={e => setEditItem({ ...editItem, icon: e.target.value })} style={inputStyle} maxLength={2} /></Field>
            <Field label="Color">
              <select value={editItem.color} onChange={e => setEditItem({ ...editItem, color: e.target.value })} style={inputStyle}>
                {Object.keys(COLOR_MAP).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Status">
            <select value={editItem.status} onChange={e => setEditItem({ ...editItem, status: e.target.value })} style={inputStyle}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => deleteProject(editItem.id)} style={{ ...btnSecondary, color: '#f43f5e' }}>Delete</button>
            <button onClick={() => { setActiveModal(null); setEditItem(null); }} style={btnSecondary}>Cancel</button>
            <button onClick={saveProject} style={{ ...btnPrimary, flex: 1 }}>Save</button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: `translateX(-50%) translateY(${toast.show ? 0 : 20}px)`, opacity: toast.show ? 1 : 0, backgroundColor: '#0d0d1a', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '10px', padding: '12px 18px', fontSize: '13px', fontWeight: 500, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 200, transition: 'all 0.3s ease', pointerEvents: 'none', whiteSpace: 'nowrap' }}>{toast.text}</div>
    </div>
  );
}
