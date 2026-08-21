# ANA-101 — Stage Engine V1

**Version:** 1.0  
**Status:** Completed Analysis  
**Target:** STM V2

---

# 1. Purpose

Questo documento analizza il concetto di Stage (denominato "Phase" nella V1) e il suo ruolo nel Competition Engine.

L'obiettivo è comprendere come la V1 organizza le diverse fasi di una competizione, identificando le responsabilità dello Stage e definendo le basi per la progettazione dello Stage Engine della V2.

---

# 2. Functional Overview

Nella V1 il concetto di Stage è rappresentato principalmente dalla tabella `tournament_phases`.

Ogni torneo può contenere una o più fasi.

Esempi:

- Tabellone principale
- Gironi Round Robin
- Tabellone qualificati
- Consolation Bracket

Ogni fase è indipendente e possiede configurazione, partecipanti e struttura proprie.

---

# 3. Responsibilities

Uno Stage è responsabile di:

- contenere una formula di gioco
- gestire i propri partecipanti
- generare la propria struttura
- produrre una classifica (quando prevista)
- qualificare partecipanti verso altri Stage
- determinare il proprio completamento

Non è responsabile della competizione nel suo complesso.

---

# 4. Stage Types presenti nella V1

La V1 implementa diversi tipi di Stage.

## Round Robin

Genera:

- gruppi
- incontri
- classifica
- qualificati

---

## Elimination

Genera:

- tabellone
- propagazione vincitori
- vincitore finale

---

## Consolation

Deriva da uno Stage precedente.

Utilizza un tabellone indipendente.

---

## Individual Round Robin

Implementa un motore completamente dedicato.

Gestisce:

- rotazione partner
- fairness
- ranking individuale

---

# 5. Internal Components

Uno Stage nella V1 è composto logicamente da:

Configuration

↓

Entries

↓

Generator

↓

Matches

↓

Ranking

↓

Qualification

↓

Completion

Questa struttura emerge chiaramente anche se distribuita tra componenti React, RPC e database.

---

# 6. Data Model

Le principali tabelle coinvolte sono:

tournament_phases

↓

tournament_groups

↓

tournament_group_entries

↓

tournament_matches

↓

tournament_rankings

↓

tournament_qualifiers

Per Individual RR esiste un modello dati parallelo.

---

# 7. Workflow

Lo Stage attraversa il seguente ciclo di vita.

Configure

↓

Add Entries

↓

Generate Structure

↓

Play Matches

↓

Ranking

↓

Qualification

↓

Completed

Ogni formula implementa lo stesso workflow generale.

---

# 8. Business Rules

Le principali regole osservate sono:

- uno Stage può essere generato una sola volta
- dopo la generazione alcune configurazioni diventano bloccate
- il ranking è aggiornato automaticamente
- la qualificazione utilizza regole configurabili
- il completamento dipende dagli incontri

---

# 9. UI Components

I principali componenti della V1 sono:

RoundRobinGroupsManager

RoundRobinStandingsTable

RoundRobinPhaseActions

TournamentPhaseBracket

PhaseMatchesManagerSection

TournamentPhasesList

Questi componenti rappresentano differenti viste dello stesso Stage.

---

# 10. RPC

Lo Stage utilizza principalmente:

- generate_round_robin_matches
- generate_elimination_bracket
- generate_elimination_bracket_from_qualifiers
- swap_elimination_bracket_entries

oltre alle RPC dedicate al ranking e ai risultati.

---

# 11. Strengths

La V1 dimostra che il concetto di Stage è corretto.

Vantaggi:

- modularità
- riutilizzo del Match Engine
- supporto multi-formula
- possibilità di concatenare più Stage

---

# 12. Weaknesses

Sono emerse alcune criticità.

## Terminologia

Phase e Stage vengono utilizzati quasi come sinonimi.

---

## Individual RR

È sviluppato come modulo parallelo.

Condivide poca logica con gli altri Stage.

---

## Generator

Ogni formula implementa un generatore differente senza una vera interfaccia comune.

---

## Ranking

Le implementazioni non condividono un motore unico.

---

# 13. Lessons Learned

L'analisi della V1 porta alle seguenti conclusioni.

Uno Stage deve essere completamente autonomo.

Ogni Stage deve possedere:

- configurazione
- generator
- scheduler
- ranking
- qualification
- completion

La Competition deve solamente orchestrare la sequenza degli Stage.

---

# 14. Mapping V1 → V2

| STM V1 | STM V2 |
|----------|----------|
| Tournament Phase | Stage |
| Round Robin Phase | Round Robin Stage |
| Bracket Phase | Elimination Stage |
| Consolation Phase | Consolation Stage |
| Individual RR | Individual Rotation Stage |

---

# 15. Decisions Already Approved

Per STM V2 sono già state approvate le seguenti decisioni.

- Competition contiene Stage ordinati.
- Uno Stage non contiene altri Stage.
- Ogni Stage è completamente autonomo.
- Ranking appartiene allo Stage.
- Qualification appartiene allo Stage.
- Generator appartiene allo Stage.
- Scheduler appartiene allo Stage.
- Court Assignment sarà un servizio indipendente.

---

# 16. Future Evolution

Lo Stage Engine dovrà supportare nuovi tipi senza modificare il Competition Engine.

Esempi:

- Swiss
- League
- Ladder
- Pool Play
- Team Competition
- Final Four
- Multi Venue Stage

Ogni nuovo algoritmo dovrà implementare la stessa interfaccia logica.

---

# 17. Conclusion

La V1 dimostra che il concetto di Stage rappresenta l'unità fondamentale di una competizione.

La V2 formalizzerà questo concetto trasformando lo Stage nel vero motore della competizione.

Competition diventerà esclusivamente un orchestratore di Stage, mentre tutta la logica sportiva sarà incapsulata all'interno dello Stage Engine.

Questa separazione costituirà una delle principali evoluzioni architetturali rispetto alla V1.