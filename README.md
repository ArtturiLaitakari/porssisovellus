# Pörssisovellus

Helsingin pörssin osakkeiden seurantasovellus. Live-osoite: **https://artturilaitakari.github.io/porssisovellus/**

## Ominaisuudet

- **Osakehaku** — hae Helsingin pörssin osakkeita nimellä tai tickerillä
- **Hintakaavio** — historiakaavio useilla aikaväleillä (1pv – 5v)
- **Tunnusluvut** — P/E, EV/EBITDA, D/E värikoodattuna
- **Overview** — laajemmat tiedot: kate, velat, ROE, henkilöstö, kuvaus
- **Suosikit** — tallenna seurattavat osakkeet selaimeen
- **Nordnet-linkki** — suora linkki osakkeen kauppasivulle
- **Cache** — same-day välimuisti, nollautuu automaattisesti puolenyön jälkeen

## Teknologia

- React 19 + TypeScript + Vite
- Recharts (kaaviot)
- Express proxy (Yahoo Finance, port 3001)
- localStorage cache

## Kehitysympäristö

```bash
npm install

# Käynnistä frontend (5173) + proxy (3001) yhdellä komennolla
npm run dev
```

Luo `.env.local`:

```env
VITE_ALPHAVANTAGE_API_KEY=your-key-here
```

Alpha Vantage -avain (ilmainen): https://www.alphavantage.co/support/#api-key  
Avain tarvitaan vain "Päivitä"-nappiin (live-hinta).

## Tuotantobuild

```bash
npm run build   # tuottaa dist/
npm run preview # esikatsele dist/ paikallisesti
```

## GitHub Pages -deploy

Push `main`-branchiin käynnistää automaattisen deployn (`.github/workflows/deploy.yml`).

Tarvittavat GitHub-asetukset:
- **Settings → Pages → Source**: GitHub Actions
- **Settings → Variables**: `VITE_API_BASE_URL` = proxy-serverin URL (esim. Railway/Render)
- **Settings → Secrets**: `VITE_ALPHAVANTAGE_API_KEY`

> Huom: Express-proxy täytyy deployata erikseen (Railway, Render tms.) — GitHub Pages tukee vain staattisia tiedostoja.

## Arkkitehtuuri

```
src/
  App.tsx              # pääkomponentti, tila, logiikka
  api/
    yahoo.ts           # kurssihistoria + hinnat (proxyn kautta)
    fundamentals.ts    # tunnusluvut + yritystiedot (proxyn kautta)
    alpha.ts           # live-hinta (Alpha Vantage, suoraan)
    cache.ts           # localStorage-apufunktiot
    favorites.ts       # suosikit
    helsinkiStocks.ts  # staattinen lista HEL-osakkeista
  graph/
    PriceChart.tsx     # Recharts-kaavio
  search/
    StockSearch.tsx    # hakukenttä
  components/
    OverviewModal.tsx  # tunnusluku-modal

server/
  proxy.ts             # Express: Yahoo Finance -proxy
```

