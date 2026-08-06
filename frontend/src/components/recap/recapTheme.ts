interface RecapTheme {
  accent: string
  surface: string
}

const themes: Record<string, RecapTheme> = {
  'avito-blue': { accent: 'text-[#00aaff]', surface: 'bg-[#e8f6ff] text-[#1f1f1f]' },
  'avito-green': { accent: 'text-[#00b956]', surface: 'bg-[#e8faef] text-[#1f1f1f]' },
  'avito-orange': { accent: 'text-[#e18400]', surface: 'bg-[#fff3d6] text-[#1f1f1f]' },
  'avito-purple': { accent: 'text-[#965eeb]', surface: 'bg-[#f1eafd] text-[#1f1f1f]' },
  'avito-red': { accent: 'text-[#ff4053]', surface: 'bg-[#ffebee] text-[#1f1f1f]' },
}

const fallbackTheme = themes['avito-blue']

export function getRecapTheme(theme: string) {
  return themes[theme] ?? fallbackTheme
}
