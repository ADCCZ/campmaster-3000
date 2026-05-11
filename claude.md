# CampMaster 3000 — KIV/UUR Semestrální práce

## Zadání

Systém pro **správu táborových her** v reálném čase. Organizátor vytváří akce (víkendovky, tábory), definuje stanoviště na interaktivní mapě (Leaflet.js / OpenStreetMap), spravuje týmy v tabulce a konfiguruje stanoviště. V Live módu sleduje živé pořadí, označuje stav stanovišť a zapisuje body do action logu. Aplikace má dvě hlavní okna: **Edit mód** — stromová struktura hry a mapa; **Live mód** — skórování per tým, přehled s žebříčkem.

---

## Tech Stack

- **Build:** Vite + React 19
- **Styling:** Tailwind CSS + vlastní CSS custom properties (`index.css`)
- **Mapy:** Leaflet.js (přímé API, ne react-leaflet)
- **Grafy:** recharts (BarChart + PieChart/donut v StatsView)
- **Ikony:** lucide-react
- **I18n:** vlastní context (`src/context/I18nContext.jsx`) — cs/en, 200+ klíčů
- **Persistence:** localStorage (`saveLocal` v GameContext) + Socket.io server sync
- **Real-time:** Socket.io (`socket.io-client`) → Express server (`server/index.js`, port 3001)

---

## Struktura adresářů

```
src/
├── main.jsx
├── App.jsx                      # Navigace stavem: home | editor | live
├── index.css                    # CSS custom properties + cm-* utility třídy + media queries
├── components/
│   ├── layout/
│   │   ├── AppHeader.jsx        # Horní lišta — logo, Edit/Live přepínač, den/etapa filtr, role, jazyk, téma
│   │   └── AboutDialog.jsx
│   ├── home/
│   │   └── GameListView.jsx     # Seznam karet akcí (status badge, počty)
│   ├── editor/
│   │   ├── EditorView.jsx       # Layout: GameTree + MapView + PropertiesPanel (resizable panely)
│   │   ├── GameTree.jsx         # Strom Dny → Etapy → Stanoviště; inline editace labelů; přidávání/mazání
│   │   ├── MapView.jsx          # Leaflet mapa; pin drag; polyline routes; ResizeObserver→invalidateSize
│   │   ├── PropertiesPanel.jsx  # Editace stanoviště; auto-label z názvu (3 znaky); sync s tree.pinLabels
│   │   ├── TeamsView.jsx        # CRUD tabulka týmů; ScoreCell+progress bar; ColorCell; StatusBadge
│   │   └── StatsView.jsx        # Stat karty + BarChart (recharts) + PieChart donut; tabulka pořadí
│   ├── live/
│   │   └── LiveView.jsx         # Tab Stanoviště (skórování +1/−1/+10/−10, per-tým stav); Tab Přehled; časomíra
│   ├── dialogs/
│   │   └── NewGameWizard.jsx    # 3-krokový wizard (základy → týmy → shrnutí); geocoding lokace
│   └── common/
│       ├── ConfirmDialog.jsx
│       ├── CustomSelect.jsx     # createPortal + position:fixed dropdown; scroll-close mimo dropdown
│       ├── EditableLabel.jsx    # Dvojklik pro inline editaci
│       ├── ModalShell.jsx
│       └── CharCounter.jsx
├── context/
│   ├── GameContext.jsx          # Jediný zdroj pravdy; Socket.io sync; localStorage persistence
│   ├── I18nContext.jsx
│   └── ThemeContext.jsx
├── hooks/
│   ├── useLocalStorage.js
│   └── useTimer.js              # Časomíra start/pause/reset
├── i18n/
│   ├── cs.js                    # ~200 českých klíčů
│   └── en.js                    # ~200 anglických klíčů
├── utils/
│   └── validation.js            # Validátory + computeEventStatus() + tError()
└── data/
    └── defaultData.js           # Seed data (3 akce) + buildRoutes() + getVedouciList()

server/
├── index.js                     # Express + Socket.io; state:init / state:push / state:update
└── data.json                    # Persistovaný stav na serveru
```

---

## Datový model

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
        { "id": 0, "label": "ČOL", "name": "Stanoviště Čolek",
          "day": 0, "stage": 0, "order": 0, "lat": 49.07, "lng": 14.71,
          "vedouci": "", "description": "", "maxPoints": 100 }
      ],
      "tree": [
        { "label": "Den 1 – Příjezd",
          "stages": [{ "label": "Etapa: Lesní hlídka", "pinLabels": ["ČOL"] }] }
      ],
      "teams": [
        { "id": "t0", "name": "Tým 1", "color": "#ef4444",
          "members": 8, "score": 0, "max": 0,
          "vedouci": "", "category": "", "status": "active", "note": "" }
      ],
      "stationScores": { "<pinId>": { "<teamId>": 0 } },
      "stationStatuses": { "<pinId>": "upcoming" },
      "teamStationStatuses": { "<pinId>": { "<teamId>": "upcoming" } },
      "liveState": { "isRunning": false, "startTime": null, "elapsedSeconds": 0 },
      "actionLog": []
    }
  }
}
```

`computeEventStatus(event)` v `validation.js` odvozuje stav dynamicky z `dateStart/dateEnd` vs. dnešního data — nepersistuje ho.

---

## Navigace / Režimy

```
[Home — Seznam akcí]
    ├── + Nová akce → [NewGameWizard 3 kroky: základy → týmy → shrnutí]
    └── Klik na akci → [EditorView]
                           ├── Tab Mapa:        GameTree | MapView | PropertiesPanel
                           ├── Tab Týmy:        TeamsView (CRUD tabulka)
                           ├── Tab Statistiky:  StatsView (grafy + pořadí)
                           └── Tlačítko Live → [LiveView]
                                                  ├── Tab Stanoviště: skórování per tým
                                                  └── Tab Přehled:    žebříček + stav stanovišť
