# Coordinator handoff - CodeDELeet V2.4

The completed source tree and one complete source ZIP are the implementation,
not a patch or instructions-only package. Start at [00_START_HERE](../00_START_HERE.md)
and [V24_TEST_REPORT](V24_TEST_REPORT.md). The local branch is
`v2.4-learning-navigation-pro`; the supplied ZIP declares upstream
`a4aad2e4ad5fe3163c5ad725456ea7e84df28964`, without a Git object database to verify it.
[Source preservation](../evidence/v24/SOURCE_PRESERVATION.json) records exact bytes.
No remote read, push, merge, PR or deployment was performed.

## Integration boundaries

Preserve `src/`, `public/`, the generated `public/app/` and `dist/`, the existing
static configuration and bundled licenses. No serverless runtime was added.
The private handoff/reference folder is not part of the candidate. Do not add it.
Do not use historical V2.2/V2.3 summaries to infer this candidate's current status.
The authoritative run manifest is `evidence/v24/FINAL_TEST_RUN.json` and the current
build inventory is `evidence/v24/build-files.json`.

Keep all 51 exercise IDs, 13 renderers, four authored cases, isolated case-task
artifacts, 12 presets and four themes. New lab icons always open homes. The global
Practice/Learn switch is not a layout selector. BI serving has no dedicated Practice
exercise. Do not fill that gap by renaming or silently moving an existing ID.

## Reproduce local validation

```sh
npm ci --ignore-scripts
npm audit --audit-level=high
npm run check
npm test
python -m pip install -r requirements-dev.txt
python -m playwright install --with-deps chromium
python -m unittest discover -s tests -p test_hosted_verifier.py -v
python tests/fixture_check.py
python tests/ui_smoke.py
python tests/v22_ui.py
python tests/v23_ui.py
python tests/v23_layout.py
python tests/v24_acceptance.py
python scripts/verify_rebuild.py
```

Run browser suites serially. Do not change/rebuild compiled modules mid-suite.
V2.3 layout comparisons use the included historical baseline metrics; V2.4's
new six-width measurements and screenshots are separate.

Start `node scripts/serve.mjs dist` in another terminal, then run:

```sh
python scripts/validate_release.py
UI_MODE=http python tests/ui_smoke.py
UI_MODE=http python tests/v22_ui.py
UI_MODE=http python tests/v23_ui.py
UI_MODE=http python tests/v24_acceptance.py
python tests/network_runtime_smoke.py
```

PowerShell uses `$env:UI_MODE='http'`. Real runtime smoke includes all retained
SQL/Python reference runs, cancellation/restart, timeout, origin persistence and
three Mermaid forms. No simulator may replace those gates. Hosted byte/header
verification uses `scripts/verify_hosted.py` only after a separately authorized
preview exists; no preview or production deployment was requested in this pass.

## Remaining external gates

The completed local pass does not clear registry, browser-origin or external-CDN
restrictions. Repeat clean install, npm audit, served-origin UI and real runtime
checks on this exact candidate in an allowed environment before promotion. Any
future authorized preview must be verified against its exact commit and build
bytes. A passing prior deployment is not evidence for V2.4.

Export actual user progress from its original origin before integration. Test
V2.3-to-V2.4 and V2.4 round trips with standalone drafts, case sessions, lesson
completion/section/notes and custom packs. The automated tests use disposable
state, never the user's live browser data. Unknown safe lesson IDs must survive
merge; equal timestamps retain local data.

## Packaging

`scripts/package_release.py --out /outside/the/repository` emits one complete
`CodeDELeet_V2_4_Complete.zip`, with source, build and evidence inside it, plus a
small verification JSON and checksum file. It verifies the current tested build
inventory and refuses private folders, archives/notebooks, fonts, environment
files, symlinks and stale/failed local test summaries. Packaging does not run tests,
contact a repository or deploy anything. Blocked external gates remain explicit.
