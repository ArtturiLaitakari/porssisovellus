export interface FavoriteStock {
  symbol: string
  name: string
  addedAt: number
}

const FAVORITES_KEY = 'favorites:stocks'
const MAX_FAVORITES = 30

// Get all favorites from localStorage
export function getFavorites(): FavoriteStock[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    
    return parsed.filter(item => 
      item && 
      typeof item.symbol === 'string' && 
      typeof item.name === 'string' && 
      typeof item.addedAt === 'number'
    )
  } catch (error) {
    console.warn('Error reading favorites from localStorage:', error)
    return []
  }
}

// Check if a stock is favorited
export function isFavorite(symbol: string): boolean {
  const favorites = getFavorites()
  return favorites.some(fav => fav.symbol === symbol)
}

// Add a stock to favorites (max 30, FIFO removal)
export function addFavorite(symbol: string, name: string): boolean {
  try {
    let favorites = getFavorites()
    
    // Check if already exists
    if (favorites.some(fav => fav.symbol === symbol)) {
      return false // Already favorited
    }
    
    // Add new favorite
    const newFavorite: FavoriteStock = {
      symbol,
      name,
      addedAt: Date.now()
    }
    
    favorites.push(newFavorite)
    
    // Enforce max limit (remove oldest if needed)
    if (favorites.length > MAX_FAVORITES) {
      favorites = favorites
        .sort((a, b) => a.addedAt - b.addedAt) // Sort by oldest first
        .slice(favorites.length - MAX_FAVORITES) // Keep only the last MAX_FAVORITES
    }
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    return true
  } catch (error) {
    console.warn('Error adding favorite to localStorage:', error)
    return false
  }
}

// Remove a stock from favorites
export function removeFavorite(symbol: string): boolean {
  try {
    const favorites = getFavorites()
    const filtered = favorites.filter(fav => fav.symbol !== symbol)
    
    if (filtered.length === favorites.length) {
      return false // Symbol not found in favorites
    }
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.warn('Error removing favorite from localStorage:', error)
    return false
  }
}

// Toggle favorite status
export function toggleFavorite(symbol: string, name: string): boolean {
  if (isFavorite(symbol)) {
    removeFavorite(symbol)
    return false // Now not favorited
  } else {
    addFavorite(symbol, name)
    return true // Now favorited
  }
}

// Get favorites as simple {symbol, name} format for search results
export function getFavoriteSymbols(): Set<string> {
  return new Set(getFavorites().map(fav => fav.symbol))
}