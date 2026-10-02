# Punto 4 — classificazione e selezione

## Criterio del campione

Valutazione editoriale manuale delle prime dieci scelte mostrate, nell’ordine effettivo. Una notizia è utile se riguarda direttamente IA, tecnologia, videogiochi, diritto/giustizia o Sicilia/Catania, aggiunge un fatto identificabile e non ripete un’altra voce del campione. Il criterio conservativo non misura il gradimento personale dell’utente e non esclude gli altri interessi appresi dal sistema. Soglia: 8/10. Nessuna apertura o preferenza artificiale per costruire il campione.

## Prima della modifica — 2 ottobre 2026

| Notizia | Utile nel benchmark | Motivo |
|---|---|---|
| Sony brings AI graphics upscaling to the regular PS5 | Sì | Gaming e IA |
| Una serie di strane intrusioni nelle case dei parlamentari finlandesi | No | Cronaca estera fuori dai cinque temi |
| MIT Transit Lab to develop an AI platform for public transit agencies | Sì | Applicazione IA |
| Britain in talks with European allies over release of emergency diesel stockpiles | No | Energia/diplomazia, nessun legame diretto |
| OpenAI chief research officer on hack fallout | Sì | IA e sicurezza |
| Meno regole per attirare l’AI: la scommessa di Milei | Sì | Regolazione IA |
| Università di Catania, nucleare avanzato e rinnovabili | Sì | Territorio |
| Glifosato addio? Grano senza insetticidi grazie alle alghe | No | Agricoltura generale |
| Auto elettriche usate: divario di valore residuo | No | Motori; altro interesse, escluso dal benchmark conservativo |
| This giant stick insect fooled scientists for decades | No | Zoologia generale |

Risultato iniziale: **5/10** nei cinque temi espliciti.

## Modifiche

- Classificazione condivisa con i settori, senza scambiare la preposizione italiana “ai” per AI; aggiunti gaming, diritto e territorio alle categorie dei pick. Un’etichetta IA non supportata dal contenuto viene corretta.
- Tutte le venti notizie recenti per fonte vengono confrontate prima di limitare l’input del modello a 160; massimo quattro per fonte nella prima passata, ordinamento deterministico.
- Priorità ai cinque temi espliciti, oltre agli interessi appresi e alle preferenze; corrispondenze su parole significative, non sottostringhe casuali.
- Penalità per promozioni e date mancanti; una nuova importazione non rende fresca una pubblicazione senza data.
- Fino a 2.000 aperture recenti vengono lette indipendentemente dagli altri eventi. Articoli già aperti esclusi se esistono dieci alternative distinte non aperte; campione al modello senza aperti quando esistono 160 alternative.
- Scoperte solo pertinenti e datate entro 72 ore; niente due posti obbligatori per fonti generaliste fuori tema.
- Punteggi IA calibrati con i segnali deterministici (40% modello, 60% attualità/contenuto/preferenze); ordine per rilevanza anche nelle API e nel briefing, senza precedenza automatica alla modalità IA.
- Conservati deduplicazione degli eventi, esclusioni esplicite, fallback e sostituzione atomica delle selezioni.

## Verifica finale

### Primo ciclo — produzione, 2 ottobre 2026 19:08–19:10 (Europe/Rome)

Deploy `b7f35c5`, PR #20. Il modello ha valutato 160 candidati: 10 riferimenti ricevuti, 10 accettati, nessuno respinto, una chiamata completata in 7,3 secondi. La calibrazione finale ha mantenuto 5 scelte IA e 5 automatiche.

| Ordine | Notizia | Fonte | Utile | Motivo |
|---|---|---|---|---|
| 1 | NVIDIA DGX Spark, versione 64 GB | Dday.it | Sì | Hardware IA |
| 2 | Leone XIV e l’AI: chi governa il potere tecnologico | Agenda Digitale | Sì | Governance IA |
| 3 | Three firings and a fourth departure shake up OpenAI safety team | The Decoder | Sì | Sicurezza e organizzazione IA |
| 4 | Transluce scopre tentati attacchi AI: chi controlla gli agenti? | Tom’s Hardware | Sì | Sicurezza degli agenti |
| 5 | BMW, nuova fabbrica di batterie in Baviera | Automoto.it | No | Motori, escluso dal criterio conservativo |
| 6 | Father of PlayStation: games have stagnated | Push Square | Sì | Industria gaming |
| 7 | Autostrada A29, incidente a Gibellina | MeridioNews | Sì | Cronaca siciliana |
| 8 | 67,8% dei Comuni siciliani in crisi finanziaria | IlSicilia | Sì | Enti locali siciliani |
| 9 | DOOM: The Dark Ages, nuova modalità gratuita | Multiplayer.it | Sì | Aggiornamento videogioco |
| 10 | Steam Hardware Survey: 32 GB overtakes 16 GB | TechPowerUp | Sì | Hardware e gaming |

**9/10**, contro 5/10 prima. Dieci editori, nessun evento ripetuto osservato. La pertinenza è valutata su titolo e descrizione disponibili, non mediante apertura degli articoli; il controllo degli aperti è coperto dalla query e dai test di regressione, non da una simulazione sul profilo reale.

Il ciclo ha registrato un timeout della fase `topics`, mantenendo le scelte aggiornate. Per ridurre questa richiesta: gruppi su 80 candidati pertinenti, estratti da 160 caratteri, riferimenti numerici anziché UUID ripetuti, schema JSON vincolato e massimo otto articoli per gruppo. Il tempo limite rimane invariato. 

### Secondo ciclo — produzione, 2 ottobre 2026 19:16:56–19:18:08 (Europe/Rome)

Deploy `968f94f`, PR #21, stato finale **Completato**, senza avvisi di fasi fallite. Otto gruppi tematici e briefing aggiornati e osservati nella home. Le dieci scelte restano 5 IA e 5 automatiche, da dieci editori. Nell’elenco sopra BMW è sostituita dalla nuova Hyundai Tucson con IA a bordo (quarta posizione, prima di Transluce): nel criterio conservativo resta una notizia di prodotto automobilistico, non un approfondimento IA; viene conteggiata come non utile. Gli altri nove eventi restano pertinenti e distinti. **9/10 confermato** nel secondo campione.

La durata di 72 secondi riguarda l’intero ciclo, non la sola selezione. Un ciclo riuscito dimostra il funzionamento osservato, non garantisce l’assenza di futuri timeout del fornitore. La segnalazione separata della fonte Valigia Blu rimane visibile: questo ciclo IA non importa le fonti.

Verifiche: **139 test passati**, TypeScript, ESLint e build di produzione riusciti; CI GitHub riuscita per entrambe le PR. Prova visiva `athena-selezione-verificata.jpg`; nessuna modifica alle letture o alle preferenze per ottenere il risultato.

## Limiti

La lettura è dedotta dall’apertura, non da una conferma di lettura completa. La cronologia usata è limitata alle 2.000 aperture più recenti. La classificazione resta lessicale e può richiedere aggiustamenti per omonimie e contenuti misti. Il campione di dieci non certifica tutti i cicli futuri.
