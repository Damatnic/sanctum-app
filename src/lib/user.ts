import { prisma } from './prisma'

const DEFAULT_USER_ID = 'default-user'

export async function getOrCreateUser(userId: string = DEFAULT_USER_ID) {
  let user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        name: 'Default User',
      }
    })
  }
  
  return user
}

export { DEFAULT_USER_ID }
