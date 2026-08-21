# ROADMAP-001 --- STM Release Roadmap: Web → PWA → Native

**Project:** STM --- Sports Tournament Manager\
**Document type:** Product / Release Roadmap\
**Status:** Active baseline\
**Date:** 15 August 2026\
**Related:** PRODUCT-300 --- Competitive Landscape & Mobile UX
Principles

------------------------------------------------------------------------

## 1. Purpose

This roadmap defines the path from the current STM V2 development build
to:

1.  a usable private Web Beta;
2.  a public Web V1;
3.  an installable PWA;
4.  native-distributed iOS and Android applications.

The roadmap deliberately separates product readiness from feature
breadth. A release is not blocked by the absence of every possible
tournament format. The primary release criterion is whether an organizer
can independently create, run, score and complete a real competition
from a smartphone.

------------------------------------------------------------------------

## 2. Release principle

From this point forward, roadmap priority is evaluated primarily with
this question:

> **Does this issue prevent an organizer from independently running a
> real competition from a phone?**

If yes, it is release-critical.\
If no, it may be deferred even if it is desirable.

The competitive review in PRODUCT-300 reinforces this approach: STM
already has substantial tournament-engine depth. The largest remaining
pre-release opportunity is the mobile field-side experience.

------------------------------------------------------------------------

## 3. Current baseline

STM V2 already provides the architectural foundation for release:

-   Next.js 16 / TypeScript / Tailwind;
-   Supabase Auth, DB, RPC and RLS;
-   Organization / Workspace model;
-   Personal and Business organization concepts;
-   multi-member architecture;
-   Competition → Stage architecture;
-   repository pattern and server actions;
-   competition entries;
-   Single Elimination;
-   Round Robin;
-   group-based structures;
-   Group → Bracket workflows;
-   Individual Rotation;
-   courts;
-   live match management;
-   result entry and correction foundations;
-   rankings;
-   fairness engine;
-   reports foundations.

### Individual Rotation Template Library

At the time this roadmap is adopted, the offline template library has
reached **83 / 84 complete families** for the configured 4--16 player
domain.

The remaining family shown by the development tool is:

``` text
16P / 4C / 2S
stored: 4 / 12
missing: R5–R12
```

This is not a release architecture problem. The resumable generator can
complete the remaining family without invalidating already persisted
work.

------------------------------------------------------------------------

# 4. Milestone A --- Web Private Beta

## Objective

A small number of external organizers must be able to use STM for real
competitions without developer intervention.

### Acceptance statement

> An organizer can create, configure, populate, generate, run, score and
> complete a supported tournament from a smartphone.

------------------------------------------------------------------------

## A1. Freeze Individual Rotation V1

### Complete / substantially complete

-   Planner;
-   fairness proposals;
-   Fairness Floor v2;
-   Fairness Classification v2;
-   template persistence;
-   resumable template generation;
-   4--16 player template domain;
-   seed-aware generation;
-   fairness scoring;
-   Play/Rest analysis foundations.

### Remaining

-   complete 84 / 84 template families;
-   verify template lookup in normal Planner flow;
-   verify fallback behavior when a template is unavailable;
-   real end-to-end tournament test;
-   confirm courts, timer, result correction and ranking after generated
    schedules;
-   confirm Add Round behavior does not overwrite existing matches.

### Exit criterion

Individual Rotation is considered V1-frozen when a real tournament can
be completed without algorithmic regeneration or manual DB intervention.

Further mathematical optimization becomes post-beta work unless a
correctness defect is found.

------------------------------------------------------------------------

## A2. End-to-end acceptance tests

Run complete real-world test competitions for the four principal
workflows.

### Test 1 --- Single Elimination

``` text
Create
→ Configuration
→ Entries
→ Generate
→ Play
→ Results
→ Complete
```

Verify:

-   seeding;
-   BYEs;
-   court assignment;
-   score entry;
-   retirement / forfeit;
-   result correction;
-   downstream propagation;
-   completion;
-   final bracket.

### Test 2 --- Round Robin

Verify:

-   groups;
-   match generation;
-   courts;
-   scoring;
-   standings;
-   ties / ranking rules;
-   result correction;
-   completion;
-   reports.

### Test 3 --- Groups → Bracket

Verify:

-   group generation;
-   standings;
-   qualifiers;
-   bracket generation;
-   propagation;
-   correction protection;
-   completion across stages.

### Test 4 --- Individual Rotation

Verify:

-   Planner;
-   template selection;
-   Entries;
-   generated rounds;
-   courts;
-   timer;
-   score entry;
-   Add Round;
-   Fairness;
-   Ranking;
-   completion.

