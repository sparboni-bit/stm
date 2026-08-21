# PRODUCT-300 --- Competitive Landscape & Mobile UX Principles

**Project:** STM --- Sports Tournament Manager\
**Document type:** Product / Competitive Analysis\
**Status:** Working baseline\
**Date:** 15 August 2026

------------------------------------------------------------------------

## 1. Purpose

This document positions STM against a selected group of tournament and
pickleball applications already available to users on mobile platforms.

The objective is not to reproduce competitors feature-for-feature. The
analysis is intended to identify:

-   capabilities that validate STM's current direction;
-   gaps that may materially improve the product;
-   mobile interaction patterns worth adopting;
-   functionality that should deliberately remain outside the initial
    STM scope;
-   a practical product position for an online, iOS and Android release.

Products reviewed:

-   Court Buddy
-   Tournament Generator: Brackets
-   Pikel: Pickleball & DUPR Sync
-   Pickleball Rotator
-   Picklemania

The comparison is based on publicly accessible product pages, App Store
descriptions and release notes available at the time of review. Some
products expose substantially more public detail than others. In
particular, the available public material for Picklemania and Pickleball
Rotator was more limited during this review, so no unsupported feature
claims are made for them.

------------------------------------------------------------------------

## 2. Executive conclusion

STM does not need to match the total feature count of the largest
competitors before release.

The current product already contains the foundations of a useful
tournament-management application:

-   elimination tournaments;
-   round-robin structures;
-   group-to-bracket workflows;
-   Individual Rotation;
-   court management;
-   live match management;
-   scoring;
-   rankings;
-   fairness analysis;
-   organization/workspace architecture.

The principal gap before a public release is therefore not the
tournament engine. It is the **field-side mobile experience**.

Competitor products repeatedly optimize for a user who is standing
beside a court with a phone in one hand. Setup is short, scoring
requires few taps, timers and courts are immediately visible, and
routine actions do not require navigating administrative screens.

For STM, the recommended near-term strategy is:

> **Make the existing engine exceptionally easy to operate on a phone
> before significantly expanding the number of competition formats.**

------------------------------------------------------------------------

## 3. Product positioning

The reviewed market broadly contains three types of product.

### 3.1 Session / rotation managers

Products such as Court Buddy focus on quickly organizing social play:

-   players;
-   courts;
-   rotations;
-   partners and opponents;
-   sit-outs;
-   timers;
-   live adjustments.

Their strength is speed and simplicity.

### 3.2 General tournament managers

Tournament Generator: Brackets represents the more general
tournament-management category. It supports multiple competition
formats, player profiles, ratings, history, court management and
sharing.

Its strength is breadth of tournament formats combined with relatively
lightweight setup.

### 3.3 Pickleball ecosystems

Pikel extends far beyond tournament management into:

-   game discovery;
-   clubs;
-   RSVP and waiting lists;
-   recurring events;
-   chat;
-   leagues;
-   player profiles;
-   DUPR integration;
-   payments;
-   community features.

Its objective is to become a broad pickleball platform rather than only
a competition manager.

### 3.4 Proposed STM position

STM should not initially compete as a social network or court-booking
ecosystem.

A stronger position is:

> **A professional tournament and fair-play engine for racket and
> participation sports.**

STM can combine two complementary product areas:

**Competition** - brackets; - groups; - group → bracket; - multi-stage
competitions.

**Fair / social competition** - Individual Rotation; - Americano-style
formats; - optimized partner/opponent rotation; - sit-out management; -
measurable fairness.

This positioning makes the fairness engine a product capability rather
than merely an internal algorithm.

------------------------------------------------------------------------

## 4. Court Buddy

Court Buddy is particularly relevant to STM's Individual Rotation
engine.

Its public product description emphasizes:

-   fair partner rotation;
-   varied opposition;
-   sit-out distribution;
-   court-position variation;
-   automatic court assignment;
-   singles and doubles;
-   round timers;
-   adding/removing players during a session;
-   swapping a sit-out player into a court;
-   live adjustment of courts and players.

Court Buddy also promotes a **Quick Play** approach with no login or
long setup before starting a session.

Its club tools extend the product with:

-   member profiles;
-   recorded game scores;
-   historical data;
-   playing groups;
-   session pre-rostering;
-   member administration;
-   ratings;
-   personal statistics and progression.

### Relevance for STM

The functional problem solved by Court Buddy strongly validates STM's
Individual Rotation direction.

STM already goes further in one important respect: fairness can become
**visible and measurable** rather than being only a promise made by the
scheduling algorithm.

STM can potentially explain a schedule using indicators such as:

