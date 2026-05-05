import { HELSINKI_STOCKS, type HelsinkiStock } from './helsinkiStocks'

export interface StockSuggestion {
  symbol: string
  name: string
  exchange: string
  isFavorite?: boolean
}

// Search stocks with client-side filtering + network search
export async function searchStocks(query: string): Promise<StockSuggestion[]> {
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
  
  // For longer queries, also search via network
  try {
    const response = await fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(query)}`)
    
    if (!response.ok) {
      console.warn('Search API failed, using static results only')
      return staticMatches
    }
    
    const data = await response.json()
    const networkMatches = data.suggestions || []
    
    // Combine and deduplicate results (network results take precedence)
    const networkSymbols = new Set(networkMatches.map((s: StockSuggestion) => s.symbol))
    const combinedResults = [
      ...networkMatches,
      ...staticMatches.filter(s => !networkSymbols.has(s.symbol))
    ]
    
    return combinedResults
  } catch (error) {
    console.warn('Search API error, using static results only:', error)
    return staticMatches
  }
}