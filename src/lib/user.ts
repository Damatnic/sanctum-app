import { prisma } from './prisma'

const DEFAULT_USER_ID = 'default-user'

// FIX: Replaced find-then-create pattern (2 DB round trips) with upsert (1 round trip).
// The old pattern issued a findUnique, then conditionally a create — even in the
// happy path (user exists) that was still 1 round trip, but any concurrent request
// during first run could hit a unique constraint race. upsert handles both atomically.
export async function getOrCreateUser(userId: string = DEFAULT_USER_ID) {
  return prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      name: 'Default User',
    },
  })
}

export { DEFAULT_USER_ID }
