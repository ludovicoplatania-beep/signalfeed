# Stato degli aggiornamenti — punto 3

In ogni pagina un riepilogo espandibile mostra l'ultimo ciclo registrato e lo stato delle fonti attive. Resta disponibile dopo ricaricamento e viene verificato ogni minuto mentre l'app è visibile, oltre che al ritorno sulla pagina. Errori di rete/verifica sono espliciti; i dati precedenti non vengono presentati come appena verificati.

Per fonte: ultimo controllo, ultimo successo, errore completo. Ritardo rilevato rispetto all'intervallo previsto (30 minuti per priorità 4–5, 60 per le altre) più 35 minuti di tolleranza per il pianificatore esterno. Fonti mai verificate o con date future sono segnalate; quelle sospese non generano incidenti. Questo sostituisce la precedente soglia di 36 ore.

Il pannello distingue controllo della fonte dalla disponibilità delle notizie. Il ritardo pubblicazione→prima importazione è la mediana dei soli nuovi articoli datati nelle ultime 24 ore del ciclo disponibile: recuperi, date mancanti/future e campioni non misurabili sono esclusi. Se il ciclo più recente è IA, il ritardo RSS può non essere disponibile e viene dichiarato.

Un ciclo con tutte le fonti controllate fallite è fallito. Un fallimento parziale resta visibile nell'app e fa fallire il workflow GitHub anziché produrre una verifica verde. Un processo senza segnali da sei minuti viene marcato interrotto; la scrittura verifica l'identità e il timestamp letti per proteggere processi che nel frattempo hanno ripreso attività.

Limite: il database conserva un solo ultimo ciclo per utente, non uno storico permanente. Gli errori ancora presenti restano nelle singole fonti. La frequenza pianificata non garantisce l'esecuzione puntuale del servizio esterno.

Verifica: test su ritardi, errori con successi recenti, sospensione, date assenti/future, esito persistente, connessione indisponibile, fallimento totale e interruzione concorrente. Verifica in produzione dell'esito conservato dopo riapertura e di un ciclo manuale in corso/completato.
