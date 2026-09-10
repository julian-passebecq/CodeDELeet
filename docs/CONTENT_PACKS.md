# Content packs and safe updates

## What a pack contains

A pack is a UTF-8 JSON object with `schemaVersion: 1`, a stable `id`, a human title, a positive integer `version`, and a non-empty `questions` array. An example is in `examples/custom-pack.json`; JSON Schema is in `examples/content-pack.schema.json`.

Every question has a stable ID, its own positive version, workspace, topic, difficulty, approximate minutes, engine, language, summary, concepts, task, requirements, starter, hints, solution, explanation and source links. Content is plain text, escaped on display, not trusted HTML. No code fence is required in starter or solution strings.

Workspace values: `code`, `model`, `pipeline`, `architecture`.

Engine values: `sql`, `python`, `dax-subset`, `graph`, `review`.

Use only combinations supported by the UI: code supports SQL, Python and review; model supports DAX subset, graph and review; pipeline supports graph or review; architecture supports graph or review. Assigning an engine does not magically install the associated product.

Use the existing model fixture for BI (`template: "model"`). Pipeline templates are `pipeline`, `watermark`, `dbt`. Architecture templates are `fabric`, `databricks`, `bigquery`, `infrastructure`, `spark`, `lakehouse`. Unknown templates fall back to the Fabric template for rendering; authors should not rely on that fallback. Custom arbitrary model schemas are not supported in v0.1.

## Three ways to add content

**Browser-local pack:** open Packs & settings, choose Import content pack, inspect the preview, and apply. This changes only this browser's library. Export a backup to move it to another device.

**Repository pack:** add a JSON file under `public/packs/`, list its relative path in `public/packs/index.json`, and restart/refresh the app. Rebuild `OPEN_STUDIO.html` with `node scripts/build-preview.mjs` after changing repository content. Repository-installed packs are protected as built-ins. Stable IDs must be globally unique.

**Backup:** export/import full learning state. Backup JSON is not a content-pack file. The app distinguishes the two import commands. A backup includes custom packs, drafts, notes, graph edits, bookmarks, ratings and attempts, but not edits to the original built-in question definitions.

## IDs are not titles

Choose an identifier such as `personal-sql-orders-001`; retain it when renaming a title, improving wording, reorganizing a topic or moving an exercise. IDs begin with an ASCII letter, contain letters/digits/underscore/hyphen only, and have a maximum length of 80 characters. Object prototype names are reserved. Pack titles and topics may be readable free text.

Changing an ID creates a different question; it is not a rename. There is no automatic migration between two different IDs. In particular, do not move a question between pack owners by stealing its ID. Keep its owner pack and change topic/workspace metadata when reorganizing, or plan an explicit migration for a later release.

## Update contract

An imported update must increase its pack version. Existing question versions cannot decrease. Any changed question object must increase its question version. Existing question IDs cannot disappear from an update; deletion is not an implicit side effect. A question cannot take an ID from another installed pack or a repository pack. An imported pack cannot replace a built-in pack ID.

These checks run before any update is applied. Drafts remain attached to stable question IDs. Opening a reference solution does not erase notes or mark an exercise solved. Copy-reference and reset-code both require confirmation and affect only the code text, not notes or graph edits.

Because comparison is currently serialized-object based, reordering question object properties can be treated as a content change. Bump the question version or preserve canonical property order. Cryptographic signing, ownership authentication and cross-pack moves are not implemented.

## Backup merge

For each draft, the newer `updatedAt` timestamp wins. Equal timestamps keep the current draft. Merge is at the whole-draft level: it does not combine code from one copy with notes from another. The preview advises exporting current state first. Timestamps are client-generated, not an authoritative distributed clock.

Settings and Python download consent stay with the current device. Custom packs must pass the normal version/ownership rules. An incoming older conflicting pack is rejected rather than silently downgrading or discarding it. Unreadable saved browser data is protected until explicitly recovered in Settings.

## Limits and fixture registration

Imports are limited to 2 MB; packs to 500 questions; custom-pack arrays to 50; draft maps to 5,000 entries; code/question text and graphs have additional parser bounds. Browser storage can run out before these structural ceilings; export regularly.

The current SQL server registers its trusted tests from the bundled starter pack. Browser-imported questions can execute read-only SQL on the existing fixture, but their solution fields do not become trusted server tests. The UI states that no server-side suite is registered instead of displaying a false pass. Adding arbitrary datasets/test adapters is a later architecture change, not a question-file trick.

Python tests are personal client-side fixture assertions, not tamper-proof grading. Standard library examples define `solve`; `pythonTests` contains `args`, `expected` and `label`. Real Spark/pandas/T-SQL/BigQuery/DAX/C#/shell runtimes do not become available by changing language labels.

## Review and provenance

Write a small original scenario, synthetic rows and a useful explanation. Link official documentation with HTTPS source URLs. Do not import scraped proprietary exercise banks or real client data. A useful first pack is four questions: one concept review, one syntax task, one small coding/modeling task, and one slightly harder practical scenario.
