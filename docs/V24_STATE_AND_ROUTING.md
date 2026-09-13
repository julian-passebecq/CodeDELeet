# V2.4 state, routing and shell contract

## URL grammar

Legacy exercise and case links remain Practice links:

```text
#exercise=sql-paid-revenue
#case=<existing-case-id>&task=<existing-task-id>
```

New surfaces use explicit hashes:

```text
#view=practice&lab=code
#view=practice&lab=code&category=sql-patterns
#view=learn&lab=model
#view=learn&lab=model&category=bi-serving
#view=learn&lesson=code-sql-grain-joins
#view=learn&lesson=code-sql-grain-joins&section=flow
```

The lesson catalog, not contradictory URL lab/category values, determines a
lesson's context. Unknown routes fall back to a safe lab home. Invalid section
IDs are ignored. Page/section updates use replaceState; destinations add a history
entry. A stored case still resumes from a blank URL, preserving the older contract.
Explicit lab-home hashes always open homes, not an exercise or case.

The global app-mode switch returns to the last active in-session Practice exercise
or case for the lab. Learn opens the lab home with Continue Learning. Category-mode
buttons deliberately open the equivalent category in the other mode. Lab icons
always open homes. Alt + Left/Right remains exercise navigation only while a
workstation is active; browser Back/Forward remains usable on discovery surfaces.

## Persistence

Storage key: `data-practice-studio.v1`. Store schema remains 1. Existing snapshots,
custom packs, standalone `drafts`, `caseSessions` and local presentation fields
remain intact. `settings.learning` is additive:

```text
progress[lessonId] = {status, lastSection?, notes?, updatedAt}
lastLessonByLab[lab]
lastCategoryByLab[lab]
notes? / notesUpdatedAt?   (general study notebook)
```

Status is not-started, in-progress or completed. Opening a completed lesson does
not uncomplete it. Scrolling/jumping tracks the last valid section; notes and
completion update the lesson timestamp. Learn never calls markDraft or patchTask.

Imports validate bounded entries, IDs, section IDs, statuses, timestamps and notes.
Safe unknown future lesson IDs are retained without rendering crashes. The limit
is 2,000 progress entries and 20,000 characters per note. Invalid learning imports
are rejected before replacing the current store. An optional empty Practice
navigation object normalizes safely to an empty per-lab exercise map.

Merge is atomic per lesson record: strictly newer incoming timestamps win; equal
or older timestamps retain the local record. Study-notebook notes have their own
timestamp. Absent incoming learning data does not erase existing learning data.
Practice drafts and cases retain their existing separate merge rules. Device
presentation preferences remain local. There is no account/cloud synchronization.

## Responsive navigator

| Viewport width | Resting state | Toggle behavior | Persistent width |
|---|---|---|---|
| At least 1,200px | Saved expanded/compact preference | Changes desktop preference | Saved 200-320px / 56px |
| 760-1,199px | Compact | Transient 320px overlay | 56px, unchanged by overlay |
| Below 760px | Hidden | Transient drawer, at most 320px | 0px |
| Practice Focus | Hidden | Exit/restore using the saved Focus snapshot | 0px |

Overlay/drawer width is capped for small screens. Escape and backdrop dismiss it
and return focus to the toggle. Visible controls trap Tab while the drawer is
modal. Destination selection and width-band changes close the transient overlay.
ARIA reflects effective visual state, not just a stored desktop preference.
No invisible expanded state survives a breakpoint change. Theme/Notes tools and
medium overlays are exclusive. CSS transforms from the former mobile drawer no
longer leave the new drawer offscreen.

## Content boundaries

`src/navigation/taxonomy.ts` defines five categories per lab and an explicit map
for the 51 existing exercise IDs. Custom exercises without metadata use the fifth
category's Imported / Other subgroup. Valid custom category metadata is honored;
there is never a sixth primary card. Category and lab progress use only standalone
Practice drafts. Case completion and Learn completion are counted separately.

The build validates exactly one lesson per category. Four JSON catalog files total
approximately 180 KB, loaded locally once at startup. The lesson validator rejects
unknown block kinds, malformed diagrams/tables, unsafe URLs, raw HTML, oversized
payloads, duplicate IDs and broken related links. Rendering also escapes text.
Original SVG diagrams include labels, captions and text alternatives; code/tables
scroll internally at narrow widths. No remote image or raw HTML block is supported.

## Scope limits

V2.4 is a 20-lesson seed curriculum, not a full course or arbitrary lesson editor.
There is no new Learn runtime, Practice micro-runner, XP system, AI chat, account,
cloud backend, scoring engine or lesson-import interface. BI serving has a real
lesson but no fabricated Practice exercise. Lesson resources can change over time;
check their official documentation before making deployment-specific decisions.
