# Sanctum — Database Audit Report

**Date:** 2026-03-11  
**Auditor:** Nyx (Database Expert Subagent)  
**Scope:** `prisma/schema.prisma`, `src/lib/prisma.ts`, `src/lib/user.ts`, all API routes

---

## Summary

| Severity | Issue | Status |
|----------|-------|--------|
| 🔴 Bug | `longestStreak` always resets to current streak | ✅ Fixed |
| 🟠 Performance | Zero indexes on any `userId` / `archived` / date field | ✅ Fixed (13 indexes added) |
| 🟠 Performance | Focus GET fetches all rows to compute aggregates | ✅ Fixed (Prisma `_sum`/`_count`) |
| 🟠 Performance | Stats route joins `habit` data that is never read | ✅ Fixed (removed `include`) |
| 🟡 Performance | `findFirst` used where `findUnique` on composite key is correct | ✅ Fixed |
| 🟡 Reliability | `getOrCreateUser` has a race condition + double round-trip | ✅ Fixed (upsert) |
| 🟡 Config | Missing SSL + pool size for Neon serverless in `prisma.ts` | ✅ Fixed |
| 🟡 Schema | `url` in `datasource` block is invalid in Prisma 7 | ✅ Fixed |
| ℹ️ Info | `GoalMilestone` model has no API endpoints | Noted (feature gap) |
| ✅ OK | Cascade deletes — all relations correct | No action needed |
| ✅ OK | `MoodLog` upsert pattern correct | No action needed |
| ✅ OK | Global Prisma singleton with Next.js HMR guard | No action needed |

---

## Issues & Fixes

---

### 🔴 BUG — `longestStreak` Never Grows

**File:** `src/app/api/habits/[id]/toggle/route.ts`

**What was wrong:**

```ts
// BUGGY CODE — original
const habit = await prisma.habit.update({
  where: { id },
  data: {
    streak,
    longestStreak: { set: streak }  // ← BUG: overwrites longestStreak with current streak
  }
})

// This check is now ALWAYS false — habit.longestStreak was just set to streak above
if (streak > habit.longestStreak) {
  await prisma.habit.update({ where: { id }, data: { longestStreak: streak } })
}
```

The `update()` returns the **updated** record. By the time the `if` check runs, `habit.longestStreak` has already been clobbered to equal `streak`, so `streak > habit.longestStreak` is never true. The user's all-time best streak is silently destroyed on every toggle.

**Fix applied:**

```ts
// Fetch current longestStreak BEFORE overwriting
const currentHabit = await prisma.habit.findUnique({
  where: { id },
  select: { longestStreak: true }
})
const newLongestStreak = Math.max(streak, currentHabit?.longestStreak ?? 0)

// Single update with the correct, non-regressing value
const habit = await prisma.habit.update({
  where: { id },
  data: { streak, longestStreak: newLongestStreak }
})
```

Also reduced from 2-3 potential update calls to exactly 1.

---

### 🟠 PERFORMANCE — Zero Database Indexes

**File:** `prisma/schema.prisma`

Every list query was doing a full table scan. The schema had no `@@index` directives at all — only the two `@@unique` constraints (`HabitCompletion(habitId, date)` and `MoodLog(userId, date)`) which act as indexes but are enforced for uniqueness, not query optimization.

**13 new indexes added:**

```prisma
model Habit {
  @@index([userId, archived])     // GET /api/habits filters by userId + archived
  @@index([userId, createdAt])    // ordered by createdAt desc
}

model HabitCompletion {
  @@index([habitId, date])        // toggle lookup + completions join
}

model Goal {
  @@index([userId, archived])     // GET /api/goals filters by userId + archived
  @@index([userId, createdAt])    // ordered by createdAt desc
}

model GoalMilestone {
  @@index([goalId])               // relation lookup
}

model Deadline {
  @@index([userId, archived])     // GET /api/deadlines filters by userId + archived
  @@index([userId, dueDate])      // ordered by dueDate asc
}

model Project {
  @@index([userId, archived])     // GET /api/projects filters by userId + archived
  @@index([userId, status])       // status-filtered queries
}

model JournalEntry {
  @@index([userId, archived])     // GET /api/journals filters by userId + archived
  @@index([userId, createdAt])    // ordered by createdAt desc, take 50
}

model FocusSession {
  @@index([userId, createdAt])    // date-range queries in stats + today filter
}

model MoodLog {
  @@index([userId, date])         // monthly range queries in stats
}
```

To apply to an existing database, run:
```bash
npx prisma db push
# or for migration-tracked projects:
npx prisma migrate dev --name add_query_indexes
```

