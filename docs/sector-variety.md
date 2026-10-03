# Punto 5 — varietà nelle selezioni tematiche

## Criterio

Almeno cinque testate nei primi dieci pick quando esistono notizie pertinenti, distinte e non escluse. Contare i siti editoriali, non gli ID dei feed; non equivale a certificare l’indipendenza dei gruppi societari proprietari. La varietà viene calcolata dopo i controlli di pertinenza, promozioni e duplicati riconosciuti; non allentare questi controlli per raggiungere il numero. Le euristiche non certificano la correttezza semantica di ogni articolo.

## Problema rilevato

La curation del settore salvava direttamente le dieci risposte IA. Il fallback salvava l’intero elenco automatico, senza limite finale né controllo coerente degli eventi o delle testate. I candidati provenivano dai primi 300 articoli globali: una fonte molto prolifica poteva nascondere le piccole fonti. Le aperture erano limitate a 120.

Campione Videogiochi precedente (1 ottobre 2026, 21:13): dieci pick, sette etichette di fonte. La varietà numerica era già sufficiente in questo campione, ma mancava un vincolo applicato dal server; Sony/QSSR appariva sia da The Verge sia da Everyeye. La deduplicazione lessicale non garantisce l’identificazione di tutte le traduzioni dello stesso evento.

## Regole applicate

- Vent’ultimi articoli per ogni fonte attiva, con otto richieste simultanee; classificazione a livello di articolo. Finestra sette giorni, trenta per diritto/giustizia, settore con minore frequenza editoriale. Il feed cronologico conserva le altre notizie.
- Pubblicazioni datate, titoli non promozionali, preferenze negative rispettate. Se esistono articoli non aperti, quelli aperti vengono esclusi. Fino a 2.000 aperture recenti, come nella home.
- Dominio del sito dell’articolo come identità di testata, con subdomini e feed dello stesso sito riuniti. Questo corregge anche etichette di fonte non corrispondenti al sito di pubblicazione. I blog ufficiali sotto .google sono un solo editore.
- Input al modello limitato a 120 e bilanciato fra testate; testo e fatti rimangono quelli dell’articolo referenziato.
- Punteggi calibrati con la stessa proporzione della home: 40% IA e 60% ranking deterministico. Risposta IA e alternative automatiche passano dallo stesso controllo finale.
- Riservare fino a cinque testate assegnando ciascuna a un evento diverso. Se la piccola testata copre un evento già occupato, il selettore può spostare l’altra testata a un suo evento alternativo; non perde varietà per un semplice ordine greedy.
- Riempimento fino a dieci, massimo due per testata nella prima passata; limite rilassato solo se necessario per settori poveri di materiale. Niente copie dello stesso evento nel riempimento.
- Numero di editori visibile nella pagina. Quando cinque non sono raggiungibili, viene dichiarato il limite del materiale recente dopo esclusioni e aperture. Diagnostica persistente nella curation, risultato indirizzabile e leggibile sugli altri dispositivi.
- Nessuna migrazione database e nessuna modifica a preferenze o letture per ottenere il benchmark.

## Verifica

PR #22 pubblicata, CI con 149 test. Primo ciclo reale 2 ottobre 2026, 19:42: dieci notizie per settore; conteggi IA 9, tecnologia 10, gaming 8, Sicilia/Catania 7, diritto 9. Tutte le richieste completate senza fallback del fornitore; la selezione finale mescola scelte IA e automatiche per rilevanza e varietà.

Il controllo manuale dei dieci risultati ha però rilevato falsi positivi: robot chirurgico con “console” nel gaming, trama di una serie Netflix nel diritto, carte Cyberpunk in tecnologia. Ha rilevato anche due titoli diversi della medesima revisione NVIDIA DGX Spark da 64 GB. Per questo il primo ciclo non basta a chiudere la verifica di pertinenza.

Correzione ulteriore: evidenza del tema nel titolo o nell’introduzione (240 caratteri), priorità all’analisi giuridica/penale e alle notizie direttamente di settore. Preordini Amazon esclusi dalle scelte gaming. Revisione DGX Spark con stessa memoria e pubblicazione entro 48 ore raggruppata, senza fondere modelli da 64/128 GB. Dominio della testata visibile su ogni pick, perché l’etichetta della fonte importata può differire dal sito dell’articolo.

