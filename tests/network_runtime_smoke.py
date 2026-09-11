"""Opt-in real HTTP-origin/CDN/worker smoke test; never substitute simulations.
Run the local server first. BASE_URL can point at an isolated deploy preview.
A blocked environment records an UNVERIFIED gate and exits nonzero.
"""
from pathlib import Path
import os, json, sys, traceback, time
from playwright.sync_api import sync_playwright
from browser_support import launch_browser

ROOT = Path(__file__).resolve().parents[1]
BASE = os.getenv('BASE_URL', 'http://127.0.0.1:5173').rstrip('/')
report = {'mode': 'real HTTP origin and external CDN', 'baseURL': BASE,
          'status': 'not-started', 'checks': [], 'pageErrors': []}

def check(name, fn):
    try:
        fn()
        report['checks'].append({'name': name, 'passed': True})
        print('PASS', name, flush=True)
    except Exception as exc:
        report['checks'].append({'name': name, 'passed': False, 'error': str(exc)[:2500]})
        print('FAIL', name, str(exc)[:1000], flush=True)

try:
    with sync_playwright() as p:
        browser = launch_browser(p)
        report['browserVersion'] = browser.version
        page = browser.new_page(viewport={'width': 1600, 'height': 1000})
        page.set_default_timeout(10000)
        page.on('dialog', lambda dialog: dialog.accept())
        page.on('pageerror', lambda error: report['pageErrors'].append(str(error)))
        try:
            page.goto(BASE + '/#exercise=sql-paid-revenue', wait_until='domcontentloaded', timeout=20000)
            page.locator('.CodeMirror').wait_for(timeout=10000)
        except Exception as exc:
            report['status'] = 'UNVERIFIED: origin unavailable or navigation blocked'
            report['blockingError'] = str(exc)[:2000]
            raise
        qs = page.evaluate('''async()=>{const index=await(await fetch('./packs/index.json')).json();
            return (await Promise.all(index.packs.map(async path=>(await(await fetch('./packs/'+path)).json()).questions))).flat();}''')
        by_id = {q['id']: q for q in qs}

        def go(qid):
            page.evaluate('(id)=>location.hash="exercise="+id', qid)
            page.wait_for_function('(title)=>document.querySelector("h1")?.textContent===title', arg=by_id[qid]['title'])

        def code(value):
            page.locator('.CodeMirror').wait_for()
            page.evaluate('(value)=>document.querySelector(".CodeMirror").CodeMirror.setValue(value)', value)

        def run_wait():
            page.locator('[data-action="run"]').click()
            page.wait_for_function('document.querySelector("[data-action=run]").textContent.trim()!=="Cancel"', timeout=105000)

        def reference(q):
            go(q['id']); code(q['solution']); run_wait()
            text = page.locator('#drawer-body').inner_text()
            expected = len(q.get('pythonTests', [])) if q['engine'] == 'python' else len(q.get('fixture', {}).get('sqlTests', []))
            assert expected > 0, 'Executable exercise must have public fixture checks'
            assert f'{expected} / {expected} checks' in text, text
            assert ('DuckDB-Wasm' if q['engine'] == 'sql' else 'CPython / Pyodide') in text, text
            assert 'Attempt not completed' not in text, text

        for q in qs:
            if q.get('executionMode') == 'execute':
                check('Real reference execution: ' + q['id'], lambda q=q: reference(q))

        def cancel_and_restart():
            go('python-aggregate'); code('while True:\n    pass')
            page.locator('[data-action="run"]').click()
            page.wait_for_function('document.querySelector("#engine-status").textContent.includes("Running learner")', timeout=95000)
            page.locator('[data-action="run"]').click()
            assert 'terminated' in page.locator('#drawer-body').inner_text()
            assert 'while True' in page.evaluate('document.querySelector(".CodeMirror").CodeMirror.getValue()')
            reference(by_id['python-aggregate'])
        check('Worker cancellation retains draft and next Python run succeeds', cancel_and_restart)

        def automatic_timeout():
            go('python-aggregate'); code('while True:\n    pass'); run_wait()
            assert '10-second execution limit' in page.locator('#drawer-body').inner_text()
            reference(by_id['python-aggregate'])
        check('Execution timeout terminates Python and permits restart', automatic_timeout)

        def storage_reload():
            go('sql-paid-revenue'); code('SELECT 7 AS saved_draft;')
            page.locator('[data-drawer-tab="Notes"]').click()
            page.locator('#notes').fill('Network gate reload note')
            page.wait_for_timeout(350); page.reload(wait_until='domcontentloaded')
            page.locator('.CodeMirror').wait_for()
            assert page.evaluate('document.querySelector(".CodeMirror").CodeMirror.getValue()') == 'SELECT 7 AS saved_draft;'
            page.locator('[data-drawer-tab="Notes"]').click()
            assert page.locator('#notes').input_value() == 'Network gate reload note'
        check('Real-origin drafts and notes survive full browser reload', storage_reload)

        diagrams = {
            'flowchart': 'flowchart LR\n A[Source] --> B[Lakehouse]',
            'ER': 'erDiagram\n CUSTOMER ||--o{ ORDER : places',
            'architecture': 'architecture-beta\n service db(database)[Warehouse]\n service api(server)[Ingestion]\n api:R -- L:db',
        }
        for name, source in diagrams.items():
            def diagram(source=source):
                go('arch-fabric'); page.locator('#layout-mode').select_option('work'); page.locator('[data-lab-tab="Mermaid"]').click()
                page.locator('#mermaid-source').fill(source)
                page.locator('[data-action="render-mermaid"]').click()
                page.locator('#mermaid-output svg').wait_for(timeout=35000)
            check('Real CDN Mermaid: ' + name, diagram)
        report['status'] = 'PASS' if all(x['passed'] for x in report['checks']) and not report['pageErrors'] else 'FAIL'
        browser.close()
except Exception as exc:
    if report['status'] == 'not-started':
        report['status'] = 'UNVERIFIED: test setup failed'
        report['blockingError'] = str(exc)[:2000]
finally:
    report['passed'] = sum(x['passed'] for x in report['checks'])
    report['failed'] = sum(not x['passed'] for x in report['checks'])
    (ROOT / 'evidence/v22').mkdir(exist_ok=True,parents=True)
    (ROOT / 'evidence/v22/network-runtime-report.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({key: report[key] for key in ['status', 'passed', 'failed']}, indent=2))

sys.exit(0 if report['status'] == 'PASS' else 2)
