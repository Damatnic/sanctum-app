// Seed script to populate Sanctum with Nick's actual data
const BASE_URL = process.env.SANCTUM_URL || 'https://sanctum-app.vercel.app';

async function api(endpoint: string, data: any) {
  const res = await fetch(`${BASE_URL}/api${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': 'default-user' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  console.log(`${endpoint}:`, res.ok ? '✓' : '✗', json.name || json.title || json.error || 'ok');
  return json;
}

async function seed() {
  console.log('🌱 Seeding Sanctum with Nick\'s data...\n');

  // === HABITS ===
  console.log('📋 Adding habits...');
  const habits = [
    { name: 'Morning Routine', icon: '🌅' },
    { name: 'Exercise', icon: '💪' },
    { name: 'Read 20 mins', icon: '📚' },
    { name: 'Drink Water', icon: '💧' },
    { name: 'Review Notes', icon: '📝' },
    { name: 'No Late Night Snacks', icon: '🚫' },
  ];
  for (const h of habits) await api('/habits', h);

  // === GOALS ===
  console.log('\n🎯 Adding goals...');
  const goals = [
    { name: 'Complete AI Data Specialist Degree', icon: '🎓', target: 100, current: 65 },
    { name: 'Finish Stats Final Prep', icon: '📊', target: 10, current: 7 },
    { name: 'Ship Astral Core V2', icon: '🚀', target: 100, current: 95 },
    { name: 'Read 12 Books This Year', icon: '📖', target: 12, current: 2 },
    { name: 'Workout 100 Times', icon: '🏋️', target: 100, current: 15 },
  ];
  for (const g of goals) await api('/goals', g);

  // === DEADLINES (upcoming only) ===
  console.log('\n📅 Adding deadlines...');
  const deadlines = [
    { title: 'Stats Final Exam', course: 'Stats', dueDate: '2026-03-13' },
    { title: 'Homework 11 - ANOVA', course: 'Stats', dueDate: '2026-03-12' },
    { title: 'Lesson 7 Quiz', course: 'Advanced SQL', dueDate: '2026-03-12' },
    { title: 'Lesson 7 Practice Problems', course: 'Advanced SQL', dueDate: '2026-03-12' },
    { title: 'Roll Call Attendance', course: 'Data Viz', dueDate: '2026-03-12' },
    { title: 'Lesson 8 Quiz', course: 'Advanced SQL', dueDate: '2026-03-26' },
    { title: 'Unit 2 Project', course: 'Advanced SQL', dueDate: '2026-04-24' },
  ];
  for (const d of deadlines) await api('/deadlines', d);

  // === PROJECTS ===
  console.log('\n📁 Adding projects...');
  const projects = [
    { name: 'Astral Core V2', desc: 'AI mental health platform', icon: '🧠', color: 'violet', status: 'active' },
    { name: 'Astral Tether', desc: 'Peer support mobile app', icon: '🔗', color: 'cyan', status: 'active' },
    { name: 'Astral Swap', desc: 'Gift exchange party game', icon: '🎁', color: 'rose', status: 'complete' },
    { name: 'Sanctum', desc: 'Life dashboard app', icon: '🏛️', color: 'violet', status: 'active' },
    { name: 'The Fractured Epoch', desc: '12-book multiverse saga', icon: '📚', color: 'amber', status: 'planning' },
    { name: 'Sloth Chronicles', desc: 'Children\'s book series', icon: '🦥', color: 'emerald', status: 'paused' },
    { name: 'Stats Final Prep', desc: 'Study for Friday exam', icon: '📊', color: 'blue', status: 'active' },
  ];
  for (const p of projects) await api('/projects', p);

  console.log('\n✅ Done seeding!');
}

seed().catch(console.error);
