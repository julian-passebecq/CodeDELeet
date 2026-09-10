from browser_support import launch_browser
"""Render actual built files without navigating, for URL-blocked CaaS Chromium.
Only fetch/storage/URL delivery are in-memory substitutes. App code, DOM events,
CodeMirror, graph engines and CSS are real build output. No production metrics.
The regular smoke path remains available with UI_MODE=http.
"""
from pathlib import Path
import base64, json, re, mimetypes, os, itertools
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
COUNT=itertools.count()
CACHE={}
def module_url(name):
    if name in CACHE:return CACHE[name]
    code=(DIST/'app'/name).read_text()
    def replace(m):return m[1]+json.dumps(module_url(m[2]))
    code=re.sub(r'(from\s+)[\'"]\./([^\'"]+)[\'"]',replace,code)
    url='data:text/javascript;base64,'+base64.b64encode(code.encode()).decode()
    CACHE[name]=url
    return url

def open_app(page,exercise='sql-paid-revenue',store=None):
    if os.getenv('UI_MODE')=='http':
        if store is not None:
            page.add_init_script('localStorage.setItem("data-practice-studio.v1",'+json.dumps(json.dumps(store))+');')
        page.goto(os.getenv('BASE_URL','http://127.0.0.1:5173')+'/#exercise='+exercise,wait_until='networkidle')
        page.locator('#question-body').wait_for(state='attached')
        return
    css=(DIST/'styles.css').read_text()+'\n'+(DIST/'vendor/codemirror/lib/codemirror.css').read_text()+'\n'+(DIST/'vendor/codemirror/addon/dialog/dialog.css').read_text()
    page.set_content('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CodeDELeet V2 - Interview Workstation</title><style>'+css+'</style></head><body><div id="app"></div><div id="toast" role="status" aria-live="polite"></div><dialog id="modal"></dialog></body></html>')
    scripts=['lib/codemirror.js','addon/mode/simple.js','mode/sql/sql.js','mode/python/python.js','mode/javascript/javascript.js','mode/yaml/yaml.js','mode/shell/shell.js','mode/powershell/powershell.js','mode/dockerfile/dockerfile.js','mode/clike/clike.js','mode/properties/properties.js','addon/edit/matchbrackets.js','addon/edit/closebrackets.js','addon/comment/comment.js','addon/search/searchcursor.js','addon/search/search.js','addon/dialog/dialog.js','studio-modes.js']
    for path in scripts:page.add_script_tag(content=(DIST/'vendor/codemirror'/path).read_text())
    packs={str(f.relative_to(DIST)):json.loads(f.read_text()) for f in (DIST/'packs').glob('*.json')}
    values={} if store is None else {'data-practice-studio.v1':json.dumps(store)}
    page.evaluate(r'''({packs,values,id})=>{
      window.__storage=values;
      const store={getItem:k=>Object.hasOwn(window.__storage,k)?window.__storage[k]:null,setItem:(k,v)=>{window.__storage[k]=String(v)},removeItem:k=>delete window.__storage[k]};
      Object.defineProperty(window,'localStorage',{value:store,configurable:true});
      window.fetch=async url=>{const key=String(url).replace(/^\.\//,'');if(!Object.hasOwn(packs,key))throw Error('Harness has no fixture: '+key);return {ok:true,json:async()=>structuredClone(packs[key]),text:async()=>JSON.stringify(packs[key])};};
      window.__downloads=[];
      const originalClick=HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click=function(){if(this.download){window.__downloads.push({name:this.download,url:this.href});return;}originalClick.call(this)};
      location.hash='exercise='+id;
    }''',{'packs':packs,'values':values,'id':exercise})
    code=(DIST/'app/app.js').read_text()
    code=re.sub(r'(from\s+)[\'"]\./([^\'"]+)[\'"]',lambda m:m[1]+json.dumps(module_url(m[2])),code)
    code+='\n// fresh harness boot '+str(next(COUNT))
    url='data:text/javascript;base64,'+base64.b64encode(code.encode()).decode()
    page.evaluate('(url)=>import(url)',url)
    page.locator('#question-body').wait_for(state='attached')
    page.wait_for_timeout(150)

if __name__=='__main__':
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser=launch_browser(p)
        page=browser.new_page(viewport={'width':1600,'height':1000},device_scale_factor=1)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        open_app(page)
        page.screenshot(path=str(ROOT/'evidence/01-code-workstation.png'),full_page=True)
        print('Title',page.title(),'H1',page.locator('h1').all_text_contents(),'CodeMirror',page.locator('.CodeMirror').count(),'errors',errors)
        print(page.evaluate('({h:innerHeight,scrollH:document.documentElement.scrollHeight,scrollW:document.documentElement.scrollWidth,w:innerWidth})'))
        browser.close()
