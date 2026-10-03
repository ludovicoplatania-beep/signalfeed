# Lettore e biblioteca

Il lettore recupera su richiesta il testo dalla pagina pubblica originale con fetch protetto (DNS pubblico, redirect verificati, limite 2 MiB e timeout). Nessun aggiramento di paywall o verifiche. Estrazione di articleBody strutturato o paragrafi di article/main, testo reso come testo semplice. Introduzione RSS non duplicata.

Stati visibili: completo solo se metadati della fonte dichiarano accesso gratuito e articleBody; parziale per estratti, limiti e segnali di abbonamento; completezza non verificata per estrazione generica. Questo è un segnale editoriale, non una prova della completezza rispetto alla versione impaginata. Cache separata per 24 ore, non sovrascritta dall’import RSS. Fonte originale sempre accessibile.

Biblioteca: ricerca titolo/testo RSS/fonte/tag nei salvati, cartelle nominate, fino a 12 tag da 40 caratteri, filtro letto/non letto. Stato di lettura esplicito e reversibile; apertura non equivale automaticamente a lettura completata. API protette dal proprietario, filtro di appartenenza articolo, RLS e nessun accesso anon/authenticated. Metadati persistenti separati dal salvataggio: rimuovere e risalvare conserva organizzazione e stato.

Migration 202610030002 applicata. Test di estrazione, paragrafi, restrizioni e articolo diverso; PostgreSQL di persistenza e permessi; UI di ricerca tag e modifica cartella. Verifica live richiesta dopo deployment.

## Prova live del 3 ottobre

8 salvati conservati. Articolo di Punto Informatico «OpenAI migliora la memoria di ChatGPT»: ricerca per titolo, cartella e tag temporanei salvati, marcato letto; dopo reload ricerca per tag e filtri cartella/letto restituiscono lo stesso articolo. Aggiornamento dello stato non cancella cartella e tag. Ripristinati cartella vuota, tag vuoti e stato da leggere; nessun salvataggio o like modificato. L’apertura genera il normale evento di lettura. Recuperato testo esteso con paragrafi, stato «completezza non verificata» e fonte originale. Corretta estrazione che inizialmente includeva raccomandazioni: priorità al corpo editoriale ed esclusione dei blocchi correlati; cache del solo articolo di prova scaduta per ricollaudo.

I test non dimostrano estrazione completa su ogni editore: marcatura conservativa e originale restano necessari; editori con restrizioni o errori mantengono contenuto parziale. Telefono/tablet fisici ancora da verificare come indicato nel punto 7.