-   games per player;
-   rests per player;
-   partner repeats;
-   opponent repeats;
-   consecutive sit-outs;
-   normalized fairness score.

This should be treated as a differentiator.

### Ideas worth adopting

-   Quick-start workflow;
-   persistent player roster;
-   highly visible round timer;
-   live player substitution;
-   easy sit-out visualization;
-   one-action next-round workflow;
-   session-oriented UI rather than configuration-oriented UI during
    play.

### Lower priority for STM

-   proprietary player-rating ecosystem;
-   broad club social features.

------------------------------------------------------------------------

## 5. Tournament Generator: Brackets

Tournament Generator is especially useful as a reference because it is
not limited to pickleball.

Its public App Store material describes six principal formats:

-   Round Robin / Americano;
-   Swiss;
-   Single Elimination;
-   Double Elimination;
-   Group Stage + Knockout;
-   Ladder.

It also includes:

-   singles and doubles;
-   multi-court management;
-   live scoring;
-   timers;
-   tournament history;
-   player profiles;
-   rating history;
-   export/share;
-   walkover/forfeit handling;
-   optional third-place playoff;
-   printable check-in sheets and fixtures.

The product uses a freemium model with a limited free tier and Pro
capabilities.

Recent release notes also show attention to:

-   faster bracket generation;
-   smoother score entry;
-   undo reliability;
-   explanations embedded in setup;
-   localization;
-   tournament-history sharing.

### Relevance for STM

This product is the closest reference for the broader STM concept.

STM currently has less format breadth, particularly regarding:

-   Swiss;
-   Double Elimination;
-   Ladder.

These are credible future additions, but none is necessary to validate
an initial STM release.

### Ideas worth adopting

-   embedded `(i)` explanations for complex configuration options;
-   tournament history;
-   player history;
-   printable/shareable summaries;
-   walkover/forfeit as a first-class match outcome;
-   third-place match option;
-   clear Free/Pro capability boundaries if STM later adopts a freemium
    model.

### Post-MVP candidates

1.  Double Elimination
2.  Swiss
3.  Ladder

They should follow, not precede, mobile UX stabilization.

------------------------------------------------------------------------

## 6. Pikel

Pikel is the broadest product reviewed.

Its App Store description includes:

-   several Round Robin variants;
-   automated pairings;
-   live standings;
-   tournaments;
-   group/pool stages and playoff brackets;
-   elimination formats;
-   leagues;
-   team competitions;
-   automatic court assignment;
-   live scoring;
-   statistics;
-   RSVP;
-   waiting lists;
-   recurring sessions;
-   clubs;
-   chat;
-   invitations;
-   DUPR synchronization.

Recent release history is particularly informative because it shows the
types of operational problems a mature tournament product must solve:

-   best-of-3 and best-of-5 scoring;
-   correcting results and immediately rebuilding dependent bracket
    state;
-   improved playoff seeding;
-   full-screen bracket;
-   pinch-to-zoom and pan;
-   landscape bracket display;
-   adding rounds during an active game without losing scores;
-   payment support;
-   sharing;
-   guest-player invitations;
-   localization and adjustable text size.

### Relevance for STM

Several Pikel improvements closely mirror problems already encountered
in STM and the earlier V1:

-   undo/correction;
-   downstream bracket consistency;
-   add round;
-   court management;
-   live standings;
-   group → bracket;
-   multi-set scoring.

This is useful market validation: these are not edge cases unique to
STM.

### What STM should not copy now

Pikel's broader ecosystem includes functionality outside STM's intended
core:

-   social feed;
-   chat;
-   game discovery;
-   RSVP infrastructure;
-   payments;
-   club community;
-   player social networking.

Building these now would dilute STM's tournament-management focus.

### Ideas worth adopting

-   score correction as a safe, explicit workflow;
-   bracket zoom/pan/landscape;
-   scoring from multiple relevant screens;
-   guest-player convenience;
-   accessible text sizing;
-   clear format education;
-   shareable champion/results screen.

------------------------------------------------------------------------

## 7. Pickleball Rotator

Pickleball Rotator belongs to the lightweight rotation/session-manager
category and is relevant primarily as a UX benchmark.

The important lesson from this category is not feature depth. It is the
reduction of setup and operating friction.

A rotation product should make the core sequence feel almost immediate:

> players → courts → assign → play → next round

For STM this reinforces the need to ensure that the sophistication of
the scheduling engine is not reflected as complexity in the user
interface.

Where public information is insufficient, this document deliberately
avoids asserting detailed product capabilities.

------------------------------------------------------------------------

