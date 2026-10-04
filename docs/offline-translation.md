# Punto 9 — offline e traduzione

## Comportamento
- Nei Salvati e nel lettore di un salvato, «Scarica per offline» recupera il testo disponibile dalla fonte e conserva titolo, fonte, URL, stato di completezza e data in IndexedDB sul dispositivo.
- «Biblioteca offline» apre /offline.html: lettore autonomo senza framework, sessione online o richieste API. Quando una navigazione fallisce per assenza di rete, il service worker restituisce questa biblioteca.
- Le copie possono essere cercate, lette e rimosse singolarmente o tutte insieme. Il download non garantisce il testo integrale: lo stato parziale resta esplicito. Immagini e pagine esterne non vengono scaricate.
- «Traduci in italiano» usa solo il testo del reader_cache appartenente all'owner autenticato. Non accetta contenuti arbitrari inviati dal client. Originale e traduzione hanno pulsanti distinti e il collegamento alla fonte resta visibile.
- La traduzione è facoltativa, IA, senza promessa di assenza di errori. Per testo parziale si traduce soltanto quanto disponibile. Testi lunghi vengono suddivisi senza scartare caratteri, con massimo tre richieste parallele e ordine preservato.
- La traduzione viene conservata con la copia offline se già scaricata; scaricando dal lettore dopo la traduzione viene inclusa se corrisponde allo stesso originale. Le traduzioni non scaricate restano nella sessione del lettore, senza sincronizzazione tra dispositivi.

## Limiti e dati locali
- Limite 100.000 caratteri; tre traduzioni per minuto per processo server; log IA riportano token/tempi senza testo. Il contatore in memoria non è un budget globale distribuito.
- Download e traduzioni scaricate appartengono al browser del dispositivo. Chi può usare quel browser può leggerli anche dopo scadenza della sessione. L'uscita esplicita da Athena elimina le copie locali.
- Il browser può eliminare lo storage; il comando facoltativo di protezione richiede persistenza e mostra se concessa. Nessuna garanzia dopo pulizia manuale dei dati o disinstallazione.
- Il service worker conserva esclusivamente risorse della biblioteca offline e icone; non conserva risposte API o HTML privato della dashboard. I vecchi shell cache Athena vengono eliminati al cambio di versione.

## Verifica
- 198 test locali, lint, typecheck e build superati.
- Test della biblioteca senza rete/sessione con originale, traduzione, stato parziale e rendering sicuro di titoli; test del fallback service worker a navigazione fallita e assenza di cache API/dashboard.
- Endpoint verificato per scope owner, corpo originale server-side e rifiuto di contenuti arbitrari.
- Verifica live del download, traduzione e persistenza da registrare dopo deployment. Modalità aereo su telefono/tablet fisici resta una prova manuale da completare: non è simulata dal browser di controllo disponibile.
