import type { RecapCardResponse, ShareRecapResponse } from '@/types/recap.type'

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  context.beginPath()
  context.roundRect(x, y, width, height, 28)
  context.fill()
}

export function downloadRecapShareImage(data: ShareRecapResponse, cards: RecapCardResponse[]) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const context = canvas.getContext('2d')
  if (!context) return

  context.fillStyle = '#eaf8ff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  ;['#00aaff', '#965eeb', '#00c565', '#ff4053'].forEach((color, index) => {
    context.fillStyle = color
    context.beginPath()
    context.arc(90 + index * 38, 90 + (index % 2) * 34, 26, 0, Math.PI * 2)
    context.fill()
  })

  context.fillStyle = '#1f1f1f'
  context.font = '800 44px Arial'
  context.fillText(`Итоги ${data.year} года на Авито`, 70, 205)
  context.font = '900 64px Arial'
  context.fillText(data.summary.headline.slice(0, 28), 70, 300)
  context.font = '400 28px Arial'
  context.fillStyle = '#6f7377'
  context.fillText('Самое важное из моей истории', 70, 350)

  cards.slice(0, 5).forEach((card, index) => {
    const y = 405 + index * 158
    context.fillStyle = '#ffffff'
    roundedRect(context, 60, y, 960, 132)
    context.fillStyle = '#1f1f1f'
    context.font = '700 30px Arial'
    context.fillText(card.title.slice(0, 38), 95, y + 53)
    if (card.value) {
      context.fillStyle = '#00aaff'
      context.font = '900 34px Arial'
      context.fillText(card.value.slice(0, 28), 95, y + 101)
    }
  })

  context.fillStyle = '#6f7377'
  context.font = '500 24px Arial'
  context.fillText('Собрано в «Итогах года» · Без приватных данных', 70, 1280)
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `avito-recap-${data.year}.png`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