## 8. Picklemania

Picklemania was included in the competitive set because it is
distributed as a mobile pickleball application.

At the time of this review, sufficiently detailed and reliably
retrievable public product information was not available to support a
feature-by-feature comparison at the same confidence level as Court
Buddy, Tournament Generator and Pikel.

It should remain on the monitoring list and be revisited when additional
public documentation, screenshots, release notes or hands-on access are
available.

No roadmap decision in this document depends on an unverified
Picklemania capability.

------------------------------------------------------------------------

## 9. Comparative view

  ----------------------------------------------------------------------------------------
  Capability          STM direction      Court Buddy         Tournament     Pikel
                                                             Generator      
  ------------------- ------------------ ------------------- -------------- --------------
  Single elimination  Yes                Secondary/not core  Yes            Yes

  Round Robin         Yes                Rotation-oriented   Yes            Yes

  Group → bracket     Yes                Not core            Yes            Yes

  Individual player   Strong focus       Strong focus        Americano/RR   Multiple RR
  rotation                                                                  variants

  Multi-court         Yes                Yes                 Yes            Yes

  Live scoring        Yes                Score support       Yes            Yes

  Timer               Yes / refinement   Yes                 Yes            Session tools
                      needed                                                

  Sit-out management  Strong focus       Strong focus        Yes            Format
                                                                            dependent

  Fairness analysis   **Strong           Fairness engine     Smart pairing  Smart pairings
                      differentiator**                                      

  Player              Future             Club tools          Yes            Yes
  profiles/history                                                          

  Ratings             Future/optional    Yes                 Yes            DUPR

  Swiss               Future             No core need        Yes            Not core
                                                                            positioning

  Double elimination  Future             No core need        Yes            Yes

  Ladder              Future             Club/league context Yes            Related
                                                                            competitive
                                                                            formats

  Club/community      Organization model Yes                 Clubs emerging Extensive

  Chat/social         Out of initial     Not core            No core        Yes
                      scope                                                 

  Payments            Out of initial     No core             No core        Yes
                      scope                                                 

  Quick/no-friction   Needed             Strong              Strong         Strong
  start                                                      local-first    
                                                             approach       

  Mobile field UX     **Priority**       Strong reference    Strong         Strong
                                                             reference      reference
  ----------------------------------------------------------------------------------------

This table is directional rather than a certification matrix. Public
product descriptions differ in detail and may change rapidly.

------------------------------------------------------------------------

## 10. STM strengths to preserve

### 10.1 Stage architecture

STM's Stage architecture is valuable because different competition
engines can coexist without forcing the entire product into a single
tournament model.

This supports:

-   elimination;
-   groups;
-   group → bracket;
-   Individual Rotation;
-   future engines.

### 10.2 Fairness as measurable data

STM should avoid presenting fairness merely as "smart scheduling".

A stronger product message is that STM can measure and explain the
outcome.

Example:

``` text
Games                 5–6
Rests                 1–2
Partner repeats         0
Opponent repeats        2
Consecutive rests       0
Fairness               98
```

The fairness matrix and Play/Rest visualization can make an otherwise
invisible scheduling quality immediately understandable.

### 10.3 Organization model

The Personal / Business Organization architecture supports a useful
distinction:

-   individual organizer;
-   club/organization;
-   multiple coaches/managers;
-   shared competitions.

This is a stronger long-term foundation than sharing a single
account/password.

------------------------------------------------------------------------

## 11. Highest-value feature additions

The competitor review suggests that the next high-value additions are
not necessarily new tournament engines.

### 11.1 Persistent Player Roster

Players should be reusable within an Organization.

Suggested interaction:

``` text
Search players...

☑ Mario Rossi
☑ Luca Bianchi
☐ Anna Verdi

+ Guest player
```

Benefits:

-   dramatically faster competition creation;
-   consistent names;
-   future statistics/history;
-   future rating integration;
-   better organization workflow.

### 11.2 Quick Tournament

STM's internal architecture may remain:

``` text
Organization
Competition
Stage
Entries
Planner
```

but users should not be required to think in those entities for a simple
session.

A Quick Tournament flow could expose:

``` text
NEW

Tournament
Round Robin
Individual Rotation
```

Then:

``` text
Players        11
Courts          2
Available time 120 min

[ Add players ]

[ Create ]
```

STM can create the underlying Competition and Stage automatically.

### 11.3 Share / export

Useful outputs include:

-   final ranking;
-   bracket;
-   round schedule;
-   player Play/Rest matrix;
-   champion/result card;
-   printable fixture sheet;
-   PDF/report.

### 11.4 Tournament history

