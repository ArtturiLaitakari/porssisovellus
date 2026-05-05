import type { ChartPoint } from './yahoo'

/**
 * Generates a realistic-looking stock price walk for demonstration purposes.
 * Used as fallback when Yahoo Finance is unavailable.
 */
export function generateMockChart(
  range: string,
  basePrice = 4.2
): ChartPoint[] {
  const msPerDay = 86_400_000

  const rangeDays: Record<string, number> = {
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '1y': 365,
    '5y': 1825,
  }
  const days = rangeDays[range] ?? 90

  const now = Date.now()
  const start = now - days * msPerDay
  const points: ChartPoint[] = []

  // Seeded random walk so data looks the same on each render
  let price = basePrice
  let seed = 42
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647
    return (seed - 1) / 2147483646 - 0.5
  }

  for (let i = 0; i <= days; i++) {
    const t = start + i * msPerDay
    // skip weekends
    const dow = new Date(t).getDay()
    if (dow === 0 || dow === 6) continue
    price = Math.max(0.5, price + rand() * 0.08)
    points.push({ t, price: +price.toFixed(3) })
  }

  return points
}
