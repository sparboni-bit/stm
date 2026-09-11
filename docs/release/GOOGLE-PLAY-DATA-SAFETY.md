# Google Play Data Safety — Pickleball Arena Tournament Manager

**Release:** Android 1.0.0  
**Package:** `com.pickleballarena.tournament`  
**Assessment date:** 11 September 2026

## Purpose

This document records the Data Safety assessment for the current offline Android release. It should be reviewed again whenever dependencies, networking, authentication, analytics, advertising, cloud synchronization or other data-handling functionality changes.

## Current release assessment

Based on the release audit performed for Android 1.0.0:

- The application can operate offline.
- No user registration, login or authentication is required.
- Tournament and player information is stored and processed locally on the device.
- The Android mobile export does not contain the Supabase URL or Supabase public-key environment variables checked during the audit.
- No advertising, analytics, Crashlytics, Firebase or user-tracking SDK was identified in the audited release dependencies/configuration.
- Individual Rotation uses a static reference catalog bundled locally with the application.
- The source Android manifest declares the Internet permission, but the presence of that permission alone does not constitute data collection.
- User-initiated export/sharing through external applications is treated separately from developer collection; the user chooses the destination.

## Google Play Data Safety answers for this release

### Does your app collect or share any of the required user data types?

**No**, based on the audited behavior of Android release 1.0.0.

Tournament information, player names and match data entered by the user are processed locally and are not transmitted to the developer or an STM-operated server.

### Is user data collected?

**No.**

### Is user data shared with third parties?

**No.**

### Accounts

The current Android release:

- does not allow users to create an account;
- does not require login;
- does not authenticate users.

Therefore account-deletion functionality is not applicable to this release.

### Advertising

**No advertising SDK or advertising functionality identified.**

### Analytics

**No analytics SDK or analytics transmission identified.**

### Tracking

**No user-tracking functionality identified.**

### Location

**Not collected or shared.**

### Personal information

Player names or similar tournament information may be entered by the tournament organizer, but they remain local to the device and are not transmitted to the developer. Under the current audited behavior they are therefore not declared as data collected by the app developer.

### Photos and videos

**Not collected or shared by the developer in the audited release.**

### Audio

**Not collected or shared.**

### Contacts

**Not collected or shared.**

### Files and documents

Local application/export functionality does not, by itself, mean that files are collected by the developer. Any user-initiated sharing to an external service is controlled by the user.

### App activity, web browsing and device identifiers

**Not collected or shared by the developer in the audited release.**

## Privacy Policy

Developer: **Stefano Parboni**, operating under the **Pickleball Arena** brand.

Public contact email: **stefano@pickleballandstay.com**

A publicly accessible web version of the Privacy Policy must be provided in Google Play Console and made accessible from the application before production publication.

## Release-change checklist

Reassess this document before every release if any of the following is introduced:

- Supabase or another remote backend in the Android build;
- user accounts, authentication or cloud synchronization;
- analytics, crash reporting or telemetry;
- advertising or advertising identifiers;
- push notifications;
- remote Individual Rotation/template retrieval;
- collection of location, contacts, media or device identifiers;
- automatic network transmission of tournament/player information;
- new third-party SDKs that transmit data.

If any of these changes occur, do not reuse the current “No data collected / No data shared” declaration without a new audit.
