# Punto 11 — avvisi selettivi e audio

## Avvisi
- Pannello Avvisi selettivi disponibile in home e nelle pagine tematiche/eventi. Disattivato inizialmente; settori, fino a 12 argomenti, limite 1–5/giorno, intervallo minimo 1–12 ore e fascia silenziosa configurabili. Fuso Europe/Rome, aggiornamenti persistenti con controllo della versione.
- La fase RSS valuta fino a 300 articoli importati dopo l'attivazione e pubblicati nelle ultime 24 ore. Temi espliciti ed esclusioni del profilo vengono rispettati. Un titolo deve indicare uno sviluppo concreto (annuncio, rilascio, decisione, emergenza, vulnerabilità ecc.); recensioni, offerte e commenti generici esclusi. Selezione deterministica, senza costi o chiamate IA: l'importanza non è certificata e il campione non copre ogni evento.
- Un avviso al massimo per intervallo. RPC con lock per owner applica limite giornaliero nel fuso locale, fascia silenziosa e deduplicazione per articolo; confronto conservativo dello stesso fatto con gli avvisi delle ultime 24 ore. Le notizie durante il silenzio possono essere valutate dopo la fascia, se ancora recenti. Nessun backfill automatico dell'archivio precedente all'attivazione.
- Raccolta di 100 avvisi recenti, motivo, data e stato letto; apertura nello stesso lettore. Verifica manuale rispetta tutti i limiti.

## Push facoltativo
- Web Push standard con web-push, payload cifrato e chiavi VAPID lato server (privata sensitive solo produzione; pubblica restituita all'owner). Nessun abbonamento aggiuntivo.
- Invia push di prova permette una verifica manuale del dispositivo, con TTL 60 secondi e limite una richiesta/minuto. La prova è esplicitamente distinta dagli avvisi e non seleziona articoli.
- Permesso richiesto soltanto sul pulsante Attiva push su questo dispositivo. La configurazione globale e l'adesione del singolo dispositivo sono indipendenti; massimo dieci dispositivi. iOS/iPadOS richiedono l'app aggiunta alla Home.
- Notifica generica senza titolo/articolo sullo schermo bloccato. Tap apre l'avviso solo dopo accesso owner; URL stesso origin e UUID validato. Logout disattiva e rimuove l'iscrizione del dispositivo.
- Endpoint limitati a FCM, Mozilla e Apple per impedire richieste verso URL arbitrari; endpoint/chiavi non vengono restituiti dalla raccolta né registrati nei log.
- Outbox persistente per coppia avviso/dispositivo, claim atomico SKIP LOCKED, massimo tre tentativi nelle due ore successive; retry almeno cinque minuti dopo. HTTP 404/410 disattiva il dispositivo. Stato/errori visibili. Sent significa accettato dal servizio push, non conferma di ricezione fisica. Tag stabile riduce notifiche ripetute se la rete interrompe la risposta dopo l'accettazione.
- La frequenza delle verifiche coincide con l'importazione programmata (normalmente 30 minuti); nessuna promessa di notifiche istantanee. Sistema operativo, connessione e permessi possono ritardare o bloccare la consegna.

## Audio
- Nel lettore: avvio manuale, pausa/ripresa/stop, velocità 0,75–1,5× e lingua italiana/inglese/francese/tedesca/spagnola.
- Legge il testo visualizzato, originale o tradotto, anche se parziale; non inventa testo integrale. Segmentazione in parti brevi, cancellazione alla chiusura e al cambio del testo.
- SpeechSynthesis del dispositivo: nessuna chiamata IA per la voce. Voce offline e riproduzione a schermo spento dipendono da browser/sistema. Nessun autoplay, file audio esportato o promessa di podcast in background.

## Verifica
- Migrazione 202610040002_alerts.sql applicata a Babilonia; quattro tabelle RLS e SELECT negato ad anon/authenticated, RPC service_role, API owner-only.
- 219 test, typecheck, lint e build locali passati: quiet hours e DST, cap e intervallo, owner scope, claim atomico, endpoint sicuri, segmentazione senza perdita di testo, opt-in esplicito, persistenza impostazioni, pausa/ripresa/cancellazione audio e RSS senza chiamate IA.
- Chiavi produzione configurate prima del deploy. Verifica live: impostazioni IA/tecnologia/videogiochi salvate e ricaricate, avvisi globali disattivati, massimo 3/giorno, intervallo 2 ore, silenzio 22–08. Verifica manuale restituisce zero avvisi/invii/errori. Audio avviato nel cloud, interruzione della voce mostrata esplicitamente; nessuna dichiarazione di ascolto fisico. Consegna push e audio fisico su telefono/tablet richiedono una prova sul dispositivo: il browser cloud non la sostituisce.
