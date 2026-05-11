# CampMaster 3000

Semestrální práce KIV/UUR — webová aplikace pro správu a živé sledování etapových her (táborové hry, orientační závody, sportovní dny).

**Online:** https://campmaster-3000.vercel.app/

## Tech stack

| Oblast | Technologie |
|--------|------------|
| Build | Vite + React 19 |
| UI | Tailwind CSS, Lucide React (ikony) |
| Mapy | Leaflet.js (přímé API, bez react-leaflet) |
| Grafy | recharts (BarChart, PieChart/donut) |
| Real-time sync | Socket.IO (klient + Express server) |
| Persistence | localStorage + server-side `data.json` |
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

### Persistence

Data jsou uložena v `server/data.json` — plain JSON soubor spravovaný Express serverem. Přežívá restart serveru. Jako záloha slouží `localStorage` v každém prohlížeči (funguje i offline bez backendu).

## Architektura

```
src/
├── components/
│   ├── layout/        # AppHeader (navigace, filtry, role, jazyk, motiv)
│   ├── home/          # GameListView — seznam karet akcí
│   ├── editor/        # EditorView, GameTree, MapView, PropertiesPanel, TeamsView, StatsView
│   ├── live/          # LiveView — tab Stanoviště + tab Přehled
│   ├── dialogs/       # NewGameWizard (3-krokový průvodce)
│   └── common/        # ConfirmDialog, CustomSelect, EditableLabel, ModalShell, CharCounter
├── context/
│   ├── GameContext.jsx   # Jediný zdroj pravdy + Socket.IO + localStorage
│   ├── I18nContext.jsx   # Překlady CS/EN (~200 klíčů)
│   └── ThemeContext.jsx  # Dark/light mode
├── hooks/
│   └── useTimer.js       # Časomíra (start/pause/reset)
├── utils/
│   └── validation.js     # Validátory, computeEventStatus(), tError()
└── data/
    └── defaultData.js    # Seed data (3 akce), buildRoutes(), getVedouciList()
```

## Datový model (zjednodušeně)

```jsonc
{
  "id": "letni-tabor-2026",
  "name": "Letní tábor 2026",
  "pins": [
    { "id": 0, "label": "ČOL", "name": "Stanoviště Čolek", "maxPoints": 100,
      "vedouci": "Jana Procházka", "day": 0, "stage": 0, "lat": 49.74, "lng": 13.37 }
  ],
  "teams": [
    { "id": "t0", "name": "Rudé lišky", "color": "#ef4444", "score": 340 }
  ],
  "stationScores":        { "0": { "t0": 85 } },       // body týmu na stanovišti
  "stationStatuses":      { "0": "done" },              // stav stanoviště
  "teamStationStatuses":  { "0": { "t0": "done" } },   // stav týmu na stanovišti
  "liveState": { "isRunning": false, "elapsedSeconds": 0 },
  "actionLog": []
}
```

## Funkce

### Edit režim
- Interaktivní mapa (Leaflet.js) s drag & drop stanovišti, custom SVG piny, polyline trasy
- Stromová struktura hry: dny → etapy → stanoviště (inline editace, přidávání, mazání)
- PropertiesPanel — editace stanoviště, auto-label ze jména (3 znaky), výběr vedoucího
- CRUD tabulka týmů s vlastními buňkami: ScoreCell (progress bar), ColorCell, StatusBadge
- Statistiky: BarChart + PieChart (donut) přes recharts, filtr dle dne/etapy

### Live režim
- **Tab Stanoviště** — ±1/±10/delta input; zobrazuje celkové skóre + body na aktuálním stanovišti; odečet omezen na 0
- **Tab Přehled** — živý žebříček + stav stanovišť s barevnými indikátory průchodu
- Časomíra (start / pauza / reset)
- Real-time synchronizace přes Socket.IO (více zařízení naráz)
- Log posledních akcí

### Obecné
- Průvodce novou akcí (3 kroky): geocoding lokace přes Nominatim, validace dat, limit týmů
- Tmavý / světlý motiv
- Přepínání jazyka CS ↔ EN
- Role výběr (Organizátor / vedoucí → filtruje vlastní stanoviště)
- Responzivní layout (breakpointy 299 / 350 / 440 / 650 px)

## Autor

Oldřich Jan Švehla — KIV/UUR 2025/2026
