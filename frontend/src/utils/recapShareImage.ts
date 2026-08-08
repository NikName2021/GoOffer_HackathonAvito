import type { RecapCardResponse, ShareRecapResponse } from '@/types/recap.type'

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1350
const CARD_GAP = 20

const themes: Record<string, { accent: string; surface: string }> = {
  'avito-blue': { accent: '#00aaff', surface: '#e8f7ff' },
  'avito-green': { accent: '#00c565', surface: '#e9fbf2' },
  'avito-orange': { accent: '#ff9f1a', surface: '#fff5e5' },
  'avito-purple': { accent: '#965eeb', surface: '#f3ecff' },
  'avito-red': { accent: '#ff4053', surface: '#fff0f2' },
}

function fillRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
  context.fill()
}

function getLines(context: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines = 2) {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word
    if (context.measureText(candidate).width <= maxWidth) current = candidate
    else {
      if (current) lines.push(current)
      current = word
    }
  })
  if (current) lines.push(current)
  if (lines.length <= maxLines) return lines

  const visible = lines.slice(0, maxLines)
  let last = visible[maxLines - 1]
  while (context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
  visible[maxLines - 1] = `${last.trim()}…`
  return visible
}

function drawLines(context: CanvasRenderingContext2D, lines: string[], x: number, y: number, lineHeight: number) {
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight))
}

function drawAvitoMark(context: CanvasRenderingContext2D) {
  const dots = [
    { color: '#00aaff', x: 88, y: 84 },
    { color: '#00c565', x: 145, y: 84 },
    { color: '#965eeb', x: 116, y: 124 },
    { color: '#ff4053', x: 174, y: 124 },
  ]
  dots.forEach(({ color, x, y }) => {
    context.fillStyle = color
    context.beginPath()
    context.arc(x, y, 27, 0, Math.PI * 2)
    context.fill()
  })
}

function drawCard(context: CanvasRenderingContext2D, card: RecapCardResponse, index: number, x: number, y: number, width: number, height: number) {
  const theme = themes[card.presentation.theme] ?? themes['avito-blue']
  context.save()
  context.shadowColor = 'rgba(34, 34, 34, 0.08)'
  context.shadowBlur = 24
  context.shadowOffsetY = 10
  context.fillStyle = theme.surface
  fillRoundedRect(context, x, y, width, height, 30)
  context.restore()

  context.fillStyle = theme.accent
  fillRoundedRect(context, x + 24, y + 22, 42, 42, 14)
  context.fillStyle = '#ffffff'
  context.font = '800 19px Inter, Arial'
  context.textAlign = 'center'
  context.fillText(String(index + 1), x + 45, y + 50)
  context.textAlign = 'left'

  context.fillStyle = '#6f7377'
  context.font = '700 15px Inter, Arial'
  context.fillText((card.eyebrow || 'ИТОГ ГОДА').toUpperCase().slice(0, 32), x + 80, y + 48)

  const compact = height < 160
  context.fillStyle = '#1f1f1f'
  context.font = `800 ${compact ? 23 : 27}px Inter, Arial`
  const titleLines = getLines(context, card.title, width - 48, compact ? 1 : 2)
  drawLines(context, titleLines, x + 24, y + (compact ? 91 : 101), compact ? 28 : 32)

  if (card.value) {
    context.fillStyle = theme.accent
    context.font = `900 ${compact ? 28 : 34}px Inter, Arial`
    const value = getLines(context, card.value, width - 48, 1)[0]
    context.fillText(value, x + 24, y + height - 24)
  }
}

export function downloadRecapShareImage(data: ShareRecapResponse, cards: RecapCardResponse[]) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const context = canvas.getContext('2d')
  if (!context || cards.length === 0) return

  const background = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  background.addColorStop(0, '#f5efff')
  background.addColorStop(0.52, '#eef9ff')
  background.addColorStop(1, '#effcf5')
  context.fillStyle = background
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  drawAvitoMark(context)

  context.fillStyle = '#1f1f1f'
  context.font = '800 28px Inter, Arial'
  context.fillText(`АВИТО · ИТОГИ ${data.year}`, 230, 105)
  context.font = '900 62px Inter, Arial'
  const headline = getLines(context, data.summary.headline, 940, 2)
  drawLines(context, headline, 60, 205, 69)
  const headlineBottom = 205 + (headline.length - 1) * 69
  context.fillStyle = '#6f7377'
  context.font = '500 25px Inter, Arial'
  context.fillText(`${cards.length} ${cards.length === 1 ? 'главный момент' : 'главных моментов'} года`, 62, headlineBottom + 54)

  const gridTop = 390
  const gridBottom = 1210
  const columns = cards.length === 1 ? 1 : 2
  const rows = Math.ceil(cards.length / columns)
  const cardWidth = (CANVAS_WIDTH - 120 - CARD_GAP * (columns - 1)) / columns
  const cardHeight = Math.min(182, (gridBottom - gridTop - CARD_GAP * (rows - 1)) / rows)

  cards.forEach((card, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = 60 + column * (cardWidth + CARD_GAP)
    const y = gridTop + row * (cardHeight + CARD_GAP)
    drawCard(context, card, index, x, y, cardWidth, cardHeight)
  })

  context.fillStyle = '#6f7377'
  context.font = '600 22px Inter, Arial'
  context.fillText('Собрано в «Итогах года» · Без приватных данных', 62, 1292)
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `avito-recap-${data.year}.png`
    link.href = url
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png')
}