Secondo ciclo (2 ottobre, 20:00), dopo la correzione di pertinenza: IA 9, tecnologia 10, gaming 7, Sicilia/Catania 6, diritto 8 editori su dieci notizie. Nessuna richiesta fallita, ma tutte le scelte risultavano automatiche: il bonus tematico veniva applicato integralmente alle alternative automatiche e solo al 60% alle selezioni del modello. Correzione: bonus centrato sull’evidenza del titolo (12), applicato dopo la calibrazione e in misura identica a entrambe le modalità; evidenza debole penalizzata, approfondimento giuridico/penale favorito, senza saturare tutti i punteggi a 99.

Test dedicato: una scelta IA di rilevanza 90 con la stessa evidenza tematica mantiene priorità sulle alternative automatiche, e la varietà rimane di cinque editori. Verifica reale dopo questa calibrazione (2 ottobre, 20:10): gaming 6 editori (4 IA / 6 automatiche), IA 9 (2/8), tecnologia 10 (2/8), diritto 8 (2/8); dieci notizie per settore, senza errori o fallback del fornitore. Ogni elenco è stato espanso e controllato manualmente. I falsi positivi robot chirurgico, trama Netflix e carte Cyberpunk non compaiono, e la revisione DGX Spark da 64 GB compare una sola volta per selezione.

Nel locale, lo stesso controllo ha trovato Grande Fratello Vip entrato per il riferimento marginale a un concorrente siciliano. Ulteriore filtro: titolo locale, oppure riferimento geografico nell’introduzione di 240 caratteri, escludendo reality/gossip privi di tema locale nel titolo. La cultura realmente locale rimane ammessa. Il ciclo del 2 ottobre, 20:16, aveva otto editori ma conservava il falso positivo: la frase «la reazione gela tutti» era interpretata come la città di Gela, aggirando il filtro per un titolo considerato geografico. Ripresa il 3 ottobre: normalizzazione delle costruzioni verbali «gela tutti/il/la…» prima della verifica geografica, con test sul titolo esatto e su notizie autentiche di Gela. Ciclo corretto verificato online il 3 ottobre, 18:13:36: dieci notizie, sette editori, sei scelte IA e quattro automatiche, senza avvisi di fallback. Il titolo del Grande Fratello non compare. Restano nove notizie locali e una recensione cinematografica ambientata a Palermo: sei editori con copertura effettivamente locale, quindi almeno cinque anche escludendo il falso positivo. Sono presenti due anticipazioni della stessa partita Catania–Crotone: il raggruppamento semantico resta incompleto.

CI finale PR #26: typecheck, lint, suite di 160 test e build riusciti. Le PR #22–26 documentano le correzioni emerse dai cicli reali, anziché certificare la prima versione soltanto sulla varietà numerica.

## Risultato del benchmark conclusivo

| Settore | Data del ciclo | Notizie | Editori visualizzati | IA / automatiche |
|---|---|---|---|---|
| Videogiochi | 2 ottobre, 20:10 | 10 | 6 | 4 / 6 |
| Intelligenza artificiale | 2 ottobre, 20:10 | 10 | 9 | 2 / 8 |
| Tecnologia | 2 ottobre, 20:10 | 10 | 10 | 2 / 8 |
| Diritto e giustizia | 2 ottobre, 20:10 | 10 | 8 | 2 / 8 |
| Sicilia e Catania | 3 ottobre, 18:13 | 10 | 7 (6 escludendo cinema) | 6 / 4 |

Editori del ciclo locale: qds.it, etnanews24.it, livesicilia.it, palermotoday.it, cataniatoday.it, ilsicilia.it; badtaste.it è il falso positivo cinematografico. Il criterio di varietà è raggiunto in tutti i cinque settori controllati; non equivale a certificare pertinenza perfetta o dieci eventi semanticamente distinti. Le altre quattro selezioni, già verificate, non sono state rigenerate dopo la correzione esclusivamente locale.

## Limiti

La deduplicazione resta lessicale con la correzione della revisione DGX; eventi multilingua e titoli molto diversi possono sfuggire. Nel campione locale del 20:10, Il Post e ANSA trattano entrambi l’inchiesta Armao con titoli abbastanza diversi da non essere riconosciuti come copie: la varietà di editori non equivale a dieci eventi semanticamente distinti. La soluzione generale con gruppi persistenti e cronologia resta il punto 10 della roadmap. La finestra temporale e il limite di venti articoli per fonte definiscono il materiale considerato, non tutta la copertura storica degli editori. Domini distinti dello stesso gruppo societario restano testate distinte; suffissi nazionali composti più comuni sono normalizzati, senza una mappa completa delle proprietà editoriali. La curation cronologica è separata dalla selezione: la regola di varietà si applica ai pick, non all’ordine di tutte le notizie del settore.
