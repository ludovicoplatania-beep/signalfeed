# Punto 6 — controllo delle preferenze

## Comportamento

Il pannello “Personalizza le scelte”, disponibile anche nei settori, distingue le regole personali dagli interessi appresi. Temi con priorità normale/alta/massima, esclusioni di argomenti e fonti, modifica della priorità e rimozione delle regole. Quaranta regole al massimo. Le priorità delle fonti rimangono nel pannello Fonti.

Le regole personali persistono nella struttura JSON del profilo esistente: nessuna migrazione. Gli aggiornamenti IA preservano le regole manuali. Scritture con controllo della versione e tentativi condizionati impediscono che il profilo appreso o un secondo dispositivo cancellino modifiche più recenti. Il timestamp degli interessi appresi è distinto dalle modifiche manuali, per non saltare l’elaborazione di nuovi segnali.

Home e settori filtrano le esclusioni prima della selezione; anche il fallback automatico le rispetta. I temi personali aggiungono un peso indipendente al ranking. L’anteprima usa il campione recente della home (fino a 100 notizie, bilanciato per editore) e il ranking automatico, senza chiamate IA: verifica subito le regole salvate. Le selezioni storiche conservano motivo e data; per sostituirle serve il ricalcolo IA. Il feed cronologico e i salvati restano consultabili.

Ogni pick, principale, secondario e tematico, mostra la data di selezione e il controllo “Perché questa notizia”, con motivazione persistita e distinzione IA/automatica.

## Verifica

Pubblicato il 3 ottobre 2026 con PR #27 e #28. CI, 171 test, typecheck, lint e build superati; deployment di produzione READY.

Verifica reale nell’account proprietario: tema OpenAI con priorità massima salvato e ritrovato dopo ricaricamento; motivazione “Tema scelto da te: OpenAI” e peso nel ranking verificati. Esclusione della fonte Il Post e del tema OpenAI applicate nell’anteprima. Motivo persistito e data verificati su un pick tematico. Tutte le regole temporanee rimosse al termine, con ulteriore ricaricamento: zero regole manuali e i 15 interessi appresi originali conservati.

La prima verifica ha evidenziato un’anteprima troppo lenta: sostituito il caricamento di tutte le fonti con il campione recente della home. Una verifica successiva è terminata in 1.231 ms; misura singola, non garanzia di latenza.

Test coprono priorità ed esclusioni, alias IA/gaming, rimozione senza reset degli interessi appresi, conflitti fra dispositivi, aggiornamento appreso simultaneo, cache del profilo, errori di salvataggio e anteprima. La concorrenza è verificata nei test; non è stato eseguito un test simultaneo su due dispositivi fisici.

## Limiti

L’anteprima è deterministica: non promette gli stessi dieci risultati del modello. I temi liberi sono riconosciuti attraverso parole significative nel titolo e nei primi 300 caratteri della descrizione; non costituiscono filtri semantici perfetti. Esclusioni di fonti riferite al singolo feed configurato, non all’intero gruppo societario. Le priorità orientano il ranking, preservando attualità e varietà, e non garantiscono che ogni articolo del tema entri nei primi dieci.
