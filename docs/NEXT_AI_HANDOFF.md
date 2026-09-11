# Coordinator handoff - CodeDELeet V2.2

## Ownership and baseline

This implementation used the uploaded `CodeDELeet_V2_Full_Source.zip` and V2.2 handoff as authority. No GitHub/Netlify connector, repository write, branch creation or deployment was performed. You own integration and any deployment separately authorized in your conversation. Keep production unchanged until the gates below pass.

The ZIP is a complete source tree, not a patch. Extract its contents at the branch root. Use `src/`, `public/packs/`, `public/cases/`, and scripts as source; `public/app/` and `dist/` are generated. Avoid nesting another project folder. Preserve licenses and the existing static `netlify.toml`; no backend/serverless service is introduced.

## Reconcile current branch safely

The supplied source was V2.0.0 and still contained the old public notebook ZIP and Mermaid 11.4.1. This pass removes that archive, pins Mermaid 11.16.1 and makes the build reject notebook/archive assets. If your branch already has independent V2.1 hardening, preserve it; do not restore the old `public/companion/` path or downgrade the pin. The current app keeps the original storage key, all 51 exercise IDs and all 27 V1 IDs.

## Reproduce deterministic evidence

```sh
npm ci --ignore-scripts
npm run check
npm test
python -m pip install -r requirements-dev.txt
python -m playwright install --with-deps chromium
python tests/fixture_check.py
python tests/ui_smoke.py
python tests/v22_ui.py
```

Run `node scripts/serve.mjs dist` in another terminal, then `python scripts/validate_release.py` to check local asset/MIME delivery and release invariants. The delivered tests record JSON under `evidence/v22/`. Browser smoke scripts capture actual application screenshots, not mockups.

## Required real-origin promotion gate

```sh
# Server running at localhost:5173 or set BASE_URL to an isolated preview.
python tests/network_runtime_smoke.py
```

Use `UI_MODE=http python tests/ui_smoke.py` for the full original interaction suite on the served build. In PowerShell set `$env:UI_MODE='http'` and optionally `$env:BASE_URL='...'` before invoking Python. A blocked setup exits 2 and records **UNVERIFIED**, never PASS. All loader waits use DOM/content readiness rather than `networkidle`.

Verify actual reference execution for every executable SQL/Python/basic-pandas exercise, cold downloads, invalid queries, syntax errors, cancellation/timeouts and a successful subsequent worker run. The network script covers browser storage reload and Mermaid flowchart, ER and architecture-beta with the pinned version. Inspect CSP/headers in the hosted environment so the existing CDN/worker requirements are allowed without broadening unrelated privileges. No such hosted verification is claimed by this delivery.

The local source/compiler checks used the installed exact TypeScript 5.8.3. A registry DNS failure prevented a clean `npm ci` in the implementation environment; perform that clean install and your dependency audit here.

## Migration acceptance

Export actual user progress from the current origin first. Import it into the isolated preview through Settings > Merge backup. Check standalone code, notes, virtual Git/shell state, bookmarks, confidence and attempts; then create/edit a case task, move exhibits/tasks, export/reimport and verify both scopes. Case mode alone must not create an authored session. Explicit standalone copying must checkpoint, not silently overwrite, a case answer.

On first V2.2 boot an eligible older stored value is copied to `.pre-v22`. `.pre-v2` behavior remains. The original unreadable value is never silently replaced: saving is blocked and raw export is offered. Different preview domains have independent localStorage.

## UI checks before promotion

Inspect Code Solve/Data & Debug, wide Model Designer, DAX Measures & Data, Pipeline Designer/Grid/Timeline/Logs, and Systems Compare. Check all four themes, terminal override, right-rail overlay/pin, all output anchors, exact Focus restoration and a phone-sized view. A narrow viewport must not rewrite desktop preferences. Output should say stale after evaluated inputs change but not after note/theme edits. No giant output region should be present before the first run.

See [known limitations](KNOWN_LIMITATIONS.md) for teaching-engine boundaries and deferred broader specialist coverage. These are deliberate limits, not evidence of real cloud/Git execution.

## Repackage without remote operations

After rerunning the tests, use `python scripts/package_release.py --out /path/to/output`. The standard-library packager writes source, static-build and evidence ZIPs, checks every archive byte/CRC and source-manifest entry, and records hashes. It reads existing test evidence; it does not replace a fresh CI run and never uploads or deploys. The default output is the excluded `release-artifacts/` directory.
