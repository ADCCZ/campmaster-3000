# CampMaster 3000 — 1. prezentace
## Obsah slidů + mluvený komentář

---

## SLIDE 1 — Titulek

### Text na slidu
| Element | Text |
|---|---|
| Nadpis (velký) | **CampMaster 3000** |
| Podnadpis | Správce táborových etapových her |
| Řádek 1 | Oldřich Jan Švehla · A23B0234P |
| Řádek 2 | KIV/UUR · Semestrální projekt · 2025/2026 |

**Pozadí:** tmavé (#1f2937), bílý a šedý text

### Co říct
> „Dobrý den, jmenuji se Oldřich Jan Švehla a dnes vám představím CampMaster 3000 —
> aplikaci pro správu nejen táborových etapových her.
> Ukáži vám, jaký problém řeší, pro koho je určená a jak vypadá její rozhraní ve wireframu."

---

## SLIDE 2 — Problém

### Text na slidu

**Nadpis:** Proč tato aplikace existuje?

**Levý box** — `Současný stav`
- Papírové archy s výsledky
- Skupinový chat: „tým A má 50 bodů"
- Ruční přepisování → chyby, zpoždění
- Výsledky vidí jen organizátor

**Pravý box** — `CampMaster 3000`
- Živý žebříček — vidí všichni
- Zápis bodů kliknutím
- Okamžitá aktualizace
- Log každého zápisu

### Co říct
> „Etapové hry se dnes většinou řídí přes papírové archy a skupinové chaty —
> výsledky se ručně přepisují, chyby se těžko dohledávají a přehled má jen organizátor.
>
> CampMaster tohle řeší: živý žebříček vidí každý, vedoucí zapíše body jedním kliknutím
> a výsledky se promítnou okamžitě. Žádné papíry, žádné přepisování."

---

## SLIDE 3 — Uživatelé a scénář

### Text na slidu

**Nadpis:** Kdo aplikaci používá a jak?

**Levý box**
Nadpis: `👤 Organizátor`
- Připravuje hru předem v Editoru
- Umísťuje stanoviště na mapu, nastaví trasy
- Přidělí vedoucí a nastaví maximální body
- Sleduje celkový přehled a pořadí v Live módu

**Pravý box**
Nadpis: `🧑‍🏫 Vedoucí stanoviště`
- Přijde na místo s tabletem nebo telefonem
- Vidí pouze svá přiřazená stanoviště
- Zapisuje body týmům (+10, +5, -5, -10)
- Vidí živé skóre a pořadí všech týmů

**Časová osa dole** *(5 kroků)*

```
1. Příprava  →  2. Zahájení  →  3. Průběh  →  4. Cíl  →  5. Výsledky
Org. nastaví    Stiskne Start,   Vedoucí        Týmy         Živé pořadí
hru v Editoru   timer běží       zapisují body  dokončují    ukáže vítěze
```

### Co říct
> „Aplikace má dva typy uživatelů s různými potřebami.
>
> Organizátor je vedoucí celé akce — před hrou připraví stanoviště na mapě,
> přiřadí k nim vedoucí a nastaví bodové ohodnocení a může dělat vše co vedoucí.
>
> Vedoucí stanoviště pak přijde na místo s telefonem nebo tabletem.
> Vidí pouze svá stanoviště — žádný chaos s cizími daty —
> a body zapisuje čtyřmi tlačítky: plus deset, plus pět, mínus pět, mínus deset.
>
> Celý průběh hry vypadá takto: organizátor připraví hru, spustí timer,
> vedoucí průběžně zapisují body a živé pořadí se aktualizuje okamžitě.
> Na konci není potřeba nic sčítat — výsledky jsou tam ihned."

---

## SLIDE 4 — Jak uživatel prochází aplikací

### Text na slidu

**Nadpis:** Jak uživatel aplikací prochází?

**Hlavní diagram — tok kroků shora dolů nebo zleva doprava:**

```
┌─────────────────────────────────────────────────────────────────┐
│  ORGANIZÁTOR — před hrou                                        │
│                                                                 │
│  [+ Nová hra]  →  Editor: Mapa       →  Editor: Týmy           │
│  Vytvořit akci    Umístit stanoviště    Přidat týmy             │
│                   Přiřadit vedoucí      Nastavit barvy          │
│                   Nastavit trasy        a kategorie             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    [ Spustit Live ▶ ]
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  ORGANIZÁTOR + VEDOUCÍ — během hry                              │
│                                                                 │
│  Live: Stanoviště         →        Live: Přehled                │
│  Vybrat stanoviště             Živé pořadí týmů                 │
│  Zapsat body (+10/-5…)         Action log změn                  │
│  Změnit stav (splněno…)        Sledovat timer                   │
└─────────────────────────────────────────────────────────────────┘
```

**Popisky propojení mezi panely v Editoru** *(malý text pod diagramem)*
- Klik na pin ve stromě → označí pin na mapě → zobrazí jeho vlastnosti vpravo
- Klik na pin na mapě → označí ho ve stromě → zobrazí vlastnosti vpravo
- Změna skóre v Live → okamžitě se přepočítá žebříček v Přehledu

### Co říct
> „Ukážu jak aplikací prochází organizátor krok po kroku.
>
> Začne tlačítkem Nová hra (zde vyplni potřebné udaje k akci), pak přejde do Editoru — na mapě umístí stanoviště,
> přiřadí jednoho vedoucího, který za stanoviště zodpovídá, nastaví body. V záložce Týmy přidá soutěžní týmy s barvami.
>
> Příprava hotová — stiskne Live hru spuštěním časovače.
>
> Vedoucí stanovišť otevřou Live mód na svých zařízeních,
> každý vidí jen svá stanoviště a zapisuje body.
> Organizátor sleduje přehled — živé pořadí a log zápisů.
>
> Všechny části spolu komunikují — co vedoucí zapíše,
> okamžitě se promítne do pořadí které vidí organizátor."

---

## SLIDE 5 — GUI: Editor (Mapa)

### Text na slidu

**Nadpis:** Editor — příprava hry

**Obrázek — celý slide je screenshot:**
> Spusť `npm run dev`, vyber Letní tábor, záložka **Mapa**.
> Klikni na jeden pin — otevře se PropertiesPanel vpravo.
> Na mapě musí být vidět alespoň 3 piny spojené přerušovanou trasou.
> Screenshotni celé okno a dej ho na celý slide (bez okrajů).

**Popisky šipkami přímo přes screenshot** *(přidat v prezentačním nástroji)*:
- vlevo na strom: *Den / Etapa / Stanoviště*
- na pin na mapě: *Kliknutím do mapy přidáš stanoviště — přetažením změníš polohu*
- na přerušovanou čáru: *Trasa etapy*
- na pravý panel: *Název, vedoucí, max. bodů*

### Co říct
> „Tohle je Editor — tady organizátor připraví celou hru ještě před jejím zahájením.
>
> Vlevo strom — hra je rozdělená do dnů a etap, každá etapa má svá stanoviště.
> Uprostřed mapa — kliknutím sem přidám nové stanoviště, přetažením ho přesunu.
> Trasy mezi stanovišti v dané etapě se kreslí automaticky.
>
> Kliknu na pin — vpravo se otevřou jeho vlastnosti.
> Nastavím název, přiřadím vedoucího a určím kolik bodů se za něj dá získat."

---

## SLIDE 6 — GUI: Správa týmů

### Text na slidu

**Nadpis:** Správa týmů

**Obrázek — celý slide je screenshot:**
> Záložka **Týmy** — alespoň 4 týmy, různé barvy, různé skóre, jeden tým ve stavu Diskvalifikován.
> Screenshotni celé okno a dej na celý slide.

**Popisky šipkami přímo přes screenshot:**
- na barevný čtverec: *Barva týmu — kliknutím změníš*
- na progress bar: *Skóre vizuálně*
- na status badge červený: *Diskvalifikován — stav měnitelný přímo v tabulce*
- na vyhledávací lištu: *Filtrování*

### Co říct
> „Záložka Týmy — tady organizátor spravuje všechny soutěžní týmy.
>
> Každý tým má barvu, vedoucího a aktuální skóre — progress bar ukazuje na první pohled kdo vede.
> Stav týmu se mění přímo v tabulce, žádný formulář navíc.
> Pokud vedoucí udělá chybu v zápisu, organizátor skóre ručně opraví tady."

---

## SLIDE 7 — GUI: Live mód ⭐ (nejzajímavější část)

### Text na slidu

**Nadpis:** Live mód — průběh hry v reálném čase

**Obrázek — celý slide je screenshot:**
> Live mód, záložka **Stanoviště** — klikni na stanoviště B v seznamu vlevo.
> Musí být vidět: timer s běžícím časem, karty týmů s velkým skóre, tlačítka +10/-5, log vpravo.
> Screenshotni celé okno a dej na celý slide.

**Popisky šipkami přímo přes screenshot:**
- na timer: *Čas od zahájení hry*
- na velké číslo: *Skóre viditelné na první pohled*
- na tlačítka +10 / -5: *Zápis bodů — jedno kliknutí*
- na log: *Co, kdy a kdo zapsal*

> **Volitelně: udělej dva screenshoty vedle sebe** — záložka Stanoviště (pohled vedoucího) a záložka Přehled (pohled organizátora). Ukazuje jak stejná data vypadají pro různé role.

### Co říct
> „Tohle je srdce aplikace — Live mód.
>
> Tady pracuje vedoucí stanoviště: vidí seznam svých stanovišť vlevo,
> vybere aktivní a zapíše body — čtyři tlačítka na jedno kliknutí.
> Velké číslo skóre je záměrné — v terénu nemáš čas číst tabulku.
>
> Vpravo log — každý zápis s časem. Chyba se pozná a opraví okamžitě.
>
> Organizátor přepne na záložku Přehled — vidí živý žebříček všech týmů.
> Každé kliknutí vedoucího se tam projeví okamžitě, bez obnovení stránky."

---

## SLIDE 8 — Datový model + Závěr

### Text na slidu

**Nadpis:** Datový model a závěr

**Diagram — 4 boxy se šipkami** *(nakresli v prezentačním nástroji, žádný screenshot)*

```
        AKCE
  název, datum, lokace
         │
         ├──────────────────────┐
         ▼                      ▼
    STANOVIŠTĚ                 TÝM
  název, den, etapa        název, barva
  GPS, vedoucí             vedoucí, skóre
  max. bodů                    │
                               ▼
                           LOG AKCE
                        čas, změna bodů
                        kdo, na jakém stan.
```

**Banner dole** *(tmavé pozadí)*
Děkuji za pozornost. Dotazy? · Oldřich Jan Švehla · A23B0234P · KIV/UUR 2025/2026

### Co říct
> „Na závěr se podívejme na data, se kterými aplikace pracuje.
>
> Základem je Akce — má název, datum, lokaci a stav hry.
> Každá akce obsahuje Stanoviště rozdělená do dnů a etap, každé má GPS souřadnice,
> přiřazeného vedoucího a maximální počet bodů.
> Pak jsou Týmy — se skóre, barvou a kategorií.
> A konečně Log akcí — každý zápis bodů se zaznamenává s časem, týmem a změnou.
>
> Díky tomu aplikace vždy ví co se kdy stalo a kdo to zapsal.
>
> To je vše, děkuji za pozornost a rád zodpovím případné dotazy."

---

## Časování (celkem ~7 minut)

| Slide | Čas |
|---|---|
| 1 — Titulek | 20 s |
| 2 — Problém | 60 s |
| 3 — Uživatelé | 75 s |
| 4 — Workflow | 60 s |
| 5 — Editor | 60 s |
| 6 — Týmy | 45 s |
| 7 — Live mód | 60 s |
| 8 — Data + Závěr | 60 s |
| **Celkem** | **~7 min** |
