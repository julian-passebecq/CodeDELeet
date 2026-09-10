# Deepnote companion integration

## Preserved input

The exact supplied `Deepnote_3_Project_Interview_Suite_v1_4(1).zip` is retained as `public/companion/Deepnote_Interview_Suite_v1_4.zip`, copied into `dist/companion/` during build. It contains the user's three-project interview suite and nine notebook backups. It is companion material, not silently converted into hundreds of browser exercises.

Twelve exercise-to-notebook heading references were checked against the supplied notebook source. See `DEEPNOTE_MAPPING_VERIFIED.json` for the exact archive member paths and headings, and `evidence/fixture-report.json` for the actual tests. The content generator is `scripts/build_content.py`.

## Configure real URLs

1. In Settings, download the URL mapping template, or edit `public/packs/deepnote-mapping.json` before rebuilding.
2. Paste the user's actual project/notebook links into the appropriate `url` fields. Leave unconfigured entries blank.
3. Import the JSON via Settings -> Import URL mapping. Only valid HTTPS Deepnote URLs render buttons. The user must already have access to those notebooks.

The map has `schemaVersion: 1` and a `links` object keyed by stable exercise IDs. Link types are exercise/concept/mock/reference/project. Labels and original section references are retained. Only the exact `deepnote.com` / `www.deepnote.com` hosts and accepted paths are allowed; credentials, custom ports and lookalike hosts are rejected.

The app cannot discover the user's workspace URLs or permissions. It does not need a token, does not create projects, does not require a GitHub sync, and does not claim an embedded preview can edit a Deepnote notebook. For an externally configured embed, availability is provider- and permission-dependent.

## Learning workflow

Attempt the problem and inspect the supplied rows/schema in V2. For PySpark, write the transformation and explain the plan; V2 explicitly reports that it did not execute Spark. Use the mapped notebook for an actual runtime, then return to record confidence and notes. Keep local backups separate from the notebooks.
