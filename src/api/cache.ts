import type { StockPrice } from './symbols'
import type { ChartPoint } from './yahoo'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface CachedEntry {
  data: StockPrice;
  timestamp: number;
}

function stockCacheKey(symbol: string): string {
  return `stock:${symbol}`
}

export function readCache(symbol: string): StockPrice | null {
  try {
    const key = stockCacheKey(symbol)
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CachedEntry
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export function writeCache(symbol: string, data: StockPrice): void {
  try {
    const entry: CachedEntry = { data, timestamp: Date.now() }
    const key = stockCacheKey(symbol)
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // ignore quota / serialization errors
  }
}

// Chart cache — only real (non-mock) data is ever written here.
const CHART_CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes (Yahoo delay matches this)

interface ChartCacheEntry {
  points: ChartPoint[];
  timestamp: number;
}

function chartCacheKey(symbol: string, range: string): string {
  return `chart:${symbol}:${range}`
}

export function readChartCache(symbol: string, range: string): ChartPoint[] | null {
  try {
    const key = chartCacheKey(symbol, range)
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as ChartCacheEntry
    if (Date.now() - entry.timestamp > CHART_CACHE_TTL_MS) {
      localStorage.removeItem(key)
      return null
    }
    return entry.points
  } catch {
    return null
  }
}

export function writeChartCache(symbol: string, range: string, points: ChartPoint[]): void {
  try {
    const entry: ChartCacheEntry = { points, timestamp: Date.now() }
    localStorage.setItem(chartCacheKey(symbol, range), JSON.stringify(entry))
  } catch {
    // ignore quota / serialization errors
  }
}
