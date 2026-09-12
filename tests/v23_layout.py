"""Measure the actual compiled workstation. The transport mode is explicit."""
import sys,json,os
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'evidence/v23/layout';out.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(root/'tests'))
from browser_harness import open_app
from browser_support import launch_browser
from playwright.sync_api import sync_playwright
VIEWPORTS=[(1600,900),(1366,768),(1024,768),(390,844)]
QUESTIONS={'code':'sql-paid-revenue','model':'bi-star-schema','pipeline':'dag-data-quality','architecture':'arch-fabric'}
MEASURE='''()=>{
 const rect=(selector)=>{const el=document.querySelector(selector);if(!el)return null;const b=el.getBoundingClientRect(),s=getComputedStyle(el);return {x:b.x,y:b.y,top:b.top,bottom:b.bottom,width:b.width,height:b.height,visible:!!(b.width&&b.height)&&s.display!=='none'&&s.visibility!=='hidden'};};
 const header=rect('#exercise-header'),topbar=rect('.topbar'),stage=rect('#workstation-stage');
 return {viewport:{width:innerWidth,height:innerHeight},header,topbar,globalChromeHeight:(header?.height||0)+(topbar?.visible?topbar.height:0),stage,labPanel:rect('.lab-panel'),renderer:rect('#lab-content'),canvas:rect('#graph-canvas'),graphSVG:rect('#graph-canvas svg'),editor:rect('.CodeMirror'),toolRail:rect('#tool-rail'),primaryAction:rect('[data-action=run]'),mobileTabs:rect('.mobile-tabs'),document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},text:{body:getComputedStyle(document.querySelector('#question-body')).fontSize,title:getComputedStyle(document.querySelector('h1')).fontSize},nav:document.querySelector('#app').dataset.nav};
}'''
report={'transport':os.getenv('UI_MODE','built-file harness (real DOM/CSS; fetch/storage replaced, no runtime simulation)'), 'sourceRoot':root.name, 'measurements':[], 'pageErrors':[]}
with sync_playwright() as p:
 b=launch_browser(p);report['browser']=b.version
 for w,h in VIEWPORTS:
  for lab,q in QUESTIONS.items():
   page=b.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
   page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
   open_app(page,q)
   if lab=='code':page.locator('.CodeMirror').wait_for(state='visible')
   page.wait_for_timeout(100)
   m=page.evaluate(MEASURE);m.update({'lab':lab,'exercise':q,'mode':'work','screenshot':f'{w}x{h}-{lab}.png'})
   page.screenshot(path=str(out/m['screenshot']),full_page=True)
   report['measurements'].append(m)
   print(w,h,lab, 'chrome',m['globalChromeHeight'],'stage',m['stage']['height'],'canvas',m['canvas']['height'] if m['canvas'] else None,flush=True)
   page.close()
 b.close()
baseline_file=Path(os.getenv('V23_BASELINE_METRICS',str(root/'evidence/v23/baseline-layout/measurements.json')))
baseline=json.loads(baseline_file.read_text())
report['baseline']={'commit':'4212550ca4260390b5a756d81882c3a75a5f912b','browser':baseline['browser'],'transport':baseline['transport'],'path':str(baseline_file.relative_to(root)) if baseline_file.is_relative_to(root) else str(baseline_file)}
report['comparisons']=[]
for after in report['measurements']:
 before=next(x for x in baseline['measurements'] if x['viewport']==after['viewport'] and x['lab']==after['lab'])
 w,h=after['viewport']['width'],after['viewport']['height']
 action=after['primaryAction'];stage=after['stage'];rail=after['toolRail']
 gain=stage['height']-before['stage']['height']
 check={'viewport':after['viewport'],'lab':after['lab'],'before':before,'after':after,'workstationGainPx':gain,'canvasGainPx':after['canvas']['height']-before['canvas']['height'] if after['canvas'] and before['canvas'] else None,'requiredGainPx':32 if w>=1366 else 0}
 check['assertions']={
   'heightGain':gain>=check['requiredGainPx'],
   'oneGlobalRow':w<760 or after['topbar'] is None and after['header']['height']==52,
   'noDocumentOverflow':after['document']['width']<=w and after['document']['height']<=h,
   'primaryVisible':action['visible'] and action['x']>=0 and action['x']+action['width']<=w and action['bottom']<=h,
   'railVisible':rail['visible'] and rail['x']+rail['width']<=w and rail['bottom']<=h,
   'textNotShrunk':float(after['text']['body'].rstrip('px'))>=float(before['text']['body'].rstrip('px')) and float(after['text']['title'].rstrip('px'))>=float(before['text']['title'].rstrip('px')),
 }
 check['passed']=all(check['assertions'].values());report['comparisons'].append(check)
report['passed']=sum(x['passed'] for x in report['comparisons']);report['failed']=sum(not x['passed'] for x in report['comparisons']);report['status']='PASS' if not report['failed'] and not report['pageErrors'] else 'FAIL'
report['boundary']='Real Chromium DOM/CSS measurements at DPR 1. Baseline was captured from the untouched supplied Git archive before edits; built-file transport replaces fetch/storage, not layout. No hosted-origin or runtime execution is inferred.'
(root/'evidence/v23/V23_LAYOUT_METRICS.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['status','passed','failed']},indent=2))
sys.exit(0 if report['status']=='PASS' else 1)
