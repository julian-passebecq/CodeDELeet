"""Static release integrity; local urllib is not a browser/CDN runtime gate."""
from pathlib import Path
import json,re,sys,urllib.request,urllib.error
ROOT=Path(__file__).resolve().parents[1]
checks=[]
def check(name,fn):
 try:fn();checks.append({'name':name,'passed':True})
 except Exception as exc:checks.append({'name':name,'passed':False,'error':str(exc)})
def require(value,message):
 if not value:raise AssertionError(message)
def get(path):return json.loads((ROOT/path).read_text())
def parity():
 for f in (ROOT/'public').rglob('*'):
  if f.is_file():
   t=ROOT/'dist'/f.relative_to(ROOT/'public');require(t.is_file() and t.read_bytes()==f.read_bytes(),str(t))
check('Every public asset equals its dist counterpart',parity)
def imports():
 for f in (ROOT/'dist/app').rglob('*.js'):
  for rel in re.findall(r'from [\'"](\.\.?/[^\'"]+)[\'"]',f.read_text()):require((f.parent/rel).is_file(),str(f)+' -> '+rel)
check('All nested compiled relative ES module imports resolve',imports)
def docs():
 # Historical reports retain original release wording; only current docs are authoritative.
 for f in [ROOT/'README.md',ROOT/'00_START_HERE.md',*(ROOT/'docs').glob('*.md')]:
  for rel in re.findall(r'\]\(([^)]+)\)',f.read_text()):
   if not re.match(r'https?://|#',rel):require((f.parent/rel.split('#')[0]).exists(),str(f)+' -> '+rel)
check('Current documentation and screenshot links resolve',docs)
def archive_policy():
 for folder in ['public','dist']:
  bad=[str(f.relative_to(ROOT)) for f in (ROOT/folder).rglob('*') if f.suffix.lower() in ['.zip','.ipynb']];require(not bad,str(bad))
 for f in (ROOT/'dist/app').rglob('*.js'):require('companion/Deepnote_' not in f.read_text(),str(f))
check('No public/build notebook, archive or old companion-download code',archive_policy)
check('Build script rejects future public notebook/archive files',lambda:require('rejectArchives' in (ROOT/'scripts/build.mjs').read_text(),'missing fail-closed build guard'))
check('Package, lockfile and build version agree at 2.2.0',lambda:require(get('package.json')['version']==get('package-lock.json')['version']==get('package-lock.json')['packages']['']['version']==get('dist/build-info.json')['version']=='2.2.0','version mismatch'))
check('Pinned compiler and lockfile agree',lambda:require(get('package.json')['devDependencies']['typescript']==get('package-lock.json')['packages']['node_modules/typescript']['version']=='5.8.3','compiler mismatch'))
check('Bundled CodeMirror license and source retained',lambda:require((ROOT/'dist/vendor/codemirror/LICENSE').is_file() and '5.58.3' in (ROOT/'dist/vendor/codemirror/lib/codemirror.js').read_text(),'editor license/version'))
check('No environment secrets, dependencies or fonts in served assets',lambda:require(not any(f.name in ['.env','.env.local','node_modules'] or f.suffix in ['.woff','.woff2','.ttf','.otf'] for folder in ['public','dist'] for f in (ROOT/folder).rglob('*')),'unexpected bulk/sensitive public file'))
check('Mermaid pin is exactly 11.16.1 in runtime/build metadata',lambda:require("mermaid: '11.16.1'" in (ROOT/'dist/app/runtime.js').read_text() and get('dist/build-info.json')['mermaid']=='11.16.1','Mermaid pin'))
def ids():
 q=[q for n in get('public/packs/index.json')['packs'] for q in get('public/packs/'+n)['questions']];identifiers=[q['id'] for q in q];require(len(identifiers)==len(set(identifiers))==51,'IDs changed');require(set(get('docs/baseline-stable-ids.json')).issubset(identifiers),'V1 IDs lost')
check('All 51 unique exercises and 27 V1 IDs retained',ids)
check('Four authored cases use explicit independent tasks',lambda:require(len(get('public/cases/index.json')['cases'])==4 and all(len(c['tasks'])>=3 for c in get('public/cases/index.json')['cases']),'cases missing'))
check('Static config remains dist and no serverless runner',lambda:require('publish = "dist"' in (ROOT/'netlify.toml').read_text() and not (ROOT/'netlify/functions').exists(),'unexpected runner'))
for rel,mime in [('index.html','text/html'),('app/app.js','text/javascript'),('app/shell/layout-controller.js','text/javascript'),('workers/python.js','text/javascript'),('packs/starter.json','application/json'),('cases/index.json','application/json'),('shell.css','text/css'),('vendor/codemirror/lib/codemirror.js','text/javascript')]:
 def http(rel=rel,mime=mime):
  with urllib.request.urlopen('http://127.0.0.1:5173/'+rel,timeout=3) as response:
   require(response.status==200 and response.headers.get_content_type()==mime,'HTTP/MIME mismatch for '+rel);require(response.read()==(ROOT/'dist'/rel).read_bytes(),'served bytes mismatch for '+rel)
 check('Local HTTP bytes and MIME: '+rel,http)
def old_url():
 try:urllib.request.urlopen('http://127.0.0.1:5173/companion/Deepnote_Interview_Suite_v1_4.zip',timeout=3)
 except urllib.error.HTTPError as exc:require(exc.code==404,'old URL not 404');return
 raise AssertionError('Old public archive URL is still served')
check('Old companion download URL returns HTTP 404',old_url)
report={'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'checks':checks,'boundary':'Static file checks and actual local urllib HTTP bytes/MIME only; browser navigation, CDN and workers are separate.'}
(ROOT/'evidence/v22/release-integrity-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));sys.exit(bool(report['failed']))
