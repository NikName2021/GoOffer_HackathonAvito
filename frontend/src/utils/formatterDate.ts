const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatDate(value: string) {
  const dateValue = value.includes('T') ? value : `${value}T00:00:00`

  return dateFormatter.format(new Date(dateValue))
}

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

export function formatDateSince(value: string) {
  return `На Авито с ${new Date(`${value}T00:00:00`).getFullYear()} года`
}
