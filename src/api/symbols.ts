// Symbols & shared constants for stock data providers.
export const YAHOO_SYMBOL = 'NOKIA.HE'

export interface StockPrice {
  symbol: string;
  price: string;
  exchange: string;
  source: 'yahoo';
  fetchedAt: number;
}
