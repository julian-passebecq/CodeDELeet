# Current V2.4 evidence

Read `FINAL_TEST_RUN.json` for commands, exit codes and PASS/BLOCKED distinctions.
`V24_ACCEPTANCE_REPORT.json` is the new 83-check browser run; `regression/` contains
snapshots of old suites rerun on this candidate. `CLEAN_REBUILD_REPORT.json` verifies
regenerated outputs. `build-files.json` binds delivery to the tested build.
`SOURCE_PRESERVATION.json` compares unchanged engines, fixtures and cases to the
uploaded V2.3 archive. `PRIVATE_REFERENCE_AUDIT.json` checks private image bytes.

`gallery.html`, `screenshots/` and `V24_LAYOUT_METRICS.json` are actual built-app
browser evidence. No worker/CDN runtime success is inferred from these pictures.
`logs/final/` is the authoritative final run. Earlier logs under `logs/` retain
investigation history and may show failures subsequently fixed; do not aggregate
them into the final candidate's assertion counts. Historical parent folders remain
for traceability and the V2.3 layout baseline, not current promotion evidence.
