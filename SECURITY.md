# Personal-workspace security boundaries

This is a local learning tool, not an untrusted multi-user execution service. No claim of an audited security sandbox is made.

## SQL

The host listens on `127.0.0.1` only. Requests require the expected Host, same local Origin, JSON content type and an intent header. There is no CORS permission. The SQL endpoint accepts only a conservative single SELECT/WITH subset and creates disposable in-memory fixtures for each query.

SQLite has query-only mode, an authorizer and a time-limited progress callback. The optional DuckDB adapter disables external access/automatic extensions, constrains threads and memory, and disables temporary-disk spill. Both are placed behind disposable subprocesses with a 12-second request timeout. POSIX resource limits are best-effort and differ from Windows. Two workers may run concurrently; body size, SQL length and output-row caps apply.

These controls reduce accidental misuse; they are not a proof against hostile SQL, denial of service, engine vulnerabilities or malicious extensions. Do not expose this server publicly. Use only its supplied or personally authored tiny fixtures. No arbitrary Python or shell endpoint exists. The bundled fixture schema is trusted repository input, not an import format for hostile table definitions.

## Optional browser Python

Python runs in a worker through Pyodide, not on the local server. Loading the pinned runtime requires consent and a third-party CDN request. Network metadata reaches that provider. The worker has no DOM access but can still have network-capable APIs; it is not a security boundary for malicious code. Run only trusted personal code. Timeout termination is provided; memory is not strongly isolated from the browser process.

The remote runtime adapter was not tested end-to-end in the offline build environment. Revoking the consent setting prevents a later download prompt from being bypassed; it is not a network firewall. Standard library practice only: package installation, pandas, Spark and native extensions are not supplied by this adapter.

## Imports and rendering

JSON imports have a 2 MB cap and structural validation. Safe stable IDs, ownership, versions and graph bounds are checked. Question text is escaped before HTML rendering. The diagram language is a small parser, not eval or full Mermaid. Diagram/source links are not executed as arbitrary HTML. Provenance links may lead to third-party websites when clicked.

Code cannot be automatically certified based on matching keywords. SQL certification is limited to server-owned fixture tests. Diagram checks assert only graph properties. Review checkboxes represent self-review.

## Saved data

Data stays in browser localStorage when available, with no account or telemetry. Shared-device browser users can inspect it. Clearing site data, private browsing, quota limits, changed origins and file-mode restrictions can lose or separate progress. Export a backup regularly and keep sensitive work out of exercise notes.

Corrupt saved state is protected from automatic overwrite. Settings offers download of the raw original, export of in-memory progress, and an explicit replacement confirmation. Backups contain personal notes/code; handle them accordingly.

## Deployment

Public static hosting may expose the included question answers and tiny synthetic fixtures by design. It does not host the Python SQL server. Never publish private datasets or secrets in `public/`, packs or answer text. This repository does not provision any cloud resources.
