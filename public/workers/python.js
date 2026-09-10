/* Optional, explicit-consent browser execution. Python code never runs on the local HTTP server.
 * A Worker prevents access to the DOM, but is NOT a hostile-code/network security boundary.
 * Run only code you trust. The app terminates this worker after the execution timeout.
 */
self.onmessage = async ({data}) => {
  try {
    self.postMessage({status:'Downloading the optional browser Python runtime...'});
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
    const py = await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'});
    self.postMessage({status:'Python ready. Running fixture tests...',ready:true});
    py.globals.set('__studio_code', data.code);
    py.globals.set('__studio_cases', JSON.stringify(data.tests));
    py.globals.set('__studio_entry', data.entrypoint);
    const start = performance.now();
    const raw = await py.runPythonAsync(`
import json, io, contextlib, traceback
_capture = io.StringIO()
_checks = []
_scope = {}
with contextlib.redirect_stdout(_capture), contextlib.redirect_stderr(_capture):
    exec(compile(__studio_code, '<your-solution>', 'exec'), _scope)
    _fn = _scope.get(__studio_entry)
    if not callable(_fn):
        raise ValueError('Define the requested solve function before running tests.')
    for _case in json.loads(__studio_cases):
        try:
            _actual = _fn(*_case['args'])
            _expected = _case['expected']
            _ok = _actual == _expected
            _checks.append({'label': _case['label'], 'passed': bool(_ok), 'detail': 'Expected ' + repr(_expected) + '; received ' + repr(_actual)})
        except Exception as _ex:
            _checks.append({'label': _case['label'], 'passed': False, 'detail': type(_ex).__name__ + ': ' + str(_ex)})
json.dumps({'checks': _checks, 'stdout': _capture.getvalue()[:20000]})
`);
    const result=JSON.parse(raw);
    self.postMessage({result:{engine:'Python via Pyodide 0.27.7',columns:['Output'],rows:result.stdout?[[result.stdout]]:[],checks:result.checks,elapsedMs:Math.round(performance.now()-start)}});
  } catch (error) {
    self.postMessage({error:String(error)});
  }
};
