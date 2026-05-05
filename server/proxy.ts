import express from 'express'
import YahooFinance from 'yahoo-finance2'

// yahoo-finance2 hoitaa crumb-autentikaation automaattisesti
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] })

// Range-string -> period1 date string
function rangeToPeriod1(range: string): string {
  const days: Record<string, number> = {
    '1d': 2, '5d': 7, '1mo': 32, '3mo': 92,
    '6mo': 183, '1y': 366, '5y': 5 * 366,
  }
  const d = days[range] ?? 32
  return new Date(Date.now() - d * 24 * 3600 * 1000).toISOString().slice(0, 10)
}

const app = express()
const PORT = 3001

// Sallitaan vain odotettavat ticker-merkit (kirjaimet, numerot, piste, väliviiva)
const SYMBOL_RE = /^[A-Z0-9.-]{1,20}$/i

// Cache-TTL eri rangeille: lyhyt range → useammin, pitkä range → harvoin muuttuu
const TTL_BY_RANGE: Record<string, number> = {
  '1d':  2 * 60_000,   //  2 min
  '5d':  5 * 60_000,   //  5 min
  '1mo': 10 * 60_000,  // 10 min
  '3mo': 15 * 60_000,  // 15 min
  '6mo': 15 * 60_000,  // 15 min
  '1y':  30 * 60_000,  // 30 min
  '5y':  60 * 60_000,  //  1 h
}
const DEFAULT_TTL = 5 * 60_000

type CacheEntry = { data: unknown; expiresAt: number }
const cache = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<unknown>>()

app.get('/api/stock/:symbol', async (req, res) => {
  const { symbol } = req.params

  if (!SYMBOL_RE.test(symbol)) {
    res.status(400).json({ error: 'Invalid symbol' })
    return
  }

  const range    = (req.query.range    as string) || '1d'
  const interval = (req.query.interval as string) || '1d'
  const cacheKey = `${symbol}:${range}:${interval}`
  const ttl      = TTL_BY_RANGE[range] ?? DEFAULT_TTL

  // 1. Muistivälimuisti
  const hit = cache.get(cacheKey)
  if (hit && hit.expiresAt > Date.now()) {
    res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`)
    res.setHeader('X-Cache', 'HIT')
    res.json(hit.data)
    return
  }

  // 2. In-flight-deduplikointi
  let req$ = inFlight.get(cacheKey)
  if (!req$) {
    req$ = yf
      .chart(symbol, {
        period1: rangeToPeriod1(range),
        interval: interval as '1d' | '1wk' | '1mo',
      })
      .then((r) => {
        // Muunnetaan yahoo-finance2-rakenne frontendin odottamaan muotoon
        const timestamps = r.quotes.map((q) =>
          Math.floor(new Date(q.date).getTime() / 1000)
        )
        const closes = r.quotes.map((q) => q.close ?? null)
        return {
          chart: {
            result: [{
              meta: r.meta,
              timestamp: timestamps,
              indicators: { quote: [{ close: closes }] },
            }],
            error: null,
          },
        }
      })
    inFlight.set(cacheKey, req$)
    req$
      .then((data) => cache.set(cacheKey, { data, expiresAt: Date.now() + ttl }))
      .catch(() => {})
      .finally(() => inFlight.delete(cacheKey))
  }

  try {
    const data = await req$
    res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`)
    res.setHeader('X-Cache', 'MISS')
    res.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[proxy] ${cacheKey} ->`, msg)
    res.status(502).json({ error: msg })
  }
})

// Search endpoint for stock suggestions
app.get('/api/search', async (req, res) => {
  const query = req.query.q as string
  
  if (!query || query.trim().length === 0) {
    res.json({ suggestions: [] })
    return
  }
  
  const trimmedQuery = query.trim()
  const cacheKey = `search:${trimmedQuery.toLowerCase()}`
  const searchTTL = 60 * 1000 // 60 seconds for search results
  
  // Check cache first
  const hit = cache.get(cacheKey)
  if (hit && hit.expiresAt > Date.now()) {
    res.setHeader('Cache-Control', `public, max-age=60`)
    res.setHeader('X-Cache', 'HIT')
    res.json(hit.data)
    return
  }
  
  // Check in-flight requests
  let searchReq$ = inFlight.get(cacheKey)
  if (!searchReq$) {
    searchReq$ = yf
      .search(trimmedQuery, { 
        quotesCount: 8, 
        newsCount: 0, 
        region: 'FI', 
        lang: 'fi-FI' 
      })
      .then((result) => {
        // Filter for Helsinki Exchange stocks
        const suggestions = result.quotes
          ?.filter(quote => 
            quote.isYahooFinance && 
            quote.exchange === 'HEL' &&
            quote.symbol &&
            quote.shortname
          )
          .map(quote => ({
            symbol: quote.symbol!,
            name: quote.shortname!,
            exchange: quote.exchange!
          })) || []
        
        return { suggestions }
      })
    
    inFlight.set(cacheKey, searchReq$)
    searchReq$
      .then((data) => cache.set(cacheKey, { data, expiresAt: Date.now() + searchTTL }))
      .catch(() => {})
      .finally(() => inFlight.delete(cacheKey))
  }
  
  try {
    const data = await searchReq$
    res.setHeader('Cache-Control', `public, max-age=60`)
    res.setHeader('X-Cache', 'MISS')
    res.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[proxy] search:${trimmedQuery} ->`, msg)
    res.status(502).json({ error: msg, suggestions: [] })
  }
})

app.listen(PORT, () => {
  console.log(`[proxy] running on http://localhost:${PORT}`)
})
