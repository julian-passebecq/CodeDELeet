# Security and data boundaries

This static app is for personal practice with trusted code, not a hardened public execution service. It has no backend credentials, host shell, cloud connection, GitHub writer or Netlify function. Virtual Git/shell operations update only browser objects. Built-in solutions and test fixtures are public client assets.

DuckDB and Pyodide are loaded from pinned external CDN URLs after explicit consent. An offline or policy-blocked runtime reports an error and retains the draft; it must never silently replace execution with a fake result. Heavy initial loading is bounded, and active workers can be terminated. Pyodide can interoperate with JavaScript: do not treat a worker as comprehensive isolation, run hostile code, place secrets in exercises, or assume all network paths are disabled by the package allowlist.

Progress is localStorage-based and backups are plain JSON. Treat exported notes and virtual files as personal data. No encryption or multi-user access control is promised. Export before changing domains or clearing storage. Sources and labels are HTML-escaped; diagrams use strict settings, input limits and neutral original SVGs. Imported custom fixtures are learning data and should be trusted/reviewed; schema hardening remains on the backlog.

No audit against every dependency vulnerability, every DOM sink or a formal threat model has been completed. Report issues privately to the repository owner rather than putting personal backup data in a public issue. A production hosted execution service would require a separate isolation design, authentication, resource quotas and abuse controls.