```

---

## Klíčová UI/UX rozhodnutí

1. **Navigace stavem** — `App.jsx` drží `{ view, eventId }`, žádný router.
2. **GameContext** je jediný zdroj pravdy; každá změna auto-persistuje do localStorage + emituje `state:push` přes Socket.io.
3. **Editor — 3 resizable panely:** GameTree (vlevo) | MapView (střed) | PropertiesPanel (vpravo). Na mobilu panely přes celou šířku, skrývají se.
4. **Pin label** se auto-odvozuje z názvu (první 3 znaky za „Stanoviště "), max 3 znaky, editovatelný. Změna synchronizuje `tree[d].stages[s].pinLabels`.
5. **Live skórování:** +1/−1/+10/−10 per tým na stanoviště; odečet omezen na body získané na daném stanovišti (nelze jít do minusu).
6. **CustomSelect** → `createPortal` + `position:fixed`; scroll listener zavírá dropdown, ale ignoruje scroll uvnitř dropdownu (`dropRef.current?.contains(e.target)`).
7. **Responzivita:** breakpointy 299/350/440/650px přes CSS media queries v `index.css`.
8. **ResizeObserver** v MapView volá `map.invalidateSize()` při změně rozměrů panelu.
9. **Socket.io:** `state:init` při připojení, `state:push` při každé změně, `state:update` broadcast ostatním klientům. `suppressSync` ref brání echo-loop.

---

## Stavy stanovišť

| Úroveň | Hodnota | Label |
|--------|---------|-------|
| Stanoviště (station-level) | `upcoming` | Bude *(výchozí)* |
| | `active` | Probíhá |
| | `done` | ✓ Splněno |
| | `skipped` | Přeskočeno |
| Tým na stanovišti (team-level) | `upcoming` | Bude |
| | `done` | ✓ Splněno |
| | `skipped` | Neobjevil se |

---

## Hodnocení — rubrika a odhad bodů

| Kategorie | Max | Odhad | Kde v kódu |
|-----------|:---:|:-----:|------------|
| Prezentace (2×) | 5+5 | 4+4 | — |
| Smysluplnost zadání | 5 | 5 | — |
| Komplexnost aplikace | 5 | 4–5 | Wizard + Editor (3 panely) + Live mód |
| Kvalita designu | 5 | 4 | GameContext jako jediný zdroj pravdy, modulární komponenty |
| Fungování aplikace | 5 | 4 | localStorage + Socket.io server, plně funkční |
| Komplexní GUI (2 okna) | 5 | 4 | Edit mód ↔ Live mód; Socket.io sync |
| User experience | 10 | 7–8 | Validace, geocoding, responzivita, intuitivní flow |
| Kontrola vstupů | 5 | 4 | `validation.js`, CharCounter, omezení odečtu bodů |
| Reakce na testy | 5 | 3–4 | Závisí na zpětné vazbě testerů |
| Čitelnost dokumentace | 5 | 4 | CLAUDE.md, NAVOD_TESTER.md |
| Lambda výrazy | 1 | 1 | Callbacky všude (arrow fce jako event handlery) |
| Vlastní buňky v tabulkách | 1–4 | 3–4 | `ScoreCell` (progress bar), `ColorCell`, `StatusBadge` v TeamsView |
| Grafy | 2–3 | 3 | `BarChart` + `PieChart` (donut) v StatsView přes recharts |
| Využití tabulky | 1–4 | 4 | TeamsView — vlastní buňky, přijímá vstupy (inline edit skóre, color picker) |
| Využití stromu | 1–4 | 3–4 | GameTree — inline editace labelů, přidávání/mazání uzlů |
| Responzivita | 3 | 3 | Breakpointy 299/350/440/650px, mobilní layout |
| Třetí strany | 1–4 | 3–4 | Leaflet (drag, polylines, custom SVG piny), recharts |
| Vícejazyčnost | 1–4 | 3–4 | cs/en, 200+ klíčů, `I18nContext` |
| Síťová komunikace | 2 | 2 | Socket.io real-time + REST `/api/state` |
| Ukládání stavu | 1–5 | 4 | localStorage + server-side `data.json` |
| Využití CSS | 2 | 2 | CSS custom properties, `cm-*` utility třídy v `index.css` |
| Observable-Observer | 2 | 2 | ResizeObserver (MapView), Socket.io events (GameContext) |
| Binding | 1–3 | 2–3 | Controlled inputs s validací, CustomSelect |
| Spolupráce více zařízení | 1–5 | 4 | Socket.io LAN sync, Vercel deployment |
| Vlastní vykreslovaná komponenta | 1–5 | 3–4 | SVG pin ikony (`makePinIcon`), polyline routes na mapě |

**Odhad celkem: ~55–62 bodů z 60 přenositelných**

---

## Důležité soubory

| Soubor | Co dělá |
|--------|---------|
| `src/context/GameContext.jsx` | addPin, updatePin, updateTree, adjustScore, updateStationStatus, updateTeamStationStatus, Socket.io |
| `src/utils/validation.js` | `computeEventStatus()` — stav akce z dateStart/dateEnd |
| `src/index.css` | CSS proměnné světlé/tmavé, `cm-*` třídy, media query breakpointy |
| `src/components/editor/StatsView.jsx` | recharts BarChart + PieChart, stat karty, tabulka pořadí |
| `src/components/editor/TeamsView.jsx` | ScoreCell, ColorCell, StatusBadge, TeamDialog |
| `src/components/live/LiveView.jsx` | PinRow skórování, per-tým stav, přehled s žebříčkem |
| `server/index.js` | Express + Socket.io; state:init / state:push / state:update |
