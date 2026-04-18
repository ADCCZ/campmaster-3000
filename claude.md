# CampMaster 3000 — KIV/UUR Semestrální práce

## Tech Stack (skutečný)
- **Build:** Vite + React 19
- **Styling:** Tailwind CSS + vlastní CSS custom properties (index.css)
- **Mapy:** react-leaflet (Leaflet.js)
- **Ikony:** lucide-react
- **Persistence:** localStorage přes vlastní `useLocalStorage` hook
- **I18n:** vlastní context (cs/en)
- **Server (mock):** Express server v `server/` — pouze pro ukázkový seed

---

## Struktura adresářů

```
src/
├── main.jsx                     # React entry point
├── App.jsx                      # Kořenový komponent — navigace Home/Editor/Live
├── index.css                    # Tailwind + CSS custom properties + media queries
├── components/
│   ├── layout/
│   │   └── AppHeader.jsx        # Horní lišta — logo, přepínač Edit/Live, selektory, role, jazyk, téma
│   ├── home/
│   │   └── GameListView.jsx     # Domovská obrazovka — seznam karet akcí
│   ├── editor/
│   │   ├── EditorView.jsx       # Hlavní layout editoru — tree + mapa + properties + spodní nav
│   │   ├── GameTree.jsx         # Levý panel — stromová struktura Dny → Etapy → Stanoviště
│   │   ├── MapView.jsx          # Střed — Leaflet mapa + přidávání/přesouvání stanovišť
│   │   ├── PropertiesPanel.jsx  # Pravý panel — editace vybraného stanoviště
│   │   ├── TeamsView.jsx        # Tab Týmy — CRUD tabulka týmů
│   │   └── StatsView.jsx        # Tab Statistiky — přehled skóre
│   ├── live/
│   │   └── LiveView.jsx         # Live režim — záložky Stanoviště + Přehled + časomíra
│   ├── dialogs/
│   │   └── NewGameWizard.jsx    # 3-krokový průvodce vytvořením nové akce
│   └── common/
│       ├── ConfirmDialog.jsx    # Potvrzovací dialog (smazání)
│       ├── CustomSelect.jsx     # Stylovaný select s portálem (position:fixed dropdown)
│       ├── EditableLabel.jsx    # Inline editovatelný text (dvojklik)
│       ├── ModalShell.jsx       # Wrapper pro modální okna
│       └── CharCounter.jsx      # Počítadlo znaků pro inputy
├── context/
│   ├── GameContext.jsx          # Hlavní stav aplikace — události, piny, týmy, skóre, live
│   ├── I18nContext.jsx          # Překlady cs/en
│   └── ThemeContext.jsx         # Světlé/tmavé téma
├── hooks/
│   ├── useLocalStorage.js       # Persistence do localStorage
│   └── useTimer.js              # Časomíra (start/pause/reset)
├── i18n/
│   ├── cs.js                    # České překlady
│   └── en.js                    # Anglické překlady
├── utils/
│   └── validation.js            # Validátory + computeEventStatus()
└── data/
    └── defaultData.js           # Seed data + getVedouciList()
```

---

## Datový model (skutečný)

```json
{
  "events": {
    "game-id": {
      "id": "game-id",
      "name": "Velká hra",
      "icon": "⛺",
      "dates": "17.04.2026 – 19.04.2026",
      "dateStart": "2026-04-17",
      "dateEnd": "2026-04-19",
      "status": "upcoming",
      "location": "Lomnice nad Lužnicí",
      "type": "Víkendovka",
      "mapCenter": [49.07, 14.71],
      "createdAt": "2026-04-17T10:00:00Z",
      "pins": [
        {
          "id": 0,
          "label": "ČOL",
          "name": "Stanoviště Čolek",
          "day": 0, "stage": 0, "order": 0,
          "lat": 49.07, "lng": 14.71,
          "vedouci": "", "description": "", "maxPoints": 100
        }
      ],
      "tree": [
        {
          "label": "Den 1 – Příjezd",
          "stages": [
            { "label": "Etapa: Lesní hlídka", "pinLabels": ["ČOL"] }
          ]
        }
      ],
      "teams": [
        {
          "id": "t0", "name": "Tým 1", "color": "#ef4444",
          "members": 8, "score": 0, "max": 0,
          "vedouci": "", "category": "", "status": "active", "note": ""
        }
      ],
      "stationScores": { "<pinId>": { "<teamId>": 0 } },
      "stationStatuses": { "<pinId>": "upcoming" },
      "teamStationStatuses": { "<pinId>": { "<teamId>": "upcoming" } },
      "stats": { "completed": 0, "notCompleted": 0, "skipped": 0, "totalPins": 0, "donePins": 0, "totalScore": 0, "avgScore": 0 },
      "liveState": { "isRunning": false, "startTime": null, "elapsedSeconds": 0 },
      "actionLog": []
    }
  }
}
```

