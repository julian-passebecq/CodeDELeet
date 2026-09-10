/* Executes only an explicitly submitted learner draft, in a disposable worker. */
let running=false;
self.onmessage=async({data})=>{if(running)return;running=true;let watchdog;
 try{
  self.postMessage({type:'progress',message:'Loading Pyodide. First use needs internet; Python runs in this disposable browser worker.'});
  importScripts(`https://cdn.jsdelivr.net/pyodide/v${data.version}/full/pyodide.js`);
  const py=await loadPyodide({indexURL:`https://cdn.jsdelivr.net/pyodide/v${data.version}/full/`});
  const packages=data.packages.filter(p=>p==='pandas'||p==='numpy');if(packages.length){self.postMessage({type:'progress',message:'Loading '+packages.join(', ')+' for this exercise.'});await py.loadPackage(packages);}
  self.postMessage({type:'progress',phase:'executing',message:'Running learner code and fixture cases. Use Cancel to terminate the worker.'});
  py.globals.set('_submission',data.code);py.globals.set('_cases_json',JSON.stringify(data.tests));py.globals.set('_entry',data.entrypoint);
  const result=await py.runPythonAsync(`
import json, io, contextlib, traceback, copy
class _LimitedBuffer(io.StringIO):
    def write(self, text):
        remaining = max(0, 10000 - self.tell())
        super().write(text[:remaining])
        return len(text)
_buffer = _LimitedBuffer()
_cases = json.loads(_cases_json)
_checks = []
_preview = []
_scope = {"__name__": "__learner__"}
with contextlib.redirect_stdout(_buffer), contextlib.redirect_stderr(_buffer):
    exec(compile(_submission, "learner.py", "exec"), _scope)
    if _cases:
        _fn = _scope.get(_entry)
        if not callable(_fn):
            raise ValueError("Define the required function " + _entry + ".")
        for _case in _cases:
            _args = copy.deepcopy(_case["args"])
            try:
                _actual = _fn(*_args)
                if hasattr(_actual, "to_dict"):
                    _actual = _actual.to_dict(orient="records")
                _pass = _actual == _case["expected"] and _args == _case["args"]
                _checks.append({"label":_case["label"], "passed":bool(_pass), "detail":"Compared return value and checked input preservation."})
                _preview.append([_case["label"], json.dumps(_actual, default=str)[:2000]])
            except Exception as _ex:
                _checks.append({"label":_case["label"], "passed":False, "detail":str(_ex)[:1000]})
                _preview.append([_case["label"], "ERROR: " + str(_ex)[:1000]])
json.dumps({"columns":["Fixture", "Returned value"], "rows":_preview, "checks":_checks, "output":_buffer.getvalue()[:10000], "notice":"Real Python in a disposable worker. Packages are limited to this exercise. No Spark, host filesystem or operating-system shell."}, default=str)
`);
  self.postMessage({type:'result',result:JSON.parse(result)});
 }catch(e){self.postMessage({type:'error',error:String(e.message||e).slice(0,5000)});}finally{running=false;}
};