### Cross-workflow failure tests

For every supported engine verify:

-   browser refresh;
-   back navigation;
-   reconnect after temporary connection loss;
-   incorrect score correction;
-   court change;
-   retirement;
-   incomplete match;
-   duplicate action protection;
-   locked downstream state.

------------------------------------------------------------------------

## A3. Mobile Interaction Pass

This is a release-critical sprint.

It is not a full visual redesign. It is a focused pass over actions used
while standing beside a court.

### Score input

-   numeric keyboard via `inputMode="numeric"`;
-   large score fields;
-   logical focus order;
-   minimal taps;
-   prominent Save Result;
-   no desktop-only interaction assumptions.

### Touch

-   comfortable primary touch targets;
-   avoid tiny icon-only critical actions;
-   sufficient spacing between destructive and normal actions.

### Courts

-   touch-friendly court selector;
-   add court without leaving the operational context;
-   visible court state;
-   court changes independent from match result.

### Timer

-   large and immediately visible;
-   Start / Pause / Resume;
-   end-of-round notification;
-   timer state understandable without opening secondary panels.

### Live actions

Primary live actions should remain reachable without unnecessary
scrolling.

Candidate pattern:

``` text
START / PAUSE
SAVE RESULT
UNDO
NEXT ROUND
```

Use sticky/bottom actions where this materially improves phone
operation.

------------------------------------------------------------------------

## A4. Play Experience V1

Play should be treated as an operational workspace, not as another
administration screen.

### Target principle

> **Configuration screens manage a competition. Play screens run it.**

A Play screen should immediately expose:

-   current round;
-   court;
-   teams/players;
-   status;
-   score;
-   waiting players where relevant;
-   next operational action.

Example:

``` text
ROUND 6                              08:32

COURT 1                              LIVE
Mario + Paolo
                 8 – 6
Luca + Andrea

COURT 2                              READY
Marco + Anna
Carlo + Sara

WAITING
Gianni · Pietro · Elena

[ NEXT ROUND ]
```

Opening a match should lead directly to the relevant live controls and
score entry.

------------------------------------------------------------------------

## A5. Results and completion

Every engine needs an explicit completion experience.

Minimum output:

-   Competition Completed state;
-   final ranking where applicable;
-   final bracket where applicable;
-   results;
-   Individual Rotation fairness report;
-   print/share-ready representation.

A competition should not feel finished merely because the DB status
became `completed`.

------------------------------------------------------------------------

## A6. Private Beta deployment

Deploy a production-like Web environment with controlled access.

### Initial users

Target:

-   3--5 organizers;
-   different competition types;
-   smartphone use;
-   real courts;
-   real scores.

### Feedback to capture

-   time to create competition;
-   setup confusion;
-   number of taps during live scoring;
-   mistakes caused by UI;
-   navigation confusion;
-   score correction cases;
-   court-change cases;
-   connection/reload problems;
-   missing operational information.

### Milestone A exit

Private Beta is achieved when supported competitions can be run
externally without developer assistance for normal operation.

------------------------------------------------------------------------

# 5. Milestone B --- Public Web V1

## Objective

A new user can discover STM, register, create a usable workspace and run
a supported competition without manual activation or technical
assistance.

------------------------------------------------------------------------

## B1. Self-service onboarding

Target flow:

``` text
Sign up
→ Personal Organization
→ New Competition
→ Players
→ Generate
→ Play
```

Requirements:

-   signup/login/magic link stable;
-   Personal Organization automatically usable;
-   understandable empty states;
-   no SQL/manual DB setup;
-   no developer-only terminology.

Business Organizations may initially retain a more controlled activation
process if commercially useful.

------------------------------------------------------------------------

## B2. Persistent Organization Players

Players become reusable Organization data rather than names repeatedly
typed into each competition.

Target model:

``` text
Organization
└── Players
```

Entries workflow:

``` text
Search players...

☑ Mario Rossi
☑ Luca Bianchi
☐ Anna Verdi

+ New player
+ Guest player
```

Benefits:

-   faster tournament creation;
-   consistent identity;
-   history foundation;
-   future statistics;
-   future ratings/integrations.

This should precede sophisticated rating systems.

------------------------------------------------------------------------

## B3. Organization members and invitations

Complete the shared-workspace model:

-   owner;
-   manager;
-   coach;
-   viewer;
-   invitation link/code;
-   join Organization;
-   activate/disable member;
-   role management.

A Business Organization should never require password sharing between
coaches.

