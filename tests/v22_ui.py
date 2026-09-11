"""V2.2 contract checks against the actual compiled modules and local CodeMirror.
No mocked execution output. Hosted browser/CDN gate remains separate.
"""
from browser_harness import ROOT,open_app
from browser_support import launch_browser
from playwright.sync_api import sync_playwright
import json,traceback,sys,time
Q=[q for n in ['starter','v2-specialists'] for q in json.loads((ROOT/'dist/packs'/f'{n}.json').read_text())['questions']]
BYID={q['id']:q for q in Q}
CASES=json.loads((ROOT/'dist/cases/index.json').read_text())['cases']
REPORT=ROOT/'evidence/v22';SHOTS=REPORT/'screenshots';SHOTS.mkdir(exist_ok=True,parents=True)
checks=[];errors=[]
def check(name,fn):
 before=len(errors)
 try:
  fn();assert errors[before:]==[],errors[before:];checks.append({'name':name,'passed':True});print('PASS',name,flush=True)
 except Exception:
  checks.append({'name':name,'passed':False,'error':traceback.format_exc()[-3000:]});print('FAIL',name,traceback.format_exc()[-2500:],flush=True)
def state(p):
 p.wait_for_timeout(260)
 return p.evaluate('JSON.parse(localStorage.getItem("data-practice-studio.v1"))')
def code(p,value=None):
 p.locator('.CodeMirror').wait_for()
 if value is not None:p.evaluate('(v)=>document.querySelector(".CodeMirror").CodeMirror.setValue(v)',value)
 return p.evaluate('document.querySelector(".CodeMirror").CodeMirror.getValue()')
def close_tool(p):
 if p.locator('#tool-panel').is_visible():p.locator('#tool-header [data-shell="tool-close"]').click()
def tool(p,name):
 if p.locator('#tool-panel').is_visible() and p.locator('#tool-panel-title').inner_text()==name:return
 p.locator(f'#tool-rail [data-tool="{name}"]').click()
def go(p,id,mode='work'):
 close_tool(p)
 if p.locator('#app').get_attribute('data-focus')=='true':p.locator('[data-action="focus"]').click()
 p.evaluate('(id)=>location.hash="exercise="+id',id)
 p.wait_for_function('(t)=>document.querySelector("h1")?.textContent===t',arg=BYID[id]['title']);p.locator('#layout-mode').select_option(mode)
 p.wait_for_timeout(40)
def tab(p,name):
 close_tool(p);p.locator(f'[data-lab-tab="{name}"]').click()
def output(p):
 if not p.locator('#output-dock').is_visible():p.locator('#run-status').click()
def overflow(p):
 s=p.evaluate('({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight})');assert s['sw']<=s['w']+1 and s['sh']<=s['h']+1,s
 assert p.locator('.main').bounding_box()['width']>200
 assert p.locator('#lab-content').bounding_box()['height']>60

