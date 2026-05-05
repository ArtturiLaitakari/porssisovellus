import axios from 'axios'

export interface FinancialMetrics {
  symbol: string
  fetchedAt: number
  source: 'yahoo'
  // Perustiedot
  name: string | null
  sector: string | null
  industry: string | null
  description: string | null
  employees: number | null
  website: string | null
  // Tunnusluvut
  peRatio: string | null
  evEbitda: string | null
  debtEquity: string | null
  marketCap: number | null
  revenue: number | null
  grossMargin: number | null
  operatingMargin: number | null
  returnOnEquity: number | null
  currentRatio: number | null
  dividendYield: number | null
}

export async function fetchFinancialMetrics(symbol: string): Promise<FinancialMetrics> {
  // Only use Yahoo Finance for fundamentals
  return await fetchFromYahoo(symbol)
}

async function fetchFromYahoo(symbol: string): Promise<FinancialMetrics> {
  const response = await axios.get(`http://localhost:3001/api/fundamentals/${symbol}`)
  
  if (!response.data) {
    throw new Error('Yahoo Finance: tunnuslukuja ei saatavilla')
  }
  
  const data = response.data
  console.log(`[fundamentals] ${symbol} raw response:`, data)
  
  return {
    symbol: data.symbol,
    name: data.name ?? null,
    sector: data.sector ?? null,
    industry: data.industry ?? null,
    description: data.description ?? null,
    employees: data.employees ?? null,
    website: data.website ?? null,
    peRatio: data.peRatio != null ? String(Number(data.peRatio).toFixed(2)) : null,
    evEbitda: data.evEbitda != null ? String(Number(data.evEbitda).toFixed(2)) : null,
    debtEquity: data.debtEquity != null ? String(Number(data.debtEquity).toFixed(2)) : null,
    marketCap: data.marketCap ?? null,
    revenue: data.revenue ?? null,
    grossMargin: data.grossMargin ?? null,
    operatingMargin: data.operatingMargin ?? null,
    returnOnEquity: data.returnOnEquity ?? null,
    currentRatio: data.currentRatio ?? null,
    dividendYield: data.dividendYield ?? null,
    source: 'yahoo',
    fetchedAt: Date.now(),
  }
}

// Cache för fundamentals (same-day data is trusted)
const FUNDAMENTALS_CACHE_KEY = 'fundamentals:cache'

export function readFundamentalsCache(symbol: string): FinancialMetrics | null {
  try {
    const stored = localStorage.getItem(`${FUNDAMENTALS_CACHE_KEY}:${symbol}`)
    if (!stored) return null
    
    const parsed = JSON.parse(stored)
    const today = new Date().toDateString()
    const cacheDate = new Date(parsed.fetchedAt).toDateString()
    
    // Invalidate cache entries missing name (old format or failed fetch)
    if (!parsed.name) {
      localStorage.removeItem(`${FUNDAMENTALS_CACHE_KEY}:${symbol}`)
      return null
    }
    
    // Trust same-day data, expire at midnight
    if (cacheDate !== today) {
      localStorage.removeItem(`${FUNDAMENTALS_CACHE_KEY}:${symbol}`)
      return null
    }
    
    return parsed
  } catch {
    return null
  }
}

export function writeFundamentalsCache(symbol: string, data: FinancialMetrics): void {
  try {
    localStorage.setItem(`${FUNDAMENTALS_CACHE_KEY}:${symbol}`, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to write fundamentals to cache:', error)
  }
}