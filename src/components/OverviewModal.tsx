import { useEffect } from 'react'
import type { FinancialMetrics } from '../api'
import './OverviewModal.css'

interface Props {
  fundamentals: FinancialMetrics
  onClose: () => void
}

function fmtBig(n: number | null): string {
  if (n == null) return '--'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} mrd €`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} milj €`
  return n.toLocaleString('fi-FI')
}

function fmtPct(n: number | null): string {
  if (n == null) return '--'
  return `${(n * 100).toFixed(1)} %`
}

function fmtNum(n: string | number | null): string {
  if (n == null) return '--'
  return String(n)
}

export function OverviewModal({ fundamentals: f, onClose }: Props) {
  // Sulje Escape-näppäimellä
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <div>
            <div className="modal__symbol">{f.symbol}</div>
            {f.name && <div className="modal__name">{f.name}</div>}
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Sulje">✕</button>
        </div>

        {(f.sector || f.industry) && (
          <div className="modal__tags">
            {f.sector && <span className="modal__tag">{f.sector}</span>}
            {f.industry && <span className="modal__tag modal__tag--secondary">{f.industry}</span>}
          </div>
        )}

        {f.description && (
          <p className="modal__description">{f.description}</p>
        )}

        <div className="modal__grid">
          <div className="modal__section">
            <div className="modal__section-title">Arvostus</div>
            <div className="modal__rows">
              <div className="modal__row"><span>P/E</span><span>{fmtNum(f.peRatio)}</span></div>
              <div className="modal__row"><span>EV/EBITDA</span><span>{fmtNum(f.evEbitda)}</span></div>
              <div className="modal__row"><span>Markkina-arvo</span><span>{fmtBig(f.marketCap)}</span></div>
              <div className="modal__row"><span>Osinkotuotto</span><span>{fmtPct(f.dividendYield)}</span></div>
            </div>
          </div>

          <div className="modal__section">
            <div className="modal__section-title">Kannattavuus</div>
            <div className="modal__rows">
              <div className="modal__row"><span>Liikevaihto</span><span>{fmtBig(f.revenue)}</span></div>
              <div className="modal__row"><span>Bruttokate</span><span>{fmtPct(f.grossMargin)}</span></div>
              <div className="modal__row"><span>Liikevoittomarginaali</span><span>{fmtPct(f.operatingMargin)}</span></div>
              <div className="modal__row"><span>Oman pääoman tuotto</span><span>{fmtPct(f.returnOnEquity)}</span></div>
            </div>
          </div>

          <div className="modal__section">
            <div className="modal__section-title">Tase</div>
            <div className="modal__rows">
              <div className="modal__row"><span>Velkaantumisaste (D/E)</span><span>{fmtNum(f.debtEquity)}</span></div>
              <div className="modal__row"><span>Current Ratio</span><span>{fmtNum(f.currentRatio)}</span></div>
            </div>
          </div>

          {(f.employees || f.website) && (
            <div className="modal__section">
              <div className="modal__section-title">Yritys</div>
              <div className="modal__rows">
                {f.employees && (
                  <div className="modal__row"><span>Henkilöstö</span><span>{f.employees.toLocaleString('fi-FI')}</span></div>
                )}
                {f.website && (
                  <div className="modal__row">
                    <span>Verkkosivusto</span>
                    <a href={f.website} target="_blank" rel="noopener noreferrer" className="modal__link">{f.website.replace(/^https?:\/\//, '')}</a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