------------------------------------------------------------------------

## B4. Quick Tournament

Quick Tournament reduces product complexity without changing internal
architecture.

Suggested entry:

``` text
+ NEW

Single Elimination
Round Robin
Individual Rotation
Advanced Competition
```

Example Individual Rotation quick setup:

``` text
Players          11
Courts             2
Available time   120 min

[ CONTINUE ]
```

STM may still create Organization → Competition → Stage → Entries
internally.

The user does not need to understand that architecture for a simple
event.

------------------------------------------------------------------------

## B5. Competition history

Competition home should clearly separate current and completed work.

Example:

``` text
ACTIVE

Summer Open
Club Championship


COMPLETED

Friday Round Robin
Social Tournament
```

Completed competitions remain accessible for:

-   results;
-   ranking;
-   bracket;
-   fairness;
-   reuse/reference.

------------------------------------------------------------------------

## B6. Contextual help

Use concise contextual explanations rather than large manuals.

Priority concepts:

-   Seeding;
-   Round Robin;
-   Fairness;
-   Minimum Fair;
-   Recommended;
-   Best of 3;
-   Consolation;
-   qualification rules.

The interface should explain complexity at the point where the decision
is made.

------------------------------------------------------------------------

## B7. Share / export V1

Minimum useful sharing:

-   ranking;
-   bracket;
-   match schedule;
-   final results;
-   Individual Rotation fairness;
-   print/PDF where appropriate.

Future branded reports are not required for first public release.

------------------------------------------------------------------------

## B8. Production hardening

Before Public Web V1:

-   error boundaries;
-   meaningful error messages;
-   loading states;
-   idempotent critical actions;
-   authorization/RLS audit;
-   organization isolation tests;
-   logging/diagnostics;
-   backup/recovery strategy;
-   privacy policy;
-   terms;
-   basic analytics/telemetry decision;
-   production domain and HTTPS;
-   transactional email review;
-   browser compatibility;
-   accessibility pass;
-   performance pass.

------------------------------------------------------------------------

# 6. Features deliberately deferred beyond Web V1

The following should not block initial release:

-   Swiss;
-   Double Elimination;
-   Ladder;
-   complete league ecosystem;
-   DUPR integration;
-   proprietary STM rating;
-   social feed;
-   general chat;
-   player discovery;
-   court booking;
-   payment processing;
-   event marketplace;
-   gamification.

Candidate competition engines can be introduced after real usage
confirms demand.

------------------------------------------------------------------------

# 7. Milestone C --- PWA

## Objective

Make the proven Web V1 installable and app-like before committing to
store packaging.

### PWA requirements

-   web app manifest;
-   production icons;
-   standalone display;
-   install flow;
-   safe-area support;
-   responsive layout;
-   orientation behavior;
-   reconnect handling;
-   deliberate caching strategy;
-   update strategy;
-   app-like launch experience.

### Why PWA first

The PWA phase provides a low-risk test of:

-   home-screen installation;
-   full-screen/standalone operation;
-   mobile navigation;
-   screen sizing;
-   reconnect behavior;
-   field-side usability.

It also exposes remaining mobile issues before App Store / Play Store
review.

------------------------------------------------------------------------

# 8. Milestone D --- Native-distributed STM

## Objective

Distribute STM through Apple App Store and Google Play without rewriting
the tournament engine.

The architecture should preserve as much as possible of:

-   domain logic;
-   repositories;
-   Supabase;
-   database;
-   server actions/API boundaries;
-   tournament engines;
-   fairness engine;
-   template library.

The exact packaging technology must be re-evaluated at implementation
time. A WebView/native-shell approach such as Capacitor is a plausible
direction for the current architecture, but it is not locked by this
roadmap.

------------------------------------------------------------------------

## D1. Native integration priorities

Only native capabilities that materially improve STM should be
introduced.

High-value candidates:

-   haptic feedback;
-   local/push notifications;
-   native share sheet;
-   keep-screen-awake during Play;
-   orientation handling;
-   deep links;
-   improved offline/reconnect behavior;
-   QR scanning for invitations or event access.

Not all are required for App V1.

------------------------------------------------------------------------

## D2. Store readiness

### Apple

-   Apple Developer account;
-   bundle identifier;
-   signing;
-   App Store Connect;
-   icons/screenshots;
-   privacy declarations;
-   TestFlight;
-   review submission.

### Android

-   Google Play Console;
-   application ID;
-   signing;
-   store listing;
-   privacy/data-safety declarations;
-   internal testing;
-   closed/open testing as appropriate;
-   production submission.

