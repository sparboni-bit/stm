# ANA-102 — Match Engine V1

**Version:** 1.0  
**Status:** Completed Analysis  
**Target:** STM V2

---

# 1. Purpose

Questo documento analizza il Match Engine della versione V1 di STM.

Il Match Engine rappresenta il componente centrale dell'esecuzione di una competizione. Tutte le formule di gioco (Elimination, Round Robin, Consolation, Individual Rotation) convergono sullo stesso concetto di Match.

L'obiettivo dell'analisi è identificare responsabilità, flusso operativo, punti di forza e limitazioni del motore, definendo le basi per il Match Engine della V2.

---

# 2. Functional Overview

Il Match Engine è responsabile della gestione completa del ciclo di vita di ogni incontro.

Le principali funzioni sono:

- pianificazione
- assegnazione campo
- avvio
- gestione live
- inserimento risultato
- propagazione vincitore
- aggiornamento ranking
- completamento

Il Match rappresenta la più piccola unità eseguibile dell'intera competizione.

---

# 3. Responsibilities

Il Match Engine gestisce:

- partecipanti
- stato del match
- assegnazione campo
- programmazione temporale
- punteggio
- vincitore
- modalità di conclusione
- propagazione risultati

Non gestisce:

- ranking
- qualificazioni
- generazione struttura

che appartengono allo Stage Engine.

---

# 4. Match Lifecycle

Ogni Match attraversa il seguente ciclo di vita.

Scheduled

↓

Assigned

↓

Started

↓

Completed

↓

Validated

Durante la V2 potranno essere introdotti ulteriori stati senza modificare il modello principale.

---

# 5. Match Status

La V1 utilizza principalmente:

- scheduled
- started
- completed

Durante l'analisi emergono possibili estensioni:

- pending
- ready
- assigned
- suspended
- cancelled
- abandoned
- validated

---

# 6. Participants

La V1 distingue:

- player
- team

Questa distinzione verrà eliminata nella V2 attraverso CompetitionEntry.

Il Match dovrà conoscere esclusivamente:

Entry A

Entry B

---

# 7. Court Assignment

L'assegnazione del campo costituisce una responsabilità separata.

Il Match conserva solamente il riferimento al campo assegnato.

L'algoritmo di assegnazione appartiene al Court Engine.

---

# 8. Score

Il Match contiene esclusivamente il risultato.

La modalità di calcolo dipende dalla formula della competizione.

Supporto V1:

- Single Set
- Best of 3
- Retirement

Estensioni previste:

- Timed Match
- Walkover
- Abandoned
- Penalty

---

# 9. Winner

Il Match determina sempre un vincitore.

Il vincitore viene successivamente utilizzato da:

- Ranking Engine
- Qualification Engine
- Bracket Engine

Il Match non decide come verrà utilizzato il vincitore.

---

# 10. Business Rules

Le principali regole osservate sono:

- un Match può essere completato una sola volta
- un risultato può essere annullato solo rispettando i vincoli di propagazione
- un Match completato aggiorna automaticamente lo Stage
- il risultato può essere bloccato se esistono incontri successivi già disputati

---

# 11. UI Components

Principali componenti V1:

- TournamentMatchesManager
- IndividualRRMatchesManager
- MatchStatusBadge
- Court Assignment
- Score Editor

---

# 12. Database Model

Principali entità coinvolte:

tournament_matches

↓

tournament_results

↓

tournament_courts

↓

tournament_rankings

Per Individual RR esiste una tabella dedicata.

---

# 13. RPC

Il Match Engine utilizza principalmente:

- submit_tournament_match_result
- undo_match_result
- assign_match_to_court
- propagate_winner
- update_match_status

oltre alle RPC specifiche dell'Individual RR.

---

# 14. Strengths

La V1 dimostra un'elevata solidità del Match Engine.

Punti di forza:

- gestione live
- protezione propagazione risultati
- supporto ritiro
- assegnazione campi
- riutilizzo tra formule differenti

---

# 15. Weaknesses

Le principali criticità osservate sono:

- distinzione Player/Team
- responsabilità distribuite tra RPC e frontend
- gestione punteggi legata al tipo di torneo
- Court Assignment non completamente indipendente

---

# 16. Lessons Learned

Il Match deve rappresentare un'entità completamente indipendente.

Il Match Engine deve conoscere esclusivamente:

- Entry A
- Entry B
- Court
- Score
- Winner
- Status

Qualsiasi altra responsabilità appartiene ad altri Engine.

---

# 17. Mapping V1 → V2

| STM V1 | STM V2 |
|----------|----------|
| Tournament Match | Match |
| Tournament Result | Result |
| Tournament Court | Court |
| Winner Player | Winner Entry |
| Winner Team | Winner Entry |

---

# 18. Decisions Already Approved

Per STM V2 sono già approvate le seguenti decisioni.

- Match e Result saranno entità distinte.
- Il Match opererà esclusivamente su CompetitionEntry.
- Il Court Assignment sarà gestito da un servizio dedicato.
- Il Ranking verrà aggiornato dallo Stage Engine.
- Il Match non conoscerà la formula della competizione.

---

# 19. Future Evolution

Il Match Engine dovrà supportare:

- Live Scoring
- Streaming
- Arbitraggio
- TV Display
- API pubbliche
- Statistiche avanzate
- Event sourcing

senza modificare il modello principale.

---

# 20. Conclusion

L'analisi della V1 conferma che il Match rappresenta l'unità fondamentale di esecuzione del Competition Engine.

La V2 evolverà questo concetto separando definitivamente Match, Result, Court Assignment e Ranking, ottenendo un motore completamente indipendente dalla formula della competizione e riutilizzabile da qualsiasi Stage.