---

## Navigace / Režimy

```
[Home — Seznam akcí]
    │
    ├── + Nová akce → [NewGameWizard — 3 kroky]
    │                     Krok 1: název, datum, lokace (geocoding), typ
    │                     Krok 2: počet týmů, max hráčů, ruční přidání týmů
    │                     Krok 3: shrnutí → Vytvořit
    │
    └── Klik na akci → [EditorView]
                           │
                           ├── Tab: Mapa (GameTree + MapView + PropertiesPanel)
                           ├── Tab: Týmy (TeamsView)
                           ├── Tab: Statistiky (StatsView)
                           │
                           └── Tlačítko Live → [LiveView]
                                                  ├── Tab: Stanoviště (moje stanoviště + skórování)
                                                  └── Tab: Přehled (žebříček + stav stanovišť)
```

---

## Klíčová UI/UX rozhodnutí

1. **Navigace stavem** (ne routerem) — `App.jsx` drží `{ view, eventId }`.
2. **GameContext** je jediný zdroj pravdy — vše persistuje do localStorage.
3. **Status akce** se počítá dynamicky z `dateStart/dateEnd` vs. dnešního data (`computeEventStatus`).
4. **Editor — 3 panely:** GameTree (vlevo, resizable) | MapView (střed) | PropertiesPanel (vpravo, resizable). Na mobilu jsou panely přes celou šířku a skrývají se.
5. **Přidání stanoviště:** kliknout na „+" u etapy v GameTree → pak kliknout do mapy. Na mobilu se panely automaticky skryjí.
6. **Pin label** (zkratka) se automaticky odvozuje z názvu stanoviště (první 3 znaky za „Stanoviště "). Je editovatelný (max 3 znaky). Změna label synchronizuje i tree.pinLabels.
7. **Live — Stanoviště tab:** skórování per tým (+1/−1/+10/−10), odečet omezen na body získané na daném stanovišti. Per-tým stav (Bude / Splněno / Neobjevil se).
8. **Live — Přehled tab:** žebříček + panel stavu stanovišť s per-tým indikátory.
9. **CustomSelect** dropdown renderován přes `createPortal` s `position:fixed` — neoříznout `overflow:hidden` ani `overflow:auto` rodiče. Zavírá se při scrollu mimo dropdown.
10. **Responzivita:** breakpointy 299/350/440/650px přes CSS media queries (ne Tailwind sm/md).
11. **AppHeader** adaptivní — na mobilu víceřádkový layout, logo se zkracuje, tlačítka se skládají.

---

## Stavy stanovišť

### Stav stanoviště (station-level, v Přehledu)
| Hodnota | Label | Výchozí |
|---------|-------|---------|
| `upcoming` | Bude | ✓ výchozí |
| `active` | Probíhá | |
| `done` | ✓ Splněno | |
| `skipped` | Přeskočeno | |

### Stav týmu na stanovišti (team-level, v Stanoviště tabu)
| Hodnota | Label |
|---------|-------|
| `upcoming` | Bude |
| `done` | ✓ Splněno |
| `skipped` | Neobjevil se |

---

## Důležité soubory a jejich role

| Soubor | Co dělá |
|--------|---------|
| `src/context/GameContext.jsx` | Všechny akce: addPin, updatePin, updateTree, adjustScore, updateStationStatus, updateTeamStationStatus, … |
| `src/utils/validation.js` | `computeEventStatus(event)` — upcoming/active/completed podle datumu |
| `src/index.css` | CSS proměnné (světlé/tmavé), cm-* utility třídy, media query breakpointy |
| `src/i18n/cs.js` | Všechny české řetězce |
| `tailwind.config.js` | Tailwind konfigurace (content paths) |
| `server/data.json` | Seed data pro ukázkové akce |
