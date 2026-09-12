"""V2.4 acceptance on actual compiled modules/DOM, via the existing file harness.
No worker/CDN success is simulated. HTTP-origin gate is separate and mandatory
for promotion; see network_runtime_smoke.py. All checks record real outcomes.
"""
from browser_harness import ROOT, open_app
from browser_support import launch_browser
from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json,traceback,sys,time,os

OUT=ROOT/'evidence/v24'; SHOTS=OUT/'screenshots';SHOTS.mkdir(parents=True,exist_ok=True)
LABS=['code','model','pipeline','architecture']
LESSONS=[l for lab in LABS for l in json.loads((ROOT/'dist/lessons'/f'{lab}.json').read_text())]
QUESTIONS=[q for name in ['starter','v2-specialists'] for q in json.loads((ROOT/'dist/packs'/f'{name}.json').read_text())['questions']]
BYID={q['id']:q for q in QUESTIONS}
CASES=json.loads((ROOT/'dist/cases/index.json').read_text())['cases']
checks=[];errors=[];metrics=[];block_shots=[]
TRANSPORT=os.getenv('UI_MODE','built-file import-map harness: real compiled modules, CSS, CodeMirror; fixture fetch/storage only')

def check(name,fn):
    start=time.monotonic();before=len(errors)
    try:
        fn();assert not errors[before:],errors[before:];checks.append({'name':name,'passed':True,'seconds':round(time.monotonic()-start,3)});print('PASS',name,flush=True)
    except Exception:
        checks.append({'name':name,'passed':False,'seconds':round(time.monotonic()-start,3),'error':traceback.format_exc()[-3500:]});print('FAIL',name,traceback.format_exc()[-3000:],flush=True)

def saved(p):
    p.wait_for_timeout(270)
    return p.evaluate('JSON.parse(localStorage.getItem("data-practice-studio.v1"))')

def go(p,route):
    p.evaluate('(route)=>location.hash=route',route)
    p.wait_for_timeout(80)
    if route.startswith('exercise='):expect(p.locator('#exercise-header h1')).to_have_text(BYID[route.split('=',1)[1]]['title'])
    elif 'lesson=' in route:
        id=route.split('lesson=',1)[1].split('&',1)[0];expect(p.locator('.lesson-reading')).to_have_attribute('data-lesson-id',id)
    elif 'category=' in route:expect(p.locator('#app')).to_have_attribute('data-surface','category-home')
    else:expect(p.locator('#app')).to_have_attribute('data-surface','lab-home')

def no_overflow(p):
    box=p.evaluate('({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight})')
    assert box['sw']<=box['w']+1 and box['sh']<=box['h']+1,box

def nav(p):return p.locator('.compact-header [data-shell="nav-toggle"]')
def close_tool(p):
    if p.locator('#tool-panel').is_visible():p.locator('#tool-header [data-shell="tool-close"]').click()
def tool(p,name):
    if p.locator('#tool-panel').is_visible() and p.locator('#tool-panel-title').inner_text()==name:return
    p.locator('#tool-rail [data-tool="'+name+'"]').click()
def shot(p,name):
    p.screenshot(path=str(SHOTS/(name+'.png')),full_page=True)

def setcode(p,value):
    p.locator('.CodeMirror').wait_for();p.evaluate('(v)=>document.querySelector(".CodeMirror").CodeMirror.setValue(v)',value)

def code(p):return p.evaluate('document.querySelector(".CodeMirror").CodeMirror.getValue()')
def read_download(p):
    # Browser-produced blob, not a fixture or reconstruction of export contents.
    return p.evaluate('''async()=>{const d=window.__downloads.at(-1);return await new Promise((resolve,reject)=>{const x=new XMLHttpRequest();x.open('GET',d.url);x.onload=()=>resolve(JSON.parse(x.responseText));x.onerror=reject;x.send();});}''')

