/** Local CodeMirror 5, lazy loaded. No third-party editor request. */
declare global { interface Window {CodeMirror:any;} }
let loading:Promise<void>|null=null;
const scripts=['lib/codemirror.js','addon/mode/simple.js','mode/sql/sql.js','mode/python/python.js','mode/javascript/javascript.js','mode/yaml/yaml.js','mode/shell/shell.js','mode/powershell/powershell.js','mode/dockerfile/dockerfile.js','mode/clike/clike.js','mode/properties/properties.js','addon/edit/matchbrackets.js','addon/edit/closebrackets.js','addon/comment/comment.js','addon/search/searchcursor.js','addon/search/search.js','addon/dialog/dialog.js','studio-modes.js'];
function load():Promise<void>{if(loading)return loading;if(window.CodeMirror?.modes?.['studio-dax'])return Promise.resolve();return loading??=(async()=>{for(const path of scripts)await new Promise<void>((resolve,reject)=>{const s=document.createElement('script');s.src='./vendor/codemirror/'+path;s.onload=()=>resolve();s.onerror=()=>reject(Error('Bundled code editor failed to load. The plain-text fallback is still editable.'));document.head.append(s);});})();}
function mode(language:string):string{const l=language.toLowerCase();if(l.includes('powershell'))return 'powershell';if(l.includes('docker'))return 'dockerfile';if(l.includes('python')||l.includes('spark'))return 'python';if(l.includes('sql'))return 'text/x-sql';if(l.includes('yaml'))return 'yaml';if(l.includes('json'))return 'application/json';if(l.includes('shell')||l.includes('bash')||l.includes('git'))return 'shell';if(l.includes('c#'))return 'text/x-csharp';if(l.includes('hcl'))return 'studio-hcl';if(l.includes('dax'))return 'studio-dax';return 'text/plain';}
export interface EditorHandle {getValue():string;setValue(s:string):void;focus():void;destroy():void;refresh():void;}
export async function mountEditor(host:HTMLElement,value:string,language:string,onChange:(s:string)=>void,onRun?:()=>void,readOnly=false):Promise<EditorHandle>{
 const ta=document.createElement('textarea');ta.className='code-fallback';ta.value=value;ta.setAttribute('aria-label',readOnly?'Reference code':'Code editor');ta.spellcheck=false;ta.readOnly=readOnly;host.replaceChildren(ta);ta.addEventListener('input',()=>onChange(ta.value));
 try{await load();if(!host.isConnected)return {getValue:()=>ta.value,setValue:s=>ta.value=s,focus:()=>{},destroy:()=>{},refresh:()=>{}};const cm=window.CodeMirror.fromTextArea(ta,{value,mode:mode(language),lineNumbers:true,lineWrapping:false,indentUnit:4,tabSize:4,matchBrackets:true,autoCloseBrackets:true,readOnly,viewportMargin:20,screenReaderLabel:readOnly?'Reference code':'Code editor',extraKeys:{'Ctrl-Enter':()=>onRun?.(),'Cmd-Enter':()=>onRun?.(),'Ctrl-/':(c:any)=>c.toggleComment(),'Cmd-/':(c:any)=>c.toggleComment(),Tab:(c:any)=>c.replaceSelection('    ')}});cm.on('change',()=>onChange(cm.getValue()));cm.setSize('100%','100%');const ro=new ResizeObserver(()=>cm.refresh());ro.observe(host);return {getValue:()=>cm.getValue(),setValue:s=>cm.setValue(s),focus:()=>cm.focus(),refresh:()=>cm.refresh(),destroy:()=>{ro.disconnect();cm.toTextArea();}};
 }catch{return {getValue:()=>ta.value,setValue:s=>ta.value=s,focus:()=>ta.focus(),destroy:()=>ta.remove(),refresh:()=>{}};}
}

/** Retain the real editor DOM/Doc across mode, tab and theme changes. */
export class EditorPool {
 private entries=new Map<string,{node:HTMLElement;handle:Promise<EditorHandle>;suppress:boolean}>();
 attach(placeholder:HTMLElement,key:string,value:string,language:string,onChange:(value:string)=>void,onRun:()=>void):Promise<EditorHandle>{
  const existing=this.entries.get(key);
  if(existing){placeholder.replaceWith(existing.node);void existing.handle.then(h=>h.refresh());return existing.handle;}
  const entry={node:placeholder,suppress:false,handle:Promise.resolve(null as unknown as EditorHandle)};entry.handle=mountEditor(placeholder,value,language,value=>{if(!entry.suppress)onChange(value);},onRun);this.entries.set(key,entry);return entry.handle;
 }
 async replace(key:string,value:string):Promise<void>{const entry=this.entries.get(key);if(entry){const handle=await entry.handle;entry.suppress=true;try{handle.setValue(value);}finally{entry.suppress=false;}}}
 refresh(key:string):void{const e=this.entries.get(key);if(e&&e.node.isConnected)void e.handle.then(h=>h.refresh());}
 dispose():void{for(const e of this.entries.values())void e.handle.then(h=>h.destroy());this.entries.clear();}
}
