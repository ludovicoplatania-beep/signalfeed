# Copertura — protocollo 2026-10-02-v1

Campione congelato prima dell'ampliamento: 20 eventi, quattro per IA, tecnologia, gaming, Catania/Sicilia e diritto penale. Riferimenti, date e criteri sono versionati in `src/lib/coverage/benchmark.ts`. Finestra 24 settembre–2 ottobre 2026; limite delle pubblicazioni 2 ottobre ore 18 UTC. Non sostituire eventi mancanti per alzare il risultato.

Il controllo privato in Fonti esamina articoli di fonti attive appartenenti al proprietario, esclude duplicati e conta ciascun evento una volta. Il punteggio è una ricerca di corrispondenze, non una certificazione: controllare titolo, testo, data e riferimento per ogni candidato. Una data assente è segnalata; la data di importazione serve solo a delimitare i candidati. Errori o limite di scansione interrompono il controllo senza produrre un punteggio parziale.

Obiettivo del campione: almeno 17 eventi su 20 (85%). Pubblicare anche le cinque frazioni settoriali, i mancanti e il confronto prima/dopo. Quattro eventi per settore non consentono una stima statistica della copertura generale: ripetere con campioni settimanali scelti indipendentemente da Athena. Questa prima versione è statica e va aggiornata nel repository, non si rinnova automaticamente.

Nuove fonti candidate motivate: Giurisprudenza Penale e Cassazione per i provvedimenti originali; EtnaNews24 per Catania/provincia; Google Keyword e Apple Newsroom per annunci primari; blog sviluppatori Home Assistant per aggiornamenti tecnici. L'aggiunta richiede verifica pubblica, articoli importabili e date recenti. Nessuna rimozione delle fonti esistenti.

## Risultati

Baseline in produzione, 2 ottobre 2026 ore 18:20:29 Europe/Rome: 5.105 articoli esaminati, 11/20 eventi con candidati (55%).

| Settore | Prima | Dopo |
|---|---:|---:|
| IA | 4/4 | 4/4 |
| Tecnologia | 2/4 | 4/4 |
| Gaming | 3/4 | 3/4 |
| Locale | 2/4 | 3/4 |
| Diritto | 0/4 | 4/4 |

Mancanti iniziali: Final Cut Camera, Probatio, Modern Warfare 4 PC, regole delle processioni ad Acireale, Fiera dei Morti/viabilità, tutti e quattro i provvedimenti della Cassazione. Le corrispondenze iniziali includono annunci primari per Gemini, GPT, NVIDIA, Kena e Wolf Among Us; sicurezza Dell/FortiMail; notizie su QSSR, riapertura aeroporto di Catania e incendio di Librino.

Misura successiva in produzione: 2 ottobre 2026 ore 18:22:29 Europe/Rome, 5.274 articoli esaminati, **18/20 (90%)**. Obiettivo complessivo del campione superato; gaming e locale restano a 3/4 (75% ciascuno). Non confondere il 90% complessivo con un 85% raggiunto in ogni settore o nella copertura generale.

Sei fonti aggiunte, tutte operative al controllo delle 18:21:34: Giurisprudenza Penale (10 articoli), Cassazione penale (14), EtnaNews24 (10), Google Keyword (20), Apple Newsroom (20), Home Assistant sviluppatori (20): 94 nuovi articoli dalle nuove fonti. L'intero ciclo manuale ha importato 213 nuovi articoli e aggiornato 45, con 108/108 fonti operative in quel ciclo. Il risultato non garantisce disponibilità futura delle fonti.

Nuove corrispondenze: comunicati originali Apple e Home Assistant, articolo EtnaNews24 sulla Fiera dei Morti, quattro documenti originali della Cassazione (contentId distinti SZP52359, SZP52356, SZP52362 e QSP51221). La Cassazione conserva la data di pubblicazione nell'elenco, diversa da udienza/deposito. Le due sentenze 34813 e 34812 hanno anche commenti di Giurisprudenza Penale.

**Restano mancanti** Modern Warfare 4 PC e regole delle processioni di Acireale. Non eliminati dal denominatore. Le pagine pubbliche Call of Duty e La Sicilia sono raggiungibili ma non espongono un feed nella pagina esaminata; integrare un elenco pubblico datato con parser verificato o ulteriori fonti indipendenti in un successivo ampliamento.

Pubblicazione: PR #17, commit produzione e0c86f3418bbad56f567fbb14e3b1c571126d87e, deploy READY dpl_39bdKnZ3HFB7DjkZyrpD3XMEf1Kt. CI, lint, typecheck e 122 test passano; build locale riuscita dopo sostituzione della cache Turbopack corrotta. Un controllo di discovery diretto nell'ambiente locale non ha potuto usare il resolver DNS (EAI_AGAIN); la verifica reale di espansione/importazione in produzione ha invece confermato tutte le sei fonti.