Completed competitions should become useful records rather than simply
archived entities.

This creates the foundation for:

-   player history;
-   organization statistics;
-   repeat-event setup;
-   analytics.

------------------------------------------------------------------------

## 12. STM Mobile Interaction Standard

Before public release, STM should adopt explicit mobile interaction
rules.

### 12.1 Touch targets

Primary controls should have comfortable touch targets, approximately
44×44 points/pixels or larger where practical.

Small icon-only actions should be avoided for critical live operations.

### 12.2 Numeric score entry

Score fields should request a numeric keyboard on mobile.

For web/mobile HTML inputs:

``` tsx
inputMode="numeric"
```

The UI should minimize keyboard switching and unnecessary taps.

### 12.3 Score-entry focus

A score workflow should support:

1.  tap first score;
2.  enter number;
3.  move naturally to second score;
4.  save.

For multi-set scoring, navigation between sets should remain
predictable.

### 12.4 Sticky live actions

During match operation, primary actions should remain reachable without
scrolling.

Examples:

-   Save Result
-   Start
-   Undo
-   Next Round

A bottom action bar is preferable to a button that disappears above or
below the viewport.

### 12.5 Court selection

Court selection should be optimized for touch.

When the choice set is small, large selectable controls may be
preferable to a traditional desktop dropdown.

### 12.6 Timer

The timer should be:

-   large;
-   visible from the main Play screen;
-   simple to start/pause/resume;
-   accompanied by a clear end-of-round notification.

### 12.7 Destructive confirmation

Confirmation dialogs should be reserved for actions with meaningful
consequences.

Routine live operations should not repeatedly interrupt the organizer.

### 12.8 Bracket interaction

On mobile/tablet, bracket presentation should consider:

-   landscape mode;
-   pinch-to-zoom;
-   pan;
-   full-screen view.

### 12.9 Accessibility and readability

Live screens should prioritize:

-   high contrast;
-   large scores;
-   readable player names;
-   semantic status colors;
-   scalable text;
-   limited dependence on color alone.

------------------------------------------------------------------------

## 13. Proposed live-screen philosophy

The Play screen should become the operational heart of STM.

An organizer should be able to understand the event state at a glance.

Example:

``` text
ROUND 4                              08:42

COURT 1                              LIVE
Mario + Luca
                 8 – 6
Anna + Paolo

COURT 2                              READY
Marco + Sara
Gianni + Elena

WAITING
Carlo · Roberto · Andrea

[ NEXT ROUND ]
```

Tapping a match should lead directly to score entry rather than to a
general administrative detail page.

The conceptual distinction is:

> **Configuration screens manage a competition.\
> Play screens run a competition.**

The two contexts should not have the same information density or
navigation model.

------------------------------------------------------------------------

## 14. Navigation principles

STM navigation should reflect the competition workflow:

> Competition → Configuration → Entries → Generate → Play → Reports

During setup, navigation can expose configuration concepts.

During Play, navigation should become much simpler and operational.

Recommended principle:

-   do not expose engine implementation terminology to normal users;
-   avoid redundant sidebars where the stage itself already provides
    context;
-   hide unavailable future actions;
-   keep the current operational state obvious;
-   minimize back-and-forth navigation during scoring.

------------------------------------------------------------------------

## 15. Visual language

STM should remain visually professional rather than becoming excessively
decorative.

A clean base of white, dark navy, subtle borders and strong typography
is appropriate.

Color should primarily carry semantic meaning:

  Meaning                            Suggested semantic treatment
  ---------------------------------- ------------------------------
  Primary action                     Navy / strong neutral
  Ready                              Blue
  Completed / valid                  Green
  Waiting / warning                  Amber
  Error / retirement / destructive   Red
  Locked / unavailable               Gray

The product should feel attractive because important information is
immediately legible, not because of gradients, animation or decorative
complexity.

------------------------------------------------------------------------

## 16. What not to build for the initial release

The competitive review does **not** justify adding the following to the
initial STM release:

-   social feed;
-   general chat;
-   court booking;
-   player discovery;
-   event marketplace;
-   payment processing;
-   photo sharing;
-   badges/gamification;
-   full social profiles.

These may be valuable to other products but are not required for STM's
core proposition.

------------------------------------------------------------------------

## 17. Proposed public MVP

A credible first public STM release can be narrower than the largest
competitors.

### Competition engines

-   Single Elimination
-   Round Robin
-   Group → Bracket
-   Individual Rotation

### Operational capabilities

