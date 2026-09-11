# Pickleball Arena Tournament Manager

## User Guide

**Product:** Pickleball Arena Tournament Manager\
**App:** Pickleball Arena Tournament\
**Language:** English

------------------------------------------------------------------------

## About This Guide

This documentation explains how to create and manage pickleball
competitions with Pickleball Arena Tournament Manager.

The application follows a common workflow:

**Create Tournament → Roster → Stage → Setup → Generate → Play →
Results**

Start with the Quick Start Guide, then use the dedicated guides for the
competition format or operation you need.

------------------------------------------------------------------------

## Documentation

### [Quick Start](QUICK-START.md)

The fastest introduction to the application.

Covers the complete basic workflow from creating a tournament to
entering results and viewing standings or brackets.

Recommended for first-time users.

------------------------------------------------------------------------

### [Tournament Management](TOURNAMENT-MANAGEMENT.md)

Explains the overall tournament structure and the relationship between:

**Tournament → Roster → Stage → Stage Engine**

Includes tournament creation, roster management, stage participants,
setup, generation, multiple stages, and smartphone/tablet workflows.

------------------------------------------------------------------------

### [Match Management](MATCH-MANAGEMENT.md)

Operational guide for running matches courtside.

Includes:

-   result entry;
-   Single Set and Best of 3;
-   court management;
-   retirement;
-   result corrections;
-   protected downstream Elimination results;
-   automatic winner progression;
-   standings updates;
-   Individual Rotation timer and Add Round.

------------------------------------------------------------------------

## Competition Formats

### [Individual Rotation](INDIVIDUAL-ROTATION.md)

Doubles matches with rotating partners and opponents and an individual
final ranking.

The guide explains:

-   why rotation scheduling is necessary;
-   combination counts;
-   courts, rounds, and playing opportunities;
-   partner and opponent rotation;
-   generation;
-   match management;
-   timer;
-   Add Round;
-   individual standings.

------------------------------------------------------------------------

### [Round Robin](ROUND-ROBIN.md)

Group-based competition with generated matches and standings.

The guide explains:

-   group configuration;
-   number of matches;
-   generation;
-   courts and playing time;
-   result entry;
-   standings;
-   multiple groups;
-   use before a later competition stage.

------------------------------------------------------------------------

### [Elimination](ELIMINATION.md)

Single-elimination knockout competition from the opening round to the
final.

The guide explains:

-   bracket size;
-   seeding;
-   BYEs;
-   bracket generation;
-   Single Set and Best of 3;
-   automatic winner progression;
-   result protection;
-   use after a qualification stage.

------------------------------------------------------------------------

## Choosing a Competition Format

Use **Individual Rotation** when players should compete in doubles with
changing combinations while being ranked individually.

Use **Round Robin** when participants should play several matches within
groups and be ranked from those results.

Use **Elimination** when the competition should follow a direct knockout
bracket.

A tournament can use multiple stages when more than one competition
phase is required.

Example:

**Round Robin → Elimination**

------------------------------------------------------------------------

## Recommended Reading Order

For a new user:

1.  Quick Start
2.  Tournament Management
3.  The guide for the selected competition format
4.  Match Management

The format-specific guides can then be used as reference during
tournament preparation and play.

------------------------------------------------------------------------

## Documentation Structure

``` text
docs/
└── user-guide/
    ├── README.md
    ├── QUICK-START.md
    ├── TOURNAMENT-MANAGEMENT.md
    ├── MATCH-MANAGEMENT.md
    ├── INDIVIDUAL-ROTATION.md
    ├── ROUND-ROBIN.md
    └── ELIMINATION.md
```

These Markdown files are the primary source for the user documentation
and can later be used to produce web, in-app, or PDF versions without
maintaining separate documentation content.
