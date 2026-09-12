"""V2.3 acceptance against real compiled DOM/CSS and CodeMirror.
Default transport is the existing built-file harness, not a served/runtime claim.
UI_MODE=http uses the same assertions on BASE_URL, without substituting engines.
"""
from pathlib import Path
import json,os,sys,traceback
from playwright.sync_api import sync_playwright
from browser_harness import ROOT,open_app
from browser_support import launch_browser

OUT=ROOT/('evidence/v23/http-attempt' if os.getenv('UI_MODE')=='http' else 'evidence/v23');OUT.mkdir(parents=True,exist_ok=True)
SHOTS=OUT/'screenshots';SHOTS.mkdir(exist_ok=True)
QS=[q for name in ['starter','v2-specialists'] for q in json.loads((ROOT/'dist/packs'/f'{name}.json').read_text())['questions']]
BYID={q['id']:q for q in QS}
CASES=json.loads((ROOT/'dist/cases/index.json').read_text())['cases']
LABS={'code':'sql-paid-revenue','model':'bi-star-schema','pipeline':'dag-data-quality','architecture':'arch-fabric'}
THEMES=['sage-light','fluent-light','fluent-soft','slate-dark']
report={'version':'2.3.0','transport':os.getenv('UI_MODE','built-file harness'),'checks':[],'pageErrors':[]}

def check(name,fn):
    before=len(report['pageErrors'])
    try:
        fn(); assert report['pageErrors'][before:]==[],report['pageErrors'][before:]
        report['checks'].append({'name':name,'passed':True}); print('PASS',name,flush=True)
    except Exception:
        err=traceback.format_exc()[-3500:];report['checks'].append({'name':name,'passed':False,'error':err});print('FAIL',name,err,flush=True)

def saved(page):
    page.wait_for_timeout(270)
    return page.evaluate('JSON.parse(localStorage.getItem("data-practice-studio.v1"))')

def content(page,value=None):
    page.locator('.CodeMirror').wait_for()
    if value is not None:page.evaluate('(v)=>document.querySelector(".CodeMirror").CodeMirror.setValue(v)',value)
    return page.evaluate('document.querySelector(".CodeMirror").CodeMirror.getValue()')

def close_tool(page):
    if page.locator('#tool-panel').is_visible():page.locator('[data-shell="tool-close"]').click()

def go(page,qid,mode='work'):
    close_tool(page)
    if page.locator('#app').get_attribute('data-focus')=='true':page.locator('[data-action="focus"]').click()
    page.evaluate('(id)=>location.hash="exercise="+id',qid)
    page.wait_for_function('(t)=>document.querySelector("h1")?.textContent===t',arg=BYID[qid]['title'])
    page.locator(f'#tool-rail [data-mode="{mode}"]').click()
    page.wait_for_timeout(50)

def tool(page,name):
    if page.locator('#tool-panel').is_visible() and page.locator('#tool-panel-title').inner_text()==name:return
    page.locator(f'#tool-rail [data-tool="{name}"]').click()

def theme(page,value):
    tool(page,'Theme');page.locator(f'input[name="app-theme"][value="{value}"]').check()

def snap(page,name):page.screenshot(path=str(SHOTS/(name+'.png')),full_page=True)

def visible_inside(page,selector):
    el=page.locator(selector);assert el.is_visible(),selector
    box=el.bounding_box();assert box and box['x']>=0 and box['y']>=0, (selector,box)
    assert box['x']+box['width']<=page.viewport_size['width']+.5,(selector,box)
    assert box['y']+box['height']<=page.viewport_size['height']+.5,(selector,box)
    # Hit test detects clipping or an overlapping panel, not just nominal geometry.
    assert el.evaluate('(el)=>{const b=el.getBoundingClientRect();return el.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));}'),selector+' obstructed'
    return box

def no_overflow(page):
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight')