-   Entries
-   Seeding
-   Courts
-   Live match management
-   Single-set scoring
-   Best-of-3 where supported
-   Retirement / forfeit handling
-   Result correction / undo
-   Rankings
-   Timer
-   Add round where supported
-   Fairness analysis
-   Reports / basic sharing

### Product layer

-   Personal Organization
-   Business Organization
-   multi-user management
-   mobile-first interface
-   persistent players
-   Quick Tournament
-   installable/public web application
-   iOS/Android distribution path

This is already a coherent product.

------------------------------------------------------------------------

## 18. Post-MVP roadmap

### Phase A --- Mobile release quality

Priority:

-   numeric score input;
-   touch targets;
-   sticky live actions;
-   court UX;
-   timer UX;
-   Play screen redesign;
-   Quick Tournament;
-   persistent player roster;
-   share/export;
-   navigation simplification.

### Phase B --- Competition breadth

Candidates:

1.  Double Elimination
2.  Swiss
3.  Ladder
4.  richer consolation/placement structures

### Phase C --- Player intelligence

Candidates:

-   player history;
-   organization statistics;
-   ratings;
-   head-to-head;
-   performance trends.

External rating integration such as DUPR should be evaluated only if it
materially supports target customers.

### Phase D --- Business features

Potential later capabilities:

-   advanced organization administration;
-   event templates;
-   branded reports;
-   organization analytics;
-   configurable permissions;
-   subscription plans.

------------------------------------------------------------------------

## 19. Commercial observations

Competitors demonstrate several viable approaches:

-   completely free club/session tools;
-   free entry tier with paid Pro;
-   subscription;
-   lifetime purchase;
-   broad ecosystem monetized through advanced services.

STM's Personal / Business Organization model creates a natural future
commercial distinction.

A possible direction is:

**Personal** - individual organizer; - limited active competitions or
advanced features.

**Business / Club** - multiple members; - shared player roster; - shared
competitions; - history; - reporting; - advanced organization features.

Pricing should not be finalized until the public MVP has been tested
with real organizers.

------------------------------------------------------------------------

## 20. Product principles derived from the analysis

1.  **Engine sophistication must not create interface complexity.**
2.  **Mobile field operation is more important than adding formats
    before release.**
3.  **Fairness should be measurable, explainable and visible.**
4.  **Quick creation and professional configuration can coexist.**
5.  **Players should become reusable organization assets.**
6.  **Play mode and configuration mode should be distinct experiences.**
7.  **Result correction is a core workflow, not an exception.**
8.  **Court state must always be easy to understand.**
9.  **Sharing and reporting increase the value of completed
    competitions.**
10. **STM should remain a tournament product before becoming an
    ecosystem.**

------------------------------------------------------------------------

## 21. Working product statement

A useful working statement for STM is:

> **Create. Run. Score. Fairly.**

A more descriptive positioning statement is:

> **STM is a mobile-first tournament and fair-play manager designed to
> create, run and score structured competitions and optimized social
> rotations across multiple courts.**

The statement should remain sport-neutral enough to support STM's
broader ambition while allowing pickleball to be an important initial
use case.

------------------------------------------------------------------------

## 22. Decision for the next sprint

The competitor analysis supports a pre-release sprint centered on:

**Mobile UX + Navigation + Public Release Readiness**

rather than a sprint centered on additional tournament formats.

Primary workstreams:

-   Play screen;
-   mobile score entry;
-   court interaction;
-   timer;
-   Quick Tournament;
-   persistent players;
-   simplified navigation;
-   sharing/reporting;
-   responsive bracket;
-   installation/distribution readiness.

The existing engines should continue to be stabilized, but format
expansion should not distract from this objective.

------------------------------------------------------------------------

## Sources reviewed

-   Court Buddy --- https://court-buddy.com/
-   Court Buddy Clubs --- https://court-buddy.com/clubs
-   Court Buddy App Store ---
    https://apps.apple.com/it/app/court-buddy/id6756144108
-   Tournament Generator: Brackets ---
    https://apps.apple.com/it/app/tournament-generator-brackets/id6740823846
-   Pikel: Pickleball & DUPR Sync ---
    https://apps.apple.com/it/app/pikel-pickleball-dupr-sync/id6760790860
-   Pickleball Rotator ---
    https://apps.apple.com/it/app/pickleball-rotator/id6756629250
-   Picklemania ---
    https://apps.apple.com/it/app/picklemania/id6767804226

------------------------------------------------------------------------

## Review note

Competitive products evolve rapidly. This document should be treated as
a product baseline and reviewed periodically, especially before:

-   App Store / Google Play release;
-   pricing decisions;
-   addition of new competition engines;
-   integration with external player-rating services.
