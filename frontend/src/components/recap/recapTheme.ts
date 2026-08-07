interface RecapTheme {
  accent: string
  accentHex: string
  glow: string
  surface: string
}

const themes: Record<string, RecapTheme> = {
  'avito-blue': { accent: 'text-[#00aaff]', accentHex: '#00aaff', glow: 'bg-[#00aaff]', surface: 'bg-gradient-to-br from-[#e7f7ff] via-[#f5fbff] to-[#dff4ff] text-[#1f1f1f]' },
  'avito-green': { accent: 'text-[#00b956]', accentHex: '#00c565', glow: 'bg-[#00c565]', surface: 'bg-gradient-to-br from-[#e8faef] via-[#f7fff9] to-[#ddf8e9] text-[#1f1f1f]' },
  'avito-orange': { accent: 'text-[#e18400]', accentHex: '#ff9f1a', glow: 'bg-[#ff9f1a]', surface: 'bg-gradient-to-br from-[#fff2d9] via-[#fffbf4] to-[#ffe9c4] text-[#1f1f1f]' },
  'avito-purple': { accent: 'text-[#965eeb]', accentHex: '#965eeb', glow: 'bg-[#965eeb]', surface: 'bg-gradient-to-br from-[#efe5ff] via-[#faf7ff] to-[#e9dcff] text-[#1f1f1f]' },
  'avito-red': { accent: 'text-[#ff4053]', accentHex: '#ff4053', glow: 'bg-[#ff4053]', surface: 'bg-gradient-to-br from-[#ffe9ed] via-[#fff8f9] to-[#ffdee4] text-[#1f1f1f]' },
}

const fallbackTheme = themes['avito-blue']

export function getRecapTheme(theme: string) {
  return themes[theme] ?? fallbackTheme
}
