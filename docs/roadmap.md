# Athena — roadmap concordata

Ordine vincolante; aggiornare lo stato con prove di verifica. Una modifica del codice non equivale a un risultato verificato in produzione.

| Ordine | Intervento | Criterio di completamento | Stato |
|---|---|---|---|
| 1 | Separare importazione e generazione IA | Priorità ogni 15–60 minuti compatibilmente con piano/budget; ritardo misurato | IA separata; nuovo scheduler database attivo ogni 30 minuti con monitor ogni minuto, token RSS in Vault. Primo avvio pianificato 03/10 alle 19:37:00 UTC, HTTP 202 senza errori. Ritardi di import misurati; verifica della cadenza su più cicli ancora da proseguire. Vedi scheduling-status.md |
| 2 | Misurare e colmare la copertura | Benchmark IA, tecnologia, gaming, locale e diritto; almeno 85% degli eventi rilevanti selezionati | Primo campione verificato: 18/20 (90%), prima 11/20 (55%). Due lacune residue, campioni periodici da proseguire |
| 3 | Affidabilità verificabile | Ultimo aggiornamento, ritardi/errori visibili; nessun fallimento silenzioso | Pubblicato: stato persistente, ritardi secondo pianificazione, errori per fonte e fasi; verifica reale di fallimento parziale e test dei cicli interrotti |
| 4 | Classificazione e selezione | Campione manuale: almeno 8 delle prime 10 notizie utili | Verificato in produzione: 9/10 in due cicli (prima 5/10); 139 test. Corrette categorie, rilevanza, aperti, scoperte e carico dei gruppi tematici. Vedi selection-quality.md |
| 5 | Varietà nei settori | Almeno cinque editori nei primi dieci risultati quando possibile | Verificato in produzione: gaming 6, IA 9, tecnologia 10, diritto 8, locale 7 (6 escludendo il falso positivo cinematografico), su dieci pick. Vincolo anche nel fallback; conteggio visibile; 160 test e build. Limiti di pertinenza/deduplicazione documentati in sector-variety.md |
| 6 | Controllo preferenze | Preferenze persistenti/immediate, motivo e data di ogni pick | Pubblicato e verificato: temi/priorità, esclusioni di temi e fonti, persistenza dopo ricaricamento, anteprima automatica, motivo e data. Regole di prova rimosse; 15 interessi appresi conservati. 171 test e build; limiti in preference-control.md |
| 7 | Esperienza mobile | Prima notizia utile nella schermata iniziale; settori entro due tocchi; telefono/tablet reali | Pubblicato: scelte prima dei contatori, strumenti compatti, accesso diretto ai settori, posizione tra sezioni e ritorno dal lettore. 174 test, build e verifica browser desktop; prova su dispositivi fisici ancora necessaria. Vedi mobile-experience.md |
| 8 | Lettore e biblioteca | Testo completo dove disponibile, parziale esplicito, letto/non letto, cartelle/tag, ricerca | Pubblicato: recupero del testo pubblico, stato di completezza esplicito, cache separata, ricerca nei salvati, cartelle/tag e letto/non letto persistenti. Biblioteca verificata live dopo reload e filtri; 189 test con verifica completa CI. Testo esteso recuperato da Punto Informatico; limiti di estrazione documentati in reader-library.md |
| 9 | Offline e traduzione | Salvati in modalità aereo; originale accanto alla traduzione | Da completare |
| 10 | Pagine eventi | Gruppi persistenti, cronologia, coperture multilingua, fonti primarie | Da completare |
| 11 | Avvisi selettivi e audio | Argomenti configurabili, frequenza, orari silenziosi; facoltativi | Da completare |
| 12 | Costi e portabilità | Budget IA misurato; export e ripristino verificato | Da completare |
