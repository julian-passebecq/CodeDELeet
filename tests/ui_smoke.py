"""Embedded DOM/UI integration tests and screenshots.

Intentionally works in managed Chromium where URL navigation may be blocked. No browser
policy is modified. UI modules are bundled from the committed build, pack resources are
read from disk, SQL reaches a real local HTTP adapter, and localStorage is an in-memory
stand-in. This is NOT a native-navigation, persistent-storage or Pyodide-download test.
Requires optional playwright (pip install playwright; playwright install chromium).
"""
from pathlib import Path
import os, sys, json, shutil, threading, importlib.util, urllib.request, urllib.error, subprocess
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
subprocess.run(['node',str(ROOT/'scripts/build-preview.mjs')],check=True,cwd=ROOT)
BUNDLE=(ROOT/'.build/browser-bundle.js').read_text()
spec=importlib.util.spec_from_file_location('studio_server_ui',ROOT/'server/app.py')
s=importlib.util.module_from_spec(spec);spec.loader.exec_module(s)
server=s.ThreadingHTTPServer(('127.0.0.1',0),s.Handler);server.verbose=False
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
BASE=f'http://127.0.0.1:{server.server_port}'
PACK=json.loads((ROOT/'public/packs/starter.json').read_text());Q={q['id']:q for q in PACK['questions']}
passed=[]
def check(name,condition=True):
 if not condition:raise AssertionError(name)
 passed.append(name);print('PASS:',name)
def bridge(url,options):
 path=url.replace('./','/',1)
 if path.startswith('/api/'):
  payload=options.get('body');headers={'Origin':BASE,'X-Studio-Request':'1','Content-Type':'application/json'}
  req=urllib.request.Request(BASE+path,data=payload.encode() if payload else None,headers=headers,method=options.get('method','GET'))
  try:
   with urllib.request.urlopen(req,timeout=18) as r:return {'status':r.status,'body':r.read().decode()}
  except urllib.error.HTTPError as ex:return {'status':ex.code,'body':ex.read().decode()}
 target=(ROOT/'public'/path.lstrip('/')).resolve()
 if not target.is_relative_to(ROOT/'public') or not target.is_file():return {'status':404,'body':'{}'}
 return {'status':200,'body':target.read_text()}
def setup(page,corrupt=False,standalone=False):
 page.expose_function('hostFetch',bridge)
 page.set_content('<html><head></head><body><div id="app"></div><div id="toast" role="status"></div><dialog id="modal"></dialog></body></html>')
 page.evaluate('''corrupt=>{const memory=new Map();if(corrupt)memory.set('data-practice-studio.v1','{broken');Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k),clear:()=>memory.clear()}});window.fetch=async(url,options={})=>{const r=await window.hostFetch(String(url),{method:options.method??'GET',body:options.body});return new Response(r.body,{status:r.status,headers:{'Content-Type':'application/json'}});};}''',corrupt)
 if standalone:page.set_content((ROOT/'OPEN_STUDIO.html').read_text())
 else:
  page.add_style_tag(content=(ROOT/'public/styles.css').read_text());page.add_script_tag(content=BUNDLE)
 page.locator('.home-page').wait_for();page.wait_for_timeout(180)
def nav(page,path):
 page.evaluate('(p)=>location.hash="#/"+p',path);page.wait_for_timeout(130)
def act(page,name):page.locator(f'[data-action="{name}"]').first.click()
def shot(page,name):
 page.evaluate("document.getElementById('toast').className='';window.scrollTo(0,0)")
 page.wait_for_timeout(70)
 page.screenshot(path=str(ROOT/'preview'/name),full_page=True)
