export const PATHS = {
  HOME: '/',
  LOGIN: '/login',
  RECAP: '/recap/:userId/:year',
  SHARE: '/share/:userId/:year',
  COMPARE: '/compare/:userId1/:userId2',
} as const

export function recapPath(userId: string, year: number) {
  return `/recap/${userId}/${year}`
}

export function sharePath(userId: string, year: number) {
  return `/share/${userId}/${year}`
}

export function comparePath(userId1: string, userId2: string) {
  return `/compare/${userId1}/${userId2}`
}