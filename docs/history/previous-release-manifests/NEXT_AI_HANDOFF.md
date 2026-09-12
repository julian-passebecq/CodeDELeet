# Coordinator handoff - CodeDELeet V2.3 compact shell

## Baseline and ownership

Use the full source ZIP as the candidate on `v2.3-compact-shell-pro`. This pass
started from the supplied Git archive at `4212550ca4260390b5a756d81882c3a75a5f912b`.
Input hash and byte-identical retained learning/runtime files are recorded in
[V23_BASELINE_PROVENANCE.json](V23_BASELINE_PROVENANCE.json). No GitHub/Netlify
read, write, branch creation, merge or deployment was performed in this pass.
Reconcile any newer main-branch commits before integration; never force-push them away.

Extract source contents at the branch root. `src/` and `public/` are sources;
`public/app/` and `dist/` are generated. Preserve the existing static Netlify config,
licenses, locked runtime versions and links-only Deepnote policy. Do not copy the
private offline research handoff into the repository or build.

## Reproduce the gates

```sh
npm ci --ignore-scripts
npm audit --audit-level=high
npm run check
npm test
python -m pip install -r requirements-dev.txt
python -m playwright install --with-deps chromium
python -m unittest discover -s tests -p test_hosted_verifier.py
python tests/fixture_check.py
python tests/ui_smoke.py
python tests/v22_ui.py
python tests/v23_ui.py
python tests/v23_layout.py
```

Run browser suites serially on a stable compiled build. Do not rebuild modules
while the built-file harness is open. The before/after measurement baseline is
included under `evidence/v23/baseline-layout/`. To repeat baseline measurement on
another browser, supply its recorded baseline via `V23_BASELINE_METRICS` and use
the same viewports, device scale factor 1, default work mode and closed output.

Start `node scripts/serve.mjs dist` in another terminal, then run:

```sh
python scripts/validate_release.py
UI_MODE=http python tests/ui_smoke.py
UI_MODE=http python tests/v22_ui.py
UI_MODE=http python tests/v23_ui.py
python tests/network_runtime_smoke.py
```

Set BASE_URL to an isolated Netlify preview for hosted runs and execute
`python scripts/verify_hosted.py`. In PowerShell use `$env:UI_MODE='http'` and
`$env:BASE_URL='...'`. The existing CI runtime/preview jobs and production-audit
workflow are retained, with V2.3 checks added. This delivery edits the YAML locally;
it does not claim those workflows have executed for this candidate.

## Explicit remaining gates

The implementation environment cannot resolve registry.npmjs.org and blocks
Chromium URL navigation (including localhost). Local build used the already
installed exact TypeScript 5.8.3. A prior V2.2 successful deployment is historical
proof only. Obtain clean install, current dependency audit, served-origin UI,
15 real runtime checks and Netlify byte/header checks before promotion.

Only the removed mode-dropdown locator in network_runtime_smoke.py was changed
to the authoritative mode rail button. Runtime workloads, all 15 assertions,
external versions, cancellation/restart and timeout requirements are retained.
Engine/worker source files are byte-identical to the supplied release.

## UI and personal-work checks

Desktop has one 52px header; keep bookmark/timer/prev/next/action/result visible.
Four neutral lab icons need labels, exclusive active state and keyboard focus.
Mode 1/2/3 and Focus are in the rail only. Theme opens a transient non-pinnable
rail panel; other tool widths and pin preferences must not be overwritten.
Inspect Pipeline and Systems at 1366x768 and all four themes. At 1024, overlays
must not cover the primary action. At 390, keep Context/Workspace/Output/Tools,
the drawer's four labs, saved notes and the inherited light terminal.

Export real progress from the existing origin before preview migration. Use
Settings > Merge backup, verify standalone and case answers separately and keep
existing recovery snapshots. Case page and task navigation are independent.
Automated tests use disposable browser state, not the user's live data.

## Packaging

After successful local checks, run `python scripts/package_release.py --out
/path/to/output`. The packager rejects private research, archives/notebooks,
fonts, symlinks and environment files, verifies recorded build bytes, and emits
source/build/evidence ZIPs plus hashes. It packages recorded evidence; it is not a
test runner or deployment command. Read [V23_TEST_REPORT.md](V23_TEST_REPORT.md)
and [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) before interpreting any PASS.
