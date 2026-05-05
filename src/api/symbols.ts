// Symbols & shared constants for stock data providers.
// Alpha Vantage uses .HEL, Yahoo uses .HE for Helsinki listings.
export const ALPHA_SYMBOL = 'NOKIA.HEL'
export const YAHOO_SYMBOL = 'NOKIA.HE'

export interface StockPrice {
  symbol: string;
  price: string;
  exchange: string;
  source: 'alphavantage' | 'yahoo';
  fetchedAt: number;
}
