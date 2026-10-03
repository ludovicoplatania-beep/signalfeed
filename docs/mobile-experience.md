# Punto 7 — esperienza su telefono e tablet

## Modifiche

Sotto 1280 px la home presenta le scelte prima dei contatori e dell’elenco dei settori. Ricerca, filtri, aggiornamento e logout sono raccolti in “Cerca e strumenti”; stato delle fonti e preferenze rimangono accessibili. Nei settori ridotti descrizioni e spazi sopra la prima scelta, senza rimuovere avvisi, data o conteggio editori.

La voce “Settori” della barra inferiore apre direttamente un dialogo con tutti i nove settori: apertura e scelta richiedono due tocchi. Dialogo nativo con contenimento del focus, chiusura ed Escape; link normali alle pagine tematiche.

Fra le sezioni dello stesso dashboard viene memorizzata la posizione; tornando all’archivio vengono conservate anche le pagine caricate se filtri e versione non cambiano. Il lettore usa un dialogo modale nativo, blocca lo scorrimento del feed e restituisce posizione e focus alla chiusura. Nessuna nuova dipendenza o migrazione.

## Verifica e limiti

174 test, typecheck, lint e build superati. Test specifici coprono accesso diretto ai nove settori, cancellazione del lettore, ritorno del focus e dello scorrimento, mantenimento delle pagine dell’archivio. Verifica browser dopo pubblicazione da registrare.

La posizione fra sezioni è mantenuta durante la sessione del dashboard, non attraverso ricaricamento o navigazione fra diverse pagine tematiche. I cambiamenti ai filtri e gli aggiornamenti possono cambiare il contenuto. Il layout non garantisce un titolo interamente visibile con ogni dimensione del testo o titolo eccezionalmente lungo.

Il criterio concordato richiede una prova su telefono e tablet reali. Non sono disponibili dispositivi fisici al runtime: il punto resta in verifica fino a quella prova, senza equiparare test DOM o browser desktop a dispositivi reali.
