# V1 to V2 migration

## Preserved contract

Storage key: `data-practice-studio.v1`. Store schema remains **1**. All 27 baseline IDs in `baseline-stable-ids.json` remain present in the shipped 51-exercise bank. The starter pack retains its ID and raises its content versions. No random ID remapping or bulk clearing occurs.

V1 fields retained: code, notes, graphs, bookmarks, confidence/review, attempts, timestamps, rubric selections, country/category, grain, original diagram script, selected table and the legacy performance-slider data. Old performance-slider values are retained for rollback but the new Spark investigator deliberately does not use them to invent a speed prediction.

New fields are additive: completion status, per-specialist virtual state, reasoning, Mermaid source, pane settings, Deepnote mapping and a `v2` migration marker. Original `diagram` remains the custom diagram script; Mermaid is stored separately.

## Same origin

On successful V1 load, the unmodified raw value is copied once to `data-practice-studio.v1.pre-v2` if that snapshot is absent. The V2 store is validated and augmented in memory. Saves continue under the original key. Settings offers **Export pre-V2 snapshot**. Corrupt stored JSON or failed validation does not silently overwrite the original: saving is blocked, and recovery can export the raw value before an explicit reset.

## Different branch-preview domain

Browser storage is origin-specific. V2 cannot read production localStorage from a new domain. On the old site: Settings -> Export backup. On the preview: Settings -> Merge backup. Verify a known code draft, note and bookmark, then reload. This manual cross-origin step is required and does not mean same-origin migration failed.

## Merge semantics

Draft IDs are stable. A newer `updatedAt` incoming draft replaces the **whole** older draft; equal timestamps retain the current draft. This is not a per-field collaborative merge: a deliberately sparse newer incoming draft can replace older fields for that same exercise. Unrelated draft IDs are retained. This behavior is disclosed in the UI and test report; export before merging competing edits.

Custom packs must have safe unique IDs, cannot shadow built-ins, cannot remove questions implicitly, and need increasing pack/question versions when changed. Imported packs keep their draft associations. Device settings and download consent are retained rather than overwritten by another device's backup.

## Rollback

Export V2 progress first. Restore the pre-V2 snapshot only through a deliberate recovery procedure on the old app/origin. Merely deploying an older build must never trigger an automatic destructive storage migration. Some V2-only fields will not be used by V1.

## Not included in this migration

`reference/legacy-trainer/leetcodedataeng-main.zip` is the separately uploaded older React trainer, not the inspected current repository. Its entire content bank and any unrelated storage schema are not silently merged. Deepnote notebooks are companion material, not imported as executable browser questions.
