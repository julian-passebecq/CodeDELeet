# Deepnote companion integration

## Purpose

Deepnote is an optional **external companion** for exercises that benefit from a real notebook/runtime. CodeDELeet remains the fast, local-first drill surface. No Deepnote notebook archive is bundled or published by the site.

The built-in mapping file contains **blank URL examples** keyed by stable exercise IDs. They demonstrate how SQL, Python, Pandas, PySpark, BI and pipeline exercises can later point to the user's own Deepnote projects/notebooks. The examples are metadata only; they are not a claim that those notebooks exist online.

## Configure real URLs

1. In Settings, download the URL mapping template, or edit `public/packs/deepnote-mapping.json` before rebuilding.
2. Paste the user's actual project/notebook links into the appropriate `url` fields. Leave unconfigured entries blank.
3. Import the JSON via Settings -> Import URL mapping. Only valid HTTPS Deepnote URLs render buttons. The user must already have access to those notebooks.

The map has `schemaVersion: 1` and a `links` object keyed by stable exercise IDs. Link types are exercise/concept/mock/reference/project. Optional notebook and section labels are descriptive hints only. Only the exact `deepnote.com` / `www.deepnote.com` hosts and accepted paths are allowed; credentials, custom ports and lookalike hosts are rejected.

The app cannot discover the user's workspace URLs or permissions. It does not need a token, does not create projects, does not require a GitHub sync, and does not claim an embedded preview can edit a Deepnote notebook. For an externally configured embed, availability is provider- and permission-dependent.

## Learning workflow

Attempt the problem and inspect the supplied rows/schema in CodeDELeet. For PySpark, write the transformation and explain the plan; CodeDELeet explicitly reports that it did not execute Spark. If the user later configures a matching Deepnote URL, the Deepnote button opens that external notebook for real execution. Return to CodeDELeet to record confidence and notes.

## Release policy

The public site ships the link/mapping mechanism only. Do not add private notebook exports, copied interview-note archives or workspace credentials to `public/` or `dist/`.
