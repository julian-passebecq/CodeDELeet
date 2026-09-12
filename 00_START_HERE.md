# CodeDELeet V2.4 - complete source, static build and evidence

This delivery continues the supplied V2.3 application. It does not replace the
workstations, exercise bank, teaching engines, worker adapters or storage key.
No GitHub or Netlify operation was performed. There is one delivery ZIP; the
complete modified source tree is also retained in the working directory.

## Open the application

Extract the ZIP, open a terminal in its `CodeDELeet` folder, and run:

```sh
node scripts/serve.mjs dist
```

Open the local HTTP address printed by the server. The included `dist/` is ready
to serve; rebuilding is not necessary to inspect this version. Double-clicking
`index.html` is not supported. Runtime downloads are optional and require consent;
SQL and Python execution need access to their pinned external runtime assets.

## Review this version

Read the [implementation report](docs/V24_IMPLEMENTATION_REPORT.md),
[actual test report](docs/V24_TEST_REPORT.md), and
[acceptance results](evidence/v24/V24_ACCEPTANCE_REPORT.json).
The [screenshot gallery](evidence/v24/gallery.html) uses real browser captures.
The [layout measurements](evidence/v24/V24_LAYOUT_METRICS.json) record all six
requested viewport sizes, responsive navigation and lesson/tool widths.

Use the Practice / Learn button to switch app modes. Each of the four lab icons
opens a home with exactly five category cards. A category opens grouped content;
it does not silently start an exercise. Learn contains 20 original seed lessons.
Switching directly back to Practice restores the active in-session exercise or
case; lab home Continue cards preserve per-lab standalone resume information.

## Keep your progress

Before changing origins or versions, use **Settings > Export my backup**. On the
new origin, use **Settings > Merge backup**. Lesson completion, section position
and notes are separate from Practice drafts and case answers. Newer timestamps
win independently; an older backup without Learn data cannot erase Learn data.
Device presentation preferences remain local. Never clear progress to test an
upgrade; use a disposable browser profile.

## Rebuild and test

```sh
npm ci --ignore-scripts
npm run check
npm test
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
python tests/fixture_check.py
python tests/ui_smoke.py
python tests/v22_ui.py
python tests/v23_ui.py
python tests/v23_layout.py
python tests/v24_acceptance.py
python -m unittest discover -s tests -p test_hosted_verifier.py
python scripts/verify_rebuild.py
```

With the local server running, also run the distinct origin/runtime gates:

```sh
python scripts/validate_release.py
UI_MODE=http python tests/ui_smoke.py
UI_MODE=http python tests/v22_ui.py
UI_MODE=http python tests/v23_ui.py
UI_MODE=http python tests/v24_acceptance.py
python tests/network_runtime_smoke.py
```

On PowerShell, set `$env:UI_MODE='http'` before invoking a served-origin suite.
The test report distinguishes passes from environment-blocked gates. Compiled-DOM
harness success is not a claim that DuckDB, Pyodide, Mermaid, npm audit or a hosted
preview passed in this environment. Integration/deployment remains a separate
coordinator responsibility. Private reference images are not in this delivery.
