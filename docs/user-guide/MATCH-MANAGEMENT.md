# Pickleball Arena Tournament Manager

## Match Management

**Product:** Pickleball Arena Tournament Manager\
**App:** Pickleball Arena Tournament\
**Guide:** Match Management\
**Language:** English

------------------------------------------------------------------------

## 1. Purpose

Match Management is the operational area used while a tournament is
being played.

After a stage has been configured and generated, the organizer uses the
match interface to follow scheduled matches, enter results, and keep the
competition structure updated.

The exact behavior depends on the stage format:

-   **Individual Rotation**
-   **Round Robin**
-   **Elimination**

------------------------------------------------------------------------

## 2. Before Play Starts

Before entering results, verify that:

-   the correct tournament and stage are open;
-   the stage has been generated;
-   the participant list is correct;
-   the generated matches are correct;
-   the match format is appropriate for the competition.

For Elimination stages, also review the bracket and seed placement
before the first result is recorded.

------------------------------------------------------------------------

## 3. Match Status

A match progresses through its operational lifecycle as play takes
place.

The interface identifies the current state of each match so the
organizer can distinguish matches that are waiting to be played from
matches that have already been completed.

A completed match contributes to the competition state and may update
standings or bracket progression.

------------------------------------------------------------------------

## 4. Entering a Result

Open the required match and enter the score for the two sides.

Before saving, verify that the score belongs to the correct
participants.

When the result is saved, Pickleball Arena Tournament Manager updates
the match and applies the result to the relevant stage logic.

Depending on the stage, this can update:

-   individual standings;
-   Round Robin standings;
-   Elimination bracket progression.

------------------------------------------------------------------------

## 5. Match Formats

The competition can use the match format configured for the stage.

Supported workflows include formats such as:

### Single Set

The match is decided by a single recorded set or score.

### Best of 3

The match can contain up to three sets, with the winner determined from
the completed set results.

The match editor reflects the format configured for the competition.

------------------------------------------------------------------------

## 6. Courts

Where court management is available, a match can be associated with the
court on which it is being played.

Court assignment is operational information and is separate from the
match result.

This means that changing a court does not require a score to be entered.

The organizer can therefore adjust court usage as the tournament
progresses without incorrectly completing the match.

------------------------------------------------------------------------

## 7. Retirement

When a participant cannot complete a match, the match can be concluded
using the available retirement workflow rather than entering a normal
result that does not represent what happened.

The competition records the affected side and completes the match
according to the stage rules.

This keeps the recorded result and subsequent competition progression
consistent with the actual match outcome.

------------------------------------------------------------------------

## 8. Correcting a Result

If a score has been entered incorrectly, correct it using the
result-management functions available for the match.

The consequences of a correction depend on the stage.

For a Round Robin or Individual Rotation match, the corrected result
affects the related standings.

For an Elimination match, the result may also have determined which
participant advanced to the next round.

For that reason, an earlier Elimination result may be protected once a
downstream match has already been completed.

------------------------------------------------------------------------

## 9. Protected Elimination Results

In an Elimination bracket, matches are linked.

For example:

**Semifinal → Final**

If a semifinal result has already advanced a participant to the final
and that final has subsequently been completed, changing the semifinal
result would invalidate the existing final.

Pickleball Arena Tournament Manager therefore protects results when a
completed downstream match depends on them.

When the interface indicates that a result is locked, the downstream
competition state must be resolved before the earlier result can be
changed.

------------------------------------------------------------------------

## 10. Automatic Progression

In an Elimination stage, saving a completed match result automatically
determines the winner and places that participant into the appropriate
next match.

The organizer does not need to manually copy the winner into the next
bracket position.

The bracket is updated as results are recorded.

------------------------------------------------------------------------

## 11. Standings Updates

For ranking-based stages, completed results contribute to the standings.

### Individual Rotation

Results are associated with the individual players who participated in
the doubles match and contribute to the individual ranking.

### Round Robin

Results contribute to the standings of the relevant group.

Standings continue to evolve until the required matches have been
completed.

------------------------------------------------------------------------

## 12. Individual Rotation Timer

Individual Rotation can use a courtside timer for timed sessions.

The timer is an operational aid and does not itself create or complete a
match result.

It can be managed independently from score entry.

When the persistent timer is no longer required, it can be closed
without changing the recorded competition results.

------------------------------------------------------------------------

## 13. Adding Rounds During Individual Rotation

Individual Rotation supports extending a playing session with **Add
Round**.

Additional rounds are appended to the existing schedule.

Previously generated or completed matches are preserved.

This allows the organizer to continue play when additional court time is
available without rebuilding the stage or losing the results already
entered.

------------------------------------------------------------------------

## 14. Working from a Smartphone

The smartphone interface is intended for fast courtside operations.

The organizer can move between the main stage sections, open matches,
enter results, and check standings or bracket progression while play is
taking place.

Because screen space is limited, use the stage navigation to move
between operational views rather than trying to keep the complete
competition structure visible at once.

------------------------------------------------------------------------

## 15. Working from a Tablet

A tablet provides more space for match lists, standings, rotations,
groups, and brackets.

This is especially useful for Elimination stages, where several rounds
of the bracket can be reviewed together.

The match-management rules are the same as on a smartphone.

------------------------------------------------------------------------

## 16. Recommended Live Workflow

During a tournament:

1.  Open the correct tournament and stage.
2.  Review the matches ready to be played.
3.  Assign or adjust courts where applicable.
4.  Start the next matches.
5.  Enter each result when the match finishes.
6.  Verify the score before saving.
7.  Check the updated standings or bracket.
8.  Correct mistakes before dependent matches are played whenever
    possible.
9.  For Individual Rotation, add another round if the session is
    extended.
10. Continue until the required matches have been completed.

------------------------------------------------------------------------

## 17. Operational Principle

The match interface is designed to keep **court operations**,
**results**, and **competition progression** synchronized.

Court changes should not require artificial scores. Results should
update the appropriate standings or bracket. Elimination winners should
advance automatically, while already completed downstream matches should
be protected from inconsistent earlier changes.

The organizer can therefore manage the competition progressively from
the court while Pickleball Arena Tournament Manager maintains the
underlying tournament state.
