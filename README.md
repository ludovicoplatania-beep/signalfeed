# SignalFeed

SignalFeed (Athena) è una PWA privata monoutente che raccoglie feed RSS, seleziona gli articoli con OpenAI e genera topic e digest personali. È costruita con Next.js, Supabase e TypeScript.

## Requisiti

- Node.js 22
- un progetto Supabase
- una chiave API OpenAI
- Vercel, se si usa il cron incluso

## Configurazione

1. Copia `.env.example` in `.env.local`.
2. Inserisci URL e chiavi del progetto Supabase.
3. Imposta `OWNER_USER_ID` con l'UUID Supabase proprietario dei dati esistenti.
4. Genera valori casuali distinti per `CRON_SECRET` e `APP_SESSION_SECRET`.
5. Imposta una password privata robusta in `APP_PASSWORD`.
6. Applica in ordine le migration in `supabase/migrations`.
7. Configura le stesse variabili nell'ambiente di deploy.

Tutte le variabili sono esclusivamente server-side. Il browser non riceve chiavi Supabase o OpenAI.

## Sviluppo

```bash
npm ci
npm run dev
```

Verifiche disponibili:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

## Sicurezza

- L'intera applicazione è protetta da una password unica e da un cookie HttpOnly firmato, con scadenza di 30 giorni.
- Il browser non accede direttamente a Supabase: letture e scritture passano dalle API private.
- `OWNER_USER_ID` mantiene la proprietà dei dati esistenti senza esporre il login Supabase.
- Il cron usa `Authorization: Bearer $CRON_SECRET`; il segreto non compare nell'URL.
- Gli URL RSS sono limitati a HTTP/HTTPS pubblici sulle porte 80/443, con controlli DNS, redirect, timeout e dimensione massima.
- Input API e output AI sono validati con Zod.
- Le policy RLS restano attive come difesa aggiuntiva, mentre il server usa la chiave riservata.
- Le migration revocano ad `anon` e `authenticated` ogni accesso diretto alle tabelle applicative.
- Il service worker non memorizza risposte API né dati personali; conserva soltanto la shell statica.

Il rate limiting in memoria è una protezione locale di base. Per installazioni distribuite ad alto traffico va sostituito con un contatore condiviso, ad esempio Redis/Vercel KV.

## Modello operativo

L'aggiornamento manuale chiama `POST /api/update-now` con il cookie privato. Il cron giornaliero chiama `GET /api/cron/update` e aggiorna esclusivamente il proprietario configurato.

I topic includono ancora `user_id` per compatibilità con i dati esistenti, ma l'applicazione opera su un solo proprietario.

## Installazione PWA

Dopo il primo accesso apri SignalFeed in Chrome, Edge o Safari e scegli “Installa app” oppure “Aggiungi alla schermata Home”. La shell grafica può aprirsi offline, ma feed e contenuti personali richiedono la connessione e non vengono salvati nella cache del service worker.

## Deploy

Prima del deploy:

1. ruota qualsiasi vecchio segreto cron già apparso nella cronologia Git;
2. applica entrambe le migration, subito prima di distribuire la nuova versione (la seconda disabilita il vecchio accesso diretto dal browser);
3. configura tutte le variabili d'ambiente, inclusi `OWNER_USER_ID`, `APP_PASSWORD` e `APP_SESSION_SECRET`;
4. esegui l'intera suite di verifica;
5. controlla che Vercel Cron invii automaticamente il bearer token configurato in `CRON_SECRET`.
