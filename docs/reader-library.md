# Lettore e biblioteca

Il lettore recupera su richiesta il testo dalla pagina pubblica originale con fetch protetto (DNS pubblico, redirect verificati, limite 2 MiB e timeout). Nessun aggiramento di paywall o verifiche. Estrazione di articleBody strutturato o paragrafi di article/main, testo reso come testo semplice. Introduzione RSS non duplicata.

Stati visibili: completo solo se metadati della fonte dichiarano accesso gratuito e articleBody; parziale per estratti, limiti e segnali di abbonamento; completezza non verificata per estrazione generica. Questo è un segnale editoriale, non una prova della completezza rispetto alla versione impaginata. Cache separata per 24 ore, non sovrascritta dall’import RSS. Fonte originale sempre accessibile.

Biblioteca: ricerca titolo/testo RSS/fonte/tag nei salvati, cartelle nominate, fino a 12 tag da 40 caratteri, filtro letto/non letto. Stato di lettura esplicito e reversibile; apertura non equivale automaticamente a lettura completata. API protette dal proprietario, filtro di appartenenza articolo, RLS e nessun accesso anon/authenticated. Metadati persistenti separati dal salvataggio: rimuovere e risalvare conserva organizzazione e stato.

Migration 202610030002 applicata. Test di estrazione, paragrafi, restrizioni e articolo diverso; PostgreSQL di persistenza e permessi; UI di ricerca tag e modifica cartella. Verifica live richiesta dopo deployment.