The generated SQL (from `prisma migrate diff --from-empty --to-schema`):
```sql
CREATE INDEX "Habit_userId_archived_idx" ON "Habit"("userId", "archived");
CREATE INDEX "Habit_userId_createdAt_idx" ON "Habit"("userId", "createdAt");
CREATE INDEX "HabitCompletion_habitId_date_idx" ON "HabitCompletion"("habitId", "date");
CREATE INDEX "Goal_userId_archived_idx" ON "Goal"("userId", "archived");
CREATE INDEX "Goal_userId_createdAt_idx" ON "Goal"("userId", "createdAt");
CREATE INDEX "GoalMilestone_goalId_idx" ON "GoalMilestone"("goalId");
CREATE INDEX "Deadline_userId_archived_idx" ON "Deadline"("userId", "archived");
CREATE INDEX "Deadline_userId_dueDate_idx" ON "Deadline"("userId", "dueDate");
CREATE INDEX "Project_userId_archived_idx" ON "Project"("userId", "archived");
CREATE INDEX "Project_userId_status_idx" ON "Project"("userId", "status");
CREATE INDEX "JournalEntry_userId_archived_idx" ON "JournalEntry"("userId", "archived");
CREATE INDEX "JournalEntry_userId_createdAt_idx" ON "JournalEntry"("userId", "createdAt");
CREATE INDEX "FocusSession_userId_createdAt_idx" ON "FocusSession"("userId", "createdAt");
CREATE INDEX "MoodLog_userId_date_idx" ON "MoodLog"("userId", "date");
```

---

### 🟠 PERFORMANCE — Focus GET: Unbounded Full Table Scan for Aggregates

**File:** `src/app/api/focus/route.ts`

**What was wrong:**

```ts
// OLD: Fetched EVERY focus session ever created just to sum them up
const sessions = await prisma.focusSession.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' }
})
const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0)
const totalSessions = sessions.length
```

This transfers every row to the Node.js process and iterates it in JavaScript. After a year of daily use (~365+ sessions), this is an unnecessary load.

**Fix applied:**

```ts
const [allTimeAgg, todayAgg, recentSessions] = await Promise.all([
  prisma.focusSession.aggregate({
    where: { userId },
    _sum: { minutes: true },
    _count: { id: true },
  }),
  prisma.focusSession.aggregate({
    where: { userId, createdAt: { gte: today } },
    _sum: { minutes: true },
    _count: { id: true },
  }),
  prisma.focusSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  }),
])
```

Now runs 3 parallel queries (all fast with the new `userId_createdAt` index) vs 1 slow serial query. Database does the math, not JavaScript.

---

### 🟠 PERFORMANCE — Stats Route: Unnecessary JOIN on Every Request

**File:** `src/app/api/stats/route.ts`

**What was wrong:**

```ts
const habitCompletions = await prisma.habitCompletion.findMany({
  where: { habit: { userId }, date: { gte: monthAgo } },
  include: { habit: true }  // ← JOINED but NEVER used in the response
})
```

The `include: { habit: true }` causes Prisma to JOIN the `Habit` table and fetch `name`, `icon`, `streak`, `longestStreak`, etc. for every completion — data that is never referenced anywhere in the stats computation or response.

**Fix applied:** Removed `include: { habit: true }`. The relation filter (`where: { habit: { userId } }`) still works correctly — it's a filter, not a selection.

---

### 🟡 PERFORMANCE — `findFirst` vs `findUnique` in Toggle

**File:** `src/app/api/habits/[id]/toggle/route.ts`

**What was wrong:**

```ts
const existing = await prisma.habitCompletion.findFirst({
  where: { habitId: id, date: today }
})
```

`HabitCompletion` has a `@@unique([habitId, date])` constraint. `findFirst` doesn't use the unique index optimally — `findUnique` directly uses the composite key lookup (an O(log n) index seek vs a filter scan).

**Fix applied:**

```ts
const existing = await prisma.habitCompletion.findUnique({
  where: { habitId_date: { habitId: id, date: today } }
})
```

---

### 🟡 RELIABILITY — `getOrCreateUser` Race Condition + Double Round-Trip

**File:** `src/lib/user.ts`

**What was wrong:**

```ts
let user = await prisma.user.findUnique({ where: { id: userId } })
if (!user) {
  user = await prisma.user.create({ data: { id: userId, name: 'Default User' } })
}
```

Two problems:
1. **Race condition:** Two concurrent requests (e.g., page load firing multiple API calls) could both see `user = null` and then both attempt `create`, causing a unique constraint error on the second one.
2. **Double query even in happy path:** This is called at the top of every API handler. That's 1 extra round-trip on every single request.

**Fix applied:**

```ts
return prisma.user.upsert({
  where: { id: userId },
  update: {},
  create: { id: userId, name: 'Default User' },
})
```

