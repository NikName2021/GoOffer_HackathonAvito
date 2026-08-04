const PROFILE_COLORS = ['#00aaff', '#965eeb', '#04e061', '#ff4053'] as const

export function getProfileAccent(name: string) {
  const hash = Array.from(name).reduce((total, character) => total + character.charCodeAt(0), 0)

  return PROFILE_COLORS[hash % PROFILE_COLORS.length]
}

export function getProfileInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
