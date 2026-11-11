# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| zenda-cheesecake (lab, 8 nov 2026) | Continuous world (one fixed 3D stage, spacer only in flow) | Clickable waypoint map: top-center labels on desktop, bottom dots on mobile | Procedural 3D cheesecake with a wedge already missing, copy left | 6 legs, peak (layer anatomy) is the longest at 28% of the track; assembly, horizontal flavor travel, orders, close | Missing wedge lands on its own plate with an in-world CTA | La porción que falta: the wedge is gone from frame 1, travels the whole page and is served at the end | Cuajada palette, warm cream ground tinted per flavor | Next.js + R3F (lab route) |


---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

- Continuous-world grammar with a single procedural 3D product object.
- Waypoint map nav (labels top-center / dots bottom).
- Close pattern: the hero object's missing piece served on its own plate with an in-world CTA.
- Signature move "la porción que falta" (missing wedge traveling the whole page).
- Horizontal travel across labelled variants that retints the world.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
