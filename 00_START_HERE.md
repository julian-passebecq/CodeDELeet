# CodeDELeet V2.3 - compact shell source/build handoff

This is a bounded shell update to the supplied V2.2 release snapshot at
`4212550ca4260390b5a756d81882c3a75a5f912b`. It is not a replacement application.
No GitHub or Netlify operation was performed during this implementation.

## Open or rebuild

Extract the complete source ZIP at the project root, not inside another project folder.
The separate static ZIP has `index.html` and the contents of `dist/` at its root.

```sh
node scripts/serve.mjs dist
# To rebuild in an environment with npm registry access:
npm ci --ignore-scripts
npm run check
npm run build
```

Open the HTTP URL printed by the server. Double-clicking index.html is not supported.

## What to review first

Read [implementation scope](docs/V23_IMPLEMENTATION_REPORT.md),
[actual test results and blocked gates](docs/V23_TEST_REPORT.md),
[measured before/after layout](evidence/v23/V23_LAYOUT_METRICS.json),
and [the coordinator handoff](docs/NEXT_AI_HANDOFF.md).
The [screenshot gallery](evidence/v23/gallery.html) contains actual browser captures.

The desktop has one 52px header, four compact lab icons, the original attempt
controls, and a Theme panel on the right rail. Rail 1/2/3 is the layout-mode control.
Mobile retains Context / Workspace / Output / Tools and lab navigation in the drawer.

## Preserve work

Export progress before moving to a different preview origin. Use Settings > Merge
backup at the new origin. The V1 storage key, migration/recovery snapshots, exercise
IDs and authored-case isolation are unchanged. Do not clear existing progress to test
an upgrade. Use disposable browser profiles for automated tests.

## Promotion is separate

Local compiled-DOM tests and measured layouts are not hosted-runtime verification.
This environment blocks browser URL navigation and cannot reach the npm registry.
Clean installation, current dependency audit, served-origin browser suites and the
real SQL/Python/Mermaid gate must be run by the coordinator before promotion.
Existing V2.2 release reports are historical evidence, not a V2.3 deployment claim.
The private offline research library is not part of this source or static build.
