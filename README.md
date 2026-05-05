# Pörssisovellus

React-pohjainen sovellus osakkeiden hakuun ja hintojen seurantaan. Käyttää Alpha Vantage + Yahoo Finance APIt.

## Ominaisuudet

- **Osakehaku**: Hae osakkeita hakusanalla
- **Hintakaaviot**: Reaaliaikaiset hinnat + historiakaaviot  
- **Suosikit**: Tallenna usein seurattavat osakkeet
- **Cache**: Välimuisti nopeuttaa hakuja
- **Duaalilähde**: Alpha Vantage + Yahoo Finance backup

## Teknologia

- React 19 + TypeScript
- Vite bundler
- Recharts graafit
- Express proxy server
- Axios HTTP client

## Käynnistys

```bash
# Asenna riippuvuudet
npm install

# Käynnistä dev + proxy
npm run dev

# Vain proxy
npm run proxy

# Tuotantoversio
npm run build
npm run preview
```

## API-avaimet

Luo `user-config.sh`:

```bash
export ALPHAVANTAGE_API_KEY="your-api-key"
```

Alpha Vantage key: https://www.alphavantage.co/support/#api-key

## Toiminta

1. Haku käyttää Alpha Vantage search API
2. Hinnat haetaan Alpha Vantage (primary) + Yahoo Finance (fallback)
3. Cache tallentaa haetut tiedot
4. Suosikit localStorage
5. Proxy server CORS bypass + API key hide
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
