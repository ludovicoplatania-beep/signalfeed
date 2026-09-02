# SignalFeed

SignalFeed (Athena) raccoglie feed RSS privati, seleziona gli articoli con OpenAI e genera topic e digest personalizzati. È costruito con Next.js, Supabase e TypeScript.

## Requisiti

- Node.js 22
- un progetto Supabase
- una chiave API OpenAI
- Vercel, se si usa il cron incluso

## Configurazione

1. Copia `.env.example` in `.env.local`.
2. Inserisci URL e chiavi del progetto Supabase.
3. Genera un `CRON_SECRET` casuale di almeno 32 caratteri.
4. Applica in ordine le migration in `supabase/migrations`.
5. Configura le stesse variabili nell'ambiente di deploy.

Le chiavi `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY` e `CRON_SECRET` sono esclusivamente server-side e non devono avere il prefisso `NEXT_PUBLIC_`.

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

- Le API applicative verificano il bearer token Supabase e ricavano l'utente dalla sessione.
- Le operazioni manuali sono limitate all'utente corrente.
- Il cron usa `Authorization: Bearer $CRON_SECRET`; il segreto non compare nell'URL.
- Gli URL RSS sono limitati a HTTP/HTTPS pubblici sulle porte 80/443, con controlli DNS, redirect, timeout e dimensione massima.
- Input API e output AI sono validati con Zod.
- Le policy RLS versionate isolano i dati per utente.

Il rate limiting in memoria è una protezione locale di base. Per installazioni distribuite ad alto traffico va sostituito con un contatore condiviso, ad esempio Redis/Vercel KV.

## Modello operativo

L'aggiornamento manuale chiama `POST /api/update-now` con la sessione dell'utente. Il cron giornaliero chiama `GET /api/cron/update` e aggiorna in sequenza tutti gli utenti. Un errore relativo a un utente viene registrato senza interrompere gli altri.

I topic sono personali e includono `user_id`. La migration di hardening elimina esclusivamente i vecchi topic globali privi di proprietario; sono dati derivati e vengono rigenerati alla successiva esecuzione.

## Deploy

Prima del deploy:

1. ruota qualsiasi vecchio segreto cron già apparso nella cronologia Git;
2. applica la migration RLS;
3. configura tutte le variabili d'ambiente;
4. esegui l'intera suite di verifica;
5. controlla che Vercel Cron invii automaticamente il bearer token configurato in `CRON_SECRET`.
