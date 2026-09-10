from browser_support import launch_browser
"""Browser interaction checks. UI_MODE=http tests a real served deployment.
Default uses the documented built-file harness because CaaS blocks URL navigation.
"""
from pathlib import Path
import json,sys,os,time,traceback
from playwright.sync_api import sync_playwright
from browser_harness import ROOT,open_app
QS=[q for name in ['starter','v2-specialists'] for q in json.loads((ROOT/'dist/packs'/f'{name}.json').read_text())['questions']]
BYID={q['id']:q for q in QS}
results=[];errors=[];browser_info={}
def check(name,fn):
    before=len(errors)
    try:
        fn()
        assert len(errors)==before,errors[before:]
        results.append({'name':name,'passed':True});print('PASS',name,flush=True)
    except Exception as e:
        results.append({'name':name,'passed':False,'error':traceback.format_exc()[-2500:]})
        print('FAIL',name,traceback.format_exc()[-2200:],flush=True)

def go(page,qid):
    page.evaluate('(id)=>location.hash="exercise="+id',qid)
    page.wait_for_function('(title)=>document.querySelector("h1")?.textContent===title',arg=BYID[qid]['title'],timeout=3000)
    page.wait_for_timeout(35)
def click_tab(page,group,tab):page.locator(f'[data-{group}-tab="{tab}"]').click()
def setcode(page,text):
    page.locator('.CodeMirror').wait_for()
    page.evaluate('(code)=>document.querySelector(".CodeMirror").CodeMirror.setValue(code)',text)
def saved(page):return page.evaluate('JSON.parse(localStorage.getItem("data-practice-studio.v1")||"{}")')
def no_overflow(page):
    size=page.evaluate('({h:innerHeight,w:innerWidth,sh:document.documentElement.scrollHeight,sw:document.documentElement.scrollWidth})')
    assert size['sh']<=size['h']+1 and size['sw']<=size['w']+1,size

def snap(page,name):page.screenshot(path=str(ROOT/'evidence'/name),full_page=True)

