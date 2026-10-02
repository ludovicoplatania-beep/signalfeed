# Stato degli aggiornamenti — punto 3

In ogni pagina un riepilogo espandibile mostra l'ultimo ciclo registrato e lo stato delle fonti attive. Resta disponibile dopo ricaricamento e viene verificato ogni minuto mentre l'app è visibile, oltre che al ritorno sulla pagina. Errori di rete/verifica sono espliciti; i dati precedenti non vengono presentati come appena verificati.

Per fonte: ultimo controllo, ultimo successo, errore completo. Ritardo rilevato rispetto all'intervallo previsto (30 minuti per priorità 4–5, 60 per le altre) più 35 minuti di tolleranza per il pianificatore esterno. Fonti mai verificate o con date future sono segnalate; quelle sospese non generano incidenti. Questo sostituisce la precedente soglia di 36 ore.

Il pannello distingue controllo della fonte dalla disponibilità delle notizie. Il ritardo pubblicazione→prima importazione è la mediana dei soli nuovi articoli datati nelle ultime 24 ore del ciclo disponibile: recuperi, date mancanti/future e campioni non misurabili sono esclusi. Se il ciclo più recente è IA, il ritardo RSS può non essere disponibile e viene dichiarato.

Un ciclo con tutte le fonti controllate fallite è fallito. Un fallimento parziale resta visibile nell'app e fa fallire il workflow GitHub anziché produrre una verifica verde. Un processo senza segnali da sei minuti viene marcato interrotto; la scrittura verifica l'identità e il timestamp letti per proteggere processi che nel frattempo hanno ripreso attività.

Limite: il database conserva un solo ultimo ciclo per utente, non uno storico permanente. Gli errori ancora presenti restano nelle singole fonti. La frequenza pianificata non garantisce l'esecuzione puntuale del servizio esterno.

Verifica: test su ritardi, errori con successi recenti, sospensione, date assenti/future, esito persistente, connessione indisponibile, fallimento totale e interruzione concorrente. Verifica in produzione dell'esito conservato dopo riapertura e di un ciclo manuale in corso/completato.

## Prove in produzione — 2 ottobre 2026

PR #18: stato persistente e rilevamento errori/ritardi. PR #19: correzione emersa nella prova reale di ricarica durante il ciclo (l'interfaccia aspettava il termine della verifica), più timeout delle richieste di 20 secondi e test del dashboard durante un aggiornamento ancora in corso.

Il ciclo avviato alle 18:37:45 Europe/Rome e concluso alle 18:38:14 ha importato 44 nuovi articoli e aggiornato 34, con 107/108 fonti riuscite. Valigia Blu ha restituito 403/429 dopo un successo alle 18:21:44. Il pannello ha mostrato stato Parziale, nome/errore della fonte, ultimo successo e ritardo mediano di 13 minuti su 43 nuovi articoli datati. Nessuna fonte eliminata per un errore intermittente.

Il corpo reale dello script del workflow è stato eseguito con risposte simulate: completato → exit 0; parziale → exit 1; fallito → exit 1. CI delle due PR riuscita; 131 test complessivi, lint/typecheck/build riusciti. La prova di interruzione/fallimento totale è automatizzata; non sono stati provocati errori artificiali nelle fonti di produzione.

Verifica della versione finale: la ricarica durante il nuovo ciclo mostra il briefing e «In corso / Controllo fonti» mentre il lavoro prosegue. Commit b8afae219306ba4add257bac0973ff5903fce5a2, deploy READY dpl_CxiDLUDYUa3r2pYATEJe4hccCRhk. L’esito Parziale precedente è stato recuperato correttamente dopo la riapertura.
