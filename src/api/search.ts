import { HELSINKI_STOCKS, type HelsinkiStock } from './helsinkiStocks'

export interface StockSuggestion {
  symbol: string
  name: string
  exchange: string
  isFavorite?: boolean
}

export interface SearchOptions {
  onProgress?: (suggestions: StockSuggestion[]) => void
}

// Search stocks with client-side filtering + network search
export async function searchStocks(query: string, options?: SearchOptions): Promise<StockSuggestion[]> {
  const trimmedQuery = query.trim().toLowerCase()
  
  if (trimmedQuery.length === 0) {
    // Return static list when query is empty
    return HELSINKI_STOCKS.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      exchange: 'HEL'
    }))
  }
  
  // Start with client-side filtering of static list
  const staticMatches = HELSINKI_STOCKS
    .filter(stock => 
      stock.name.toLowerCase().includes(trimmedQuery) ||
      stock.symbol.toLowerCase().includes(trimmedQuery)
    )
    .map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      exchange: 'HEL'
    }))
  
  // If query is too short, return only static matches
  if (trimmedQuery.length < 2) {
    return staticMatches
  }
  
  // Immediately show static results while loading network
  if (options?.onProgress && staticMatches.length > 0) {
    options.onProgress(staticMatches)
  }
  
  // For longer queries, also search via network
  try {
    const response = await fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(query)}`)
    
    if (!response.ok) {
      console.warn('Search API failed, using static results only')
      return staticMatches
    }
    
    const data = await response.json()
    const networkMatches = data.suggestions || []
    
    // Network results replace static when available and non-empty
    if (networkMatches.length > 0) {
      return networkMatches
    }
    
    // Fallback to static matches if network returns empty
    return staticMatches
  } catch (error) {
    console.warn('Search API error, using static results only:', error)
    return staticMatches
  }
}