with sync_playwright() as p:
    browser=launch_browser(p)
    browser_info={'browser':'Chromium','version':browser.version,'mode':os.getenv('UI_MODE','built-file in-memory harness'),'urlNavigation':'blocked by environment policy' if not os.getenv('UI_MODE') else 'HTTP'}
    context=browser.new_context(viewport={'width':1600,'height':1000},device_scale_factor=1)
    page=context.new_page();page.set_default_timeout(3000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
    open_app(page)
    check('Desktop fixed-height workstation and real CodeMirror visible',lambda:(no_overflow(page),page.locator('.CodeMirror').is_visible()))
    snap(page,'01-code-workstation.png')
    def reveal_safety():
        assert page.locator('[data-action="reveal"]').count()==0
        click_tab(page,'drawer','Explanation');assert page.locator('[data-action="reveal"]').count()==1
        assert BYID['sql-paid-revenue']['solution'] not in page.locator('#drawer-body').inner_text()
        page.locator('[data-action="reveal"]').click();assert BYID['sql-paid-revenue']['explanation'] in page.locator('#drawer-body').inner_text()
        go(page,'sql-latest-order');click_tab(page,'drawer','Explanation');assert page.locator('[data-action="reveal"]').count()==1
    check('Reference reveal is deliberate and resets on navigation',reveal_safety)
    def draft_flow():
        go(page,'sql-paid-revenue');setcode(page,'SELECT 123 AS my_draft;');click_tab(page,'drawer','Notes');page.locator('#notes').fill('Remember the customer grain.');page.locator('#confidence').select_option('Review');page.locator('[data-action="bookmark"]').click();page.wait_for_timeout(260)
        go(page,'python-aggregate');go(page,'sql-paid-revenue');click_tab(page,'drawer','Notes');assert page.locator('#notes').input_value()=='Remember the customer grain.'
        assert saved(page)['drafts']['sql-paid-revenue']['code']=='SELECT 123 AS my_draft;'
        assert saved(page)['drafts']['sql-paid-revenue']['bookmark'] is True
    check('Code, notes, confidence and bookmark survive navigation',draft_flow)
    def layout():
        page.locator('#column-separator').focus();page.keyboard.press('ArrowRight');page.wait_for_timeout(260);assert saved(page)['settings']['split']==44
        old=page.locator('#column-separator').get_attribute('aria-valuenow');assert old=='44'
        page.locator('[data-action="collapse-drawer"]').click();assert 'drawer-collapsed' in page.locator('#workstation').get_attribute('class')
        click_tab(page,'drawer','Results');assert 'drawer-collapsed' not in page.locator('#workstation').get_attribute('class')
        page.locator('[data-action="focus"]').click();assert 'focus-lab' in page.locator('#workstation').get_attribute('class');page.locator('[data-action="focus"]').click();no_overflow(page)
    check('Keyboard split resize, drawer collapse and focus mode work',layout)
    def filters():
        go(page,'sql-paid-revenue');page.locator('#difficulty').select_option('Medium');titles=page.locator('[data-question]').all_text_contents();assert titles and all('Medium' in t for t in titles)
        first=page.locator('[data-question]').first;first.click();assert page.locator('#difficulty').input_value()=='Medium'
        page.locator('#difficulty').select_option('All levels');page.locator('#search').fill('does-not-exist');assert page.locator('[data-question]').count()==0;page.locator('#search').fill('')
    check('Library filtering survives selecting an exercise',filters)
    # Visit all built-in exercises, inspect each specialist view, and enforce layout.
    for q in (QS if os.getenv('SKIP_MATRIX')!='1' else []):
        def matrix(q=q):
            go(page,q['id'])
            for tab in page.locator('[data-lab-tab]').evaluate_all('(xs)=>xs.map(x=>x.dataset.labTab)'):
                click_tab(page,'lab',tab);assert page.locator('#lab-content').inner_text().strip() or page.locator('.CodeMirror').count()
            for tab in ['Data','Schema','Hints','Task']:click_tab(page,'left',tab)
            for tab in ['Visual','Deepnote','Explanation','Results']:click_tab(page,'drawer',tab)
            assert page.locator('#lab-content').bounding_box()['height']>50
            no_overflow(page)
        check('Renderer/views: '+q['id'],matrix)
    def bash():
        go(page,'linux-log-triage');page.locator('#terminal-command').fill("grep -in 'error' pipeline.log | tail -n 20");page.locator('#terminal-form button').click();assert '2:ERROR source timeout' in page.locator('.terminal-console').inner_text();page.locator('[data-action="run"]').click();assert '1 / 1 checks' in page.locator('#drawer-body').inner_text()
        snap(page,'02-bash-text-pipeline.png')
    check('Virtual Bash command, visible output and goal check',bash)
    def powershell():
        go(page,'v2-powershell-csv');page.locator('#terminal-command').fill(BYID['v2-powershell-csv']['solution']);page.locator('#terminal-form button').click();assert 'object[]' in page.locator('.terminal-console').inner_text().lower();page.locator('[data-action="run"]').click();assert '1 / 1 checks' in page.locator('#drawer-body').inner_text();snap(page,'03-powershell-objects.png')
    check('PowerShell object pipeline works through the UI',powershell)
    def git_merge():
        go(page,'v2-git-merge');page.locator('#git-command').fill('git status');page.locator('#git-form button').click();assert 'On branch main' in page.locator('.terminal-console').inner_text()
        page.locator('#git-command').fill('git merge feature');page.locator('#git-form button').click();assert page.locator('[data-commit="N1"]').count()==1;page.locator('[data-commit="N1"]').click();assert 'Created merge' in page.locator('.terminal-console').inner_text()
        page.locator('[data-action="run"]').click();assert '3 / 3 checks' in page.locator('#drawer-body').inner_text();snap(page,'04-git-connected-state.png')
        click_tab(page,'lab','Predict');page.locator('input[value="parents"]').check();page.locator('[data-action="check-prediction"]').click();assert 'Prediction matches' in page.locator('#prediction-feedback').inner_text()
    check('Git graph/HEAD/console/goal and prediction are connected',git_merge)
    def git_conflict():
        go(page,'v2-git-conflict');page.locator('#git-command').fill('git merge feature');page.locator('#git-form button').click();click_tab(page,'lab','Files');page.locator('#git-file').select_option('pipeline.py');assert '<<<<<<<' in page.locator('#virtual-file').input_value();page.locator('#virtual-file').fill('print("resolved")\n');page.locator('[data-action="stage-file"]').click();click_tab(page,'lab','Workspace');page.locator('#git-command').fill('git commit -m "Resolve"');page.locator('#git-form button').click();page.locator('[data-action="run"]').click();assert '3 / 3 checks' in page.locator('#drawer-body').inner_text()
    check('Conflict resolution via working file editor and staging',git_conflict)
    def dag():
        go(page,'dag-data-quality');click_tab(page,'lab','Config');g=json.loads(page.locator('#graph-config').input_value());g['edges']=[x for x in g['edges'] if not(x['from']=='transform' and x['to']=='publish')];g['edges'].append({'id':'quality-publish','from':'quality','to':'publish'});next(n for n in g['nodes'] if n['id']=='quality')['retries']=1
        page.locator('#graph-config').fill(json.dumps(g));page.locator('[data-action="apply-graph"]').click();page.locator('[data-action="run"]').click();assert 'success' in page.locator('#drawer-body').inner_text();click_tab(page,'lab','Workspace');assert page.locator('[data-node="quality"]').count()==1;snap(page,'05-dag-retry-run.png')
    check('Graph JSON roundtrip, repaired quality gate and retry simulation',dag)
    def dax():
        go(page,'bi-revenue');setcode(page,BYID['bi-revenue']['solution']);page.locator('#country').select_option('Norway');page.locator('[data-action="run"]').click();assert page.locator('#kpi-value').inner_text()=='300';assert '1 / 1 checks' in page.locator('#drawer-body').inner_text();snap(page,'06-dax-filter-context.png')
    check('DAX subset evaluates through editor and active country filter',dax)
    def config():
        go(page,'v2-k8-selector');setcode(page,BYID['v2-k8-selector']['solution']);page.locator('[data-action="run"]').click();assert '2 / 2 checks' in page.locator('#drawer-body').inner_text();click_tab(page,'lab','Evidence');assert 'Supplied evidence, not regenerated output' in page.locator('#lab-content').inner_text();snap(page,'07-kubernetes-evidence.png')
    check('Infrastructure analyzer labels checks and unchanged evidence honestly',config)
    def spark():
        go(page,'spark-dedup');assert 'NO SPARK RUNTIME' in page.locator('.mode-label').inner_text();page.locator('[data-action="run"]').click();assert 'NOT EXECUTED' in page.locator('#drawer-body').inner_text();click_tab(page,'lab','Sample rows');snap(page,'08-pyspark-guided-review.png')
        go(page,'arch-spark-skew');page.locator('input[name="diagnosis-choice"]').first.check();page.locator('[data-action="run"]').click();page.locator('#lab-content .panel-scroll').evaluate('(el)=>el.scrollTop=0');snap(page,'09-spark-performance-investigator.png')
    check('PySpark review and performance fixture never pretend execution',spark)
    def deepnote():
        go(page,'spark-dedup');click_tab(page,'drawer','Deepnote');assert page.locator('a[href^="https://deepnote.com"]').count()==0;assert 'No notebook URL configured' in page.locator('#drawer-body').inner_text()
        page.locator('[data-action="settings"]').click();payload={'schemaVersion':1,'links':{'spark-dedup':[{'type':'exercise','label':'My real notebook','url':'https://deepnote.com/workspace/my-team/project/my-project'}]}}
        page.locator('#map-import').set_input_files({'name':'mapping.json','mimeType':'application/json','buffer':json.dumps(payload).encode()});page.wait_for_timeout(100);assert page.locator('a[href^="https://deepnote.com/workspace/my-team"]').count()==1
    check('Deepnote buttons are hidden until explicit safe URLs are imported',deepnote)
    def backup_merge():
        go(page,'sql-paid-revenue');page.locator('[data-action="settings"]').click();incoming={'schemaVersion':1,'drafts':{'sql-paid-revenue':{'notes':'newer imported note','updatedAt':'2070-01-01T00:00:00Z'}},'customPacks':[],'settings':{'focus':False}}
        page.locator('#backup-import').set_input_files({'name':'backup.json','mimeType':'application/json','buffer':json.dumps(incoming).encode()});page.wait_for_timeout(100);click_tab(page,'drawer','Notes');assert page.locator('#notes').input_value()=='newer imported note';assert 'v2-git-merge' in saved(page)['drafts'];page.locator('[data-action="export-backup"]').click()
        if not os.getenv('UI_MODE'):assert page.evaluate('window.__downloads.length')>0
    check('Backup merge through the actual file input preserves unrelated work',backup_merge)
    def migration():
        old={'schemaVersion':1,'drafts':{'bi-revenue':{'code':'Revenue = SUMX(Sales, Sales[Quantity] * Sales[UnitPrice])','notes':'Original v1 note','bookmark':True,'confidence':'Review','country':'Sweden','updatedAt':'2025-05-01T00:00:00Z'}},'customPacks':[],'settings':{'focus':False,'lastQuestion':'bi-revenue','pyodideConsent':True}}
        other=context.new_page();other.set_default_timeout(3000);other.on('pageerror',lambda e:errors.append(str(e)));open_app(other,'bi-revenue',old);click_tab(other,'drawer','Notes');assert other.locator('#notes').input_value()=='Original v1 note';assert other.evaluate('localStorage.getItem("data-practice-studio.v1.pre-v2")') is not None
        other.close()
    check('V1 browser boot retains draft, settings, notes and a pre-upgrade snapshot',migration)
    def mobile():
        mobile_context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
        m=mobile_context.new_page();m.set_default_timeout(3000);m.on('pageerror',lambda e:errors.append(str(e)));open_app(m,'v2-powershell-csv');no_overflow(m);assert m.locator('#terminal-command').is_visible();m.locator('[data-mobile="question"]').click();assert m.locator('#question-body').is_visible();assert not m.locator('#terminal-command').is_visible();m.locator('[data-mobile="drawer"]').click();click_tab(m,'drawer','Notes');m.locator('#notes').fill('Mobile note');m.locator('[data-mobile="lab"]').click();snap(m,'10-mobile-workspace.png');m.locator('[data-action="library"]').first.click();m.wait_for_function('document.querySelector(".library").getBoundingClientRect().x>=-1',timeout=3000);mobile_context.close()
    check('390px mobile tabs, notes, shell and exercise drawer are usable',mobile)
    # UI network tests intentionally belong to network_runtime_smoke.py, not this harness.
    browser.close()
report={'browser':browser_info,'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results),'pageErrors':errors,'checks':results,'limitations':['Default harness substitutes file delivery, fetch and localStorage transport only.','Actual WebAssembly downloads and HTTP-origin browser integration are not covered by harness checks.','Screenshots are actual rendered build output, not generated concept art.']}
(ROOT/'evidence/ui-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'passed':report['passed'],'failed':report['failed'],'pageErrors':errors,'browser':browser_info},indent=2))
sys.exit(bool(report['failed']))
