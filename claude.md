# Etapová Hra — Návrhář a Správce (KIV/UUR Semestrální práce)

## Architektura projektu

### Tech Stack
- **Build:** Vite + React 19 + Electron
- **UI:** MUI (Material UI) + @mui/icons-material
- **Canvas:** react-konva (Konva.js)
- **Tabulky:** @mui/x-data-grid
- **Grafy:** recharts
- **Persistence:** localStorage (JSON serializace)

### Struktura adresářů
```
src/
├── main.jsx                  # React entry point
├── electron/
│   └── main.cjs              # Electron main process
├── components/
│   ├── layout/
│   │   ├── AppHeader.jsx         # AppBar — jméno autora + tlačítko "O aplikaci"
│   │   └── AboutDialog.jsx       # Dialog s informacemi o aplikaci
│   ├── home/
│   │   ├── GameListView.jsx      # Domovská obrazovka — seznam her
│   │   ├── GameCard.jsx          # Karta jedné hry
│   │   └── NewGameDialog.jsx     # Dialog pro vytvoření nové hry
│   ├── editor/
│   │   ├── GameEditorView.jsx    # Hlavní layout editačního režimu
│   │   ├── EditorToolbar.jsx     # Toolbar — uložit, přepnout do Live, nastavení
│   │   ├── canvas/
│   │   │   ├── MapCanvas.jsx     # Konva Stage — mapa + stanoviště (drag & drop)
│   │   │   ├── StationNode.jsx   # Jednotlivé stanoviště na plátně (draggable)
│   │   │   └── ConnectionLine.jsx# Spojnice mezi stanovišti (trasa)
│   │   ├── PropertiesPanel.jsx   # Pravý panel — konfigurace vybraného stanoviště
│   │   └── TeamsPanel.jsx        # Spodní panel — DataGrid pro správu družin
│   ├── live/
│   │   ├── LiveModeView.jsx      # Hlavní layout live režimu (fullscreen mapa)
│   │   ├── LiveCanvas.jsx        # Konva Stage — mapa (bez drag & drop)
│   │   ├── hud/
│   │   │   ├── TimerHUD.jsx      # Plovoucí časomíra
│   │   │   ├── LeaderboardHUD.jsx# Plovoucí žebříček (DataGrid)
│   │   │   └── ChartHUD.jsx      # Plovoucí graf (recharts)
│   │   └── ScoreDialog.jsx       # Dialog pro zápis bodů po kliknutí na stanoviště
│   └── common/
│       └── ConfirmDialog.jsx     # Znovupoužitelný potvrzovací dialog
├── context/
│   └── GameContext.jsx           # React Context pro stav celé hry (data binding)
├── hooks/
│   ├── useLocalStorage.js        # Hook pro persistenci do localStorage
│   └── useTimer.js               # Hook pro časomíru (start/stop/reset)
├── utils/
│   └── validation.js             # Validace formulářů (jméno, body, atd.)
└── theme.js                      # MUI theme customizace
```

---

## Datový model (JSON)

```json
{
  "games": [
    {
      "id": "uuid-1",
      "name": "Velká etapová hra 2026",
      "description": "Jarní hra pro oddíl Pathfinder",
      "createdAt": "2026-02-17T10:00:00Z",
      "mapImage": "data:image/png;base64,... nebo relativní cesta",
      "stations": [
        {
          "id": "st-1",
          "name": "Křižovatka šifru",
          "description": "Družina musí rozluštit šifru a najít další indícii.",
          "x": 320,
          "y": 180,
          "color": "#FF5722",
          "icon": "flag",
          "maxPoints": 100,
          "order": 1
        }
      ],
      "connections": [
        { "from": "st-1", "to": "st-2" }
      ],
      "teams": [
        {
          "id": "tm-1",
          "name": "Lišky",
          "color": "#4CAF50",
          "members": ["Jan Novák", "Petr Svoboda", "Anna Králová"]
        }
      ],
      "scores": [
        {
          "id": "sc-1",
          "teamId": "tm-1",
          "stationId": "st-1",
          "points": 85,
          "timestamp": "2026-02-17T14:23:00Z",
          "note": "Splnili na výbornou"
        }
      ],
      "liveState": {
        "isRunning": false,
        "startTime": null,
        "elapsedSeconds": 0
      }
    }
  ]
}
```

---

## Navigace / Režimy aplikace

```
[Home — Seznam her]
    │
    ├── Klik na hru → [Editor — Editační režim]
    │                     │
    │                     └── Tlačítko "Spustit Live" → [Live režim]
    │                                                       │
    │                                                       └── Tlačítko "Zpět do editoru"
    └── Tlačítko "+" → [Dialog nové hry] → [Editor]
```

---

## Klíčová UI/UX rozhodnutí

1. **Dva režimy (Edit vs. Live)** se přepínají tlačítkem v toolbaru, ne routováním.
2. **Canvas (Konva)** zabírá většinu prostoru; v Editoru je vedle něj pravý panel (resizable).
3. **Live HUD panely** jsou `position: absolute` nad Canvas, s `backdrop-filter: blur()` a poloprůhledným pozadím.
4. **Data binding:** Všechna data tečou přes React Context → změna scores okamžitě přepočítá leaderboard i graf.
5. **Validace:** Všechny formuláře (nová hra, stanoviště, družiny, zápis bodů) mají inline validaci s chybovými hláškami.
6. **AppBar** vždy obsahuje jméno autora a tlačítko "O aplikaci" (dialog).
7. **Responzivita:** Layout přes CSS flexbox/grid, panely se přizpůsobí velikosti okna.

---

## To-Do list

### Fáze 0 — Setup ✅
- [x] Inicializovat Vite + React projekt
- [x] Nainstalovat MUI, Electron
- [ ] Doinstalovat zbývající balíčky (konva, recharts, data-grid, icons)
- [ ] Nastavit Electron (main process, preload)
- [ ] Nastavit MUI theme + globální styly

### Fáze 1 — Kostra aplikace
- [ ] AppHeader + AboutDialog
- [ ] React Context (GameContext) + useLocalStorage hook
- [ ] Navigace mezi Home / Editor / Live (stav, ne router)

### Fáze 2 — Home (Seznam her)
- [ ] GameListView s kartami
- [ ] NewGameDialog s validací
- [ ] Možnost smazat hru

### Fáze 3 — Editor (Editační režim)
- [ ] Layout: Canvas vlevo + PropertiesPanel vpravo + TeamsPanel dole
- [ ] MapCanvas — nahrání obrázku mapy, zoom, pan
- [ ] StationNode — drag & drop, vizuální ikony
- [ ] ConnectionLine — spojnice mezi stanovišti
- [ ] PropertiesPanel — formulář pro editaci vybraného stanoviště
- [ ] TeamsPanel — DataGrid pro CRUD družin

### Fáze 4 — Live režim
- [ ] LiveCanvas (view-only, klikatelná stanoviště)
- [ ] TimerHUD — plovoucí časomíra (start/stop/reset)
- [ ] ScoreDialog — zápis bodů po kliknutí na stanoviště
- [ ] LeaderboardHUD — živý žebříček (DataGrid)
- [ ] ChartHUD — živý graf (recharts)

### Fáze 5 — Polish
- [ ] Validace všech formulářů
- [ ] Responzivní layout
- [ ] Electron packaging (build)
- [ ] Testování a opravy
