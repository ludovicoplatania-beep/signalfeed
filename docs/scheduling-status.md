# Pianificazione — verifica del 3 ottobre 2026

Il workflow import-news.yml è configurato ai minuti 17 e 47, ma la configurazione non dimostra che gli avvii rispettino la cadenza. Gli ultimi avvii automatici osservati via API GitHub sono 01:28:56, 07:07:48, 12:36:47 e 16:46:15 UTC. Quello delle 01:28 è fallito per importazione parziale (106/108 fonti); i successivi sono riusciti. Non è una mancanza del cron secret: il job ha raggiunto Athena e verificato il risultato.

Alle 20:29 Europe/Rome, l’interfaccia segnalava tutte le 108 fonti in ritardo. Recupero manuale completato alle 20:29:54: 76 articoli nuovi, 40 aggiornati, 107/108 fonti operative; ritardo mediano prima importazione 69 minuti su 74 articoli recenti datati. Automated Home ha risposto 403/429, dopo un successo alle 18:46:34: errore intermittente, non prova di indisponibilità definitiva.

La cadenza del punto 1 è riaperta. Vercel contiene cron giornalieri, GitHub la cadenza frequente: non aumentare la tolleranza per nascondere i ritardi e non confondere il recupero manuale con una correzione della pianificazione.

Prossimo intervento: verificare pg_cron/pg_net nel progetto Supabase esistente, uso di Vault per il cron secret e stato delle richieste HTTP, mantenendo la verifica del completamento della pipeline. Prima della configurazione serve ispezionare il progetto e le estensioni disponibili. Il dashboard Supabase mostra una schermata di accesso: autenticazione da ripristinare. Nessuna modifica al database o alle credenziali effettuata.