MEASURE='''()=>{const r=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,visible:!!(b.width&&b.height)&&getComputedStyle(e).display!=='none'};};
return {viewport:{width:innerWidth,height:innerHeight},surface:document.querySelector('#app').dataset.surface,mode:document.querySelector('#app').dataset.appMode,navState:document.querySelector('#app').dataset.navState,header:r('#exercise-header'),navigator:r('#exercise-library'),persistentNavWidth:parseFloat(getComputedStyle(document.querySelector('#app')).getPropertyValue('--nav-width')),main:r('.main'),workstation:r('#workstation'),rail:r('#tool-rail'),tool:r('#tool-panel'),reading:r('.lesson-reading'),readingMaxWidth:document.querySelector('.lesson-reading')?getComputedStyle(document.querySelector('.lesson-reading')).maxWidth:null,document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},visibleCards:[...document.querySelectorAll('[data-category-card]')].filter(e=>{const b=e.getBoundingClientRect();return b.top<innerHeight&&b.bottom>0&&b.right>0&&b.left<innerWidth}).length};}'''

with sync_playwright() as pw:
    b=launch_browser(pw);context=b.new_context(viewport={'width':1600,'height':900},device_scale_factor=1)
    def new_page(width=1600,height=900,route=None,store=None,exercise='sql-paid-revenue'):
        p=b.new_page(device_scale_factor=1);p.set_viewport_size({'width':width,'height':height});p.set_default_timeout(6000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept());open_app(p,exercise=exercise,route=route,store=store);return p
    p=new_page()

    def mode_roundtrip():
        setcode(p,'SELECT 3 AS my_practice;')
        before=p.evaluate('''()=>{const cm=document.querySelector('.CodeMirror').CodeMirror;cm.clearHistory();cm.setCursor({line:0,ch:7});cm.replaceRange('4',{line:0,ch:7},{line:0,ch:8},'+input');window.__beforeCM=cm;return {text:cm.getValue(),history:cm.historySize(),cursor:cm.getCursor()};}''')
        tool(p,'Notes');p.locator('#notes').fill('Practice stays separate');close_tool(p)
        p.locator('.app-mode-switch').click();expect(p.locator('#app')).to_have_attribute('data-app-mode','learn');assert p.locator('[data-lab-home="code"]').count()==1;assert p.locator('[data-action="run"]').count()==0;assert not p.locator('#tool-panel').is_visible()
        p.locator('.app-mode-switch').click();expect(p.locator('#app')).to_have_attribute('data-surface','exercise');assert 'exercise=sql-paid-revenue' in p.evaluate('location.hash')
        after=p.evaluate('''()=>{const cm=document.querySelector('.CodeMirror').CodeMirror;return {same:cm===window.__beforeCM,text:cm.getValue(),history:cm.historySize(),cursor:cm.getCursor()};}''');assert after.pop('same');assert after==before,(after,before)
        assert saved(p)['drafts']['sql-paid-revenue']['notes']=='Practice stays separate'
    check('A: Practice -> Learn -> Practice restores exact exercise, editor instance, cursor, undo and draft',mode_roundtrip)

    for mode in ['practice','learn']:
        for lab in LABS:
            def home_case(mode=mode,lab=lab):
                go(p,'view='+mode+'&lab=code');p.locator('.workspace-nav [data-workspace="'+lab+'"]').click()
                expect(p.locator('[data-lab-home]')).to_have_attribute('data-lab-home',lab);assert p.locator('[data-category-card]').count()==5
                assert p.locator('#workstation').count()==0;assert p.locator('[data-action="run"],#run-status').count()==0
                assert p.locator('.workspace-nav [aria-pressed="true"]').get_attribute('data-workspace')==lab
                assert p.locator('.category-nav [data-nav-category]').count()==5;no_overflow(p)
                if lab in ['code','model']:shot(p,mode+'-'+lab+'-home')
            check('A/G: '+mode+' '+lab+' icon opens five-card lab home, never an arbitrary exercise',home_case)

    for mode in ['practice','learn']:
        for lesson in LESSONS:
            def category_case(mode=mode,l=lesson):
                route=f'view={mode}&lab={l["workspace"]}&category={l["categoryId"]}'
                go(p,route);assert p.locator('#discovery-content h1').count()==1;assert p.locator('[data-category-progress]').count()==1
                assert p.locator('.surface-breadcrumb [data-nav-home]').count()==1;assert p.locator('.category-nav [aria-current="page"]').get_attribute('data-nav-category')==l['categoryId']
                if mode=='learn':assert p.locator('#discovery-content [data-lesson="'+l['id']+'"]').count()>=1
                elif l['categoryId']=='bi-serving':assert 'no dedicated Practice' in p.locator('#discovery-content').inner_text()
                else:assert p.locator('#discovery-results .exercise-subgroup').count()>=1
                other=new_page(route=route);expect(other.locator('#app')).to_have_attribute('data-surface','category-home');assert other.locator('.category-nav [aria-current="page"]').get_attribute('data-nav-category')==l['categoryId'];other.close()
                p.locator('.surface-breadcrumb [data-nav-home]').click();assert p.locator('[data-category-card]').count()==5;no_overflow(p)
            check('A: '+mode+' category '+lesson['categoryId']+' grouped / breadcrumb / fresh boot',category_case)

    def history_case():
        go(p,'view=practice&lab=code');p.locator('[data-category-card="sql-patterns"]').click()
        p.locator('#discovery-results [data-question="sql-paid-revenue"]').click();setcode(p,'SELECT 900 AS history_keeps_me;')
        p.evaluate('history.back()');expect(p.locator('#app')).to_have_attribute('data-surface','category-home')
        p.evaluate('history.back()');expect(p.locator('#app')).to_have_attribute('data-surface','lab-home')
        p.evaluate('history.forward()');expect(p.locator('#app')).to_have_attribute('data-surface','category-home')
        p.evaluate('history.forward()');expect(p.locator('#app')).to_have_attribute('data-surface','exercise');assert code(p)=='SELECT 900 AS history_keeps_me;'
    check('A: Home -> Category -> Exercise -> Back / Back / Forward / Forward preserves draft',history_case)

    def old_case():
        c=CASES[0];route='case='+c['id']+'&task='+c['tasks'][0]['id'];q=new_page(route=route)
        expect(q.locator('#app')).to_have_attribute('data-surface','case');assert q.locator('#case-task').input_value()==c['tasks'][0]['id'];assert q.locator('#exercise-header [data-nav-category]').count()==1
        q.locator('.app-mode-switch').click();q.locator('.app-mode-switch').click();expect(q.locator('#app')).to_have_attribute('data-surface','case');assert q.locator('#case-task').input_value()==c['tasks'][0]['id'];q.close()
    check('A/F: Old case/task URL, breadcrumb and Practice/Learn resume keep case contract',old_case)

    for l in LESSONS:
        def render_lesson(l=l):
            go(p,'view=learn&lesson='+l['id']);assert p.locator('[data-block-kind]').count()==len(l['blocks']);assert p.locator('[data-action="run"],#run-status').count()==0
            assert p.locator('.lesson-diagram svg[aria-labelledby]').count()>=1;assert p.locator('.lesson-diagram figcaption').count()>=1
            assert p.locator('.lesson-table-scroll table th[scope="col"]').count()>0
            p.locator('.lesson-checkpoint summary').click();assert p.locator('.lesson-checkpoint').get_attribute('open') is not None
            assert p.locator('.lesson-resources a').evaluate_all('(links)=>links.every(a=>a.protocol==="https:"&&a.rel.includes("noopener"))')
            assert set(p.locator('#tool-rail [data-rail-group]').evaluate_all('(es)=>es.map(e=>e.dataset.railGroup)'))=={'personal','preferences'}
            assert saved(p)['settings']['learning']['progress'][l['id']]['status'] in ['in-progress','completed'];no_overflow(p)
        check('D/E: render and self-check '+l['id'],render_lesson)

    def block_evidence():
        seen=set()
        for l in LESSONS:
            missing=[x for x in l['blocks'] if x['kind'] not in seen]
            if not missing:continue
            go(p,'view=learn&lesson='+l['id'])
            for block in missing:
                section=p.locator('[data-lesson-section="'+block['id']+'"]');section.scroll_into_view_if_needed();section.screenshot(path=str(SHOTS/('block-'+block['kind']+'.png')));seen.add(block['kind']);block_shots.append({'kind':block['kind'],'lesson':l['id'],'screenshot':'screenshots/block-'+block['kind']+'.png'})
        assert len(seen)==14
        go(p,'view=learn&lesson=code-git-working-tree-index-head&section=example-code');shot(p,'learn-git-code-and-table')
        go(p,'view=learn&lesson=code-sql-grain-joins&section=flow');shot(p,'learn-sql-diagram')
        p.set_viewport_size({'width':1600,'height':1300});p.locator('.lesson-outline [data-lesson-section-link="flow"]').click();shot(p,'learn-sql-code-and-diagram');p.set_viewport_size({'width':1600,'height':900})
    check('E/I: actual browser screenshots for all 14 block kinds, code/table/diagram scenarios',block_evidence)

    def lesson_interactions():
        l=LESSONS[0];go(p,'view=learn&lesson='+l['id']);before=saved(p).get('drafts',{}).copy()
        p.locator('.lesson-outline [data-lesson-section-link="flow"]').click();assert 'section=flow' in p.evaluate('location.hash');assert saved(p)['settings']['learning']['progress'][l['id']]['lastSection']=='flow'
        p.locator('[data-copy-block]').first.click();assert p.locator('[data-copy-block]').first.inner_text() in ['Copied','Select code to copy']
        # Restore an explicit section after clicking a scrolled code block.
        p.locator('.lesson-outline [data-lesson-section-link="flow"]').click()
        tool(p,'Notes');p.locator('#lesson-notes').fill('A lesson note, not an exercise draft.');close_tool(p)
        p.locator('#exercise-header [data-lesson-complete]').click();expect(p.locator('#lesson-progress-label')).to_have_text('Completed')
        store=saved(p);assert store['drafts']==before;assert store['settings']['learning']['progress'][l['id']]['notes']=='A lesson note, not an exercise draft.'
        other=new_page(route='view=learn&lesson='+l['id'],store=store);expect(other.locator('#lesson-progress-label')).to_have_text('Completed');assert saved(other)['settings']['learning']['progress'][l['id']]['lastSection']=='flow';other.close()
        p.locator('.related-exercise').first.click();expect(p.locator('#app')).to_have_attribute('data-app-mode','practice');assert p.evaluate('location.hash').startswith('#exercise=');assert saved(p)['settings']['learning']['progress'][l['id']]['status']=='completed'
        p.locator('.app-mode-switch').click();expect(p.locator('[data-lab-home]')).to_have_attribute('data-lab-home','code');assert p.locator('.continue-card[data-lesson="'+l['id']+'"]').count()==1
    check('E/F/H: outline / copy / completion / notes / reload / related Practice remain separate',lesson_interactions)

    def backup_roundtrip():
        go(p,'view=learn&lesson='+LESSONS[0]['id']);before=saved(p);p.locator('[data-action="settings"]').click()
        if os.getenv('UI_MODE')=='http':
            with p.expect_download() as download:p.locator('#settings-export').click()
            backup=json.loads(Path(download.value.path()).read_text())
        else:
            p.locator('#settings-export').click();backup=read_download(p)
        assert backup['settings']['learning']==before['settings']['learning'];assert backup['drafts']==before['drafts'];p.locator('[aria-label="Close settings"]').click()
        target=new_page();setcode(target,'SELECT 77 AS target_local;');tool(target,'Notes');target.locator('#notes').fill('target notes');close_tool(target)
        target.locator('[data-action="settings"]').click();target.locator('#backup-import').set_input_files({'name':'roundtrip.json','mimeType':'application/json','buffer':json.dumps(backup).encode()});expect(target.locator('#modal')).not_to_be_visible()
        merged=saved(target);assert merged['settings']['learning']['progress'][LESSONS[0]['id']]['status']=='completed';assert merged['drafts']['sql-paid-revenue']['code']=='SELECT 77 AS target_local;';assert merged['drafts']['sql-paid-revenue']['notes']=='target notes'
        old={'schemaVersion':1,'drafts':{'preserved-old':{'notes':'old backup imported','updatedAt':'2025-01-01T00:00:00Z'}},'customPacks':[],'settings':{'focus':False}}
        target.locator('[data-action="settings"]').click();target.locator('#backup-import').set_input_files({'name':'v23.json','mimeType':'application/json','buffer':json.dumps(old).encode()});expect(target.locator('#modal')).not_to_be_visible();merged=saved(target)
        assert merged['drafts']['preserved-old']['notes']=='old backup imported';assert merged['settings']['learning']['progress'][LESSONS[0]['id']]['status']=='completed';target.close()
    check('F: actual browser export blob -> file input merge -> old backup import preserves both modes',backup_roundtrip)

    def import_and_filters():
        go(p,'view=practice&lab=code');p.locator('.home-shortcuts [data-nav-queue="Bookmarked"]').click();assert p.locator('#discovery-results [data-question]').count()==0
        p.locator('#discovery-results [data-clear-filters]').click();assert p.locator('#discovery-results [data-question]').count()>0
        q=dict(QUESTIONS[0]);q.update(id='v24-imported-example',title='Imported data challenge');q.pop('categoryId',None);q.pop('subcategoryId',None)
        pack={'schemaVersion':1,'id':'v24-personal-pack','title':'Personal examples','version':1,'questions':[q]}
        p.locator('[data-action="settings"]').click();p.locator('#pack-import').set_input_files({'name':'custom.json','mimeType':'application/json','buffer':json.dumps(pack).encode()});expect(p.locator('#modal')).not_to_be_visible()
        assert p.locator('[data-category-card]').count()==5;group=p.locator('#discovery-results .exercise-subgroup').filter(has=p.locator('[data-question="v24-imported-example"]'));assert group.count()==1;assert 'Imported / Other' in group.text_content()
        p.locator('#surface-search').fill('Imported data challenge');assert p.locator('#discovery-results [data-question]').count()==1;assert p.locator('#discovery-results [data-question]').get_attribute('data-question')=='v24-imported-example'
        p.locator('#surface-search').fill('zz-no-match');assert p.locator('#discovery-results [data-clear-filters]').is_visible()
        p.locator('#discovery-results [data-clear-filters]').click();p.locator('#discovery-results [data-question="v24-imported-example"]').click();p.locator('[data-action="bookmark"]').click()
        p.locator('.workspace-nav [data-workspace="code"]').click();p.locator('.home-shortcuts [data-nav-queue="Bookmarked"]').click();assert p.locator('#discovery-results [data-question="v24-imported-example"]').count()==1
    check('G: custom pack fallback, five-card invariant, grouped search and bookmark/empty queues',import_and_filters)

    def practice_rail():
        go(p,'exercise=sql-paid-revenue');close_tool(p);ids=p.locator('#tool-rail [data-rail-group]').evaluate_all('(es)=>es.map(e=>e.dataset.railGroup)');assert ids==['layout','run','reference','personal','preferences']
        buttons=p.locator('#tool-rail button');ys=[x['y'] for x in buttons.evaluate_all('(es)=>es.map(e=>({y:e.getBoundingClientRect().y}))')];assert ys==sorted(ys)
        tool(p,'Notes');assert 'active' in p.locator('#tool-rail [data-tool="Notes"]').get_attribute('class');close_tool(p);shot(p,'practice-workstation-grouped-rail')
        tool(p,'Theme');assert p.locator('#tool-panel').bounding_box()['width']==320;shot(p,'practice-theme-grouped-rail');close_tool(p)
        p.locator('[data-action="focus"]').click();p.locator('.app-mode-switch').click();assert p.locator('#app').get_attribute('data-focus')=='false';assert not p.locator('#tool-panel').is_visible();assert p.locator('#tool-rail [data-mode]').count()==0
    check('C: semantic rail order / active state / Theme and Focus normalize safely on Learn switch',practice_rail)

    for w,h in [(1600,900),(1366,768),(1190,800),(1024,768),(768,1024),(390,844)]:
        def nav_case(w=w,h=h):
            page=new_page(w,h);expected='expanded' if w>=1200 else 'compact' if w>=760 else 'hidden';expect(page.locator('#app')).to_have_attribute('data-nav-state',expected)
            before=page.evaluate(MEASURE)
            for slot in ['work','inspect','case']:
                page.locator('#tool-rail [data-mode="'+slot+'"]').click();nav(page).click()
                opened='compact' if w>=1200 else 'overlay' if w>=760 else 'drawer';expect(page.locator('#app')).to_have_attribute('data-nav-state',opened)
                assert nav(page).get_attribute('aria-expanded')==('false' if w>=1200 else 'true')
                if w<1200:
                    after=page.evaluate(MEASURE);assert abs(after['main']['width']-before['main']['width'])<=1;assert abs(after['workstation']['width']-before['workstation']['width'])<=1;assert after['navigator']['x']==0
                    if slot=='work':
                        after.update(scenario='practice-overlay',mainWidthBefore=before['main']['width'],mainWidthAfter=after['main']['width'],workstationWidthBefore=before['workstation']['width'],workstationWidthAfter=after['workstation']['width']);metrics.append(after)
                    assert after['navigator']['width']==320;assert page.locator('#exercise-library').get_attribute('aria-modal')=='true'
                    page.keyboard.press('Escape');expect(nav(page)).to_be_focused()
                else:nav(page).click()
                expect(page.locator('#app')).to_have_attribute('data-nav-state',expected);no_overflow(page)
            for name in ['Theme','Notes']:
                tool(page,name);close_tool(page);expect(page.locator('#app')).to_have_attribute('data-nav-state',expected)
            # Focus temporarily hides the current expanded/overlay state, then restores it.
            nav(page).click();focus_before=page.locator('#app').get_attribute('data-nav-state')
            # Focus button remains a tested global action, even when an overlay is modal.
            if w<1200:page.keyboard.press('Escape');focus_before=expected
            page.locator('[data-action="focus"]').click();expect(page.locator('#app')).to_have_attribute('data-nav-state','hidden');assert nav(page).get_attribute('aria-expanded')=='false'
            page.locator('[data-action="focus"]').click();expect(page.locator('#app')).to_have_attribute('data-nav-state',focus_before)
            if w>=1200 and focus_before=='compact':nav(page).click()
            go(page,'view=practice&lab=code');home_metric=page.evaluate(MEASURE);home_metric['scenario']='home';metrics.append(home_metric)
            nav(page).click();opened_metric=page.evaluate(MEASURE);opened_metric['scenario']='navigator-toggle';opened_metric['mainWidthBefore']=home_metric['main']['width'];opened_metric['mainWidthAfter']=opened_metric['main']['width'];metrics.append(opened_metric)
            if w<1200:
                # Tab / Shift-Tab wrap inside visible drawer, and backdrop dismisses.
                controls=page.locator('#exercise-library button:visible,#exercise-library input:visible,#exercise-library select:visible,#exercise-library summary:visible')
                controls.last.focus();page.keyboard.press('Tab');expect(controls.first).to_be_focused();page.keyboard.press('Shift+Tab');expect(controls.last).to_be_focused()
                if w==1190:shot(page,'medium-expanded-overlay')
                if w==390:shot(page,'mobile-practice-drawer')
                page.locator('#nav-backdrop').click(position={'x':w-5,'y':30});expect(nav(page)).to_be_focused();expect(page.locator('#app')).to_have_attribute('data-nav-state',expected)
                nav(page).click();page.locator('.category-nav [data-nav-category="sql-patterns"]').click();expect(page.locator('#app')).to_have_attribute('data-nav-state',expected);assert nav(page).get_attribute('aria-expanded')=='false'
            else:nav(page).click()
            go(page,'view=learn&lesson=code-git-working-tree-index-head&section=example-code');no_overflow(page)
            lesson_metric=page.evaluate(MEASURE);lesson_metric['scenario']='lesson';metrics.append(lesson_metric);assert float(lesson_metric['readingMaxWidth'].replace('px',''))==870
            if w==390:
                page.locator('.block-code').scroll_into_view_if_needed();assert page.locator('.block-code .code-block').evaluate('(e)=>getComputedStyle(e).overflowX')=='auto';shot(page,'mobile-lesson-code');table=page.locator('.block-table .lesson-table-scroll');table.scroll_into_view_if_needed();assert table.evaluate('(e)=>getComputedStyle(e).overflowX')=='auto';shot(page,'mobile-lesson-table')
            tool(page,'Theme');measure=page.evaluate(MEASURE);measure['scenario']='lesson-theme';metrics.append(measure);assert measure['tool']['width']==320
            if w==390:shot(page,'mobile-lesson-theme')
            close_tool(page)
            if w==1366:go(page,'view=practice&lab=code&category=sql-patterns');shot(page,'practice-category-1366')
            page.close()
        check(f'B/J: {w}x{h} deterministic nav / modes / tools / focus / ARIA / widths / overflow',nav_case)

    def themes_and_settings():
        go(p,'view=learn&lesson=systems-platform-tradeoffs')
        colors=[]
        for theme in ['sage-light','fluent-light','fluent-soft','slate-dark']:
            tool(p,'Theme');p.locator('input[name="app-theme"][value="'+theme+'"]').check();close_tool(p);assert p.locator('html').get_attribute('data-theme')==theme;colors.append(p.locator('.lesson-reading').evaluate('(e)=>getComputedStyle(e).color'));no_overflow(p)
            if theme in ['slate-dark','fluent-soft']:shot(p,'lesson-theme-'+theme)
        assert len(set(colors))>=3
        p.locator('[data-action="settings"]').click();p.locator('#layout-reset').click();p.locator('[aria-label="Close settings"]').click();assert p.locator('.lesson-reading').count()==1;assert p.locator('#app').get_attribute('data-nav-state')=='expanded';no_overflow(p)
    check('C/E: all four existing themes style lessons, and settings/layout reset is safe without a workstation',themes_and_settings)
    p.close();b.close()

report={'suite':'V2.4 Learning + Navigation acceptance','browser':'Chromium','transport':TRANSPORT,'checks':checks,'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'pageErrors':errors,'blockScreenshots':block_shots}
report['status']='PASS' if report['failed']==0 and not errors else 'FAIL'
(OUT/'V24_ACCEPTANCE_REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
(OUT/'V24_LAYOUT_METRICS.json').write_text(json.dumps({'transport':TRANSPORT,'measurements':metrics,'status':report['status'],'boundary':'Actual DOM measurements. Built-file fixture transport is not served-origin or worker/CDN validation.'},indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['status','passed','failed','pageErrors']},indent=2));sys.exit(0 if report['status']=='PASS' else 1)
