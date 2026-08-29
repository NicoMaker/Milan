# Archivio Rose A.C. Milan — versione modernizzata

Questa è una modernizzazione del sito originale (`NicoMaker/Milan`), mantenuta
volutamente **come sito statico "monolitico"** (stessa struttura a file
singoli: `home.js`/`season.js`, `home.css`/`season.css`) e non ancora divisa
in componenti riutilizzabili — quella è prevista come passo successivo, come
richiesto.

## Bug corretti

1. **I nomi dei giocatori non venivano mai mostrati.** Il JS cercava
   `card.querySelector(".player-name")`, ma nel template `<template
   id="player-card-template">` nessun elemento aveva quella classe: il nome
   restava sempre vuoto sia sul fronte che sul retro della card. Ora il
   template ha `<h3 class="card-name">` e il JS aggiorna entrambe le
   occorrenze.
2. **Percorsi con maiuscole/minuscole incoerenti.** La repo originale aveva
   cartelle/file come `Season/`, `Index.html`, `Player.json`, mentre
   `data.json` e il fetch in `season.js` puntavano a `season/index.html` e
   `player.json` in minuscolo. Su un host case-sensitive questo avrebbe
   rotto i link e il caricamento dei dati. Ora tutto è coerentemente in
   minuscolo (`season/2024-2025/index.html`, `player.json`, ecc.).

## Principali modernizzazioni

**CSS**
- Nuove funzioni CSS: `color-mix()` al posto di valori `rgba()` duplicati
  legati ai colori del brand, cosicché i colori restano derivati da un'unica
  fonte (i token in `tokens.css`).
- `container-type`/`@container` per il layout delle card giocatore e dei tag
  stagione, in aggiunta (non in sostituzione) alle media query esistenti.
- `@view-transition { navigation: auto }` per transizioni animate nativa tra
  le pagine sui browser che le supportano (Chrome/Edge); nessun impatto sugli
  altri browser.
- `text-wrap: balance/pretty`, `color-scheme: dark`, `scrollbar-color`.

**JavaScript**
- Da `.then()` chain a `async`/`await` in entrambi gli script.
- Rimosso l'enorme blocco di **stili inline generati via JS** per la sezione
  nazionalità sul retro della card (~90 righe che impostavano `style.xxx` a
  mano): ora è markup semantico con classi (`.nationality-row`,
  `.nationality-label`, `.nationality-value`) e tutto l'aspetto è nel CSS.
  Stesso identico risultato visivo, molto più manutenibile.
- Ricerca con **debounce** (150ms) invece di rigenerare i suggerimenti ad
  ogni tasto.
- Pattern **combobox accessibile** per la ricerca con suggerimenti:
  `role="combobox"`, `aria-expanded`, `aria-activedescendant`,
  `role="listbox"`/`role="option"` con id reali.
- Uso di `Intl.DateTimeFormat("it-IT", …)` al posto dell'array manuale dei
  mesi in italiano.
- `Object.groupBy()` al posto del `reduce()` manuale per raggruppare i
  giocatori per ruolo (richiede un browser recente: Chrome 117+, Firefox
  119+, Safari 17.4+ — se serve supportare browser più vecchi, va
  sostituito con un `reduce()`, indicato nei commenti).
- Costruzione dei nodi via `DocumentFragment` per ridurre i reflow.

## Struttura (invariata rispetto all'originale)

```
index.html
data.json
assets/
  css/ (tokens.css, home.css, season.css)
  js/  (home.js, season.js)
  data/logos.json
season/
  2024-2025/ (index.html, player.json)
  2025-2026/ (index.html, player.json)
  2026-2027/ (index.html, player.json)
```

## Prossimo passo (non incluso qui)

Suddivisione in componenti per funzionalità (es. header, ricerca/filtri,
card giocatore, timeline stagione) — da fare come intervento separato, come
richiesto.
