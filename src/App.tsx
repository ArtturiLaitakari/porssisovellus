import { useCallback, useState, useEffect } from 'react'
import {
  YAHOO_SYMBOL,
  fetchFromAlpha,
  readCache,
  writeCache,
  getFavorites,
  type StockPrice,
} from './api'
import { PriceChart } from './graph'
import { StockSearch } from './search'
import './App.css'

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('fi-FI')
}

function App() {
  // Initialize selectedSymbol from first favorite or default to Nokia
  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => {
    const favorites = getFavorites()
    return favorites.length > 0 ? favorites[0].symbol : YAHOO_SYMBOL
  })
  
  const [stockData, setStockData] = useState<StockPrice | null>(() => readCache(selectedSymbol))
  const [loading, setLoading] = useState(() => readCache(selectedSymbol) === null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(() => readCache(selectedSymbol) !== null)

  // Handle stock selection from search
  const handleSelect = useCallback((symbol: string, name: string) => {
    setSelectedSymbol(symbol)
    
    // Reset state for new symbol
    const cachedData = readCache(symbol)
    setStockData(cachedData)
    setLoading(cachedData === null)
    setFromCache(cachedData !== null)
    setError(null)
  }, [])

  // PriceChart kutsuu tätä kun se saa oikeaa dataa (verkosta tai chart-cachesta)
  const handlePriceLoaded = useCallback((data: StockPrice) => {
    setStockData((prev) => {
      // Päivitä vain jos ei ole tuoreempaa alphavantage-dataa tai hinta muuttui
      if (prev?.source === 'alphavantage') return prev
      writeCache(selectedSymbol, data)
      return data
    })
    setFromCache(false)
    setLoading(false)
  }, [selectedSymbol])

  const fetchLive = useCallback(async () => {
    const API_KEY = import.meta.env.VITE_ALPHAVANTAGE_API_KEY
    if (!API_KEY) {
      setError('Missing VITE_ALPHAVANTAGE_API_KEY in .env.local')
      return
    }
    setRefreshing(true)
    setError(null)
    try {
      const data = await fetchFromAlpha(API_KEY)
      setStockData(data)
      setFromCache(false)
      writeCache(selectedSymbol, data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setRefreshing(false)
    }
  }, [selectedSymbol])

  return (
    <div className="app-page">
      <header className="app-header">
        <span className="app-header__dot" />
        <h1 className="app-header__title">Pörssisovellus</h1>
      </header>

      {/* Stock search */}
      <StockSearch onSelect={handleSelect} />

      <main className="app-main">
        {error && <div className="app-error">{error}</div>}

        {/* Price card */}
        <div className="app-card">
          {loading ? (
            <div className="stock-skeleton" />
          ) : stockData ? (
            <>
              <div className="stock-symbol">{stockData.symbol} · {stockData.exchange}</div>
              <div className="stock-price">
                {stockData.price}
                <span className="stock-price__currency">€</span>
              </div>
              <div className="stock-meta">
                <span className={`stock-badge stock-badge--${stockData.source}`}>
                  {stockData.source === 'alphavantage' ? 'Alpha Vantage · live' : 'Yahoo Finance · ≈15 min viive'}
                </span>
                {fromCache && <span>välimuistista</span>}
                <span>Päivitetty {formatTime(stockData.fetchedAt)}</span>
              </div>
              {/* Only show live button for Nokia (Alpha Vantage API limitation) */}
              {selectedSymbol === 'NOKIA.HE' && (
                <button
                  className="live-btn"
                  onClick={fetchLive}
                  disabled={refreshing}
                >
                  {refreshing ? 'Haetaan…' : 'Hae live-hinta'}
                </button>
              )}
            </>
          ) : null}
        </div>

        {/* Chart card — näytetään aina, ei odoteta hintadataa */}
        <div className="app-card">
          <div className="app-card__label">Kurssikehitys</div>
          <PriceChart symbol={selectedSymbol} onPriceLoaded={handlePriceLoaded} />
        </div>
      </main>
    </div>
  )
}

export default App
