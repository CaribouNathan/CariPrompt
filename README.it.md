<p align="center">
  <img src="docs/icon.png" width="132" height="132" alt="Icona CariPrompt">
</p>

<h1 align="center">CariPrompt</h1>

<p align="center">
  Gobbo multi-schermo semplice e moderno, per macOS, Windows e Linux.<br>
  <strong>Gratuito e open source</strong> — uno strumento <a href="https://github.com/CaribouNathan">Caribou Labs</a>.
</p>

<p align="center">
  <a href="https://github.com/CaribouNathan/CariPrompt/releases/latest"><img src="https://img.shields.io/github/v/release/CaribouNathan/CariPrompt?label=versione&color=007aff" alt="Ultima versione"></a>
  <img src="https://img.shields.io/badge/piattaforme-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey" alt="Piattaforme">
  <a href="LICENSE"><img src="https://img.shields.io/badge/licenza-MIT-green" alt="Licenza MIT"></a>
  <img src="https://img.shields.io/badge/prezzo-gratuito-brightgreen" alt="Gratuito">
</p>

<p align="center">
  <a href="README.md">Français</a> ·
  <a href="README.en.md">English</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <strong>Italiano</strong>
</p>

<p align="center">
  <img src="docs/screenshot.png" alt="Interfaccia di CariPrompt" width="900">
</p>

---

## Sommario

