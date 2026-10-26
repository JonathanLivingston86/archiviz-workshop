# ArchiViz deck: istruzioni per gli agenti

## Obiettivo e confini

- Mantieni un deck web statico, senza build e senza dipendenze, che funzioni anche offline.
- Il deck è una risorsa del progetto `workshop-ai-per-architette`, ma ha il proprio repository Git e la propria pubblicazione (GitHub Pages, branch `main`).
- Leggi `README.md` per il funzionamento e `docs/STATUS.md` per lo stato.
- Spiega ad Andrea in italiano semplice obiettivo, motivo e rischi prima di modifiche non banali. Definisci gli acronimi alla prima occorrenza.

## Regole di scrittura dei contenuti

- Frasi corte e parole comuni. Dai del tu.
- Mai il trattino lungo Unicode U+2014, mai la formula "Non è X, è Y", niente elenchi con una parola in grassetto.
- Indipendenza dallo strumento: VizMaker è presentato come strumento usato, senza sponsorizzazione.
- Il testo delle slide è minimale; i dettagli vanno nel blocco `.extra`, visibile solo nella dispensa.

## Mappa

- `index.html`: slide (ogni `<section class="slide">`). `data-po` marca le slide solo da presentatore; `data-steps` e `data-step` gestiscono i passaggi.
- `deck.js`: motore, quiz (`buildQuizSlides`, `chooseCard`) e visual.
- `style.css`: tutto lo stile; le dimensioni usano `cqw`, quindi le slide scalano con il proprio contenitore.

## Cose da non fare

- Non pubblicare in `quiz/` foto di rivista o loro copie generate: il `.gitignore` le esclude e non va indebolito.
- Non inserire dati personali, credenziali o percorsi locali nel repository pubblico.
- Non creare repository, fare push o modificare il sito live senza l'approvazione esplicita di Andrea.
- Le norme citate (art. 13 e 25 della legge 132/2025, art. 50 dell'AI Act) vanno riverificate su fonti ufficiali prima di ogni aggiornamento.

## Verifiche minime

1. `node --check deck.js`.
2. Server locale, poi scorri tutte le slide in modalità presentatore e in dispensa (`#dispensa`) e prova copia dei prompt, quiz, schermo intero e QR.
3. Controlla anche una finestra stretta (telefono).
4. Cerca il trattino lungo: `grep -rn "—" index.html deck.js style.css`.
