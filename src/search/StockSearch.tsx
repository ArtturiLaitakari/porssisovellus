import React, { useState, useEffect, useRef } from 'react'
import { searchStocks, getFavoriteSymbols, toggleFavorite, type StockSuggestion } from '../api'
import './StockSearch.css'

interface Props {
  onSelect: (symbol: string, name: string) => void
  placeholder?: string
}

export function StockSearch({ onSelect, placeholder = "Hae osakkeita..." }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [favoriteSymbols, setFavoriteSymbols] = useState<Set<string>>(new Set())
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<number>()

  // Load favorites on mount
  useEffect(() => {
    setFavoriteSymbols(getFavoriteSymbols())
  }, [])

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current)
    
    debounceRef.current = window.setTimeout(async () => {
      if (!showDropdown) return
      
      setLoading(true)
      try {
        const results = await searchStocks(query)
        
        // Mark favorites in results
        const resultsWithFavorites = results.map(suggestion => ({
          ...suggestion,
          isFavorite: favoriteSymbols.has(suggestion.symbol)
        }))
        
        setSuggestions(resultsWithFavorites)
      } catch (error) {
        console.error('Search error:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(debounceRef.current)
  }, [query, showDropdown, favoriteSymbols])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setShowDropdown(true)
  }

  // Handle input focus
  const handleInputFocus = () => {
    setShowDropdown(true)
  }

  // Handle selection
  const handleSelect = (suggestion: StockSuggestion) => {
    setQuery(`${suggestion.name} (${suggestion.symbol})`)
    setShowDropdown(false)
    onSelect(suggestion.symbol, suggestion.name)
  }

  // Handle favorite toggle
  const handleFavoriteToggle = (e: React.MouseEvent, suggestion: StockSuggestion) => {
    e.stopPropagation()
    
    const newIsFavorite = toggleFavorite(suggestion.symbol, suggestion.name)
    
    // Update local state
    const newFavoriteSymbols = new Set(favoriteSymbols)
    if (newIsFavorite) {
      newFavoriteSymbols.add(suggestion.symbol)
    } else {
      newFavoriteSymbols.delete(suggestion.symbol)
    }
    setFavoriteSymbols(newFavoriteSymbols)
    
    // Update suggestions to reflect new favorite status
    setSuggestions(prev => prev.map(s => 
      s.symbol === suggestion.symbol 
        ? { ...s, isFavorite: newIsFavorite }
        : s
    ))
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        dropdownRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="stock-search">
      <div className="stock-search-input-container">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="stock-search-input"
          autoComplete="off"
        />
        
        {loading && (
          <div className="stock-search-loading">
            <div className="spinner"></div>
          </div>
        )}
      </div>

      {showDropdown && (
        <div ref={dropdownRef} className="stock-search-dropdown">
          {suggestions.length === 0 ? (
            <div className="stock-search-no-results">
              {loading ? 'Haetaan...' : 'Ei tuloksia'}
            </div>
          ) : (
            <ul className="stock-search-suggestions">
              {suggestions.slice(0, 8).map((suggestion) => (
                <li
                  key={suggestion.symbol}
                  className="stock-search-suggestion"
                  onClick={() => handleSelect(suggestion)}
                >
                  <div className="stock-suggestion-content">
                    <div className="stock-suggestion-name">{suggestion.name}</div>
                    <div className="stock-suggestion-symbol">({suggestion.symbol})</div>
                  </div>
                  
                  <button
                    className={`stock-favorite-btn ${suggestion.isFavorite ? 'favorited' : ''}`}
                    onClick={(e) => handleFavoriteToggle(e, suggestion)}
                    title={suggestion.isFavorite ? 'Poista suosikeista' : 'Lisää suosikkeihin'}
                  >
                    ★
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}