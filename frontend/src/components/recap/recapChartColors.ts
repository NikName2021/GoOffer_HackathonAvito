const chartColors: Record<string, string> = {
  'avito-blue': '#00aaff',
  'avito-green': '#00c565',
  'avito-orange': '#ff9f1a',
  'avito-purple': '#965eeb',
  'avito-red': '#ff4053',
}

export function getRecapChartColor(color: string) {
  return chartColors[color] ?? color
}
