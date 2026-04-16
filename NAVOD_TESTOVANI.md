# Kompletní testovací plán — CampMaster 3000

Tento dokument slouží pro vlastní testování aplikace před odevzdáním.
Spusť `npm run dev:all` a projdi všechny sekce.

---

## 1. Úvodní obrazovka (HomeView)

| # | Test | Očekávaný výsledek | OK? |
|---|------|--------------------|-----|
| 1.1 | Otevři aplikaci | Zobrazí se seznam 3 ukázkových her s kartami | |
| 1.2 | Klikni na kartu hry | Přejde do editoru pro danou hru | |
| 1.3 | Klikni **← Zpět** | Vrátí se na seznam her | |
| 1.4 | Klikni **+ Nová akce** | Otevře se průvodce vytvořením hry | |
| 1.5 | Vyplň jen název a potvrď | Hra se vytvoří a otevře v editoru | |
| 1.6 | Zkus potvrdit bez vyplnění názvu | Zobrazí se chybová hláška (validace) | |
| 1.7 | Smaž hru ikonou koše | Hra zmizí ze seznamu, potvrzovací dialog | |
| 1.8 | Zavři prohlížeč, znovu otevři | Seznam her přetrvá (localStorage) | |

---

## 2. Editor — Mapa

| # | Test | Očekávaný výsledek | OK? |
|---|------|--------------------|-----|
| 2.1 | Klikni do mapy | Přidá se nové stanoviště, zobrazí v pravém panelu | |
| 2.2 | Přetáhni stanoviště | Změní pozici, souřadnice se aktualizují v panelu | |
| 2.3 | Klikni na stanoviště | Vybrání — panel vpravo zobrazí jeho detail | |
| 2.4 | Změň název v pravém panelu | Název se aktualizuje na mapě i v listu | |
| 2.5 | Nastav maximální body na 0 nebo záporně | Validace zamítne (min. 1) | |
| 2.6 | Smaž stanoviště | Zmizí z mapy i ze stromu | |
| 2.7 | Zoom a pan mapy | Plynulé, stanoviště zůstávají na místě | |
| 2.8 | Nastav vedoucího stanoviště | Vedoucí se ukáže v rozbalovacím menu role | |

---

## 3. Editor — Týmy

| # | Test | Očekávaný výsledek | OK? |
|---|------|--------------------|-----|
| 3.1 | Klikni **+ Přidat tým** | Přidá se nový řádek v tabulce | |
| 3.2 | Klikni do buňky Název | Lze editovat přímo v tabulce | |
| 3.3 | Nastav barvu týmu | Barevný indikátor se okamžitě změní | |
| 3.4 | Zkus uložit tým bez jména | Validace zamítne | |
| 3.5 | Smaž tým | Odstraní z tabulky i z Live skóre | |
| 3.6 | Přidej 5+ týmů | Tabulka scrolluje, vše přehledné | |

---

## 4. Editor — Strom (dny/etapy)

| # | Test | Očekávaný výsledek | OK? |
|---|------|--------------------|-----|
| 4.1 | Přidej nový den | Zobrazí se v stromové struktuře | |
| 4.2 | Přidej etapu do dne | Etapa se zobrazí pod dnem | |
| 4.3 | Přiřaď stanoviště do etapy | Stanoviště se zobrazí pod etapou | |
| 4.4 | Klikni na den v AppBaru | Mapa filtruje na stanoviště toho dne | |
| 4.5 | Klikni na etapu | Mapa filtruje na stanoviště etapy | |
| 4.6 | Přejmenuj den přímo ve stromu | Název se uloží | |

---

## 5. Live režim — Tab Stanoviště

| # | Test | Očekávaný výsledek | OK? |
|---|------|--------------------|-----|
| 5.1 | Přepni na Live tlačítkem | Zobrazí se tab Stanoviště nebo Přehled (dle role) | |
| 5.2 | Vyber stanoviště ze seznamu vlevo | Detail stanoviště se zobrazí uprostřed | |
| 5.3 | Klikni **+10** u týmu | Celkové skóre +10, "Toto stanoviště" +10 | |
| 5.4 | Klikni **−5** u týmu | Celkové skóre −5, "Toto stanoviště" −5 | |
| 5.5 | Progress bar pod skóre stanoviště | Odpovídá poměru zísaných/max bodů | |
| 5.6 | Skóre neklesne pod 0 | Při −X u 0 zůstane 0 | |
| 5.7 | Přepni na jiné stanoviště | "Toto stanoviště" skóre je nezávislé (resetuje pohled) | |
| 5.8 | Zkontroluj log akcí (>1280px) | Každá úprava se zapíše s časem | |
| 5.9 | Změň stav stanoviště (Probíhá/Splněno/Přeskočeno) | Stav se zobrazí ve stavovém sloupci | |
| 5.10 | Klikni **⚠ Problém** | Tlačítko zešedne (odeslán alert) | |

