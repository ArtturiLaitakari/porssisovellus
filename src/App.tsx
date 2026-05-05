import { useCallback, useState, useEffect, useRef } from 'react'
import {
  YAHOO_SYMBOL,
  HELSINKI_STOCKS,
  fetchFinancialMetrics,
  readCache,
  writeCache,
  readFundamentalsCache,
  writeFundamentalsCache,
  getFavorites,
  isFavorite,
  toggleFavorite,
  type StockPrice,
  type FinancialMetrics,
} from './api'
import { PriceChart } from './graph'
import { StockSearch } from './search'
import { OverviewModal } from './components/OverviewModal'
import './App.css'

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('fi-FI')
}

function peColor(v: string | null | undefined): string {
  const n = parseFloat(v ?? '')
  if (isNaN(n)) return ''
  if (n < 12) return 'metric__value--green'
  if (n < 20) return 'metric__value--yellow'
  if (n < 35) return 'metric__value--orange'
  return 'metric__value--red'
}

function evEbitdaColor(v: string | null | undefined): string {
  const n = parseFloat(v ?? '')
  if (isNaN(n)) return ''
  if (n < 8) return 'metric__value--green'
  if (n < 14) return 'metric__value--yellow'
  if (n < 20) return 'metric__value--orange'
  return 'metric__value--red'
}

function deColor(v: string | null | undefined): string {
  const n = parseFloat(v ?? '')
  if (isNaN(n)) return ''
  if (n < 0.5) return 'metric__value--green'
  if (n < 1.5) return 'metric__value--yellow'
  if (n < 2.5) return 'metric__value--orange'
  return 'metric__value--red'
}

function getDividendInfo(exDividendDate: number | null, dividendDate: number | null): { label: string; value: string } | null {
  const formatDate = (ts: number | null) => ts ? new Date(ts).toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric', year: 'numeric' }) : null
  
  const lastDividend = dividendDate ? formatDate(dividendDate) : null
  const exDate = exDividendDate ? formatDate(exDividendDate) : null
  
  // Prioriteetti: viimeisin osinko ensisijaisesti
  if (lastDividend) {
    return { label: 'Viimeisin osinko', value: lastDividend }
  }
  
  // Jos ei viimeistä osinkoa, näytä irtoamispäivä
  if (exDate) {
    return { label: 'Irtoamispäivä', value: exDate }
  }
  
  return null
}

