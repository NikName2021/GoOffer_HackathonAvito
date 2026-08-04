const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatCount(value: number, forms: [string, string, string]) {
  const lastTwoDigits = value % 100
  const lastDigit = value % 10

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return `${value} ${forms[2]}`
  if (lastDigit === 1) return `${value} ${forms[0]}`
  if (lastDigit >= 2 && lastDigit <= 4) return `${value} ${forms[1]}`
  return `${value} ${forms[2]}`
}