---

## 6. Live režim — Tab Přehled

| # | Test | Očekávaný výsledek | OK? |
|---|------|--------------------|-----|
| 6.1 | Přepni na záložku Přehled | Zobrazí se tabulka s pořadím | |
| 6.2 | Přidej body týmu (tab Stanoviště) | Pořadí v Přehledu se okamžitě přepočítá | |
| 6.3 | Diskvalifikovaný tým (status "disqualified") | Řádek je poloprůhledný | |
| 6.4 | Klikni na status stanoviště (vpravo) | Přepne cyklicky Probíhá→Splněno→Přeskočeno | |

---

## 7. Časomíra

| # | Test | Očekávaný výsledek | OK? |
|---|------|--------------------|-----|
| 7.1 | Klikni ▶ (Start) | Časomíra začne tiktat | |
| 7.2 | Klikni ⏸ (Pauza) | Zastaví se, čas zůstane | |
| 7.3 | Klikni ↺ (Reset) | Vrátí se na 00:00 | |
| 7.4 | Spusť, přepni záložku, vrať se | Časomíra pokračuje (není vázaná na tab) | |

---

## 8. Responsivita

| # | Test | Očekávaný výsledek | OK? |
|---|------|--------------------|-----|
| 8.1 | Zúži okno na ~768px | AppBar compact, score karty 2 sloupce | |
| 8.2 | Zúži na ~1024px | Action log v Live skrytý, layout přehledný | |
| 8.3 | Fullscreen (F11) | Layout vyplní celou obrazovku korektně | |
| 8.4 | Tablet landscape (1024×768) | Vše použitelné bez horizontálního scrollu | |

---

## 9. Internationalizace

| # | Test | Očekávaný výsledek | OK? |
|---|------|--------------------|-----|
| 9.1 | Přepni na EN | Všechny popisky v angličtině | |
| 9.2 | Proveď akci v EN | Logy, chybové hlášky — anglicky | |
| 9.3 | Přepni zpět na CS | Vše zpět česky | |

---

## 10. Perzistence a síť

| # | Test | Očekávaný výsledek | OK? |
|---|------|--------------------|-----|
| 10.1 | Přidej tým, reload stránky | Tým přetrvá (localStorage nebo server) | |
| 10.2 | Spusť `npm run dev:all`, otevři na 2 zařízeních/záložkách | Obě vidí stejná data | |
| 10.3 | Uprav skóre na jednom | Druhé se aktualizuje bez reloadu (Socket.IO) | |
| 10.4 | Zastav server, proveď změnu | Změna se uloží do localStorage, indicator "offline" | |

---

## 11. Dark/Light mode

| # | Test | Očekávaný výsledek | OK? |
|---|------|--------------------|-----|
| 11.1 | Přepni na tmavý motiv | Celá aplikace tmavá, bez bílých artefaktů | |
| 11.2 | Přepni zpět | Světlý motiv bez blikání | |
| 11.3 | Reload po přepnutí | Motiv se zapamatuje | |

---

## Opravené bugy

- [x] Smazání pinu ze stromové struktury (GameTree) — volalo `stopPropagation`, ale nechybějící `deletePin` + `updateTree`
- [x] Poznámka v Live módu se neukládala — tlačítko Uložit teď přidá záznam do logu akcí
- [x] Badge "disqualified" v tabulce StatsView přetékal — nyní se používá i18n překlad a `whitespace-nowrap`
- [x] Na mobilu nebyla vidět mapa v editoru — panely stromu a vlastností se skryjí pod `md` breakpointem
- [x] AppBar na mobilu skrýval prvky — přepracován na 2-řádkový layout, vše viditelné

## Známé limitace / TODO

- [ ] Grafy (recharts) nejsou ještě zapojeny do Live přehledu
- [ ] Offline indikátor v AppBaru by mohl být výraznější
- [ ] Na mobilu v editoru nejsou dostupné Vlastnosti ani Strom — pouze mapa
