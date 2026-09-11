# V2.2 integration and release audit

Date: 2026-09-11. Repository: julian-passebecq/CodeDELeet. Existing Netlify project: leetdejul.

## Verified input and branch

Input: CodeDELeet_V2_2_Full_Source.zip, SHA256 487729963a3f5b2353c0f11cc8ac7e6527a48021309569ecd4bcdba816e05f66.
Based on audited V2 commit 0a0ddad5cb8704abda26257d58e95e861ecff33e, not the old V1 main worktree.
GitHub import run 34550147355 verified the transport, rebuilt source and committed unpacked files as 3efbe2b5b286084c10343301fa639a278e7e498a.
The one-time transport and import workflow are removed. Provenance: evidence/coordinator/import-provenance.json.

## Obtained evidence and corrected failures

The import run passed clean npm ci, typecheck/build, 80 unit tests, 42 native fixture checks, 68 built-file browser checks, 30 shell/case checks and 22 integrity checks. Those are 242 checks, not 242 cloud runtimes.

Run 34551289828 passed fresh contracts and all real HTTP UI/runtime gates: 68 exercise UI + 30 shell/case checks, nine SQL/Python/pandas reference exercises, cancellation/restart, automatic timeout/restart, real reload persistence and three Mermaid diagram types (15 runtime checks). Its Netlify gate correctly stopped on a served index.html difference. Diagnostic run 34551786634 proved the only HTML change was the platform's feedback drawer:

`<div data-netlify-deploy-id="..." data-netlify-site-id="3ae5ab13-da0f-4e61-a1a2-106d869fbff0" data-vcs="github" style="position:fixed"> ... <script async src="/.netlify/scripts/cdp"></script> ... </div>`

The comparator now permits exactly one such observed block immediately before closing body, only on a Deploy Preview of this specific site. All remaining HTML must be byte-identical, and the immutable deploy permalink's original HTML must also be byte-identical. Production HTML and every non-HTML asset remain strict, unnormalized byte checks. Nine no-network regression cases reject unexpected scripts, site IDs, additional application edits, duplicate snippets, unsafe IDs and normalization in production/non-HTML assets.

## Coordinator hardening

- Preserved audited SECURITY.md and real served-origin/CDN CI; the supplied ZIP's reduced workflow would have dropped that gate.
- Repaired HTTP harness explicit-case-route handling.
- Wait for actual lazy CodeMirror readiness rather than testing shell DOM too early.
- Select the root Mermaid SVG without matching nested architecture-icon SVGs; all original rendering assertions retained. Capture actual runtime screenshots.
- Added locked npm audit, reproducible committed-build checking, deployed-byte/security-header/removed-archive checks, full hosted UI/runtime tests and a read-only production audit after main updates.
- Independent CI jobs run in parallel; all must pass before promotion.

## Release state

The source is integrated. Fresh final-head preview CI and production promotion must be confirmed in PR #9's final audit comment and its linked runs. This document does not claim those pending gates passed. Source-package historical reports are input evidence, not new hosted release proof; their SHA256SUMS/RELEASE_MANIFEST do not describe this integrated tree. Use the final Git commit and current hosted hash report.

## Bounded limitations

51 exercises and four cases are a curated teaching bank, not exhaustive interview coverage. Git/shell/DAG/DAX/configuration views are bounded teaching engines, not host or full vendor execution. Public fixture tests are not secret exams. CDN availability and browser-worker isolation remain trust boundaries. npm audit covers the lockfile, not a security certification of every vendored/CDN dependency. Chromium phone-sized tests are not native Safari proof. Progress is origin-local: export/import before changing origins.

## Official platform references

- https://docs.netlify.com/deploy/review-deploys/netlify-drawer-for-feedback/troubleshoot-the-netlify-drawer/
- https://docs.netlify.com/build/post-processing/snippet-injection/