One atomic round-trip. The `update: {}` is intentional — it's a no-op on existing users, but prevents a duplicate key error if two requests race.

---

### 🟡 CONFIG — Missing SSL + Pool Size for Neon Serverless

**File:** `src/lib/prisma.ts`

**What was wrong:**

```ts
const pool = new Pool({ connectionString })
```

No SSL config, no pool size limit. For Neon + Vercel serverless:
- Neon requires SSL (`rejectUnauthorized: false` for standard connections)
- Each serverless function invocation is short-lived; a pool of 10 connections per instance × N concurrent functions = potential connection exhaustion on Neon's free tier

**Fix applied:**

```ts
const pool = new Pool({
  connectionString,
  max: process.env.NODE_ENV === 'production' ? 1 : 10,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})
```

Also added `log` to the PrismaClient to surface `query` logs in development for debugging.

---

### 🟡 SCHEMA — `url` Field Invalid in Prisma 7

**File:** `prisma/schema.prisma`

In Prisma 7, the `url` property was removed from `datasource` blocks in `schema.prisma`. The URL must be defined in `prisma.config.ts` under `datasource.url`. The project already had this configured correctly in `prisma.config.ts` — the `url` in the schema was just incorrect syntax.

**Fix:** Removed `url = env("DATABASE_URL")` from the schema datasource block. Added explanatory comment pointing to `prisma.config.ts`.

---

## No Action Needed

### ✅ Cascade Deletes — Correct Throughout

All foreign key relations use `onDelete: Cascade` where appropriate:

| Child | Parent | Delete behavior |
|-------|--------|-----------------|
| `Habit` | `User` | Cascade ✅ |
| `HabitCompletion` | `Habit` | Cascade ✅ |
| `Goal` | `User` | Cascade ✅ |
| `GoalMilestone` | `Goal` | Cascade ✅ |
| `Deadline` | `User` | Cascade ✅ |
| `Project` | `User` | Cascade ✅ |
| `JournalEntry` | `User` | Cascade ✅ |
| `FocusSession` | `User` | Cascade ✅ |
| `MoodLog` | `User` | Cascade ✅ |

Deleting a user wipes all their data. Deleting a habit wipes its completions. Deleting a goal wipes its milestones. All correct.

### ✅ Unique Constraints — Correct

- `HabitCompletion(habitId, date)` — prevents double-completing a habit in one day ✅
- `MoodLog(userId, date)` — one mood per day per user, enforced at DB level ✅
- `MoodLog` upsert correctly uses the composite unique name `userId_date` ✅

### ✅ Prisma Singleton Pattern — Correct

The global singleton (`globalForPrisma.prisma`) prevents creating multiple PrismaClient instances during Next.js HMR in development. Production always creates exactly one. This is the recommended pattern.

---

## Feature Gap (Not a Bug)

### ℹ️ `GoalMilestone` — Model Defined, No API Coverage

The `GoalMilestone` model is fully defined in the schema (with proper relations and cascade deletes) but has zero API endpoints. No route creates, reads, or updates milestones. The `Goal` API only returns `current`, `target`, `category`, etc. — milestones are silently ignored.

**This is a feature gap, not a bug.** The data model is ready; the UI + API just haven't been built yet. No schema changes needed.

---

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added 13 indexes, removed invalid `url` from datasource, added Prisma 7 comment |
| `src/lib/prisma.ts` | Added SSL config, serverless pool sizing, dev logging |
| `src/lib/user.ts` | `findUnique + create` → atomic `upsert` |
| `src/app/api/habits/[id]/toggle/route.ts` | Fixed `longestStreak` bug, `findFirst` → `findUnique`, single update call |
| `src/app/api/focus/route.ts` | Full table scan → `prisma.aggregate()` with `_sum`/`_count` |
| `src/app/api/stats/route.ts` | Removed unnecessary `include: { habit: true }` |

---

## Next Steps (Recommended)

1. **Apply the indexes to the live database:**
   ```bash
   cd ~/AstralView/sanctum-app
   npx prisma db push
   ```

2. **Build the GoalMilestone API** if milestones are a planned feature.

3. **Consider caching `getOrCreateUser`** — since this is a single-user app, the user existence check on every request is purely overhead. Could store userId in a module-level variable once verified.

4. **Add `DIRECT_URL`** to `.env.local` if not already set for Prisma migrations (Neon recommends a separate non-pooled URL for `prisma migrate`):
   ```env
   DATABASE_URL=postgresql://...?pgbouncer=true  # pooled - for runtime
   DIRECT_URL=postgresql://...                    # direct - for migrations
   ```
   And in `prisma.config.ts`:
   ```ts
   datasource: {
     url: process.env.DATABASE_URL,
     directUrl: process.env.DIRECT_URL,
   }
   ```
