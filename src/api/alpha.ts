import axios from 'axios'
import { ALPHA_SYMBOL, type StockPrice } from './symbols'

export async function fetchFromAlpha(apiKey: string): Promise<StockPrice> {
  const response = await axios.get(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ALPHA_SYMBOL}&apikey=${apiKey}`
  )
  const data = response.data
  // Free tier returns { Note | Information } when daily/per-minute limits hit
  if (data?.Note || data?.Information) {
    throw new Error(`Alpha Vantage rate limit: ${data.Note || data.Information}`)
  }
  const quote = data?.['Global Quote']
  if (!quote || !quote['05. price']) {
    throw new Error(`Alpha Vantage unexpected response: ${JSON.stringify(data)}`)
  }
  return {
    symbol: quote['01. symbol'],
    price: parseFloat(quote['05. price']).toFixed(2),
    exchange: 'XHEL (Helsinki)',
    source: 'alphavantage',
    fetchedAt: Date.now(),
  }
}
