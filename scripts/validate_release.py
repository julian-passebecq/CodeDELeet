"""Local release integrity checks, separate from real browser runtime execution."""
from pathlib import Path
import json, hashlib, re, zipfile, sys, urllib.request
ROOT = Path(__file__).resolve().parents[1]
checks=[]
def check(name, fn):
    try: fn(); checks.append({'name':name,'passed':True})
    except Exception as exc: checks.append({'name':name,'passed':False,'error':str(exc)})
def require(value,message):
    if not value: raise AssertionError(message)
def get(path): return json.loads((ROOT/path).read_text())

def parity():
    files=[f for f in (ROOT/'public').rglob('*') if f.is_file()]
    for f in files:
        target=ROOT/'dist'/f.relative_to(ROOT/'public')
        require(target.is_file() and target.read_bytes()==f.read_bytes(),str(target))
check('Every public asset equals its built dist counterpart',parity)

def imports():
    for f in (ROOT/'dist/app').glob('*.js'):
        for relative in re.findall(r'from [\'"](\./[^\'\"]+)[\'"]',f.read_text()):
            require((f.parent/relative).is_file(),str(f)+' -> '+relative)
check('Compiled relative ES module imports resolve',imports)

def docs():
    for f in [ROOT/'README.md',ROOT/'00_START_HERE.md',*(ROOT/'docs').glob('*.md')]:
        for rel in re.findall(r'\]\(([^)]+)\)',f.read_text()):
            if not re.match(r'https?://|#',rel): require((f.parent/rel.split('#')[0]).exists(),str(f)+' -> '+rel)
check('Local documentation and screenshot links resolve',docs)

def archives():
    for file in [ROOT/'public/companion/Deepnote_Interview_Suite_v1_4.zip',ROOT/'reference/legacy-trainer/leetcodedataeng-main.zip']:
        with zipfile.ZipFile(file) as z: require(z.testzip() is None,str(file))
check('Retained supplied companion/reference ZIPs pass CRC checks',archives)
check('Pinned package and lockfile agree',lambda: require(get('package.json')['devDependencies']['typescript']==get('package-lock.json')['packages']['node_modules/typescript']['version']=='5.8.3','compiler mismatch'))
check('Bundled CodeMirror license and editor source exist',lambda:require((ROOT/'dist/vendor/codemirror/LICENSE').is_file() and '5.58.3' in (ROOT/'dist/vendor/codemirror/lib/codemirror.js').read_text(),'missing version/license'))
check('No node_modules, environment secrets or font files in release',lambda:require(not any(f.name in ['.env','.env.local','node_modules'] or f.suffix in ['.woff','.woff2','.ttf','.otf'] for f in ROOT.rglob('*')),'unexpected sensitive/bulk file'))

# This checks local static delivery with urllib only. It is not a browser/CDN test.
for rel,mime in [('index.html','text/html'),('app/app.js','text/javascript'),('workers/python.js','text/javascript'),('packs/starter.json','application/json'),('vendor/codemirror/lib/codemirror.js','text/javascript')]:
    def http(rel=rel,mime=mime):
        with urllib.request.urlopen('http://127.0.0.1:5173/'+rel,timeout=3) as response:
            require(response.status==200 and response.headers.get_content_type()==mime,'HTTP/MIME mismatch for '+rel)
            require(response.read()==(ROOT/'dist'/rel).read_bytes(),'served bytes mismatch for '+rel)
    check('Local HTTP bytes and MIME: '+rel,http)
report={'checks':checks,'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'boundary':'Static file and local urllib delivery only; no browser navigation, CDN or worker execution.'}
(ROOT/'evidence/release-integrity-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2));sys.exit(bool(report['failed']))
