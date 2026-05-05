import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchYahooChart, generateMockChart, readChartCache, writeChartCache, type ChartPoint, type ChartResult, type StockPrice } from '../api'
import './PriceChart.css'

// Moduulitason deduplikointi: jos sama avain on jo lennossa, ei luoda uutta pyyntöä.
// Toimii hot-reload- ja double-mount-tilanteissa jopa ilman palvelinvälimuistia.
const inFlight = new Map<string, Promise<ChartResult>>()

type RangeKey = '1mo' | '3mo' | '6mo' | '1y' | '5y'

interface RangeOption {
  key: RangeKey;
  label: string;
  interval: string;
}

const RANGES: RangeOption[] = [
  { key: '1mo', label: '1kk', interval: '1d' },
  { key: '3mo', label: '3kk', interval: '1d' },
  { key: '6mo', label: '6kk', interval: '1d' },
  { key: '1y', label: '1v', interval: '1d' },
  { key: '5y', label: '5v', interval: '1wk' },
]

interface Props {
  symbol: string;
  onPriceLoaded?: (data: StockPrice) => void;
}

export function PriceChart({ symbol, onPriceLoaded }: Props) {
  const [range, setRange] = useState<RangeKey>('3mo')
  const [data, setData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [isMock, setIsMock] = useState(false)

  const getInterval = (r: RangeKey) => RANGES.find((o) => o.key === r)?.interval ?? '1d'
  const cancelRef = useRef(false)

  useEffect(() => {
    cancelRef.current = false
    setLoading(true)
    setIsMock(false)

    // localStorage ensin — sinne kirjoitetaan vain oikeaa dataa
    const cached = readChartCache(symbol, range)
    if (cached) {
      setData(cached)
      setIsMock(false)
      setLoading(false)
      // Johdetaan hinta viimeisestä pisteestä jos App.tsx tarvitsee
      if (onPriceLoaded && cached.length > 0) {
        const last = cached[cached.length - 1]
        onPriceLoaded({
          symbol,
          price: last.price.toFixed(2),
          exchange: 'XHEL (Helsinki)',
          source: 'yahoo',
          fetchedAt: Date.now(),
        })
      }
      return
    }

    const interval = getInterval(range)
    const key = `${symbol}:${range}:${interval}`

    let req = inFlight.get(key)
    if (!req) {
      req = fetchYahooChart(symbol, range, interval)
      inFlight.set(key, req)
      req.finally(() => inFlight.delete(key))
    }

    req
      .then((result: ChartResult) => {
        if (cancelRef.current) return
        setData(result.points)
        setIsMock(false)
        writeChartCache(symbol, range, result.points)
        onPriceLoaded?.(result.stockPrice)
      })
      .catch(() => {
        if (cancelRef.current) return
        setData(generateMockChart(range))
        setIsMock(true)
      })
      .finally(() => {
        if (!cancelRef.current) setLoading(false)
      })

    return () => {
      cancelRef.current = true
    }
  }, [symbol, range])

  const xFormatter = (ts: number) => {
    const d = new Date(ts)
    if (range === '5y' || range === '1y') {
      return d.toLocaleDateString('fi-FI', { month: 'short', year: '2-digit' })
    }
    return d.toLocaleDateString('fi-FI', { day: '2-digit', month: '2-digit' })
  }

  const yDomain = useMemo<[number | string, number | string]>(() => {
    if (data.length === 0) return ['auto', 'auto']
    const prices = data.map((d) => d.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const pad = (max - min) * 0.05 || 0.1
    return [+(min - pad).toFixed(2), +(max + pad).toFixed(2)]
  }, [data])

  return (
    <div className="chart-root">
      <div className="chart-ranges">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            disabled={loading}
            className={`chart-range-btn${range === r.key ? ' chart-range-btn--active' : ''}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="chart-loading">Ladataan kaaviota…</div>
      )}
      {!loading && isMock && (
        <p className="chart-mock-warning">⚠️ Demo-data — Yahoo Finance ei vastannut</p>
      )}

      {!loading && data.length > 0 && (
        <div className="chart-area">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="t"
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="time"
                tickFormatter={xFormatter}
                minTickGap={50}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={yDomain}
                tickFormatter={(v) => `€${v.toFixed(2)}`}
                width={72}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                labelFormatter={(ts) => new Date(ts as number).toLocaleDateString('fi-FI', { day: 'numeric', month: 'long', year: 'numeric' })}
                formatter={(value) => [`€${Number(value).toFixed(2)}`, 'Hinta']}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={isMock ? '#D1D5DB' : '#FF6600'}
                strokeWidth={2}
                strokeDasharray={isMock ? '4 3' : undefined}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