- [Presentazione](#presentazione)
- [Funzionalità](#funzionalità)
- [Scaricare](#scaricare)
- [Installazione — applicazione non firmata](#installazione--applicazione-non-firmata)
- [Primi passi](#primi-passi)
- [Scorciatoie](#scorciatoie)
- [Telecomando per presentazioni](#telecomando-per-presentazioni)
- [Formati importabili](#formati-importabili)
- [Progetti e preimpostazioni](#progetti-e-preimpostazioni)
- [Dove sono archiviati i miei testi?](#dove-sono-archiviati-i-miei-testi)
- [Cronologia delle versioni](#cronologia-delle-versioni)
- [Limiti noti](#limiti-noti)
- [Compilare dai sorgenti](#compilare-dai-sorgenti)
- [Licenza](#licenza)

## Presentazione

CariPrompt trasforma qualsiasi computer in una regia da gobbo:

- lo **schermo dell'operatore** serve a scrivere e correggere il testo, regolare la velocità e pilotare la riproduzione;
- lo **schermo di uscita** (monitor da gobbo, TV, proiettore, iPad usato come schermo) mostra il testo a tutto schermo, ribaltato per il vetro semiriflettente;
- lo **schermo intero** sostituisce i due precedenti per un uso in solitaria, davanti al computer.

L'applicazione è **gratuita, open source (licenza MIT), senza account, senza pubblicità e senza connessione a Internet**. Nessun dato lascia il suo computer.

### Funziona offline, per costruzione

Nessuna telemetria, nessuna verifica di licenza, nessuna richiesta all'avvio. Tutto ciò che serve durante una ripresa — visualizzazione, scorrimento, velocità, specchio, comandi, registrazione delle riprese, progetti locali — funziona senza connessione, compreso al primo avvio.

Due eccezioni, entrambe attivate da un clic e mai durante la riproduzione:
- la **Scrittura IA** (traduzione, adattamento al parlato) contatta il fornitore scelto;
- la **Trascrizione** scarica una sola volta il suo modello Whisper; in seguito funziona interamente offline.

### Prestazioni

Misurazioni su uno script di **20 000 parole** (2 h 22 di lettura), in rendering software senza accelerazione grafica:

| Indicatore | Valore |
|---|---|
| Tempo per immagine durante lo scorrimento | 16,7 ms (mediana), 17,6 ms nel caso peggiore |
| Immagini perse | nessuna |
| Nodi visualizzati | 515 |
| Memoria JavaScript | 10 MB |

Lo scorrimento tiene 60 immagini al secondo senza scatti. Viene applicato direttamente al DOM tramite `requestAnimationFrame`, fuori dal ciclo di rendering dell'interfaccia: la dimensione dello script non influisce sulla fluidità.

## Funzionalità

### Riproduzione e velocità

- **Velocità da 0 a 100**, a passi di 1 (0 = testo fermo, 35 ≈ ritmo parlato corrente). Internamente, 1 punto corrisponde a 4 parole al minuto.
- **Durata stimata** calcolata in tempo reale a partire dal numero di parole e dalla velocità.
- **Durata obiettivo**: indichi la durata voluta per il video e la velocità viene calcolata automaticamente. Un avviso compare se la durata richiede una velocità fuori intervallo. Qualsiasi modifica manuale della velocità disattiva la durata obiettivo.
- **Conto alla rovescia di 3 secondi** prima di ogni avvio (disattivabile). Spazio durante il conto alla rovescia lo annulla.
- **Navigazione** a passi di 10 secondi, per paragrafo, con la rotella sopra l'anteprima, e barra di avanzamento cliccabile.
- **Clic nell'editor**: l'anteprima si posiziona immediatamente sul passaggio cliccato.
- **Cambio di velocità e di corpo in piena riproduzione**, senza salti del testo: la posizione viene conservata.
- **Timecode** opzionale sullo schermo dello speaker: cronometro reale della ripresa (pause escluse, azzerato al ritorno all'inizio), tempo rimanente stimato, o entrambi.
- **Schermo nero** istantaneo (tasto <kbd>B</kbd> o <kbd>.</kbd>), come in PowerPoint.
- **Scorrimento fluido** sincronizzato con l'aggiornamento dello schermo, **sospensione bloccata** durante la riproduzione.

### Testo e tipografia

- **Stile per selezione**: selezioni una parte del testo e le assegni un colore, il grassetto o il corsivo. Pensato per attribuire **un colore per interlocutore** in un dialogo. Gli stili seguono il testo quando lo modifica.
- **Carattere** a scelta fra tutti i caratteri installati sul computer.
- **Spessore** (sottile fino a nero), **corsivo**, **maiuscole**.
- **Colori** del testo, dello sfondo e della linea di lettura, con ritorno ai colori predefiniti.
- **Corpo** da 24 a 500 pt e **interlinea** da 1 a 2,5.
- **Allineamento** a sinistra o centrato, **margini** laterali regolabili.
- **Correttore ortografico** nell'editor, allineato alla lingua dell'interfaccia.
- **Annullamento e ripristino**: <kbd>⌘</kbd><kbd>Z</kbd> e <kbd>⌘</kbd><kbd>⇧</kbd><kbd>Z</kbd> su Mac, <kbd>Ctrl</kbd><kbd>Z</kbd> e <kbd>Ctrl</kbd><kbd>Y</kbd> altrove. Le battute ravvicinate contano per un solo passo, i cambi di colore ne formano uno a parte, e il cursore torna al punto modificato.

### Visualizzazione e schermi

- **Specchio** a scelta: nessuno, orizzontale (vetro da gobbo classico), verticale o entrambi (rotazione di 180°). Impostazioni separate per l'anteprima e per lo schermo intero.
- **Anteprima fedele**: l'anteprima è resa alla risoluzione esatta dello schermo di uscita, quindi gli a capo sono identici.
- **Linea di lettura** segnalata da due frecce e da una fascia, posizione regolabile, mostrabile o nascondibile.
- **Sfumatura** in alto e in basso sullo schermo per tenere lo sguardo sulla linea attiva.
- Uscita su **qualsiasi schermo collegato**, a tutto schermo senza bordi, con rilevamento automatico dei collegamenti e degli scollegamenti.
- **Schermo intero** per l'uso in solitaria: pulsante nella barra degli strumenti oppure <kbd>⌘</kbd><kbd>⇧</kbd><kbd>F</kbd> / <kbd>Ctrl</kbd><kbd>Maiusc</kbd><kbd>F</kbd>, uscita con <kbd>Esc</kbd>.
- La tastiera e la rotella funzionano anche quando il mouse si trova sullo schermo di uscita.

<p align="center">
  <img src="docs/screenshot-fullscreen.png" alt="Modalità a schermo intero" width="720">
</p>

### Riprese

Il pulsante **Registra audio**, sotto i comandi di riproduzione, avvia una **ripresa**, che trascina con sé il gobbo: conto alla rovescia, poi scorrimento; l'arresto mette il gobbo in pausa.

Le riprese sono legate al testo per il quale sono state registrate: il blocco mostra solo quelle del testo aperto, e una casella «Tutte le riprese» dà accesso all'insieme. Ogni ripresa viene nominata automaticamente **RIPRESA 01**, **RIPRESA 02**… (la numerazione riparte da 01 per ogni testo) e conserva la sua ora, la sua durata, lo script utilizzato, la posizione raggiunta, la velocità e la sua analisi. La si può **rinominare, bloccare, annotare, marcare, riprodurre, confrontare, mostrare nel Finder, esportare ed eliminare**. Una ripresa bloccata non può essere né rinominata né eliminata. L'audio viene registrato in **WAV** (PCM a 16 bit, mono, alla frequenza del microfono): non compresso, leggibile da tutti i software di montaggio, e direttamente sfruttabile dalla trascrizione prevista nella 2.0.

### Coach del ritmo

Durante una ripresa, il suono viene analizzato in continuo, **senza trascrizione**: livello, attività vocale, attacchi sillabici. CariPrompt ne deduce un ritmo approssimato, lo confronta con la velocità del gobbo e mostra un'indicazione discreta — «Buon ritmo», «Rallenta un poco», «Accelera un poco». Compare solo dopo 2,5 secondi di stabilità, non interrompe mai la riproduzione, e un interruttore la disattiva completamente.

Ogni ripresa conserva la sua analisi: ritmo medio, scarto con il gobbo, numero di pause, silenzio totale, tempo di parola, irregolarità.

> [!NOTE]
> Questa analisi in diretta si basa sul solo segnale audio: individua un ritmo, non legge le parole. L'analisi del discorso, parola per parola, avviene dopo la ripresa, a partire dalla trascrizione (vedi più sotto).

### Tracciamento vocale

Il pulsante **Segui voce**, sotto i comandi di riproduzione, fa **seguire la sua voce** al gobbo: il testo avanza quando parla, **si ferma quando fa una pausa**, e **recupera un passaggio saltato** — con l'indicazione «Passaggio saltato» sullo schermo se il coach è attivo. Se torna indietro per riprendere una frase, anche il testo vi ritorna. Tutto avviene sul computer, offline.

Come funziona:
1. **Riconoscimento continuo.** Whisper non trascrive in flusso: appena è libero ed è arrivato del parlato nuovo, viene rilanciato sugli ultimi sei secondi dell'enunciato in corso. Il rilevamento di attività vocale decide quando decodificare — mai sul silenzio, dove Whisper inventa volentieri del testo.
2. **Allineamento.** La fine di ogni trascrizione viene riagganciata al testo con un allineamento locale parola per parola (Smith-Waterman), tollerante alle parole mal riconosciute, in una finestra attorno alla posizione corrente. Tornare indietro costa più che avanzare, e un grande salto richiede una corrispondenza forte: il tracciamento non si imbizzarrisce su una frase somigliante.
3. **Regolazione.** Dieci volte al secondo, la velocità di scorrimento diventa il suo ritmo misurato più una correzione dello scarto. Una **predizione** compensa la latenza di Whisper: fra due trascrizioni, la posizione avanza al suo ritmo.

Il tracciamento usa il **più leggero dei modelli installati**, per la latenza più bassa: scarichi **Base** (198 MB) anche se trascrive le riprese con Turbo. Il tracciamento vocale e la velocità impostata non si combinano: quando il tracciamento è attivo, è la sua voce a dare il ritmo; quando è disattivato, la velocità impostata riprende il comando.

> [!NOTE]
> Misurazioni di sviluppo, voce di sintesi e processore a 2 core: scarto mediano fra la voce e il testo di 1,8 parole con il solo motore, di 3 parole nell'applicazione completa, dove Whisper dispone di un solo core e impiega 1,5 s per decodifica. Su un Mac recente, Whisper Base decodifica in una frazione di secondo: lo scarto si riduce di conseguenza.

### Trascrizione, analisi del discorso e sottotitoli

Ogni ripresa può essere **trascritta sul computer, senza connessione**, da Whisper. Il modello si scarica una sola volta dal blocco **Trascrizione**; in seguito, ogni ripresa viene trascritta automaticamente alla fine della registrazione (disattivabile), oppure su richiesta.

| Modello | Download | Su disco | Nota |
|---|---|---|---|
| **Turbo** (predefinito) | 538 MB | 1,0 GB | Il più preciso, e più rapido di Small |
| Small | 610 MB | 375 MB | Intermedio |
| Base | 198 MB | 160 MB | Il più leggero, sensibilmente meno accurato in francese |

Misurazioni di sviluppo, su una voce di sintesi francese in condizioni pulite e un processore a 2 core: Turbo ha commesso un solo errore di parola su 150, e trascrive un minuto di ripresa in circa 30 secondi. Una voce vera, una stanza vera e un Mac a 10 core cambieranno questi numeri — la precisione verso il basso, la velocità verso l'alto.

**Analisi del discorso**, confrontata con il testo del gobbo:

| Misura | Che cosa dice |
|---|---|
| Fedeltà al testo | quota delle parole del passaggio letto effettivamente pronunciate |
| Passaggi saltati | estratti di almeno tre parole non pronunciate; un clic vi porta il gobbo |
| Parole aggiunte | parole pronunciate assenti dal testo |
| Ritmo | parole al minuto, fra la prima e l'ultima parola detta |
| Intercalari, ripetizioni | «ehm», «cioè», «andiamo a, andiamo a»… contati solo se non sono nel testo |
| Esitazioni | pause di oltre 0,8 s in mezzo a una frase |

Le indicazioni fra parentesi quadre (`[SORRISO]`) vengono ignorate, e «centoventi» nel testo corrisponde correttamente a «120» nella trascrizione.

> [!IMPORTANT]
> Whisper **cancella volentieri le disfluenze**: «ehm», false partenze, parole ripetute. Il modello Turbo lo fa più di Base. I conteggi di intercalari e di ripetizioni sono quindi dei **minimi**. I passaggi saltati, la fedeltà e le esitazioni, invece, non dipendono da questo comportamento.

**Sottotitoli**: la trascrizione viene suddivisa secondo gli usi di diffusione — due righe da 42 caratteri al massimo, da 1 a 7 secondi sullo schermo, al massimo 17 caratteri al secondo — tagliando di preferenza alle fini di frase, alle virgole e prima delle congiunzioni, mai dopo un articolo o una preposizione. I tagli sono allineati ai silenzi reali. L'editor permette di riprodurre la ripresa, correggere il testo, regolare i tempi (↑/↓ per ±0,1 s), dividere al cursore, unire, eliminare; i sottotitoli troppo veloci vengono segnalati. **Esportazione in SRT** (UTF-8 con BOM, fine riga CRLF, per i software di montaggio).

### Scrittura IA

Due trasformazioni, a partire dal testo aperto, che producono ciascuna un **nuovo testo** collocato appena sotto — l'originale non viene mai modificato:

- **Traduci il testo** in inglese, francese, spagnolo, tedesco, italiano, portoghese o olandese. L'istruzione chiede un adattamento per l'orecchio, non una traduzione parola per parola.
- **Adatta al parlato**: frasi brevi che stanno in un respiro, elenchi convertiti in frasi, eliminazione di ciò che non si dice (parentesi, abbreviazioni, «cfr.»). Una pausa breve è segnata da «/», una pausa lunga da un nuovo paragrafo, e le parole da enfatizzare passano in **grassetto**. Nessuna informazione, nessuna cifra, nessun nome e nessuna chiamata all'azione viene rimossa.

Tre protezioni non dipendono dal modello:

| Elemento | Trattamento |
|---|---|
| URL, e-mail, variabili (`{{prenom}}`, `{x}`, `%s`, `$VAR`), indicazioni fra parentesi quadre (`[SORRISO]`) | **Sostituiti da token prima dell'invio**, poi ripristinati identici. Il fornitore non li vede. |
| Cifre | Confrontate fra l'originale e il risultato. Ogni paragrafo in cui una cifra è scomparsa o è cambiata viene **segnalato dal suo numero**. |
| Colori degli interlocutori | Il colore di un paragrafo segue tutti i paragrafi in cui si trasforma. Il grassetto parziale viene conservato. |

Il fornitore si sceglie nel blocco: **Claude (Anthropic)** o **OpenAI**, con la sua chiave API personale. L'elenco dei modelli viene letto direttamente presso il fornitore; per impostazione predefinita, Claude Sonnet 5 e GPT-5.6 Terra. La chiave è cifrata nel portachiavi di sistema (Portachiavi macOS, Gestione credenziali Windows, portachiavi GNOME/KDE), non viene mai trasmessa all'interfaccia, e viene inviata soltanto al fornitore scelto. I testi lunghi partono a lotti di circa 1 200 parole, tre alla volta, con una barra di avanzamento e un pulsante di annullamento.

> [!NOTE]
> Su macOS, non essendo l'applicazione firmata da uno sviluppatore identificato, il Portachiavi può chiedere la sua password dopo ogni aggiornamento per autorizzare CariPrompt a rileggere la propria chiave. Scelga «Consenti sempre».

### Testi, progetti e preimpostazioni

- **Libreria di testi**: quanti testi servono, ciascuno con la sua velocità, la sua durata obiettivo e i suoi colori.
- **Testi inclusi**: un testo **Welcome** che presenta tutte le funzioni nelle cinque lingue dell'interfaccia, e uno **Script di prova** breve per ogni lingua per regolare la velocità e provare il tracciamento vocale. Vengono aggiunti una sola volta; i vecchi testi di benvenuto non modificati sono sostituiti, quelli che ha ritoccato sono conservati.
- **Selezione multipla** come nel Finder: <kbd>⇧</kbd> + clic per un intervallo, <kbd>⌘</kbd> / <kbd>Ctrl</kbd> + clic per aggiungere o togliere un testo. Il clic destro agisce allora su tutta la selezione.
- **Ricerca per parola chiave** nei titoli, in cima all'elenco. Indifferente a maiuscole e accenti: «presi» trova «Auguri del presidente».
- **Salvataggio automatico** a ogni modifica e alla chiusura.
- **Importazione** per trascinamento ovunque nella finestra, tramite la zona di rilascio della colonna di sinistra, o tramite il pulsante dedicato. Ogni file diventa un nuovo testo: niente viene sovrascritto.
- **Duplicare, esportare in .txt, eliminare** (clic destro su un testo), con annullamento dell'eliminazione per 6 secondi.
- **Progetti `.cariprompt`**: un testo e tutte le sue impostazioni in un file.
- **Preimpostazioni**: l'insieme delle impostazioni di visualizzazione salvato sotto un nome («iPad CACE», «Studio 2»…) e richiamato con un clic. Memorizzano anche l'ordine dei blocchi del pannello.
- **Pannello delle impostazioni riordinabile**: ogni blocco si sposta trascinandolo dalla sua intestazione, per mettere in alto quelli che usa di più. L'ordine torna alla disposizione predefinita all'avvio successivo; per conservarlo, lo salvi in una preimpostazione.

### Interfaccia

- **Cinque lingue**: inglese (predefinito), francese, spagnolo, tedesco, italiano. Menu, finestre di dialogo, messaggi e correttore ortografico seguono la lingua scelta.
- **Aspetto Sistema, Chiaro o Scuro** (Sistema come predefinito).
- Stile macOS, identico su Windows e Linux.
- **Promemoria delle scorciatoie** richiudibile in fondo alla colonna di sinistra.
- **Nessun suono**: l'interfaccia non emette alcun bip, nemmeno su un tasto non riconosciuto.
- Numero di versione mostrato accanto al nome dell'applicazione.
- **Pannello delle impostazioni a schede**: **Essenziale** (uscita, velocità, durata obiettivo, comandi, telecomando), **Impaginazione** (tipografia, colori, impaginazione, timecode), **Trascrizione** (riprese, trascrizione), **Strumenti IA** e **Personale**. In ogni scheda, i blocchi si riordinano per trascinamento e si chiudono con la freccia della loro riga di titolo; la «i» fornisce la spiegazione del blocco.
- **Scheda Personale**: il menu in cima alla scheda vi aggiunge qualsiasi blocco, che resta anche nella sua scheda d'origine. Il suo contenuto è conservato al riavvio, e le preimpostazioni ne salvano più disposizioni.
- **Su macOS**, le colonne laterali lasciano intravedere la materia del sistema (vibrancy), come le barre laterali delle applicazioni Apple, e i tratti di separazione delle grandi zone lasciano il posto a semplici scarti di tinta.
- **Aggiornamenti**: in fondo al pannello, «Cerca aggiornamenti» interroga l'ultima versione pubblicata su GitHub. La verifica all'avvio può essere disattivata; nessun dato viene inviato e l'installazione resta manuale.

### Menu

| Sistema | Posizione |
|---|---|
| macOS | Barra dei menu in cima allo schermo: **CariPrompt**, **Archivio**, **Modifica**, **Vista** (Aspetto, Lingua), **Gobbo**, **Finestra** — e pulsante **☰** nella finestra |
| Windows / Linux | Pulsante **☰** in alto a sinistra nella finestra |

Il pulsante **☰** dà accesso, sui tre sistemi, ad **Archivio**, **Gobbo**, **Aspetto**, **Lingua**, **Informazioni** ed **Esci**.
In inglese, i menu si chiamano *File*, *Edit*, *View* (*Appearance*, *Language*), *Prompter*, *Window*.
Le preferenze di lingua e di aspetto vengono salvate e riprese all'avvio successivo.

## Scaricare

I file sono disponibili nella pagina **[Releases](https://github.com/CaribouNathan/CariPrompt/releases/latest)**.

| Sistema | File | Nota |
|---|---|---|
| macOS — Apple Silicon (da M1 a M4) | `CariPrompt-2.2.2-macOS-AppleSilicon.dmg` | macOS 12 o più recente, installazione per trascinamento |
| macOS — Apple Silicon (da M1 a M4) | `CariPrompt-2.2.2-macOS-AppleSilicon.zip` | Stessa applicazione, senza immagine disco |
| Windows 10 / 11 (64 bit) | `CariPrompt-2.2.2-Windows-Setup.exe` | Installer classico |
| Windows 10 / 11 (64 bit) | `CariPrompt-2.2.2-Windows-Portable.exe` | Senza installazione, si avvia direttamente |
| Linux x86_64 | `CariPrompt-2.2.2-Linux-x86_64.AppImage` | Tutte le distribuzioni |
| Debian, Ubuntu e derivate | `CariPrompt-2.2.2-Linux-amd64.deb` | Pacchetto installabile |

> Dalla 2.0.2, vengono forniti solo i Mac **Apple Silicon** (M1 e successivi): menu  › **Informazioni su questo Mac**, riga **Chip**. Su un Mac Intel, l'applicazione si compila dai sorgenti con `MAC_ARCHS=x64 npm run dist:mac`.

## Installazione — applicazione non firmata

> [!IMPORTANT]
> CariPrompt è un progetto personale gratuito. **Non è firmato** con un certificato Apple Developer né con un certificato di firma del codice Windows: questi certificati sono a pagamento e annuali.
> Il suo sistema mostrerà quindi un avviso al primo avvio. È normale. Il codice sorgente è interamente consultabile in questo repository.

### macOS

1. Apra il `.dmg` e trascini **CariPrompt** sulla scorciatoia **Applicazioni** (oppure decomprima lo `.zip` e trascini **CariPrompt.app** in **Applicazioni**).
2. Avvii l'applicazione. macOS indica che non può essere verificata: faccia clic su **Fine** (o **OK**).
3. Apra **Impostazioni di Sistema › Privacy e sicurezza**. In fondo alla pagina, accanto al messaggio relativo a CariPrompt, faccia clic su **Apri comunque**, poi confermi.
4. Riavvii CariPrompt: l'avviso non comparirà più.

**Altro metodo, dal Terminale** (rimuove l'attributo di quarantena aggiunto dal browser):

```bash
xattr -cr /Applications/CariPrompt.app
```

> Se macOS indica che l'applicazione «è danneggiata», si tratta della stessa protezione: usi il comando qui sopra.

### Windows

1. Avvii `CariPrompt-2.2.2-Windows-Setup.exe` (o la versione portatile).
2. Compare **Windows ha protetto il PC** (SmartScreen): faccia clic su **Ulteriori informazioni**, poi su **Esegui comunque**.
3. L'installer permette di scegliere la cartella di installazione. Viene creata una scorciatoia nel menu Start e sul desktop.

### Linux

**AppImage**:

```bash
chmod +x CariPrompt-2.2.2-Linux-x86_64.AppImage
./CariPrompt-2.2.2-Linux-x86_64.AppImage
```

Alcune distribuzioni recenti richiedono la libreria FUSE 2 (`sudo apt install libfuse2t64` su Ubuntu 24.04).

**Pacchetto .deb**:

```bash
sudo apt install ./CariPrompt-2.2.2-Linux-amd64.deb
```

## Primi passi

1. **Carichi il testo**: lo digiti, lo incolli, oppure trascini un file nella finestra.
2. **Colori gli interlocutori** (facoltativo): selezioni una battuta, faccia clic su un colore nella barra **Selezione**.
3. **Regoli la velocità**, oppure attivi **Durata obiettivo** e indichi la durata voluta.
4. **Scelga lo schermo di uscita** e lo **Specchio**, poi faccia clic su **Mostra l'uscita**. Senza un secondo schermo, usi lo **Schermo intero**.
5. **Avvii** con <kbd>⌥</kbd><kbd>Spazio</kbd>. Regoli in diretta con la rotella o con le frecce.
6. **Salvi** le sue impostazioni in una preimpostazione, oppure l'insieme testo + impostazioni in un progetto `.cariprompt`.

## Scorciatoie

Le scorciatoie del gobbo sono attive non appena il cursore non si trova in un campo di testo. <kbd>Esc</kbd> esce dall'area di testo, e anche un clic sull'anteprima.

| Tasto | Azione |
|---|---|
| <kbd>⌥</kbd> <kbd>Spazio</kbd> (<kbd>Alt</kbd> <kbd>Spazio</kbd> su Windows e Linux) | Riproduci / pausa (annulla il conto alla rovescia se è in corso). Funziona anche durante la scrittura del testo. |
| <kbd>↓</kbd> / <kbd>↑</kbd> | Più veloce / più lento (±1) |
| <kbd>←</kbd> / <kbd>→</kbd> | Indietro / avanti di 10 secondi |
| <kbd>+</kbd> / <kbd>−</kbd> | Ingrandire / ridurre il testo, anche durante la riproduzione |
| Rotella o trackpad sull'anteprima | Navigare nel testo (<kbd>⌥</kbd>: regolare la velocità) |
| Rotella o trackpad altrove | Più veloce / più lento |
| <kbd>B</kbd> o <kbd>.</kbd> | Schermo nero |
| <kbd>Pag ↓</kbd> / <kbd>Pag ↑</kbd> | Tasti del telecomando (azioni configurabili) |
| <kbd>F5</kbd> | Riproduci |
| <kbd>Inizio</kbd> | Torna all'inizio |
| <kbd>Esc</kbd> | Uscire dal campo di testo, o dallo schermo intero |

| macOS | Windows / Linux | Azione |
|---|---|---|
| <kbd>⌘</kbd> <kbd>Z</kbd> | <kbd>Ctrl</kbd> <kbd>Z</kbd> | Annulla |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>Z</kbd> | <kbd>Ctrl</kbd> <kbd>Y</kbd> | Ripristina |
| <kbd>⌘</kbd> <kbd>N</kbd> | <kbd>Ctrl</kbd> <kbd>N</kbd> | Nuovo testo |
| <kbd>⌘</kbd> <kbd>O</kbd> | <kbd>Ctrl</kbd> <kbd>O</kbd> | Importare dei file |
| <kbd>⌘</kbd> <kbd>S</kbd> | <kbd>Ctrl</kbd> <kbd>S</kbd> | Salvare il progetto |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>O</kbd> | <kbd>Ctrl</kbd> <kbd>Maiusc</kbd> <kbd>O</kbd> | Aprire un progetto |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>F</kbd> | <kbd>Ctrl</kbd> <kbd>Maiusc</kbd> <kbd>F</kbd> o <kbd>F11</kbd> | Schermo intero |
| <kbd>⌘</kbd> <kbd>D</kbd> | <kbd>Ctrl</kbd> <kbd>D</kbd> | Duplicare il testo |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>E</kbd> | <kbd>Ctrl</kbd> <kbd>Maiusc</kbd> <kbd>E</kbd> | Esportare in .txt |
| <kbd>⌘</kbd> <kbd>R</kbd> | <kbd>Ctrl</kbd> <kbd>R</kbd> | Tornare all'inizio |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>D</kbd> | <kbd>Ctrl</kbd> <kbd>Maiusc</kbd> <kbd>D</kbd> | Mostrare / nascondere l'uscita |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>T</kbd> | <kbd>Ctrl</kbd> <kbd>Maiusc</kbd> <kbd>T</kbd> | Tracciamento vocale (attivo / disattivo) |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>R</kbd> | <kbd>Ctrl</kbd> <kbd>Maiusc</kbd> <kbd>R</kbd> | Registrazione audio (attiva / disattiva) |

Il verso della rotella segue l'impostazione **scorrimento naturale** di macOS. Può essere invertito in **Impostazioni › Comandi**, dove si sceglie anche l'azione della rotella sull'anteprima: **Navigare nel testo** (impostazione predefinita) o **Regolare la velocità**. Il tasto <kbd>⌥</kbd> dà l'altra azione.
Nella colonna di modifica, nell'elenco dei testi e nelle impostazioni, la rotella scorre normalmente.

## Telecomando per presentazioni

CariPrompt si pilota con i telecomandi pensati per PowerPoint (Logitech R400 / R500 / Spotlight, Kensington, Targus…), che si comportano come una tastiera:

| Tasto | Azione |
|---|---|
| Avanti (Pag ↓) | A scelta, per impostazione predefinita **riproduci / pausa** |
| Indietro (Pag ↑) | A scelta, per impostazione predefinita **indietro di 10 s** |
| Avvia la presentazione (F5) | Riproduci |
| Schermo nero (B o .) | Schermo nero / ritorno al testo |

Azioni disponibili per Avanti e Indietro: riproduci / pausa, paragrafo successivo, paragrafo precedente, avanti o indietro di 10 s, più veloce, più lento, torna all'inizio, niente.

## Formati importabili

| Formato | Estensioni | Nota |
|---|---|---|
| Testo semplice | `.txt` `.text` `.md` `.markdown` | UTF-8, UTF-16 o Windows-1252 rilevati automaticamente |
| Word | `.docx` | |
| Word 97-2003 | `.doc` | Solo il testo principale |
| RTF | `.rtf` | |
| OpenDocument | `.odt` | LibreOffice, OpenOffice |
| HTML | `.html` `.htm` | |
| PDF | `.pdf` | Gli a capo di impaginazione vengono eliminati |
| Progetto CariPrompt | `.cariprompt` | Testo **e** impostazioni |

Non supportati: i file **Pages** (da esportare prima in `.docx` o `.pdf`) e i **PDF scansionati** senza livello di testo. L'importazione recupera il testo, non la formattazione del documento d'origine.

## Progetti e preimpostazioni

|  | Progetto `.cariprompt` | Preimpostazione |
|---|---|---|
| Contiene il testo e i suoi colori | Sì | No |
| Contiene le impostazioni di visualizzazione | Sì | Sì |
| Contiene l'ordine dei blocchi del pannello | Sì | Sì |
| Archiviazione | File, nel punto che preferisce | Nell'applicazione |
| Uso | Archiviare o trasmettere un servizio completo | Richiamare una configurazione hardware |

- **Salvare un progetto**: <kbd>⌘</kbd><kbd>S</kbd> / <kbd>Ctrl</kbd><kbd>S</kbd>. **Aprirlo**: <kbd>⌘</kbd><kbd>⇧</kbd><kbd>O</kbd>, trascinamento, o doppio clic sul file. Il testo viene aggiunto alla libreria e le impostazioni vengono applicate.
- **Salvare una preimpostazione**: pulsante **Salva le impostazioni attuali…** in cima alle impostazioni, poi un nome («iPad CACE»). Un clic sulla sua pastiglia la richiama, la croce la elimina.
- In entrambi i casi, la **lingua**, l'**aspetto** e lo **schermo di uscita** non vengono ripresi: restano propri del computer utilizzato.
- Il file di progetto è in formato JSON, leggibile e modificabile.

## Dove sono archiviati i miei testi?

I testi (`scripts.json`) e le impostazioni (`settings.json`, che contiene anche le preimpostazioni) vengono salvati localmente:

| Sistema | Cartella |
|---|---|
| macOS | `~/Library/Application Support/CariPrompt/` |
| Windows | `%APPDATA%\CariPrompt\` |
| Linux | `~/.config/CariPrompt/` |

Le riprese si trovano nella sottocartella `takes/`: un file audio per ripresa e un indice `index.json`.
Le chiavi API della Scrittura IA si trovano in `ai-keys.json`, cifrate dal portachiavi di sistema.
I modelli di trascrizione si trovano nella sottocartella `stt/`; si possono eliminare dal blocco Trascrizione.
Per salvare o trasferire i suoi testi, copi `scripts.json`.
In caso di problemi, gli errori interni sono registrati in `cariprompt.log`, nella stessa cartella.

## Cronologia delle versioni

Il dettaglio è nel [CHANGELOG](CHANGELOG.md).

| Versione | Tecnologia | Piattaforme | Novità principali |
|---|---|---|---|
| **2.2.2** | Electron | macOS Apple Silicon, Windows, Linux | Vibrancy macOS sulle colonne, anteprima meglio staccata, README in cinque lingue |
| 2.2.1 | Electron | macOS Apple Silicon, Windows, Linux | Icona scontornata, schede su una sola riga in tutte le lingue, colonne traslucide su macOS |
| 2.2.0 | Electron | macOS Apple Silicon, Windows, Linux | Pannello delle impostazioni a schede, blocchi richiudibili, scheda personalizzabile, verifica degli aggiornamenti, immagine .dmg, applicazione alleggerita |
| 2.1.0 | Electron | macOS Apple Silicon, Windows, Linux | Testo «Welcome» multilingue e script di prova inclusi; scorciatoie per il tracciamento vocale e la registrazione |
| 2.0.2 | Electron | macOS Apple Silicon, Windows, Linux | Nuova icona; fine della versione Mac Intel |
| 2.0.1 | Electron | macOS, Windows, Linux | Pulsanti «Segui voce» e «Registra audio» etichettati e tradotti, con il loro stato |
| 2.0.0 | Electron | macOS, Windows, Linux | Tracciamento vocale: il gobbo segue la voce, si ferma alle pause, recupera i passaggi saltati; testo fino a 500 pt |
| 1.9.1 | Electron | macOS, Windows, Linux | Messaggio chiaro quando l'account API non ha più credito; ritorno di Windows, Linux e macOS Intel |
| 1.9.0 | Electron | macOS, Windows, Linux | Trascrizione locale (Whisper), analisi del discorso confrontata con il testo, sottotitoli ed esportazione SRT |
| 1.8.0 | Electron | macOS, Windows, Linux | Scrittura IA: traduzione e adattamento al parlato, Claude o OpenAI, elementi protetti e cifre controllate |
| 1.7.3 | Electron | macOS, Windows, Linux | Registrazione delle riprese in WAV, legate al loro testo, coach del ritmo, annullamento nell'editor |
| 1.6.0 | Electron | macOS, Windows, Linux | Cinque lingue di interfaccia, ricerca dei testi, prestazioni validate su 20 000 parole |
| 1.5.0 | Electron | macOS, Windows, Linux | Pannello delle impostazioni riordinabile, testo fino a 400 pt, riproduci/pausa su ⌥ + Spazio |
| 1.4.2 | Electron | macOS, Windows, Linux | Navigazione con la rotella, selezione multipla, sincronizzazione al clic, correzione macOS della barra dei menu |
| 1.4.1 | Electron | macOS, Windows, Linux | Stile per selezione (un colore per interlocutore), preimpostazioni, zona di rilascio, nuova icona |
| 1.4.0 | Electron | macOS, Windows, Linux | Tipografia e colori, progetti `.cariprompt`, telecomando per presentazioni, interlinea, velocità 0–100, schermo intero, timecode |
| 1.3.1 | Electron | macOS, Windows, Linux | Linea di lettura nascondibile, testi di benvenuto in inglese e francese, correzioni di impaginazione |
| 1.3.0 | Electron | macOS, Windows, Linux | Interfaccia in inglese o in francese, aspetto Sistema / Chiaro / Scuro, pulsante ☰ |
| 1.2.0 | Electron | macOS, Windows, Linux | Prima versione multipiattaforma, icona, binari pronti all'uso |
| 1.1.0 | SwiftUI | macOS | Importazione di documenti, libreria di testi |
| 1.0.0 | SwiftUI | macOS | Prima versione: uscita a specchio, durata obiettivo, conto alla rovescia, scorciatoie |

Le versioni 1.0 e 1.1 (native macOS) sono sostituite dalla versione Electron. Su Mac, la libreria di testi viene ripresa automaticamente da una versione all'altra.

## Limiti noti

- **Applicazione non firmata**: avviso al primo avvio (vedi [Installazione](#installazione--applicazione-non-firmata)).
- **Velocità uniforme in altezza**: la velocità è calcolata a partire dal numero medio di parole per riga. Una riga corta passa alla stessa velocità di una riga piena.
- **Caratteri**: l'elenco viene letto alla prima apertura delle impostazioni (qualche secondo su un Mac che contiene molti caratteri). Un carattere assente dal computer che apre un progetto viene sostituito dal carattere di sistema.
- **Timecode rimanente**: stima basata sulla velocità attuale, cambia se la velocità cambia.
- **Trackpad**: l'inerzia non può essere distinta da un gesto volontario, quindi la cadenza di cambio della velocità è limitata.
- **Nessun aggiornamento automatico**: le nuove versioni vanno scaricate nelle Releases.
- **Linux**: viene fornita solo l'architettura x86_64.
- **Tracciamento vocale**: bisogna leggere il testo. Un'improvvisazione che se ne discosta fa passare il tracciamento allo stato «perso» (pulsante arancione): il testo attende che la voce ritrovi lo script. Una frase ripetuta altrove nel testo può, raramente, attirare il tracciamento; si riaggancia alla frase successiva.
- **Trascrizione**: Whisper non fornisce la marca temporale di ogni parola con questi modelli, solo quella di ogni segmento. La suddivisione dei sottotitoli all'interno di un segmento è quindi proporzionale, riagganciata ai silenzi rilevati. I conteggi di intercalari e di ripetizioni sono dei minimi (vedi più sopra).
- **Scrittura IA**: il controllo delle cifre confronta sequenze di cifre, non valori. «10000» riscritto «10 000» viene segnalato a torto; al contrario, una cifra spostata in un'altra frase dello stesso paragrafo passa inosservata. Una parentesi finale di URL (`…/Page_(X)`) viene presa per punteggiatura.

## Compilare dai sorgenti

Prerequisiti: [Node.js](https://nodejs.org) 22 o più recente.

```bash
git clone https://github.com/CaribouNathan/CariPrompt.git
cd CariPrompt
npm install
npm start            # avvia l'applicazione in modalità sviluppo
```

Creazione dei pacchetti (depositati in `release/`):

| Comando | Risultato | Da eseguire da |
|---|---|---|
| `npm run dist:mac` | `.zip` Apple Silicon firmato ad hoc (`MAC_ARCHS=x64` per Intel) | macOS o Linux (con [rcodesign](https://github.com/indygreg/apple-platform-rs)) |
| `npm run dist:win` | Installer NSIS e versione portatile | Windows, oppure Linux/macOS con Wine |
| `npm run dist:linux` | AppImage e `.deb` | Linux |

Su Mac, `build.command` concatena l'installazione delle dipendenze e la creazione dei pacchetti.

### Architettura

```
src/
├── main/          Processo principale Electron
│   ├── main.ts        finestre operatore e uscita, schermi, archiviazione, menu, progetti
│   ├── preload.ts     API esposta all'interfaccia
│   ├── importer.ts    lettura txt, rtf, doc, docx, odt, html, pdf
│   ├── fonts.ts       elenco dei caratteri installati
│   ├── takes.ts       archiviazione delle riprese e del loro indice
│   ├── ai.ts          chiavi API, chiamate Claude / OpenAI, token protetti, controllo delle cifre
│   ├── stt.ts         modelli Whisper: download, estrazione, coda di trascrizione, tracciamento vocale
│   ├── liveStt.ts     riconoscimento continuo: VAD in flusso, Whisper a finestre scorrevoli
│   ├── sttEngine.ts   WAV, ricampionamento a 16 kHz, VAD Silero, Whisper a finestre
│   └── sttExtract.ts  estrazione .tar.bz2 di riserva, in un thread
├── renderer/      Interfaccia React
│   ├── App.tsx            schermo operatore e schermo intero
│   ├── Output.tsx         schermo di uscita
│   ├── PrompterCanvas.tsx rendering, scorrimento, timecode
│   ├── RichEditor.tsx     editor con stili per selezione
│   ├── recorder.ts        registrazione microfono e analisi del segnale
│   ├── pcmTap.ts          cattura PCM (AudioWorklet), wav.ts: codifica WAV
│   ├── aiText.ts          suddivisione in paragrafi, riporto degli stili
│   ├── speechAnalysis.ts  allineamento parola per parola, passaggi saltati, intercalari, esitazioni
│   ├── liveAlign.ts       allineamento in diretta (Smith-Waterman), ritmo, predizione
│   ├── subtitles.ts       suddivisione secondo le norme di diffusione, SRT
│   ├── store.ts           stato, riproduzione, libreria, progetti, riprese (zustand)
│   └── input.ts           tastiera, rotella, telecomando
└── shared/        Codice comune
    ├── types.ts       tipi e calcoli
    ├── marks.ts       stili parziali del testo
    ├── i18n.ts        traduzioni
    └── locales/       en, fr, es, de, it
```

Principio di sincronizzazione: la posizione di lettura è un avanzamento da 0 a 1, indipendente dall'impaginazione. Lo schermo dell'operatore invia un punto di ancoraggio (posizione e marca temporale) allo schermo di uscita. Ogni finestra calcola poi la propria posizione a ogni immagine. I due schermi restano sincronizzati senza scambio continuo.

Stack: Electron, React, TypeScript, Vite, zustand, mammoth, word-extractor, unpdf, JSZip, sherpa-onnx (Whisper, VAD Silero).

### Contribuire

Le segnalazioni di bug e i suggerimenti sono benvenuti nelle [Issues](https://github.com/CaribouNathan/CariPrompt/issues). Precisi il suo sistema, la versione di CariPrompt e, se possibile, il file interessato.

## Roadmap — dalla 1.6 alla 2.0

| Tappa | Contenuto | Stato |
|---|---|---|
| 1.6.0 | Cinque lingue, ricerca dei testi, funzionamento offline garantito, prestazioni validate | rilasciato |
| 1.7.3 | Registrazione e gestione delle riprese, coach del ritmo, annullamento nell'editor | rilasciato |
| 1.8.0 | Traduzione di script, trasformazione scritto → parlato (Claude o OpenAI) | rilasciato |
| **1.9.0** | Trascrizione locale (Whisper), sottotitoli ed esportazione SRT, analisi del discorso dopo la ripresa | rilasciato |
| **2.0.0** | Tracciamento vocale in tempo reale | rilasciato |

Le funzioni di trascrizione useranno un motore **locale**, per restare utilizzabili sul set senza rete. Le funzioni di testo tramite IA (traduzione, adattamento al parlato) richiederanno una connessione e una chiave API fornita dall'utente; resteranno facoltative e senza effetto sul gobbo stesso.

## Licenza

CariPrompt è un **software libero e gratuito**, distribuito sotto [licenza MIT](LICENSE).
Può usarlo, anche per riprese commerciali, modificarlo e ridistribuirlo liberamente.

© 2026 Nathan Carrillat — Caribou Labs