try:
 with sync_playwright() as pw:
  exe=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
  args={'headless':True}
  if exe:args['executable_path']=exe
  browser=pw.chromium.launch(**args)
  page=browser.new_page(viewport={'width':1600,'height':1120},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda ex:errors.append(str(ex)))
  setup(page);check('home has four workspace cards',page.locator('.workspace-card').count()==4);shot(page,'01-overview.png')
  nav(page,'practice/sql-paid-revenue');act(page,'test-sql');page.locator('.check-result').first.wait_for();check('wrong SQL starter produces failing checks',page.locator('.check-result.failed').count()>0)
  page.locator('[data-field="code"]').fill(Q['sql-paid-revenue']['solution']);check('editing code removes stale checks',page.locator('.check-result').count()==0)
  act(page,'test-sql');page.locator('.check-result').first.wait_for();check('SQL reference passes three real HTTP fixture suites',page.locator('.check-result.passed').count()==3)
  shot(page,'02-code-lab.png')
  page.locator('[data-field="notes"]').fill('Remember LEFT JOIN and nulls.');page.locator('[data-field="confidence"]').select_option('Review');act(page,'bookmark')
  nav(page,'home');nav(page,'practice/sql-paid-revenue');check('draft and notes survive navigation',page.locator('[data-field="notes"]').input_value()=='Remember LEFT JOIN and nulls.' and page.locator('[data-field="code"]').input_value()==Q['sql-paid-revenue']['solution'])
  nav(page,'review');check('review queue includes tagged exercise',page.locator('a[href="#/practice/sql-paid-revenue"]').count()==1)
  nav(page,'practice/python-aggregate');act(page,'run-python');check('Python requires explicit download consent',page.locator('#modal').inner_text().find('Enable optional browser Python')>=0);act(page,'close-modal')
  nav(page,'practice/bi-revenue');page.locator('[data-field="code"]').fill(Q['bi-revenue']['solution']);act(page,'run-dax');check('DAX teaching measure returns 410',page.locator('.kpi-user strong').inner_text()=='410')
  page.locator('[data-field="country"]').select_option('Norway');act(page,'run-dax');check('country slicer filters teaching revenue to 300',page.locator('.kpi-user strong').inner_text()=='300')
  page.locator('[data-edge="customer-sales"]').click();act(page,'run-dax');check('inactive relationship returns unfiltered revenue 410',page.locator('.kpi-user strong').inner_text()=='410')
  page.locator('[data-edge="customer-sales"]').click();page.locator('[data-field="country"]').select_option('All');page.locator('[data-field="grain"]').select_option('order-line');act(page,'check-model');check('model structure and fixture checks pass',page.locator('.check-result.failed').count()==0 and page.locator('.check-result.passed').count()==7)
  act(page,'layout');act(page,'run-dax');shot(page,'03-bi-modeling.png')
  page.locator('[data-field="code"]').fill('Revenue = SUM(Sales[UnitPrice])');check('editing DAX clears old KPI',page.locator('.kpi-user strong').inner_text()=='\u2014')
  nav(page,'practice/dag-data-quality');act(page,'simulate-dag');check('faulty DAG simulates before repair','failed' in page.locator('.pipeline-bottom').inner_text())
  page.locator('[aria-label="Remove dependency transform to publish"]').click();page.locator('#edge-from').select_option('quality');page.locator('#edge-to').select_option('publish');act(page,'add-edge');act(page,'simulate-dag');check('quality failure blocks repaired publish','upstream_failed' in page.locator('.pipeline-bottom').inner_text())
  page.locator('[data-node="quality"]').press('Enter');page.locator('#task-retries').select_option('1');act(page,'simulate-dag');check('one retry recovers failed quality task','one retry succeeded' in page.locator('.pipeline-bottom').inner_text())
  shot(page,'04-pipeline.png')
  nav(page,'practice/arch-fabric');original=page.locator('[data-field="diagram"]').input_value();page.locator('[data-field="diagram"]').fill(original.replace('Operational source','My CRM source'));act(page,'render-diagram');check('diagram-as-code updates actual canvas','My CRM source' in page.locator('#graph-surface').inner_text());act(page,'check-graph');check('architecture structure passes limited graph checks',page.locator('.check-result.failed').count()==0)
  shot(page,'05-architecture.png')
  page.locator('[data-field="diagram"]').fill('source -> source');act(page,'render-diagram');check('invalid diagram preserves previous canvas','My CRM source' in page.locator('#graph-surface').inner_text())
  nav(page,'practice/arch-spark-skew');check('Spark panel explicitly explains synthetic work','Unitless work' in page.locator('.performance-panel').inner_text());shot(page,'06-spark-reasoning.png')
  for q in PACK['questions']:
   nav(page,'practice/'+q['id']);assert page.locator('h1').inner_text()==q['title']
  check('all 27 exercise routes render with distinct metadata')
  nav(page,'settings');page.locator('#pack-file').set_input_files(str(ROOT/'examples/custom-pack.json'));page.locator('#modal[open]').wait_for();check('pack import previews before writing','Review the import' in page.locator('#modal').inner_text());act(page,'apply-import');check('custom pack applied',len(json.loads(page.evaluate("localStorage.getItem('data-practice-studio.v1')"))['customPacks'])==1)
  act(page,'focus');check('focus mode hides sidebar',not page.locator('.sidebar').is_visible());act(page,'focus')
  for width in [768,390]:
   page.set_viewport_size({'width':width,'height':1000})
   for path in ['home','practice/sql-paid-revenue','practice/bi-revenue','practice/dag-data-quality','practice/arch-fabric']:
    nav(page,path)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),f'Overflow at {width}px {path}'
   check(f'five principal pages avoid horizontal overflow at {width}px')
  shot(page,'07-mobile.png');check('no uncaught JavaScript errors',not errors)
  corrupt=browser.new_page();setup(corrupt,True);nav(corrupt,'practice/sql-paid-revenue');corrupt.locator('[data-field="code"]').fill('SELECT 1');check('unreadable original storage is not overwritten',corrupt.evaluate("localStorage.getItem('data-practice-studio.v1')")=='{broken');nav(corrupt,'settings');act(corrupt,'recover-storage');act(corrupt,'confirm-recover-storage');check('explicit recovery replaces storage with valid current state',json.loads(corrupt.evaluate("localStorage.getItem('data-practice-studio.v1')"))['drafts']['sql-paid-revenue']['code']=='SELECT 1')
  single=browser.new_page();setup(single,standalone=True);nav(single,'practice/bi-revenue');single.locator('[data-field="code"]').fill(Q['bi-revenue']['solution']);act(single,'run-dax');check('single-file edition renders working DAX without resources',single.locator('.kpi-user strong').inner_text()=='410');nav(single,'practice/sql-paid-revenue');act(single,'test-sql');check('single-file SQL clearly requests local launcher','Enable real SQL locally' in single.locator('#modal').inner_text())
  browser.close()
 print(f'\n{len(passed)} embedded UI checks passed. Native navigation/storage and remote Python are not covered.')
 (ROOT/'.build/ui-report.json').write_text(json.dumps({'checks':passed,'count':len(passed),'limitations':['Embedded harness, not native navigation','Memory storage stand-in, not native persistence','Remote Pyodide not loaded']},indent=2))
finally:server.shutdown();server.server_close();thread.join()