def snap(p,name):p.screenshot(path=str(SHOTS/(name+'.png')),full_page=True)
with sync_playwright() as pw:
 b=launch_browser(pw);context=b.new_context(viewport={'width':1600,'height':1000},device_scale_factor=1)
 p=context.new_page();p.set_default_timeout(4000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept());open_app(p)
 def initial():
  assert not p.locator('#output-dock').is_visible();assert p.locator('.CodeMirror').is_visible();assert p.locator('#tool-rail').bounding_box()['width']==48;assert p.locator('[data-action="reveal"]').count()==0;overflow(p);snap(p,'01-code-solve')
 check('New session: compact shell, 48px rail, real editor, no empty output or revealed solution',initial)
 for lab,id in [('code','sql-paid-revenue'),('model','bi-revenue'),('pipeline','dag-data-quality'),('architecture','v2-k8-selector')]:
  for slot in ['work','inspect','case']:
   def mode(lab=lab,id=id,slot=slot):
    go(p,id,slot);assert p.locator('#workstation').get_attribute('data-mode')==slot;assert p.locator('#workstation').get_attribute('data-lab')==lab;overflow(p);assert not state(p).get('caseSessions'), 'Preset selection must not create an authored case'
    if slot=='work' and lab=='model':snap(p,'02-model-designer')
    if slot=='work' and lab=='pipeline':snap(p,'03-pipeline-designer')
    if slot=='inspect' and lab=='architecture':snap(p,'04-systems-compare')
   check(f'Preset renders: {lab}/{slot}; no implicit authored-case session',mode)
 def undo():
  go(p,'sql-paid-revenue');code(p,'SELECT 1 AS original;')
  before=p.evaluate('''()=>{const cm=document.querySelector('.CodeMirror').CodeMirror;cm.clearHistory();cm.setCursor({line:0,ch:7});cm.replaceRange('2',{line:0,ch:7},{line:0,ch:8},'+input');window.__cm=cm;return {text:cm.getValue(),cursor:cm.getCursor(),history:cm.historySize()}}''')
  p.locator('#layout-mode').select_option('inspect');p.locator('#layout-mode').select_option('case');tool(p,'Notes');p.locator('#notes').fill('Persistent note');close_tool(p);p.locator('#theme-select').select_option('fluent-soft');p.locator('[data-action="focus"]').click();p.locator('[data-action="focus"]').click();p.locator('#layout-mode').select_option('work')
  after=p.evaluate('''()=>{const cm=document.querySelector('.CodeMirror').CodeMirror;return {same:cm===window.__cm,text:cm.getValue(),cursor:cm.getCursor(),history:cm.historySize()}}''')
  assert after['same'];assert {k:after[k] for k in before}==before
  p.evaluate('document.querySelector(".CodeMirror").CodeMirror.undo()');assert code(p)=='SELECT 1 AS original;';assert state(p)['drafts']['sql-paid-revenue']['notes']=='Persistent note'
 check('Mode/theme/tool/Focus changes retain the identical editor, cursor and undo stack',undo)
 def focus():
  go(p,'sql-paid-revenue');output(p);p.locator('#output-anchor').select_option('right');p.locator('#output-size').select_option('half');p.locator('#column-separator').focus();p.keyboard.press('ArrowRight');tool(p,'Notes');p.locator('#tool-separator').focus();p.keyboard.press('ArrowRight');p.locator('[data-shell="tool-expand"]').click()
  before=state(p)['settings']['workstation'];p.locator('[data-action="focus"]').click();assert not p.locator('#output-dock').is_visible();assert not p.locator('#tool-panel').is_visible();overflow(p);output(p);p.locator('#output-anchor').select_option('workspace');p.locator('[data-action="focus"]').click()
  assert state(p)['settings']['workstation']==before;assert p.locator('#tool-panel-title').inner_text()=='Notes';assert p.locator('#tool-panel').bounding_box()['width']>500;assert p.locator('#workstation').get_attribute('data-anchor')=='right';close_tool(p)
 check('Focus temporarily maximizes and restores exact sizes, dock, tool and expansion',focus)
 def dock_modes():
  go(p,'bi-revenue','inspect');code(p,BYID['bi-revenue']['solution']);p.locator('[data-action="run"]').click();assert p.locator('#run-status').inner_text()=='1/1 checks'
  p.locator('[data-shell="context-toggle"]').first.click()
  for anchor in ['artifact','context','workspace','right']:
   output(p);p.locator('#output-anchor').select_option(anchor);assert p.locator('#output-dock').evaluate('(el)=>el.parentElement.id')==anchor+'-output';overflow(p)
  tool(p,'Notes');p.locator('#notes').fill('Dock stays independent');assert p.locator('#output-dock').is_visible();assert p.locator('#tool-panel').is_visible();close_tool(p)
  p.locator('#output-size').select_option('compact');p.locator('#output-anchor').select_option('artifact');p.locator('#drawer-separator').focus();p.keyboard.press('ArrowUp');before=state(p)['settings']['workstation']['layouts']['model.measures'];p.locator('#layout-mode').select_option('work');p.locator('#layout-mode').select_option('inspect');assert state(p)['settings']['workstation']['layouts']['model.measures']==before
  p.locator('[data-shell="output-close"]').click();assert p.locator('#run-status').inner_text()=='1/1 checks';assert not p.locator('#output-dock').is_visible()
 check('Four independent output anchors, persistent check badge, per-mode resize and tools',dock_modes)
 def stale():
  go(p,'bi-revenue','inspect');code(p,BYID['bi-revenue']['solution']);p.locator('[data-action="run"]').click();tool(p,'Notes');p.locator('#notes').fill('Does not invalidate the result');assert 'Stale' not in p.locator('#run-status').inner_text();close_tool(p);code(p,'Revenue = SUM(Sales[UnitPrice])');assert 'Stale' in p.locator('#run-status').inner_text();output(p);assert 'Stale' in p.locator('#drawer-body').inner_text();p.locator('[data-action="run"]').click();assert 'failing' in p.locator('#run-status').inner_text();assert 'Stale' not in p.locator('#run-status').inner_text()
 check('Output becomes stale only after input changes; failing count remains visible',stale)
 def tool_panel():
  p.set_viewport_size({'width':1920,'height':1080});go(p,'sql-paid-revenue');tool(p,'Notes');assert p.locator('#workstation-stage').get_attribute('data-pinned')=='false';p.locator('[data-shell="tool-pin"]').click();assert p.locator('#workstation-stage').get_attribute('data-pinned')=='true';width=p.locator('#tool-panel').bounding_box()['width'];p.locator('#tool-separator').focus();p.keyboard.press('ArrowRight');assert p.locator('#tool-panel').bounding_box()['width']==width+20;p.locator('#notes').fill('A pinned note');tool(p,'References');assert p.locator('#notes').count()==0;tool(p,'Notes');assert p.locator('#notes').input_value()=='A pinned note';p.locator('#tool-rail [data-tool="Notes"]').click();assert not p.locator('#tool-panel').is_visible();p.set_viewport_size({'width':1600,'height':1000})
 check('Tools default overlay, safely pin, keyboard resize, switch exclusively and retain Notes',tool_panel)
 def responsive():
  go(p,'sql-paid-revenue');tool(p,'Notes');before=state(p)['settings']['workstation'];p.set_viewport_size({'width':1024,'height':768});p.wait_for_timeout(80);assert p.locator('#workstation-stage').get_attribute('data-pinned')=='false';assert p.locator('.mobile-tabs').is_visible();assert state(p)['settings']['workstation']==before;p.set_viewport_size({'width':1600,'height':1000});p.wait_for_timeout(50);assert state(p)['settings']['workstation']==before;close_tool(p);overflow(p)
 check('Laptop fallback uses overlay/mobile surfaces without corrupting desktop preferences',responsive)
 def graph_state():
  go(p,'dag-data-quality');p.locator('[data-node="quality"]').click();assert p.locator('#node-label').input_value()=='Quality check';p.locator('#node-retries').select_option('1');p.locator('#node-label').fill('Validated quality');p.locator('#node-label').dispatch_event('change');close_tool(p);p.locator('[data-action="zoom-in"]').click();zoom=p.locator('#graph-canvas').evaluate('(el)=>el.style.getPropertyValue("--graph-zoom")');p.locator('#layout-mode').select_option('inspect');p.locator('#layout-mode').select_option('work');assert p.locator('#graph-canvas').evaluate('(el)=>el.style.getPropertyValue("--graph-zoom")')==zoom;tool(p,'Inspector');assert p.locator('#node-label').input_value()=='Validated quality';assert p.locator('#node-retries').input_value()=='1';close_tool(p)
 check('Pipeline node selection, graph edits, retries and camera survive modes',graph_state)
 def config_edit():
  go(p,'dag-data-quality');tab(p,'Config');original=p.locator('#graph-config').input_value();p.locator('#graph-config').fill(original+'\n  ');p.locator('#layout-mode').select_option('inspect');p.locator('#layout-mode').select_option('work');tab(p,'Config');assert p.locator('#graph-config').input_value()==original+'\n  ';p.locator('[data-action="apply-graph"]').click();p.locator('[data-action="run"]').click();tab(p,'Timeline');assert p.locator('.timeline-row').count()==4;tab(p,'Logs');assert p.locator('.task-log').count()==4;tab(p,'Run grid');assert 'attempts' in p.locator('#lab-content').inner_text()
 check('Unapplied graph JSON survives modes; simulation opens real fixture grid/timeline/logs',config_edit)
 def model_inspector():
  go(p,'bi-star-schema');p.locator('[data-node="sales"]').click();assert 'One order line' in p.locator('#tool-body').inner_text();assert 'INTEGER' in p.locator('#tool-body').inner_text();assert 'PK' in p.locator('#tool-body').inner_text();p.locator('[data-inspect-edge="customer-sales"]').click();assert 'Dimension to fact' in p.locator('#tool-body').inner_text();p.locator('#tool-body [data-edge-active="customer-sales"]').first.uncheck();assert 'Inactive' in p.locator('#tool-body').inner_text();close_tool(p)
 check('Model inspector exposes typed columns, PK/FK, grain and active single-direction relationship',model_inspector)
 def virtuals():
  go(p,'v2-git-merge');p.locator('#git-command').fill('git merge feature');p.locator('#git-form button').click();commit=p.locator('[data-commit="N1"]');assert commit.count()==1;p.locator('#layout-mode').select_option('inspect');p.locator('#layout-mode').select_option('case');p.locator('#layout-mode').select_option('work');assert p.locator('[data-commit="N1"]').count()==1;tab(p,'Files');p.locator('#virtual-file').fill('unsaved mode-safe work');p.locator('#layout-mode').select_option('inspect');p.locator('#layout-mode').select_option('work');assert p.locator('#virtual-file').input_value()=='unsaved mode-safe work'
  go(p,'v2-powershell-csv');p.locator('#terminal-command').fill(BYID['v2-powershell-csv']['solution']);p.locator('#terminal-form button').click();console=p.locator('.terminal-console').inner_text();p.locator('#layout-mode').select_option('inspect');p.locator('#layout-mode').select_option('work');assert p.locator('.terminal-console').inner_text()==console
 check('Git commits and unsaved working editor, plus object-terminal sessions, survive modes',virtuals)
 def cases():
  go(p,'sql-paid-revenue');code(p,'SELECT 71 AS standalone;');case=next(c for c in CASES if c['workspace']=='code');p.locator(f'[data-open-case="{case["id"]}"]').click();assert 'standalone' not in code(p);code(p,'SELECT 82 AS case_answer;');task0=case['tasks'][0]['id'];page0=p.locator('#case-page').input_value();p.locator('#case-page').select_option(case['pages'][1]['id']);assert p.locator('#case-task').input_value()==task0;assert code(p)=='SELECT 82 AS case_answer;';p.locator('#case-task').select_option(case['tasks'][1]['id']);code(p,'SELECT 93 AS task_two;');assert p.locator('#case-page').input_value()==case['pages'][1]['id'];p.locator('#case-task').select_option(task0);assert code(p)=='SELECT 82 AS case_answer;';p.locator('#theme-select').select_option('sage-light');close_tool(p);snap(p,'05-authored-case');s=state(p);assert s['drafts']['sql-paid-revenue']['code']=='SELECT 71 AS standalone;';assert len(s['caseSessions'][case['id']]['drafts'])==2
 check('Authored case: page/task cursors independent; all case drafts isolated from standalone',cases)
 def copy_case():
  p.locator('[data-case-action="copy"]').click();assert code(p)=='SELECT 71 AS standalone;';tool(p,'History');button=p.locator('[data-checkpoint]').first;assert button.count()==1;button.click();assert code(p)=='SELECT 82 AS case_answer;';assert p.locator('[data-checkpoint]').count()==2;close_tool(p)
 check('Deliberate copy and checkpoint restoration never overwrite standalone answer',copy_case)
 def case_reload():
  saved=state(p);case=next(c for c in CASES if c['workspace']=='code');other=context.new_page();other.on('dialog',lambda d:d.accept());other.on('pageerror',lambda e:errors.append(str(e)));open_app(other,store=saved,route='');assert other.locator('#case-task').input_value()==case['tasks'][0]['id'];assert code(other)=='SELECT 82 AS case_answer;';other.close()
 check('Case session, page/task cursor and saved answers survive a fresh application boot',case_reload)
 def theme():
  go(p,'v2-powershell-csv');before=state(p)['drafts']['v2-powershell-csv']['labState'];colors={}
  for theme in ['sage-light','fluent-light','fluent-soft','slate-dark']:
   p.locator('#theme-select').select_option(theme);assert p.locator('html').get_attribute('data-theme')==theme;colors[theme]=p.locator('.terminal-console').evaluate('(el)=>getComputedStyle(el).backgroundColor');overflow(p)
  assert len(set(colors.values()))==4;assert state(p)['drafts']['v2-powershell-csv']['labState']==before
  p.locator('#theme-select').select_option('fluent-soft');p.locator('[data-action="settings"]').click();p.locator('#terminal-theme').select_option('dark');p.locator('#density').select_option('compact');p.locator('#text-size').select_option('15');p.locator('[aria-label="Close settings"]').click();assert p.locator('html').get_attribute('data-terminal')=='dark';assert state(p)['settings']['workstation']['terminal']=='dark';p.locator('[data-action="settings"]').click();p.locator('#terminal-theme').select_option('inherit');p.locator('[aria-label="Close settings"]').click();snap(p,'06-fluent-soft')
 check('Four themes apply without domain reset; terminal inheritance and override/settings persist',theme)
 def safe_links():
  go(p,'spark-dedup');assert p.locator('#tool-rail [data-tool="Deepnote"]').count()==0;p.locator('[data-action="settings"]').click();payload={'schemaVersion':1,'links':{'spark-dedup':[{'type':'exercise','label':'Configured companion','url':'https://deepnote.com/project/explicit-user-choice'}]}};p.locator('#map-import').set_input_files({'name':'safe.json','mimeType':'application/json','buffer':json.dumps(payload).encode()});tool(p,'Deepnote');link=p.locator('#tool-body a[href^="https://deepnote.com/project/"]');assert link.count()==1;assert 'noopener' in link.get_attribute('rel');close_tool(p);p.locator('[data-action="settings"]').click();payload['links']['spark-dedup'][0]['url']='https://deepnote.com.evil.invalid/app/fake';p.locator('#map-import').set_input_files({'name':'unsafe.json','mimeType':'application/json','buffer':json.dumps(payload).encode()});assert p.locator('#modal').is_visible();assert 'Unsafe' in p.locator('#toast').inner_text();p.locator('[aria-label="Close settings"]').click();tool(p,'Deepnote');assert link.count()==1;close_tool(p)
 check('Blank companion hidden; safe mapping works; unsafe import is rejected without replacing it',safe_links)
 def migration():
  old={'schemaVersion':1,'drafts':{'bi-revenue':{'code':'Revenue = 123','notes':'V1 note','bookmark':True,'confidence':'Review','country':'Sweden','updatedAt':'2025-01-01T00:00:00Z'}},'customPacks':[],'settings':{'focus':False,'split':46,'drawerHeight':300,'lastQuestion':'bi-revenue'}}
  oldp=context.new_page();oldp.on('pageerror',lambda e:errors.append(str(e)));open_app(oldp,'bi-revenue',old);assert oldp.evaluate('JSON.parse(localStorage.getItem("data-practice-studio.v1.pre-v22"))')==old;assert state(oldp)['drafts']==old['drafts'];oldp.locator('#layout-mode').select_option('inspect');assert code(oldp)=='Revenue = 123';tool(oldp,'Notes');assert oldp.locator('#notes').input_value()=='V1 note';oldp.close()
 check('V1 upgrade keeps byte-equivalent recovery snapshot and all personal draft fields',migration)
 def phone():
  mobile=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);m=mobile.new_page();m.on('pageerror',lambda e:errors.append(str(e)));open_app(m,'v2-powershell-csv');overflow(m);assert m.locator('#terminal-command').is_visible();m.locator('[data-mobile="question"]').click();assert m.locator('#question-body').is_visible();m.locator('[data-mobile="tools"]').click();m.locator('#notes').fill('Phone note');m.locator('[data-mobile="lab"]').click();assert m.locator('#terminal-command').is_visible();assert not m.locator('#tool-panel').is_visible();m.locator('#terminal-command').click();m.locator('.topbar [data-shell="nav-toggle"]').click();assert m.locator('.library').bounding_box()['x']>=0;m.locator('.topbar [data-shell="nav-toggle"]').click();snap(m,'07-phone-workspace');mobile.close()
 check('Phone tabs preserve notes, keep terminal usable and show navigator on request',phone)
 report={'suite':'V2.2 built-file browser contracts','browser':b.version,'viewport':'1600x1000 (additional 1920x1080,1024x768,390x844)','checks':checks,'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'pageErrors':errors,'screenshots':[str(f.relative_to(ROOT)) for f in SHOTS.glob('*.png')],'executionBoundary':'Real compiled UI/CodeMirror/teaching engines; file transport and storage adapter supplied by harness. No mocked SQL/Python runtime or CDN success.'}
 (REPORT/'ui-shell-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k] for k in ['passed','failed','pageErrors']},indent=2));b.close()
sys.exit(bool(report['failed'] or errors))