### Shared

-   Privacy Policy;
-   Terms;
-   support contact;
-   app description;
-   screenshots;
-   release notes;
-   versioning;
-   crash/diagnostic strategy.

------------------------------------------------------------------------

# 9. Release gates

## Gate A --- Private Web Beta

Must have:

-   Individual Rotation V1 frozen;
-   principal engines pass E2E tests;
-   mobile score entry usable;
-   courts usable;
-   result correction reliable;
-   Play screen operational;
-   completion/results usable;
-   no normal workflow requires DB intervention.

## Gate B --- Public Web V1

Must additionally have:

-   self-service Personal onboarding;
-   persistent players;
-   usable Organization membership;
-   history;
-   Quick Tournament;
-   contextual help;
-   production hardening;
-   legal/privacy basics.

## Gate C --- PWA

Must additionally have:

-   installability;
-   standalone mobile layout;
-   safe areas/orientation;
-   reconnect/update behavior validated.

## Gate D --- Native App V1

Must additionally have:

-   native shell/package;
-   store compliance;
-   TestFlight / Play testing;
-   store assets;
-   release monitoring.

------------------------------------------------------------------------

# 10. Recommended sprint sequence

## Sprint R1 --- Finish Individual Rotation

-   complete 84 / 84 templates;
-   verify template lookup;
-   real tournament;
-   Add Round;
-   timer;
-   ranking;
-   fairness;
-   freeze V1.

## Sprint R2 --- E2E Core Tournament Validation

-   Single Elimination;
-   Round Robin;
-   Groups → Bracket;
-   correction/undo;
-   retirement;
-   courts;
-   completion.

## Sprint R3 --- Mobile Play UX

-   numeric keypad;
-   score focus;
-   touch targets;
-   sticky actions;
-   court UX;
-   timer;
-   Play screen simplification.

## Sprint R4 --- Beta Readiness

-   completion/results;
-   reports;
-   critical error handling;
-   deployment;
-   private accounts;
-   acceptance checklist.

### → RELEASE: PRIVATE WEB BETA

## Sprint R5 --- Beta Feedback

-   real-user defects;
-   workflow simplification;
-   performance;
-   mobile fixes.

## Sprint R6 --- Product Layer

-   persistent players;
-   Personal onboarding;
-   Organization invites/members;
-   history.

## Sprint R7 --- Public UX

-   Quick Tournament;
-   contextual help;
-   share/export;
-   empty states;
-   public-facing polish.

## Sprint R8 --- Production Hardening

-   security/RLS audit;
-   privacy/legal;
-   diagnostics;
-   accessibility;
-   production configuration.

### → RELEASE: PUBLIC WEB V1

## Sprint R9 --- PWA

-   manifest;
-   install;
-   standalone;
-   safe areas;
-   reconnect;
-   update behavior.

### → RELEASE: INSTALLABLE PWA

## Sprint R10+ --- Native Distribution

-   packaging decision;
-   iOS/Android shell;
-   native integrations;
-   TestFlight;
-   Play internal testing;
-   store compliance.

### → RELEASE: STM APP V1

------------------------------------------------------------------------

# 11. Post-release engine roadmap

Only after Web V1 usage data should STM prioritize additional formats.

Current candidate order:

1.  Double Elimination;
2.  Swiss;
3.  Ladder;
4.  richer consolation/placement structures.

Priority may change based on actual organizer demand.

------------------------------------------------------------------------

# 12. Product KPI for the first releases

The most important early KPI is not the number of supported formats.

It is:

> **Percentage of competitions successfully created and completed
> without developer/support intervention.**

Supporting measures:

-   time from New Competition to generated structure;
-   score-entry error/correction frequency;
-   abandoned competitions;
-   mobile vs desktop usage;
-   completion rate;
-   repeated organizers;
-   repeated Organization players;
-   support requests per competition.

------------------------------------------------------------------------

# 13. Definition of first product success

STM Web V1 is successful when an organizer who did not participate in
development can:

1.  register;
2.  create or access an Organization;
3.  create a supported competition;
4.  add/select players;
5.  generate the competition;
6.  run it from a phone;
7.  enter and correct results;
8.  manage courts;
9.  complete the competition;
10. show/share the final outcome.

The native application is the next distribution milestone, not a
prerequisite for validating the product.

------------------------------------------------------------------------

## Roadmap statement

> **Web first. Real tournaments second. PWA next. Stores after the
> workflow has proven itself.**

This sequence protects STM from spending significant effort on packaging
or additional engine breadth before the core product has been validated
by real organizers.
