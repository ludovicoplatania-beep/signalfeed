# Pianificazione — verifica del 3 ottobre 2026

Il workflow import-news.yml è configurato ai minuti 17 e 47, ma la configurazione non dimostra che gli avvii rispettino la cadenza. Gli ultimi avvii automatici osservati via API GitHub sono 01:28:56, 07:07:48, 12:36:47 e 16:46:15 UTC. Quello delle 01:28 è fallito per importazione parziale (106/108 fonti); i successivi sono riusciti. Non è una mancanza del cron secret: il job ha raggiunto Athena e verificato il risultato.

Alle 20:29 Europe/Rome, l’interfaccia segnalava tutte le 108 fonti in ritardo. Recupero manuale completato alle 20:29:54: 76 articoli nuovi, 40 aggiornati, 107/108 fonti operative; ritardo mediano prima importazione 69 minuti su 74 articoli recenti datati. Automated Home ha risposto 403/429, dopo un successo alle 18:46:34: errore intermittente, non prova di indisponibilità definitiva.

La cadenza del punto 1 è riaperta. Vercel contiene cron giornalieri, GitHub la cadenza frequente: non aumentare la tolleranza per nascondere i ritardi e non confondere il recupero manuale con una correzione della pianificazione.

Accesso Supabase ripristinato mediante autenticazione sicura GitHub. Confermato il progetto Babilonia, ref mhuubnpntjxsjicizehu, che contiene tutte le tabelle Athena. Query di sola lettura: Vault 0.3.1 installato; pg_cron 1.6.4 e pg_net 0.20.0 disponibili ma non installati. Nessuna modifica al database o alle credenziali effettuata.

## Configurazione pronta, attivazione da confermare

Migration 202610030001_rss_scheduler.sql: abilita pg_cron/pg_net, genera nel database un token casuale dedicato all’import RSS e lo conserva in Vault. Il token non viene stampato, copiato nel repository o inserito nei comandi cron. Athena invia al validatore solo l’hash SHA-256; RPC riservata a service_role. Credenziale non accettata dal cron IA. Il vecchio cron secret continua a funzionare.

Import ai minuti 7 e 37, controllo HTTP ogni minuto e polling dello stato solo durante un ciclo attivo. Gli esiti HTTP sono registrati in athena_private.rss_requests; il completamento reale resta in athena_updates. Un job cron eseguito non equivale a un import riuscito. Ruoli anon/authenticated privi di accesso a funzioni e audit privati. I job sono creati INATTIVI.

Dopo conferma della nuova credenziale persistente: applicare migration, invocare athena_private.invoke_rss(false), verificare esito HTTP e stato persisted della pipeline, quindi attivare i due job con cron.alter_job. Verificare un avvio pianificato prima di dichiarare il problema risolto. Disattivazione reversibile tramite cron.alter_job(active:=false); scheduler precedenti conservati come fallback.

Test di autenticazione legacy, limitazione al solo endpoint RSS, rifiuto delle credenziali malformate e validatore assente; test Postgres di permessi, job spenti, idempotenza e registrazione HTTP 403. La migration è validata con interfacce simulate delle estensioni, non ancora applicata al database reale.

Riferimenti: https://supabase.com/docs/guides/functions/schedule-functions e https://supabase.com/docs/guides/database/extensions/pg_net.
