const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value ?? 0)
}

export function formatCount(value: number, forms?: [string, string, string]) {
  const n = value ?? 0
  const formatted = new Intl.NumberFormat('ru-RU').format(n)
  if (!forms) return formatted

  const lastTwo = n % 100
  const last = n % 10
  if (lastTwo >= 11 && lastTwo <= 19) return `${formatted} ${forms[2]}`
  if (last === 1) return `${formatted} ${forms[0]}`
  if (last >= 2 && last <= 4) return `${formatted} ${forms[1]}`
  return `${formatted} ${forms[2]}`
}