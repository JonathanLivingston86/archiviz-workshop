# ArchiViz: deck del workshop

Deck web interattivo del workshop **ArchiViz** (render con l'AI per chi progetta), parte del progetto `workshop-ai-per-architette`. Un solo file serve due usi:

- **Presentatore:** una slide alla volta, a schermo intero, con frecce da tastiera.
- **Dispensa:** le stesse slide in una pagina scorrevole, con i prompt da copiare. Sul telefono si apre così in automatico. Si può stampare o salvare in PDF.

Sito pubblicato (dopo l'approvazione di Andrea): <https://jonathanlivingston86.github.io/archiviz-workshop/>

## Struttura

- `index.html`: contenuto di tutte le slide.
- `style.css`: aspetto (stile keynote: bianco, grigio chiaro, nero, blu).
- `deck.js`: navigazione, quiz, copia dei prompt e visualizzazioni interattive (camera, texture, moodboard, upscale, pianta in 3D, flusso di Agentic 3D).
- `assets/`: immagini delle inquadrature e della sequenza da 3D a render, codice QR.
- `quiz/`: le sei coppie del quiz "Real o AI?" (`0N-reale.jpg` e `0N-ai.jpg`), già allineate per formato, nitidezza e peso. Le foto vere sono foto di rivista, pubblicate per scelta di Andrea; gli originali restano in `materiali-privati/`.
- `kit-presentatore/` e `materiali-privati/`: materiale personale, escluso da Git.

## Come aprirlo

Basta aprire `index.html` nel browser. Funziona anche senza internet. Con un piccolo server locale, per una prova più fedele:

```bash
python -m http.server 8765
```

Poi apri `http://localhost:8765`.

## Indirizzi utili

- `#dispensa` apre la modalità dispensa.
- `#12` apre la dodicesima slide in modalità presentatore.

## Tasti

Frecce: avanti e indietro. `A` e `B`: risposta al quiz. `G`: indice. `H`: cambia modalità. `F`: schermo intero.
