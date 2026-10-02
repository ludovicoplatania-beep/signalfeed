# Punto 4 — classificazione e selezione

## Criterio del campione

Valutazione editoriale manuale delle prime dieci scelte mostrate, nell’ordine effettivo. Una notizia è utile se riguarda direttamente IA, tecnologia, videogiochi, diritto/giustizia o Sicilia/Catania, aggiunge un fatto identificabile e non ripete un’altra voce del campione. Il criterio conservativo non misura il gradimento personale dell’utente e non esclude gli altri interessi appresi dal sistema. Soglia: 8/10. Nessuna apertura o preferenza artificiale per costruire il campione.

## Prima della modifica — 2 ottobre 2026

| Notizia | Utile nel benchmark | Motivo |
|---|---|---|
| Sony brings AI graphics upscaling to the regular PS5 | Sì | Gaming e IA |
| Una serie di strane intrusioni nelle case dei parlamentari finlandesi | No | Cronaca estera fuori dai cinque temi |
| MIT Transit Lab to develop an AI platform for public transit agencies | Sì | Applicazione IA |
| Britain in talks with European allies over release of emergency diesel stockpiles | No | Energia/diplomazia, nessun legame diretto |
| OpenAI chief research officer on hack fallout | Sì | IA e sicurezza |
| Meno regole per attirare l’AI: la scommessa di Milei | Sì | Regolazione IA |
| Università di Catania, nucleare avanzato e rinnovabili | Sì | Territorio |
| Glifosato addio? Grano senza insetticidi grazie alle alghe | No | Agricoltura generale |
| Auto elettriche usate: divario di valore residuo | No | Motori; altro interesse, escluso dal benchmark conservativo |
| This giant stick insect fooled scientists for decades | No | Zoologia generale |

Risultato iniziale: **5/10** nei cinque temi espliciti.

## Modifiche

- Classificazione condivisa con i settori, senza scambiare la preposizione italiana “ai” per AI; aggiunti gaming, diritto e territorio alle categorie dei pick. Un’etichetta IA non supportata dal contenuto viene corretta.
- Tutte le venti notizie recenti per fonte vengono confrontate prima di limitare l’input del modello a 160; massimo quattro per fonte nella prima passata, ordinamento deterministico.
- Priorità ai cinque temi espliciti, oltre agli interessi appresi e alle preferenze; corrispondenze su parole significative, non sottostringhe casuali.
- Penalità per promozioni e date mancanti; una nuova importazione non rende fresca una pubblicazione senza data.
- Fino a 2.000 aperture recenti vengono lette indipendentemente dagli altri eventi. Articoli già aperti esclusi se esistono dieci alternative distinte non aperte; campione al modello senza aperti quando esistono 160 alternative.
- Scoperte solo pertinenti e datate entro 72 ore; niente due posti obbligatori per fonti generaliste fuori tema.
- Punteggi IA calibrati con i segnali deterministici (40% modello, 60% attualità/contenuto/preferenze); ordine per rilevanza anche nelle API e nel briefing, senza precedenza automatica alla modalità IA.
- Conservati deduplicazione degli eventi, esclusioni esplicite, fallback e sostituzione atomica delle selezioni.

## Verifica finale

In attesa del deploy e del campione reale. I test di regressione non sostituiscono questo controllo.

## Limiti

La lettura è dedotta dall’apertura, non da una conferma di lettura completa. La cronologia usata è limitata alle 2.000 aperture più recenti. La classificazione resta lessicale e può richiedere aggiustamenti per omonimie e contenuti misti. Il campione di dieci non certifica tutti i cicli futuri.
