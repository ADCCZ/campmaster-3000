# CampMaster 3000

Semestrální práce KIV/UUR — webová aplikace pro správu a živé sledování etapových her (táborové hry, orientační závody, sportovní dny).

## Tech stack

| Oblast | Technologie |
|--------|------------|
| Build | Vite + React 19 |
| UI | Tailwind CSS (utility třídy), Lucide React (ikony) |
| Mapy | Leaflet + React-Leaflet |
| Real-time sync | Socket.IO (klient + Express server) |
| Persistence | localStorage + WebSocket state push |
| i18n | vlastní I18nContext (CS / EN) |

## Spuštění

```bash
# Instalace závislostí
npm install

# Dev server (frontend)
npm run dev

# Backend (Socket.IO server pro real-time sync)
npm run dev:server

# Nebo obojí naráz
npm run dev:all
```

Frontend běží na `http://localhost:5173`, backend na portu `3001`.

### Spuštění na více zařízeních v síti (LAN)

1. Spusť `npm run dev:all` na hostitelském počítači
2. Ostatní zařízení otevřou `http://<IP-hostitele>:5173` v prohlížeči
3. Frontend automaticky detekuje hostname a připojí se ke správnému backendu — žádná konfigurace není potřeba
4. Všechny změny se okamžitě synchronizují přes WebSocket

### Databáze

Data jsou uložena v `server/data.json` — plain JSON soubor spravovaný Node.js/Express. Přežívá restart serveru. Jako záloha slouží `localStorage` v každém prohlížeči (funguje i offline bez backendu).

## Architektura

```
src/
├── components/
│   ├── layout/        # AppHeader, Sidebar, AboutDialog
│   ├── home/          # Seznam akcí (HomeView, EventCard)
│   ├── editor/        # Editační režim (EditorView, MapEditor, PinsPanel, TeamsPanel)
│   └── live/          # Live režim (LiveView, TabStanoviste, TabPrehled)
├── context/
│   ├── GameContext.jsx   # Globální stav + Socket.IO + localStorage
│   ├── I18nContext.jsx   # Překlady CS/EN
│   └── ThemeContext.jsx  # Dark/light mode
├── hooks/
│   └── useTimer.js       # Časomíra (start/pause/reset)
└── data/
    └── defaultData.js    # Ukázková data (3 akce)
```

## Datový model (zjednodušeně)

```jsonc
{
  "id": "letni-tabor-2026",
  "name": "Letní tábor 2026",
  "pins": [
    { "id": 0, "label": "A", "name": "Stanoviště A — Čolek", "maxPoints": 100, "vedouci": "Jana Procházka", "lat": 49.74, "lng": 13.37 }
  ],
  "teams": [
    { "id": "t0", "name": "Rudé lišky", "color": "#ef4444", "score": 340 }
  ],
  "stationScores": {
    "0": { "t0": 85, "t1": 60 }   // body každého týmu na daném stanovišti
  },
  "actionLog": [],
  "liveState": { "isRunning": false, "elapsedSeconds": 0 }
}
```

## Funkce

### Edit režim
- Interaktivní mapa (Leaflet) s drag & drop stanovišti
- CRUD pro stanoviště (název, popis, max bodů, vedoucí, GPS)
- CRUD pro týmy (název, barva, vedoucí, kategorie)
- Stromová struktura (dny → etapy → stanoviště)

### Live režim
- **Tab Stanoviště** — vedoucí zadává body týmům; zobrazuje celkové skóre týmu + body získané na aktuálním stanovišti z maxima (`85 / 100`)
- **Tab Přehled** — živý žebříček všech týmů + stav stanovišť
- Plovoucí časomíra (start / pauza / reset)
- Real-time synchronizace přes WebSocket (více zařízení naráz)
- Log posledních akcí

### Obecné
- Tmavý / světlý motiv
- Přepínání jazyka CS ↔ EN
- Role výběr (Organizátor / konkrétní vedoucí → filtruje vlastní stanoviště)
- Offline fallback přes localStorage

## Responzivita

| Obrazovka | Chování |
|-----------|---------|
| ≥ 1280px (desktop) | Plný layout — AppBar 90px, boční panel s logem akce, action log v Live módu viditelný |
| 1024–1279px (laptop) | AppBar 80px, výběr etapy skrytý, pravý sloupec v Přehledu viditelný |
| 768–1023px (tablet) | AppBar 60px, výběr dne/etapy skrytý, action log v Live skrytý, score karty 2 sloupce |
| < 768px | Minimální AppBar, score karty 1 sloupec, skryté sekundární prvky |

## Autor

Oldřich Jan Švehla — KIV/UUR 2025/2026
