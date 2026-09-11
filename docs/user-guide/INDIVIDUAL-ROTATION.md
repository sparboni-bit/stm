# Pickleball Arena Tournament Manager

## Individual Rotation

**Product:** Pickleball Arena Tournament Manager\
**App:** Pickleball Arena Tournament\
**Guide:** Individual Rotation\
**Language:** English

------------------------------------------------------------------------

## 1. What Individual Rotation Is

**Individual Rotation** is designed for pickleball sessions in which
players compete in doubles matches while the competition is evaluated
individually.

Each match is played **2 vs 2**, but players are not tied to one
permanent team. Across the generated rounds, the application rotates
combinations of partners and opponents and records each player's results
separately.

The goal is practical: use the available courts and playing time
efficiently while keeping participation and player combinations as
balanced as possible.

------------------------------------------------------------------------

## 2. Why a Rotation Is Needed

With a small number of players, it may be possible to play many
different combinations. As the number of players increases, however, the
number of possible four-player groups grows very quickly.

For `n` players, the number of different groups of four players is:

**C(n,4) = n! / (4! × (n-4)!)**

For example:

-   8 players produce 70 different groups of four.
-   12 players produce 495 different groups of four.
-   13 players produce 715 different groups of four.

Even this count only identifies which four players are involved. Within
a group of four, there are also **3 different ways to divide the players
into two doubles teams**.

Therefore, attempting to play every possible combination is normally
impractical.

Individual Rotation instead generates a usable schedule for the actual
session.

------------------------------------------------------------------------

## 3. What the Generator Considers

The rotation is built around the real constraints of the competition.

The main parameters include:

-   the players assigned to the stage;
-   the number of usable courts;
-   the required number of rounds;
-   the expected match duration or available playing structure;
-   any stage-specific generation options.

The generated schedule aims to distribute playing opportunities across
the participants while varying partners and opponents.

This balancing process is part of the generation logic. It is not a
separate user-facing competition phase or screen.

------------------------------------------------------------------------

## 4. Create the Stage

Create a new stage and select **Individual Rotation** as the stage
format.

Assign the required players from the tournament roster to the stage.

Before continuing, check that the player list is complete and that names
are correct. The generated schedule is based on the participants
assigned at generation time.

------------------------------------------------------------------------

## 5. Configure the Rotation

Open **Setup**.

Configure the parameters required for the session, including the
available courts and the desired playing structure.

The application uses these settings to determine how the rounds can be
organized.

Before generating, review the summary shown by the application so that
the expected number of rounds and matches is appropriate for the
session.

------------------------------------------------------------------------

## 6. Generate the Rotation

Select **Generate** when the setup is ready.

The application creates the Individual Rotation schedule.

A generated round contains the matches that can be played during that
rotation step, according to the available players and courts.

Players who cannot be assigned to a match in a particular round remain
out for that round.

The complete generated schedule can then be reviewed before play starts.

------------------------------------------------------------------------

## 7. Understanding Balance

A useful Individual Rotation schedule should not be judged only by the
total number of matches.

The generation logic also considers the distribution of participation
and combinations.

In practical terms, the objectives include:

**Playing opportunities**\
Players should play a similar number of matches whenever the available
rounds make this possible.

**Partner rotation**\
Repeated partnerships should be limited when alternative combinations
are available.

**Opponent rotation**\
Players should face different opponents rather than repeatedly meeting
the same combinations.

**Court utilization**\
Available courts should be used effectively without creating unnecessary
matches merely to fill capacity.

These objectives can conflict. For example, avoiding every repeated
partner may be impossible while also giving all players exactly the same
number of matches within a limited number of rounds.

The generator therefore seeks a balanced practical schedule rather than
claiming that every possible combination will be unique.

------------------------------------------------------------------------

## 8. Play the Matches

Open **Matches** to manage the generated rotation.

The screen shows the matches belonging to the generated rounds and their
current state.

Enter the result when a match is completed. The result is stored against
the four participating players and contributes to the individual
standings.

Continue through the rounds according to the planned session.

------------------------------------------------------------------------

## 9. Match Timer

When the Individual Rotation setup uses timed matches, the stage timer
can support courtside play.

The timer is intended as an operational aid for the organizer. It can be
started and managed while the session is running.

Closing the persistent timer removes it when it is no longer required.

The recorded match result remains independent from the visual timer
state.

------------------------------------------------------------------------

## 10. Add More Rounds

Individual Rotation supports an important open-session workflow:
**additional rounds can be appended after the original schedule has been
generated**.

Use **Add Round** when:

-   the planned matches have been completed and more time is available;
-   the organizer decides to extend the playing session;
-   additional play is desirable without rebuilding the existing
    competition.

Adding a round extends the current schedule.

Previously generated and completed matches are preserved and are not
overwritten.

The new round becomes part of the same Individual Rotation stage,
allowing the session to continue naturally.

------------------------------------------------------------------------

## 11. Individual Standings

Open **Standings** to follow the competition at player level.

Unlike a fixed-team doubles competition, the ranking belongs to the
individual player.

The standings are updated from the recorded match results and provide
the organizer with a consolidated view of each player's performance
across different partnerships and opponents.

This is the defining characteristic of Individual Rotation: **the
matches are doubles, but the competition is individual**.

------------------------------------------------------------------------

## 12. Practical Example

Consider a session with 12 players and 3 courts.

Each full round can involve all 12 players:

-   3 courts;
-   4 players per court;
-   12 players active in the round.

If the organizer generates 6 rounds, the schedule contains:

**3 matches per round × 6 rounds = 18 matches**

Each match creates four player appearances:

**18 × 4 = 72 player appearances**

Distributed evenly among 12 players:

**72 / 12 = 6 matches per player**

This is an ideal participation case because the number of players
exactly fills the available courts.

With a different player count, some players may need to sit out in
particular rounds. The rotation logic must then distribute those playing
opportunities as evenly as the selected number of rounds permits.

------------------------------------------------------------------------

## 13. When the Numbers Do Not Divide Evenly

Suppose there are 13 players and 3 courts.

Only 12 players can be active simultaneously, so one player must sit out
each full round.

Over a sufficiently long session, those sit-outs can be distributed
among the participants.

However, with only a few rounds, mathematically identical participation
may not always be possible.

This is why the quality of a rotation should be evaluated across the
complete schedule rather than from a single round or a single repeated
partnership.

------------------------------------------------------------------------

## 14. Recommended Courtside Workflow

For an Individual Rotation session:

1.  Create or open the tournament.
2.  Add the players to the Roster.
3.  Create an Individual Rotation stage.
4.  Assign the players to the stage.
5.  Configure courts, rounds, duration, and the available stage options.
6.  Review the expected schedule.
7.  Generate the rotation.
8.  Check the generated rounds before starting.
9.  Open Matches and run the session.
10. Enter results as matches are completed.
11. Check Standings during or after play.
12. Use Add Round if the session should continue.
13. Review the final individual standings when play finishes.

------------------------------------------------------------------------

## 15. Key Principle

Individual Rotation is not intended to enumerate every mathematically
possible doubles combination.

Its purpose is to produce a **practical, playable and balanced
rotation** within the real limits of the session.

The organizer defines the participants and available resources;
Pickleball Arena Tournament Manager turns those constraints into a
rotation that can be managed directly from the court.
