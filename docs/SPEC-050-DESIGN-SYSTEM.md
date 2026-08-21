# SPEC-050 – STM Design System

**Version:** 1.0

**Status:** Approved

**Applies to:** STM V2

---

# Purpose

This document defines the visual language of STM.

The objective is to guarantee consistency across the entire application, independently from the developer implementing each module.

The Design System is intentionally small.

Every new screen should reuse these components instead of creating custom styles.

---

# Design Principles

STM follows these principles:

- Mobile First
- Simple
- Professional
- Functional
- Consistent
- Accessible

Visual effects should never distract from the primary goal:

Managing competitions efficiently.

---

# Color Palette

## Primary

Slate

```
Background
slate-50

Surface
white

Border
slate-200

Primary Text
slate-900

Secondary Text
slate-500

Primary Action
slate-900

Primary Hover
slate-800
```

---

## Semantic Colors

Success

```
emerald-600
```

Warning

```
amber-500
```

Danger

```
red-600
```

Information

```
blue-600
```

---

# Border Radius

Only these values should be used.

```
rounded-lg

rounded-xl

rounded-2xl

rounded-full
```

Avoid:

```
rounded

rounded-sm

rounded-md

rounded-3xl
```

---

# Shadows

Default

```
shadow-sm
```

Avoid large shadows.

The interface should appear light and clean.

---

# Typography

## Page Title

```
text-3xl

font-bold
```

---

## Section Title

```
text-xl

font-semibold
```

---

## Card Title

```
text-lg

font-semibold
```

---

## Body

```
text-sm
```

---

## Secondary Text

```
text-xs

text-slate-500
```

---

# Spacing

Preferred spacing

```
gap-2
gap-3
gap-4
gap-6

p-3
p-4
p-5
p-6
```

Avoid arbitrary spacing.

---

# Buttons

Three official variants.

## Primary

```
bg-slate-900

text-white
```

---

## Secondary

```
border

bg-white

text-slate-900
```

---

## Danger

```
bg-red-600

text-white
```

---

# Cards

Default Card

```
rounded-2xl

border

bg-white

shadow-sm

p-5
```

---

# Forms

Input

Select

Textarea

must share identical styling.

```
rounded-xl

border

px-4

py-3
```

---

# Navigation

Desktop

Header

Sidebar

Mobile

Top Header

Bottom Navigation (future)

---

# Icons

Official icon library

Lucide

Icons should always communicate actions.

Avoid decorative icons.

---

# Components

UI components

```
Button

Card

Badge

Input

Select

Spinner

Section

EmptyState

ConfirmDialog
```

Layout components

```
AppShell

AppHeader

Sidebar

PageContainer

PageHeader

UserMenu
```

Workspace

```
WorkspaceSwitcher
```

Competition

Future modules.

---

# Responsive Design

STM is Mobile First.

Every page must work correctly on:

- Phone
- Tablet
- Desktop

Desktop enhancements should never break mobile usability.

---

# Accessibility

Buttons must have visible focus.

Forms must have labels.

Color must never be the only way to communicate status.

---

# Future Extensions

Dark Theme

Brand customization

Accessibility themes

White Label