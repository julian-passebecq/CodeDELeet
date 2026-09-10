# V2.1 backlog - bounded follow-up, not hidden V2 claims

## Release blockers before promotion

1. Run real-origin and network-runtime smoke tests, including timeout/cancel/restart and CDN failure. Record actual engine versions and logs. Fix demonstrated failures before adding features.
2. Verify a clean `npm ci` with the included lockfile; run dependency and license checks; consider self-hosting pinned runtime assets for predictable CSP/offline behavior.
3. Verify real V1 backup migration on the new preview with full reload, and phone/tablet/Firefox behavior.

## High value next pass

- Field-level backup conflict preview and reversible custom-pack removal without draft deletion.
- Fixture schema validation for every specialist, robust saved-lab-state validation, malformed import fuzz tests and input-size limits at all render boundaries.
- Playwright suites on HTTP origins in CI; actual error/cancellation cases, visual regression, keyboard and accessibility checks.
- More practical SQL/Python exercises from the supplied materials, individually converted, sourced, fixture-tested and deduplicated. Do not bulk-copy notebook cells or unlicensed challenge banks.
- Test SQL/Python runtime startup as part of every dependency update; remove CDN dependency only after asset licensing and bundle-size review.
- A real-model adapter contract for arbitrary semantic tables/relationships, rather than presenting the teaching model as a universal DAX engine.
- DAG run history, richer task inspection, pools/backfill and a bounded watermark replay data fixture. Keep real Airflow/ADF badges separate.

## Later, explicitly opt-in

- Real Spark/dbt execution through a separately designed service with isolation, authentication, cost limits and consent. Not a static-hosting patch.
- Enhanced virtual Git conflict/rebase continuation and richer diff display; exact shell quoting/status and broader PowerShell object semantics.
- Further architecture lessons on Iceberg/Delta/DuckLake and cloud-provider trade-offs, with dated official sources. No fabricated price/performance equivalence.
