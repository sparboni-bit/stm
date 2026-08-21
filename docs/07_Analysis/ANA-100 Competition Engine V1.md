# ANA-100 — Competition Engine V1

**Version:** 1.0  
**Status:** Completed Analysis  
**Target:** STM V2

---

# 1. Purpose

Questo documento descrive il Competition Engine della versione V1 di STM.

L'obiettivo non è documentare il codice, ma analizzare il comportamento del motore, individuandone responsabilità, punti di forza e limitazioni.

Il documento costituisce la base per la progettazione del Competition Engine della V2.

---

# 2. Overview

Il Competition Engine V1 è il cuore dell'applicazione.

Gestisce l'intero ciclo di vita di un torneo:

- configurazione
- iscrizione partecipanti
- generazione della struttura
- gestione incontri
- ranking
- qualificazioni
- conclusione torneo

Il motore è già fortemente modulare ma alcune responsabilità risultano distribuite tra database, RPC e componenti React.

---

# 3. Main Entity

L'entità principale è

Tournament

che rappresenta una competizione completa.

Contiene:

- informazioni generali
- impostazioni
- partecipanti
- fasi
- campi
- incontri
- risultati

---

# 4. Supported Tournament Types

La V1 supporta:

- Single Elimination
- Double Elimination (parziale)
- Round Robin
- Round Robin + Bracket
- Consolation
- Individual Round Robin
- Multi Phase Tournament

Questi tipi condividono gran parte del motore ma utilizzano generatori differenti.

---

# 5. Internal Modules

Il Competition Engine può essere suddiviso nei seguenti moduli logici.

## Competition Setup

Responsabilità:

- creazione torneo
- configurazione
- impostazioni
- partecipanti
- seed
- campi

---

## Structure Generator

Responsabilità:

- generazione tabelloni
- generazione gironi
- propagazione bye
- qualificazioni
- swap partecipanti

---

## Match Engine

Responsabilità:

- assegnazione campi
- gestione live
- inserimento risultati
- ritiro
- undo
- propagazione vincitori

---

## Ranking Engine

Responsabilità:

- classifica gironi
- ranking points
- qualificazioni
- tie break

---

## Bracket Engine

Responsabilità:

- tabellone
- stampa
- visualizzazione
- consolazione

---

## Individual RR Engine

Modulo completamente separato.

Responsabilità:

- planner
- optimizer
- generatore
- fairness
- timer
- report
- classifica

---

# 6. Database Model

Le principali entità sono:

Tournament

↓

Tournament Players

↓

Tournament Teams

↓

Tournament Phases

↓

Tournament Groups

↓

Tournament Matches

↓

Tournament Results

↓

Tournament Rankings

Parallelamente esiste un ramo dedicato all'Individual Round Robin.

---

# 7. Business Workflow

Il workflow principale è:

Create Tournament

↓

Configure Tournament

↓

Add Entries

↓

Generate Structure

↓

Assign Courts

↓

Play Matches

↓

Ranking

↓

Qualification

↓

Next Phase

↓

Tournament Completed

---

# 8. Strengths

Il motore V1 presenta numerosi punti di forza.

## Modularità

Le principali responsabilità sono già separate.

## Affidabilità

Gli algoritmi sono stati validati nell'utilizzo reale.

## Supporto Multi Formula

Round Robin e Tabellone condividono parte consistente del motore.

## Individual RR

Motore innovativo con fairness optimizer.

---

# 9. Weaknesses

Le principali criticità individuate sono:

## Terminologia

Il termine Tournament rende difficile generalizzare il motore.

## Duplicazione

Player e Team vengono gestiti separatamente.

## Responsabilità distribuite

Parte della logica è nelle RPC, parte nei componenti React.

## Individual RR

Motore sviluppato parallelamente rispetto al resto dell'applicazione.

---

# 10. Lessons Learned

L'esperienza della V1 porta alle seguenti conclusioni.

- Il concetto di Stage è corretto.
- Il ranking appartiene allo Stage.
- La qualificazione appartiene allo Stage.
- I generatori devono essere indipendenti.
- Il Match Engine deve essere comune.
- Il Court Assignment deve diventare un servizio.
- Il Result deve essere separato dal Match.

---

# 11. Mapping V1 → V2

| STM V1 | STM V2 |
|----------|----------|
| Tournament | Competition |
| Tournament Player | Competition Entry |
| Tournament Team | Competition Entry |
| Tournament Phase | Stage |
| Tournament Group | Group |
| Tournament Match | Match |
| Tournament Result | Result |
| Tournament Ranking | Ranking |
| Tournament Court | Court |
| Tournament Qualifier | Qualification Rule |

---

# 12. Decisions Already Approved

Durante la progettazione della V2 sono già state approvate le seguenti decisioni.

- Il motore opera esclusivamente su CompetitionEntry.
- Player, Pair e Team sono concetti esterni al motore.
- Competition contiene Stage ordinati.
- Uno Stage non contiene altri Stage.
- Ranking e Qualification appartengono allo Stage.
- Match e Result sono entità distinte.
- La V1 rappresenta il riferimento funzionale della V2.

Queste decisioni sono considerate definitive.

---

# 13. Future Evolution

Il Competition Engine V2 dovrà supportare nativamente:

- Swiss System
- League
- Pool Play
- Team Competition
- Individual Rotation
- Multi Venue
- AI Scheduling
- Live Scoring
- TV Display
- API pubbliche

---

# 14. Conclusion

L'analisi della V1 evidenzia che il Competition Engine possiede già una struttura concettuale molto solida.

La V2 non rappresenta una riscrittura del motore ma una sua evoluzione architetturale.

Gli algoritmi fondamentali rimarranno sostanzialmente invariati; cambieranno invece il modello dati, le responsabilità dei componenti e l'organizzazione complessiva del software, con l'obiettivo di ottenere un motore indipendente dal dominio sportivo, estendibile e facilmente manutenibile.