try:
 with sync_playwright() as pw:
    browser=launch_browser(pw);report['browserVersion']=browser.version
    ctx=browser.new_context(viewport={'width':1600,'height':900},device_scale_factor=1)
    page=ctx.new_page();page.set_default_timeout(5000)
    page.on('dialog',lambda d:d.accept());page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
    open_app(page);page.locator('.CodeMirror').wait_for()

    def single_row():
        assert page.locator('.topbar').count()==0
        header=page.locator('#exercise-header').bounding_box()
        assert header['y']==0 and header['height']==52,header
        assert page.locator('#workstation-stage').bounding_box()['y']==52
        assert page.locator('#exercise-header .brand, #exercise-header .version').count()==0
        assert page.locator('#exercise-header select').count()==0
        assert page.locator('#theme-select, #layout-mode').count()==0
        assert page.locator('[data-action="focus"]').count()==1
        assert page.locator('h1').get_attribute('title')==BYID['sql-paid-revenue']['title']
        no_overflow(page);snap(page,'01-1600-code-solve')
    check('V23-01/05/06/10: one 52px desktop header; no routine brand, theme select or duplicate mode/Focus',single_row)

    def lab_icons():
        for lab in LABS:
            b=page.locator(f'.workspace-nav [data-workspace="{lab}"]')
            assert b.get_attribute('aria-label') and b.get_attribute('title')
            box=visible_inside(page,f'.workspace-nav [data-workspace="{lab}"]');assert box['width']>=40 and box['height']>=40
            b.click();page.wait_for_function('(lab)=>document.querySelector("#workstation").dataset.lab===lab',arg=lab)
            assert page.locator(f'.workspace-nav [data-workspace="{lab}"]').get_attribute('aria-pressed')=='true'
            assert page.locator('.workspace-nav [aria-pressed="true"]').count()==1
            assert page.locator(f'.workspace-nav [data-workspace="{lab}"]').evaluate('(el)=>getComputedStyle(el).borderColor!="rgba(0, 0, 0, 0)"')
    check('V23-02/03/04: four 40px labeled neutral icons switch labs with exclusive visible/ARIA active state',lab_icons)

    for lab,qid in LABS.items():
        for slot in ['work','inspect','case']:
            def modes(lab=lab,qid=qid,slot=slot):
                go(page,qid,slot)
                assert page.locator('#workstation').get_attribute('data-mode')==slot
                assert page.locator(f'button[data-mode="{slot}"].rail-button').get_attribute('aria-pressed')=='true'
                assert page.locator(f'button[data-mode="{slot}"].rail-button').get_attribute('aria-label').endswith(' layout')
                assert not saved(page).get('caseSessions'),'Mode selection must not implicitly create an authored case'
            check(f'V23-09: {lab}/{slot} uses the authoritative rail mode',modes)

    def attempt_controls():
        for w,h in [(1600,900),(1366,768),(1024,768)]:
            page.set_viewport_size({'width':w,'height':h});go(page,'sql-latest-order')
            for name in ['bookmark','timer','previous','next','run']:
                box=visible_inside(page,f'#exercise-header [data-action="{name}"]');assert box['height']>=34
            visible_inside(page,'#run-status');no_overflow(page)
        page.set_viewport_size({'width':1600,'height':900})
    check('V23-11: bookmark, timer, previous/next, primary action and status visible at all desktop sizes',attempt_controls)

    def theme_open():
        go(page,'sql-paid-revenue');content(page,'SELECT 23 AS compact_shell;')
        before=saved(page);page.evaluate('window.__editorV23=document.querySelector(".CodeMirror").CodeMirror')
        tool(page,'Theme')
        assert page.locator('#tool-panel-title').inner_text()=='Theme'
        assert page.locator('input[name="app-theme"]').count()==4
        assert page.locator('button[data-tool="Theme"]').get_attribute('aria-expanded')=='true'
        assert page.locator('#exercise-header input[name="app-theme"]').count()==0
        assert page.locator('#tool-panel [data-shell="tool-pin"]').count()==0
        snap(page,'02-theme-rail-panel')
        for value in THEMES:theme(page,value)
        after=saved(page)
        assert after['drafts']==before['drafts'];assert after['settings']['workstation']['layouts']==before['settings']['workstation']['layouts']
        assert page.evaluate('window.__editorV23===document.querySelector(".CodeMirror").CodeMirror')
        page.locator('button[data-tool="Theme"]').click();assert not page.locator('#tool-panel').is_visible()
    check('V23-07: compact exclusive Theme panel toggles from rail without remounting editor or changing drafts/sizes',theme_open)

    for value in THEMES:
        def theme_persistence(value=value):
            theme(page,value);assert page.locator('html').get_attribute('data-theme')==value
            state=saved(page);assert state['settings']['workstation']['theme']==value
            p=ctx.new_page();open_app(p,'sql-paid-revenue',state)
            assert p.locator('html').get_attribute('data-theme')==value
            p.locator('.CodeMirror').wait_for();assert content(p)=='SELECT 23 AS compact_shell;'
            p.close();close_tool(page)
        check('V23-08: theme persists across fresh boot: '+value,theme_persistence)

    def output_state():
        go(page,'bi-revenue','inspect');content(page,BYID['bi-revenue']['solution'])
        page.locator('[data-action="run"]').click()
        assert '1 / 1 checks' in page.locator('#drawer-body').inner_text()
        for anchor in ['artifact','context','workspace','right']:
            # Context docking requires showing context first, as in V2.2.
            if anchor=='context' and not page.locator('#question-body').is_visible():page.locator('[data-shell="context-toggle"]').first.click()
            page.locator('#output-anchor').select_option(anchor);page.locator('#output-size').select_option('half')
            before=saved(page)['settings']['workstation']['layouts']
            theme(page,'fluent-soft');close_tool(page)
            assert saved(page)['settings']['workstation']['layouts']==before
            assert page.locator('#output-dock').evaluate('(el)=>el.parentElement.id')==anchor+'-output'
        page.locator('#output-size').select_option('compact');page.locator('#output-anchor').select_option('artifact')
    check('V23-12: independent output anchors and requested sizes survive rail Theme changes',output_state)

    def focus_undo():
        go(page,'sql-paid-revenue');content(page,'SELECT 1;')
        page.evaluate(r'''()=>{const e=document.querySelector('.CodeMirror').CodeMirror;e.clearHistory();e.replaceRange('\n-- keep undo',{line:0,ch:9});window.__keepEditor=e;window.__keepHistory=e.getHistory();}''')
        tool(page,'Notes');page.locator('#notes').fill('Focus and compact header invariant');before=saved(page)['settings']['workstation']
        page.locator('[data-action="focus"]').click();assert page.locator('#app').get_attribute('data-focus')=='true'
        theme(page,'sage-light');page.keyboard.press('Escape');page.locator('[data-action="focus"]').click()
        assert page.locator('#app').get_attribute('data-focus')=='false'
        assert page.locator('#tool-panel-title').inner_text()=='Notes'
        assert page.locator('#notes').input_value()=='Focus and compact header invariant'
        assert saved(page)['settings']['workstation']['layouts']==before['layouts']
        assert page.evaluate('window.__keepEditor===document.querySelector(".CodeMirror").CodeMirror')
        assert page.evaluate('JSON.stringify(window.__keepHistory)===JSON.stringify(window.__keepEditor.getHistory())')
        close_tool(page);page.evaluate('window.__keepEditor.undo()');assert content(page)=='SELECT 1;'
    check('V23-13: Focus restores prior tools/layout, editor identity, draft and usable undo history',focus_undo)

    def isolated_case():
        go(page,'sql-paid-revenue');content(page,'SELECT 10 AS standalone;')
        case=next(c for c in CASES if c['workspace']=='code')
        page.locator(f'[data-open-case="{case["id"]}"]').click();content(page,'SELECT 20 AS case_first;')
        page.locator('#case-page').select_option(case['pages'][1]['id']);page.locator('#case-task').select_option(case['tasks'][1]['id']);content(page,'SELECT 30 AS case_second;')
        theme(page,'fluent-soft');close_tool(page);page.locator('button[data-mode="inspect"]').click();page.locator('button[data-mode="case"]').click()
        assert page.locator('#case-page').input_value()==case['pages'][1]['id']
        assert page.locator('#case-task').input_value()==case['tasks'][1]['id'];snap(page,'03-fluent-soft-case')
        before=saved(page)['caseSessions'][case['id']]
        page.locator('.workspace-nav [data-workspace="pipeline"]').click();theme(page,'sage-light');close_tool(page)
        page.locator('.workspace-nav [data-workspace="code"]').click();page.locator(f'[data-open-case="{case["id"]}"]').click()
        assert content(page)=='SELECT 30 AS case_second;'
        assert page.locator('#case-page').input_value()==case['pages'][1]['id']
        assert page.locator('#case-task').input_value()==case['tasks'][1]['id']
        after=saved(page)
        assert after['drafts']['sql-paid-revenue']['code']=='SELECT 10 AS standalone;'
        assert after['caseSessions'][case['id']]['drafts']==before['drafts']
        page.locator('#case-task').select_option(case['tasks'][0]['id']);assert content(page)=='SELECT 20 AS case_first;'
    check('V23-14: independent case exhibit/task cursors and isolated drafts survive theme, lab and mode roundtrip',isolated_case)

    def keyboard():
        go(page,'sql-paid-revenue');theme(page,'sage-light');close_tool(page)
        page.locator('.navigator-toggle').focus()
        for lab in LABS:
            page.keyboard.press('Tab');assert page.evaluate('document.activeElement.dataset.workspace')==lab
        page.keyboard.press('Enter');assert page.locator('#workstation').get_attribute('data-lab')=='architecture'
        assert page.evaluate('document.activeElement.dataset.workspace')=='architecture'
        button=page.locator('button[data-tool="Theme"]');button.focus();page.keyboard.press('Enter')
        assert page.evaluate('document.activeElement.name')=='app-theme'
        page.keyboard.press('ArrowDown');assert page.locator('html').get_attribute('data-theme')=='fluent-light'
        page.keyboard.press('Escape');assert not page.locator('#tool-panel').is_visible()
        assert page.evaluate('document.activeElement.dataset.tool')=='Theme'
        page.keyboard.press('Tab');assert page.evaluate('document.activeElement.dataset.action')=='settings'
        # Verify a visible focus treatment in every shipped theme, without trapping focus.
        for value in THEMES:
            theme(page,value);page.keyboard.press('Escape');page.keyboard.press('Tab')
            outline=page.evaluate('({width:getComputedStyle(document.activeElement).outlineWidth,style:getComputedStyle(document.activeElement).outlineStyle})')
            assert outline['style']=='solid' and float(outline['width'].rstrip('px'))>=2,outline
        theme(page,'sage-light');close_tool(page)
        page.locator('button[data-mode="inspect"]').focus();page.keyboard.press('Enter');assert page.evaluate('document.activeElement.dataset.mode')=='inspect'
    check('V23 keyboard: lab tab order, activation, native theme arrows, Escape return and visible focus in all themes',keyboard)

    def shortcuts():
        go(page,'bi-revenue','inspect');content(page,BYID['bi-revenue']['solution'])
        page.locator('.CodeMirror').click();page.keyboard.press('Control+Enter')
        assert '1 / 1 checks' in page.locator('#drawer-body').inner_text()
        go(page,'sql-paid-revenue');page.locator('.navigator-toggle').focus();page.keyboard.press('Alt+ArrowRight')
        page.wait_for_function('document.querySelector("h1").textContent==="The latest order, with a tie-breaker"')
        page.keyboard.press('Alt+ArrowLeft');page.wait_for_function('(t)=>document.querySelector("h1").textContent===t',arg=BYID['sql-paid-revenue']['title'])
    check('V23 keyboard: existing Ctrl+Enter executes DAX teaching check; Alt arrows navigate',shortcuts)

    def link_mapping():
        go(page,'sql-paid-revenue');assert page.locator('button[data-tool="Deepnote"]').count()==0
        page.locator('[data-action="settings"]').click();assert 'CodeDELeet V2.3.0' in page.locator('#modal').inner_text()
        mapping={'schemaVersion':1,'links':{'sql-paid-revenue':[{'type':'exercise','label':'User-configured notebook','url':'https://deepnote.com/app/example/project-example'}]}}
        page.locator('#map-import').set_input_files({'name':'links.json','mimeType':'application/json','buffer':json.dumps(mapping).encode()})
        page.locator('#modal').wait_for(state='hidden');tool(page,'Deepnote')
        link=page.locator('#tool-body a[href="https://deepnote.com/app/example/project-example"]').first
        assert link.is_visible() and link.get_attribute('target')=='_blank'
        assert 'noopener' in link.get_attribute('rel') and 'noreferrer' in link.get_attribute('rel')
        close_tool(page)
    check('V23-15/16: blank Deepnote hidden; explicitly imported safe URL has new-tab/no-opener contract; identity in Settings',link_mapping)

    def laptop():
        go(page,'dag-data-quality');tool(page,'Notes');page.locator('[data-shell="tool-pin"]').click();close_tool(page)
        before=saved(page)['settings']['workstation']
        page.set_viewport_size({'width':1024,'height':768});tool(page,'Notes');assert page.locator('#workstation-stage').get_attribute('data-pinned')=='false'
        visible_inside(page,'[data-action="run"]');close_tool(page);theme(page,'fluent-light')
        assert page.locator('#workstation-stage').get_attribute('data-pinned')=='false';visible_inside(page,'[data-action="run"]');close_tool(page)
        snap(page,'04-1024-pipeline');no_overflow(page)
        page.set_viewport_size({'width':1600,'height':900})
        assert saved(page)['settings']['workstation']['layouts']==before['layouts']
        tool(page,'Notes');assert page.locator('[data-shell="tool-pin"]').get_attribute('aria-pressed')=='true';close_tool(page)
    check('V23 responsive: 1024px overlays never cover primary header or overwrite desktop pin/sizes',laptop)

    def short_rail():
        go(page,'arch-fabric');page.set_viewport_size({'width':1366,'height':600})
        for selector in ['button[data-mode="work"]','button[data-mode="inspect"]','button[data-mode="case"]','[data-action="focus"]','button[data-tool="Theme"]','[data-action="settings"]']:
            box=visible_inside(page,selector);assert box['height']>=40
        page.locator('#tool-rail button[data-tool="Inspector"]').scroll_into_view_if_needed();page.locator('#tool-rail button[data-tool="Inspector"]').click();close_tool(page)
        visible_inside(page,'button[data-tool="Theme"]');page.set_viewport_size({'width':1600,'height':900})
    check('V23 rail crowding: mode/Focus/Theme/Settings targets stay >=40px; secondary tools scroll at 600px height',short_rail)

    def mobile():
        mobile_ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
        m=mobile_ctx.new_page();m.set_default_timeout(5000);m.on('pageerror',lambda e:report['pageErrors'].append(str(e)));open_app(m,'v2-powershell-csv')
        no_overflow(m);assert m.locator('#terminal-command').is_visible()
        for name in ['bookmark','timer','previous','next','run']:visible_inside(m,f'#exercise-header [data-action="{name}"]')
        m.locator('[data-mobile="question"]').click();assert m.locator('#question-body').is_visible()
        m.locator('[data-mobile="tools"]').click();m.locator('#notes').fill('Compact mobile state')
        m.locator('[data-mobile="lab"]').click();assert m.locator('#terminal-command').is_visible()
        theme(m,'fluent-soft');assert m.locator('#tool-panel').is_visible();m.locator('button[data-tool="Theme"]').click();assert not m.locator('#tool-panel').is_visible()
        assert m.locator('#terminal-command').is_visible();assert m.locator('html').get_attribute('data-terminal')=='inherit'
        assert m.locator('.terminal-console').evaluate('(el)=>getComputedStyle(el).backgroundColor')=='rgb(243, 245, 248)'
        m.locator('.navigator-toggle').click();assert m.locator('.navigator-toggle').get_attribute('aria-expanded')=='true'
        for lab in LABS:
            btn=m.locator(f'.library-labs [data-workspace="{lab}"]');assert btn.is_visible();btn.click()
            assert m.locator('#workstation').get_attribute('data-lab')==lab
        m.locator('#exercise-list button[data-question]').first.click()
        assert m.locator('.navigator-toggle').get_attribute('aria-expanded')=='false'
        assert not m.locator('body').evaluate('(el)=>el.classList.contains("library-open")')
        m.locator('.navigator-toggle').click();assert m.locator('.navigator-toggle').get_attribute('aria-expanded')=='true'
        m.locator('.navigator-toggle').click();assert m.locator('.navigator-toggle').get_attribute('aria-expanded')=='false'
        no_overflow(m);snap(m,'05-390-mobile')
        mobile_ctx.close()
    check('V23 mobile: 390px tabs, attempt controls, all four drawer labs, notes, light terminal and Theme close',mobile)

    def final_views():
        page.set_viewport_size({'width':1366,'height':768});go(page,'dag-data-quality');theme(page,'sage-light');close_tool(page);snap(page,'06-1366-pipeline-designer')
        go(page,'arch-fabric');snap(page,'07-1366-systems-workbench');theme(page,'fluent-soft');close_tool(page);snap(page,'08-1366-fluent-soft')
        theme(page,'slate-dark');close_tool(page);snap(page,'09-1366-slate-dark');no_overflow(page)
    check('V23 screenshots: actual compact pipeline/systems and retained light/dark themes',final_views)
    browser.close()
except Exception:
 report['setupError']=traceback.format_exc()[-3500:];print(report['setupError'],flush=True)
finally:
 report['passed']=sum(x['passed'] for x in report['checks']);report['failed']=sum(not x['passed'] for x in report['checks'])
 report['status']='PASS' if not report['failed'] and not report['pageErrors'] and not report.get('setupError') else 'FAIL'
 (OUT/'acceptance-report.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({k:report[k] for k in ['status','passed','failed']},indent=2))
sys.exit(0 if report['status']=='PASS' else 1)
