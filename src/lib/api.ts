// API helper functions for Sanctum
const API_BASE = '/api'

interface ApiResponse<T> {
  data?: T
  error?: string
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'default-user',
        ...options.headers,
      },
      ...options,
    })
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }))
      return { error: err.error || `HTTP ${res.status}` }
    }
    
    const data = await res.json()
    return { data }
  } catch (e) {
    console.error(`API ${endpoint} error:`, e)
    return { error: 'Network error' }
  }
}

// Habits
export const habitsApi = {
  list: () => apiCall<any[]>('/habits'),
  create: (data: { name: string; icon?: string }) => 
    apiCall<any>('/habits', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiCall<any>(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiCall<void>(`/habits/${id}`, { method: 'DELETE' }),
  toggle: (id: string) =>
    apiCall<any>(`/habits/${id}/toggle`, { method: 'POST' }),
}

// Goals
export const goalsApi = {
  list: () => apiCall<any[]>('/goals'),
  create: (data: { name: string; icon?: string; target?: number }) =>
    apiCall<any>('/goals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiCall<any>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiCall<void>(`/goals/${id}`, { method: 'DELETE' }),
  increment: (id: string, delta: number) =>
    apiCall<any>(`/goals/${id}/increment`, { method: 'POST', body: JSON.stringify({ delta }) }),
}

// Deadlines
export const deadlinesApi = {
  list: () => apiCall<any[]>('/deadlines'),
  create: (data: { title: string; course?: string; dueDate: string }) =>
    apiCall<any>('/deadlines', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiCall<any>(`/deadlines/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiCall<void>(`/deadlines/${id}`, { method: 'DELETE' }),
}

// Projects
export const projectsApi = {
  list: () => apiCall<any[]>('/projects'),
  create: (data: { name: string; desc?: string; icon?: string; color?: string; status?: string }) =>
    apiCall<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiCall<any>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiCall<void>(`/projects/${id}`, { method: 'DELETE' }),
}

// Journals
export const journalsApi = {
  list: () => apiCall<any[]>('/journals'),
  create: (data: { text: string; mood?: string }) =>
    apiCall<any>('/journals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiCall<any>(`/journals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiCall<void>(`/journals/${id}`, { method: 'DELETE' }),
}

// Focus
export const focusApi = {
  stats: () => apiCall<{ totalMinutes: number; totalSessions: number; todayMinutes: number }>('/focus'),
  log: (minutes: number, completed: boolean = true) =>
    apiCall<any>('/focus', { method: 'POST', body: JSON.stringify({ minutes, completed }) }),
}

// Moods
export const moodsApi = {
  list: () => apiCall<any[]>('/moods'),
  log: (mood: string) =>
    apiCall<any>('/moods', { method: 'POST', body: JSON.stringify({ mood }) }),
}

// Sync all data from API
export async function syncFromApi() {
  const [habits, goals, deadlines, projects, journals, focus, moods] = await Promise.all([
    habitsApi.list(),
    goalsApi.list(),
    deadlinesApi.list(),
    projectsApi.list(),
    journalsApi.list(),
    focusApi.stats(),
    moodsApi.list(),
  ])
  
  return {
    habits: habits.data || [],
    goals: goals.data || [],
    deadlines: deadlines.data || [],
    projects: projects.data || [],
    journals: journals.data || [],
    focus: focus.data || { totalMinutes: 0, totalSessions: 0, todayMinutes: 0 },
    moods: moods.data || [],
    todayMood: moods.data?.[0]?.mood || null,
  }
}
