import type { RecapCardResponse, RecapShareFormat } from '@/types/recap.type'

const themes: Record<string, { accent: string; surface: string }> = {
  'avito-blue': { accent: '#00aaff', surface: '#e8f7ff' },
  'avito-green': { accent: '#00b956', surface: '#e9fbf2' },
  'avito-orange': { accent: '#e18400', surface: '#fff5e5' },
  'avito-purple': { accent: '#965eeb', surface: '#f3ecff' },
  'avito-red': { accent: '#ff4053', surface: '#fff0f2' },
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
  context.fill()
}

function lines(context: CanvasRenderingContext2D, text: string, width: number, limit: number) {
  const result: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (context.measureText(candidate).width <= width) line = candidate
    else {
      if (line) result.push(line)
      line = word
    }
  }
  if (line) result.push(line)
  return result.slice(0, limit)
}

function drawBrand(context: CanvasRenderingContext2D, year: number) {
  const dots = [['#00aaff', 76, 76], ['#00b956', 125, 76], ['#965eeb', 101, 110], ['#ff4053', 150, 110]] as const
  dots.forEach(([color, x, y]) => {
    context.fillStyle = color
    context.beginPath()
    context.arc(x, y, 23, 0, Math.PI * 2)
    context.fill()
  })
  context.fillStyle = '#1f1f1f'
  context.font = '800 30px Inter, Arial, sans-serif'
  context.fillText(`Итоги ${year} года`, 200, 98)
}

function drawCard(context: CanvasRenderingContext2D, card: RecapCardResponse, x: number, y: number, width: number, height: number) {
  const theme = themes[card.presentation.theme] ?? themes['avito-blue']
  context.fillStyle = theme.surface
  roundedRect(context, x, y, width, height, 28)
  context.fillStyle = theme.accent
  roundedRect(context, x + 24, y + 24, 10, height - 48, 5)
  context.fillStyle = '#1f1f1f'
  context.font = '800 27px Inter, Arial, sans-serif'
  lines(context, card.title, width - 88, 2).forEach((line, index) => context.fillText(line, x + 58, y + 58 + index * 32))
  if (card.value) {
    context.fillStyle = theme.accent
    context.font = '900 32px Inter, Arial, sans-serif'
    context.fillText(lines(context, card.value, width - 88, 1)[0] ?? '', x + 58, y + height - 36)
  }
}

function triggerDownload(blob: Blob, year: number) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `itogi-goda-${year}.png`
  link.href = url
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

export function downloadRecapImage(cards: RecapCardResponse[], year: number, format: RecapShareFormat) {
  return new Promise<boolean>((resolve) => {
    if (cards.length === 0) return resolve(false)
    const story = format === 'mobile_story'
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = story ? 1920 : 1350
    const context = canvas.getContext('2d')
    if (!context) return resolve(false)

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#f1eaff')
    gradient.addColorStop(0.5, '#eef9ff')
    gradient.addColorStop(1, '#e9fbf2')
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
    drawBrand(context, year)

    context.fillStyle = '#1f1f1f'
    context.font = '900 58px Inter, Arial, sans-serif'
    context.fillText('Самое важное за год', 60, 210)
    const top = 280
    const columns = story ? 1 : 2
    const rows = Math.ceil(cards.length / columns)
    const gap = 18
    const width = (960 - gap * (columns - 1)) / columns
    const availableHeight = canvas.height - top - 80
    const height = Math.min(story ? 170 : 190, (availableHeight - gap * (rows - 1)) / rows)
    cards.forEach((card, index) => drawCard(context, card, 60 + (index % columns) * (width + gap), top + Math.floor(index / columns) * (height + gap), width, height))
    canvas.toBlob((blob) => {
      if (!blob) return resolve(false)
      triggerDownload(blob, year)
      resolve(true)
    }, 'image/png')
  })
}
