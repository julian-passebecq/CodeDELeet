"""Actual built app/modules/CodeMirror/CSS in Chromium, without URL navigation.
Transport and localStorage are replaced ONLY in harness mode. Workers/CDNs are not
faked. UI_MODE=http retains the distinct served-origin path for the coordinator.
"""
from browser_support import launch_browser
from pathlib import Path
import base64, json, re, os, itertools, posixpath
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
COUNT=itertools.count()
CACHE={}
IMPORT_RE=r'''(from\s+)["'](\.\.?/[^"']+)["']'''
def rewrite(code,name):
    return re.sub(IMPORT_RE,lambda m:m[1]+json.dumps(module_url(posixpath.normpath(posixpath.join(posixpath.dirname(name),m[2])))),code)
def module_url(name):
    name=posixpath.normpath(name)
    if name in CACHE:return CACHE[name]
    code=rewrite((DIST/'app'/name).read_text(),name)
    url='data:text/javascript;base64,'+base64.b64encode(code.encode()).decode()
    CACHE[name]=url
    return url

def open_app(page,exercise='sql-paid-revenue',store=None,route=None):
    if os.getenv('UI_MODE')=='http':
        if store is not None:page.add_init_script('localStorage.setItem("data-practice-studio.v1",'+json.dumps(json.dumps(store))+');')
        page.goto(os.getenv('BASE_URL','http://127.0.0.1:5173')+'/#'+(route if route is not None else 'exercise='+exercise),wait_until='domcontentloaded')
        page.locator('#question-body').wait_for(state='attached')
        # HTTP lazily loads the bundled editor; do not mistake shell DOM for editor readiness.
        if page.locator('#editor-host').count():
            page.locator('#editor-host .CodeMirror').wait_for(state='visible', timeout=15000)
        return
    css='\n'.join((DIST/file).read_text() for file in ['styles.css','vendor/codemirror/lib/codemirror.css','vendor/codemirror/addon/dialog/dialog.css','shell.css'])
    page.set_content('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CodeDELeet V2.2 - Interview Workstation</title><style>'+css+'</style></head><body><div id="app"></div><div id="toast" role="status" aria-live="polite"></div><dialog id="modal"></dialog></body></html>')
    scripts=['lib/codemirror.js','addon/mode/simple.js','mode/sql/sql.js','mode/python/python.js','mode/javascript/javascript.js','mode/yaml/yaml.js','mode/shell/shell.js','mode/powershell/powershell.js','mode/dockerfile/dockerfile.js','mode/clike/clike.js','mode/properties/properties.js','addon/edit/matchbrackets.js','addon/edit/closebrackets.js','addon/comment/comment.js','addon/search/searchcursor.js','addon/search/search.js','addon/dialog/dialog.js','studio-modes.js']
    for path in scripts:page.add_script_tag(content=(DIST/'vendor/codemirror'/path).read_text())
    packs={str(f.relative_to(DIST)):json.loads(f.read_text()) for folder in ['packs','cases'] for f in (DIST/folder).glob('*.json')}
    values={} if store is None else {'data-practice-studio.v1':json.dumps(store)}
    page.evaluate(r'''({packs,values,id})=>{
      window.__storage=values;
      const store={getItem:k=>Object.hasOwn(window.__storage,k)?window.__storage[k]:null,setItem:(k,v)=>{window.__storage[k]=String(v)},removeItem:k=>delete window.__storage[k]};
      Object.defineProperty(window,'localStorage',{value:store,configurable:true});
      window.fetch=async url=>{const key=String(url).replace(/^\.\//,'');if(!Object.hasOwn(packs,key))throw Error('Harness has no fixture: '+key);return {ok:true,json:async()=>structuredClone(packs[key]),text:async()=>JSON.stringify(packs[key])};};
      window.__downloads=[];
      const originalClick=HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click=function(){if(this.download){window.__downloads.push({name:this.download,url:this.href});return;}originalClick.call(this)};
      location.hash=id;
    }''',{'packs':packs,'values':values,'id':route if route is not None else 'exercise='+exercise})
    code=rewrite((DIST/'app/app.js').read_text(),'app.js')+'\n// Fresh harness boot '+str(next(COUNT))
    url='data:text/javascript;base64,'+base64.b64encode(code.encode()).decode()
    page.evaluate('(url)=>import(url)',url)
    page.locator('#question-body').wait_for(state='attached',timeout=5000)
    page.wait_for_timeout(120)

if __name__=='__main__':
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser=launch_browser(p);page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        open_app(page);page.screenshot(path=str(ROOT/'evidence/v22/first-render.png'),full_page=True)
        print('Title',page.title(),'H1',page.locator('h1').all_text_contents(),'CodeMirror',page.locator('.CodeMirror').count(),'errors',errors)
        print(page.evaluate('({h:innerHeight,scrollH:document.documentElement.scrollHeight,scrollW:document.documentElement.scrollWidth,w:innerWidth})'))
        browser.close()
