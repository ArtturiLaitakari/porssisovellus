import axios from 'axios'
import { YAHOO_SYMBOL, type StockPrice } from './symbols'

// Kaikki Yahoo-pyynnöt menevät oman Express-proxyn kautta (/api/stock/:symbol)
// joka lisää tarvittavan User-Agent-headerin palvelinpuolella.
const BASE = '/api/stock'

export interface ChartPoint {
  t: number;
  price: number;
}

// Chart-haku palauttaa sekä pisteet ETTÄ ajantasaisen kurssihinnan (meta.regularMarketPrice).
// Näin sivun lataus tarvitsee vain YHDEN Yahoo-pyynnön – App.tsx ei tee erillistä hintahakua.
export interface ChartResult {
  points: ChartPoint[];
  stockPrice: StockPrice;
}

export async function fetchYahooChart(
  symbol: string,
  range: string,
  interval: string
): Promise<ChartResult> {
  const res = await axios.get(`${BASE}/${symbol}?range=${range}&interval=${interval}`)
  const result = res.data?.chart?.result?.[0]
  const meta = result?.meta
  const timestamps: number[] | undefined = result?.timestamp
  const closes: (number | null)[] | undefined =
    result?.indicators?.quote?.[0]?.close

  if (!timestamps || !closes) {
    throw new Error('Yahoo chart response missing timestamp/close arrays')
  }

  const points = timestamps
    .map((ts, i) => ({ t: ts * 1000, price: closes[i] as number }))
    .filter((p) => typeof p.price === 'number')

  const marketPrice: number =
    typeof meta?.regularMarketPrice === 'number'
      ? meta.regularMarketPrice
      : points[points.length - 1]?.price ?? 0

  const stockPrice: StockPrice = {
    symbol: meta?.symbol ?? symbol,
    price: marketPrice.toFixed(2),
    exchange: meta?.fullExchangeName || meta?.exchangeName || 'XHEL (Helsinki)',
    source: 'yahoo',
    fetchedAt: Date.now(),
  }

  return { points, stockPrice }
}

// Pidetään fetchFromYahoo live-refresh-nappia varten (Alpha Vantage on ensisijainen,
// mutta tämä toimii varana). Käyttää samaa proxya.
export async function fetchFromYahoo(): Promise<StockPrice> {
  const { stockPrice } = await fetchYahooChart(YAHOO_SYMBOL, '1d', '1d')
  return stockPrice
}
