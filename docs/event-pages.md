# Punto 10 — pagine degli eventi

## Struttura
- /eventi elenca fino a 100 gruppi persistenti. /eventi/{uuid} è l'indirizzo stabile della raccolta; titolo e sintesi iniziale sono conservati.
- Gli eventi sono fatti specifici condivisi da almeno due articoli, distinti dai Temi caldi che possono descrivere fenomeni ampi.
- Ogni copertura mantiene articolo, testata, data di pubblicazione, data di ingresso nella raccolta, lingua stimata e taglio derivato da titolo/estratto. Filtro lingua e ordine cronologico rendono confrontabili i testi, apribili nello stesso lettore con traduzione del punto 9.
- La cronologia conserva le coperture aggiunte. Non pretende di ricostruire tutte le revisioni del testo fatte dalla testata, né identifica automaticamente contraddizioni fattuali.

## Aggiornamenti e limiti
- L'aggiornamento IA e il pulsante Aggiorna eventi eseguono il raggruppamento semantico multilingua su massimo 240 candidati distribuiti tra editori (URL duplicati esclusi; tutte le coperture concorrenti conservate), più due ancore per ciascuna delle ultime 24 raccolte.
- Riutilizzo dell'ID basato su un articolo effettivamente condiviso con un gruppo persistente; mai soltanto sul titolo. Il database serializza scritture dello stesso owner, impedisce duplicati e rifiuta articoli di altri owner.
- Una copertura viene assegnata a un solo evento. Gruppi preesistenti non vengono automaticamente fusi; una rigenerazione senza novità lascia identità e coperture intatte. La raccolta di tutti gli eventi dell'intero archivio non è garantita dal campione finito.
- Durante RSS, in presenza di articoli nuovi, confronto conservativo dei titoli tramite sameEvent (date entro 48 ore, numeri uguali, token fortemente coincidenti); nessuna chiamata IA. Confronta fino a 240 articoli recenti con 400 appartenenze. I collegamenti meno ovvi o tra lingue diverse attendono il ciclo IA o un aggiornamento manuale.
- Le lingue sono stimate dal modello; i nuovi collegamenti RSS restano non rilevati finché l'IA li riconosce. Gli errori di raggruppamento restano possibili: la UI distingue inferenze IA e testi delle fonti.
- Eventi/aggiornamenti eventi sono fasi visibili della pipeline, soggette allo stesso limite di tempo. Un fallimento conserva i dati e produce un avviso.

## Fonti primarie
- Verifica fonti primarie controlla fino a sei coperture recenti tramite safeFetch (protezione reti private/redirect, timeout, limite del corpo), massimo tre richieste parallele.
- Conserva solo collegamenti concreti trovati nel corpo della copertura verso domini ufficiali riconosciuti, oppure l'URL di una copertura pubblicata dal dominio ufficiale stesso. Nessun URL inventato dal modello; homepage, landing generiche, privacy e navigazione esclusi.
- Ogni link riporta la copertura di provenienza. Ultima verifica, numero di pagine controllate e pagine irraggiungibili restano espliciti. L'elenco dei domini riconosciuti è finito e una pagina bloccata può impedire l'estrazione; «nessun collegamento» non significa che non esistano documenti primari.

## Sicurezza e verifica
- Migrazione 202610040001_events.sql applicata al progetto Babilonia. Tre tabelle con RLS attiva e SELECT negato ad anon/authenticated; API owner-only e RPC service_role.
- 206 test locali, typecheck, lint e build. Test su ID stabile, aggiunte, idempotenza, scope owner, riferimenti IA validi, multilingua, fonti ufficiali, accesso mobile entro due tocchi e assenza di chiamate IA nell'import RSS.
- Prima prova live: quattro coperture di Catania–Crotone del 03/10, dalle 14:19 alle 22:45, raccolte nello stesso evento con date e testate coerenti. Campione ampliato da 160 a 240 candidati per non subordinare i confronti internazionali alla graduatoria personale del feed; ricerca globale applicata agli eventi e alle coperture. Seconda rigenerazione live conserva lo stesso UUID e le quattro coperture senza duplicazioni. Verifica fonti: quattro pagine, zero collegamenti ufficiali, nessun errore. Il campione non ha prodotto un evento multilingua o con link primari: questi casi sono verificati nei test, senza dichiararli verificati live. Conferma dell’utente: punto 10 funzionante.