function nordnetUrl(symbol: string, name: string | null | undefined): string {
  const ticker = symbol.replace('.HE', '').toLowerCase()
  const resolvedName = name ?? HELSINKI_STOCKS.find(s => s.symbol === symbol)?.name
  const nameSlug = resolvedName
    ? resolvedName
        .toLowerCase()
        .replace(/\b(corporation|corp|oyj|plc|ltd|group|ab|oy)\b/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    : ticker
  return `https://www.nordnet.fi/osakkeet/kurssit/${nameSlug}-${ticker}-xhel`
}

function App() {
  // Initialize selectedSymbol from first favorite or default to Nokia
  const [selectedSymbol, setSelectedSymbol] = useState<string>(() => {
    const favorites = getFavorites()
    return favorites.length > 0 ? favorites[0].symbol : YAHOO_SYMBOL
  })
  
  const [stockData, setStockData] = useState<StockPrice | null>(() => readCache(selectedSymbol))
  const [loading, setLoading] = useState(() => readCache(selectedSymbol) === null)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(() => readCache(selectedSymbol) !== null)
  const [isCurrentFavorite, setIsCurrentFavorite] = useState(() => isFavorite(selectedSymbol))
  const [showFavoritesDropdown, setShowFavoritesDropdown] = useState(false)
  const [fundamentals, setFundamentals] = useState<FinancialMetrics | null>(() => readFundamentalsCache(selectedSymbol))
  const [loadingFundamentals, setLoadingFundamentals] = useState(() => readFundamentalsCache(selectedSymbol) === null)
  const [showOverview, setShowOverview] = useState(false)
  const favoritesDropdownRef = useRef<HTMLDivElement>(null)
  const initialFetchDone = useRef(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (favoritesDropdownRef.current && !favoritesDropdownRef.current.contains(event.target as Node)) {
        setShowFavoritesDropdown(false)
      }
    }

    if (showFavoritesDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFavoritesDropdown])

  const fetchFundamentals = useCallback(async (symbol: string) => {
    try {
      const data = await fetchFinancialMetrics(symbol)
      setFundamentals(data)
      writeFundamentalsCache(symbol, data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn('Fundamentals fetch failed:', msg)
    } finally {
      setLoadingFundamentals(false)
    }
  }, [])

  // Handle stock selection from search
  const handleSelect = useCallback((symbol: string) => {    setSelectedSymbol(symbol)
    
    // Reset state for new symbol
    const cachedData = readCache(symbol)
    const cachedFundamentals = readFundamentalsCache(symbol)
    setStockData(cachedData)
    setLoading(cachedData === null)
    setFromCache(cachedData !== null)
    setError(null)
    setIsCurrentFavorite(isFavorite(symbol))
    setFundamentals(cachedFundamentals)
    setLoadingFundamentals(cachedFundamentals === null)
    if (!cachedFundamentals) void fetchFundamentals(symbol)
  }, [fetchFundamentals])

  // PriceChart kutsuu tätä kun se saa oikeaa dataa (verkosta tai chart-cachesta)
  const handlePriceLoaded = useCallback((data: StockPrice) => {
    writeCache(selectedSymbol, data)
    setStockData(data)
    setFromCache(false)
    setLoading(false)
  }, [selectedSymbol])

  useEffect(() => {
    if (!initialFetchDone.current && !readFundamentalsCache(selectedSymbol)) {
      initialFetchDone.current = true
      void fetchFundamentals(selectedSymbol)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleFavorite = useCallback(() => {
    if (stockData) {
      const newIsFavorite = toggleFavorite(stockData.symbol, fundamentals?.name || stockData.symbol)
      setIsCurrentFavorite(newIsFavorite)
    }
  }, [stockData, fundamentals?.name])

  const handleFavoritesClick = useCallback(() => {
    setShowFavoritesDropdown(prev => !prev)
  }, [])

  const handleFavoriteSelect = useCallback((symbol: string) => {
    handleSelect(symbol)
    setShowFavoritesDropdown(false)
  }, [handleSelect])

  return (
    <div className="app-page">
      <header className="app-header">
        <span className="app-header__dot" />
        <h1 className="app-header__title">Pörssisovellus</h1>
        <div className="favorites-dropdown" ref={favoritesDropdownRef}>
          <button 
            className="button button--small" 
            onClick={handleFavoritesClick}
          >
            Suosikit
          </button>
          {showFavoritesDropdown && (
            <div className="favorites-dropdown__content">
              {getFavorites().length === 0 ? (
                <div className="favorites-dropdown__empty">Ei suosikkeja</div>
              ) : (
                getFavorites().map((favorite) => (
                  <button
                    key={favorite.symbol}
                    className="favorites-dropdown__item"
                    onClick={() => handleFavoriteSelect(favorite.symbol)}
                  >
                    <span className="favorites-dropdown__symbol">{favorite.symbol}</span>
                    <span className="favorites-dropdown__name">{favorite.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </header>

      {/* Stock search */}
      <StockSearch onSelect={handleSelect} />

      <main className="app-main">
        {error && <div className="app-error">{error}</div>}

        {/* Price + metrics card */}
        <div className="app-card stock-card">
          <div className="stock-card__layout">
            {/* Left: price info */}
            <div className="stock-card__main">
              {loading ? (
                <div className="stock-skeleton" />
              ) : stockData ? (
                <>
                  <div className="stock-symbol">
                    {fundamentals?.name || stockData.symbol} · {stockData.exchange}
                  </div>
                  <div className="stock-price">
                    {stockData.price}
                    <span className="stock-price__currency">€</span>
                  </div>
                  <div className="stock-meta">
                    <span className={`stock-badge stock-badge--${stockData.source}`}>
                      Yahoo Finance
                    </span>
                    {fromCache && <span>välimuistista</span>}
                    <span>Päivitetty {formatTime(stockData.fetchedAt)}</span>
                  </div>
                  <button
                    className={`button ${isCurrentFavorite ? 'button--favorite-active' : ''}`}
                    onClick={handleToggleFavorite}
                    title={isCurrentFavorite ? 'Poista suosikeista' : 'Lisää suosikkeihin'}
                  >
                    {isCurrentFavorite ? '★' : '☆'}{' '}
                    {isCurrentFavorite ? 'Suosikki' : 'Lisää suosikiksi'}
                  </button>
                  <a className="button" href={nordnetUrl(selectedSymbol, fundamentals?.name)} target="_blank" rel="noopener noreferrer">Kauppaan →</a>
                </>
              ) : null}
            </div>

            {/* Right: financial metrics */}
            <div className="stock-card__metrics">
              <div className="app-card__label">
                Tunnusluvut
              </div>
              <div className="financial-metrics">
                <div className="metric">
                  <div className="metric__label">P/E</div>
                  <div className={`metric__value ${peColor(fundamentals?.peRatio)}`}>
                    {loadingFundamentals ? '…' : fundamentals?.peRatio ?? '--'}
                  </div>
                </div>
                <div className="metric">
                  <div className="metric__label">EV/EBITDA</div>
                  <div className={`metric__value ${evEbitdaColor(fundamentals?.evEbitda)}`}>
                    {loadingFundamentals ? '…' : fundamentals?.evEbitda ?? '--'}
                  </div>
                </div>
                <div className="metric">
                  <div className="metric__label">D/E</div>
                  <div className={`metric__value ${deColor(fundamentals?.debtEquity)}`}>
                    {loadingFundamentals ? '…' : fundamentals?.debtEquity ?? '--'}
                  </div>
                </div>
                {(() => {
                  const dividendInfo = getDividendInfo(fundamentals?.exDividendDate ?? null, fundamentals?.dividendDate ?? null)
                  return dividendInfo ? (
                    <div className="metric">
                      <div className="metric__label">{dividendInfo.label}</div>
                      <div className="metric__value">
                        {dividendInfo.value}
                      </div>
                    </div>
                  ) : null
                })()}
              </div>
              {fundamentals && (
                <button
                  className="button button--small button--overview"
                  onClick={() => setShowOverview(true)}
                >
                  Overview
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chart card — näytetään aina, ei odoteta hintadataa */}
        <div className="app-card">
          <div className="app-card__label">Kurssikehitys</div>
          <PriceChart symbol={selectedSymbol} onPriceLoaded={handlePriceLoaded} />
        </div>
      </main>

      {showOverview && fundamentals && (
        <OverviewModal fundamentals={fundamentals} onClose={() => setShowOverview(false)} />
      )}
    </div>
  )
}

export default App
