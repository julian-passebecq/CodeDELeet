import { renderHeaderDOM } from './shell/header.js';
import type { CaseStudy } from './case-study/controller.js';
import { ensureSession,patchTask,selectTask,taskDraft,validateCase } from './case-study/controller.js';
import { caseReferences } from './case-study/view.js';
import { configurationChecks,gitGoal,modelChecks,terminalGoal } from './checks.js';
import { clone,escapeHTML as e,emptyStore,formatNumber,loadStore,markDraft,newId,normalizeQuestion,safeDeepnoteURL,saveStore,STORAGE_KEY,validateGraph,validatePack } from './core.js';
import { evaluateDax } from './dax.js';
import type { EditorHandle } from './editor.js';
import { EditorPool } from './editor.js';
import type { GitState } from './git.js';
import { commitAt,gitFixture,headId,runGit } from './git.js';
import { autoLayout,graphChecks,graphSVG,graphTemplate,parseDiagram,simulateDAG } from './graph.js';
import * as codeViews from './renderers/code-view.js';
import type { ViewContext } from './renderers/context.js';
import * as modelViews from './renderers/model-view.js';
import * as pipelineViews from './renderers/pipeline-view.js';
import * as systemsViews from './renderers/systems-view.js';
import * as workspaceViews from './renderers/workspace.js';
import { cancelRuntime,executePython,executeSQL,RUNTIME_VERSIONS } from './runtime.js';
import type { ModeSlot,Presentation,ToolId } from './shell/layout-controller.js';
import { activePreferences,defaultPresentation,newTransient,normalizePresentation,presetFor,resolveLayout,setOutputSize,toggleFocus } from './shell/layout-controller.js';
import * as shellViews from './shell/orchestration.js';
import type { RunStatus } from './shell/output-dock.js';
import { answerFingerprint,newRunStatus,outputControls,outputDetail,runSummary } from './shell/output-dock.js';
import * as readingViews from './shell/reading-panels.js';
import { scaffold } from './shell/scaffold.js';
import * as settingsViews from './shell/settings.js';
import type { TerminalState } from './terminal.js';
import { runTerminal,terminalFixture } from './terminal.js';
import type { DeepnoteLink,Draft,Fixtures,Graph,Pack,QueryResult,Question,Store,Workspace } from './types.js';
import { chips,download,icon,notice,options,pre } from './ui.js';

const $=<T extends HTMLElement=HTMLElement>(s:string):T=>document.querySelector(s)!;
let builtins:Pack[]=[],fixtures:Fixtures={},mapping:Record<string,DeepnoteLink[]>={},store:Store=emptyStore(),questions:Question[]=[],current:Question;
let workspace:Workspace='code',search='',difficulty='All levels',technology='All topics',queue='All exercises',conceptFilter='',priorityFilter='All priorities';
let presentation:Presentation=defaultPresentation(),shellState=newTransient(),cases:CaseStudy[]=[],activeCase:CaseStudy|null=null,outputTab='Summary',runState:RunStatus=newRunStatus(),selectedEdge='';
const editorPool=new EditorPool();
const viewMemory=new Map<string,any>();
const cameraMemory=new Map<string,{zoom:string;x:number;y:number}>();
const inputMemory=new Map<string,Record<string,{value:string;start:number;end:number;scroll:number}>>();
let graphRedo:Graph[]=[];
let leftTab='Task',drawerTab='Results',labTab='Workspace',hintCount=0,revealed=false,selectedNode='',selectedCommit='',selectedFile='',mobilePanel='lab';
let editor:EditorHandle|null=null,editorEpoch=0,labEpoch=0,saveTimer:ReturnType<typeof setTimeout>|undefined,result:QueryResult|null=null,runEpoch=0,busy=false,storageBlocked=false;
let graphUndo:Graph[]=[],timerStart:number|null=null,timerElapsed=0,terminalResult:{value:unknown;output:string}|null=null;
let runStatuses:Record<string,string>={},runGrid:any[]=[],graphDrag=false;
const app=$('#app');
function viewContext():ViewContext{return {current,labTab,selectedNode,selectedCommit,get selectedFile(){return selectedFile;},set selectedFile(v){selectedFile=v;},graphUndo,graphRedo,selectedEdge,runStatuses:runSummary(runState,answerFingerprint(draft(),current?.starter??'')).stale?{}:runStatuses,runGrid,fixtures,draft,graph,git,terminal};}
const draftKey=():string=>activeCase?'case/'+activeCase.id+'/'+ensureSession(store,activeCase).currentTaskId:'exercise/'+current.id;
const draft=():Draft=>activeCase?taskDraft(store,activeCase):store.drafts[current.id]??{};
const code=():string=>draft().code??current.starter;
function toast(message:string,error=false):void{const host=$('#toast');host.textContent=message;host.classList.toggle('error',error);host.classList.add('visible');setTimeout(()=>host.classList.remove('visible'),5000);}
function persist(immediate=false):void{clearTimeout(saveTimer);const write=()=>{store.settings.workstation=presentation;if(storageBlocked){$('#save-status').textContent='Recovery needed';return;}try{saveStore(store);$('#save-status').textContent='Saved on this device';}catch{storageBlocked=true;$('#save-status').textContent='Not saved - export backup';toast('Browser storage is unavailable or full. Export a backup from Settings before leaving.',true);}};if(immediate)write();else saveTimer=setTimeout(write,220);}
function patch(p:Partial<Draft>,immediate=false):void{if(activeCase)patchTask(store,activeCase,p);else markDraft(store,current.id,p);persist(immediate);updateRunBadge();}
function recalc():void{questions=[...builtins,...store.customPacks].flatMap(p=>p.questions).map(normalizeQuestion);}
function filtered():Question[]{return questions.filter(q=>q.workspace===workspace&&(!search||(q.title+' '+q.topic+' '+q.summary+' '+q.id).toLowerCase().includes(search.toLowerCase()))&&(difficulty==='All levels'||q.difficulty===difficulty)&&(technology==='All topics'||q.technology===technology)&&(!conceptFilter||q.concept.join(' ').toLowerCase().includes(conceptFilter.toLowerCase()))&&(priorityFilter==='All priorities'||q.interviewPriority===priorityFilter)&&(queue==='All exercises'||queue==='Bookmarked'&&store.drafts[q.id]?.bookmark||queue==='Review queue'&&(store.drafts[q.id]?.status==='review'||store.drafts[q.id]?.confidence==='Review')||queue==='Unfinished'&&store.drafts[q.id]?.status!=='completed'));}
function graph():Graph{if(draft().graph)return clone(draft().graph!);return validateGraph(current.fixture?.graph??graphTemplate(current.template??(current.workspace==='model'?'model':'fabric')));}
function setGraph(g:Graph,remember=true):void{if(remember){graphUndo=[...graphUndo.slice(-19),graph()];graphRedo=[];}patch({graph:validateGraph(g)},true);renderLab();}
function git():GitState{const s=draft().labState;if(s?.kind==='git'&&s.value?.commits){try{const v=clone(s.value);commitAt(v,headId(v));return v;}catch{toast('Saved virtual Git state is invalid. Reset this lab or export a backup.',true);}}return gitFixture(current.fixture?.git??'merge');}
function terminal():TerminalState{const s=draft().labState;return s?.kind==='terminal'&&s.value?.files?clone(s.value):terminalFixture(current.fixture?.shell??'bash');}
function shellHTML():void{
 app.innerHTML=scaffold({workspace,questions,search,difficulty,technology,queue});
 renderLibrary();renderHeader();renderQuestion();renderLab();renderDrawer();applyLayout();bindControls();
}

function renderLibrary():void{const list=filtered();
 const technologies=[...new Set(questions.filter(q=>q.workspace===workspace).map(q=>q.technology!))];
 $('#quick-filters').innerHTML=technologies.map(t=>`<button data-quick-filter="${e(t)}" class="quick-filter ${technology===t?'active':''}" aria-pressed="${technology===t}">${e(t)}</button>`).join('');
 $('#case-library').innerHTML='<span class="eyebrow">CASE STUDIES</span>'+cases.filter(c=>c.workspace===workspace).map(c=>`<button class="case-library-item ${activeCase?.id===c.id?'active':''}" data-open-case="${e(c.id)}"><strong>${e(c.title)}</strong><span>${c.tasks.length} tasks / ${c.pages.length} exhibits</span></button>`).join('');$('#library-count').textContent=`${list.length} exercises`;$('#exercise-list').innerHTML=list.length?list.map(q=>{const d=store.drafts[q.id]??{};return `<button class="exercise-item ${q.id===current.id?'selected':''}" data-question="${q.id}" role="listitem" aria-current="${q.id===current.id?'true':'false'}"><span class="exercise-status ${d.status==='completed'?'done':''}">${d.status==='completed'?icon('check'):''}</span><span class="exercise-item-copy"><strong>${e(q.title)}</strong><span><b class="level ${q.difficulty.toLowerCase()}">${q.difficulty}</b><span>${e(q.technology)}</span></span></span>${d.bookmark?'<span class="tiny-bookmark">'+icon('bookmark')+'</span>':''}</button>`;}).join(''):'<div class="empty small">No exercises match these filters.</div>';const done=questions.filter(q=>store.drafts[q.id]?.status==='completed').length;$('#progress-text').innerHTML=`<strong>${done}</strong> of ${questions.length} marked complete`;$('#progress-bar').style.width=100*done/questions.length+'%';}
function labelMode():string{const q=current;if(q.executionMode==='execute')return q.engine==='sql'?'EXECUTE / DUCKDB-WASM':'EXECUTE / PYODIDE';if(q.renderer==='pyspark-editor')return 'GUIDED REVIEW / NO SPARK RUNTIME';if(q.renderer==='semantic-model')return 'TEACHING MODEL / DAX SUBSET';return `${q.executionMode?.toUpperCase()} / ${q.renderer==='terminal'?'VIRTUAL SHELL':q.renderer==='git-visual'?'VIRTUAL GIT':q.renderer==='config-editor'?'TEXT CHECKS':'FIXTURE'}`;}
function actionLabel():string{return busy?'Cancel':current.renderer==='git-visual'||current.renderer==='terminal'?'Check goal':current.executionMode==='execute'?'Run & test':current.renderer==='dag-editor'?'Simulate':current.renderer==='semantic-model'?'Evaluate':current.renderer==='config-editor'?'Analyze':'Record review';}
function renderHeader():void{
 const d=draft(),siblings=filtered(),i=siblings.findIndex(q=>q.id===current.id),r=runSummary(runState,answerFingerprint(d,current.starter));
 renderHeaderDOM($('#exercise-header'),{navExpanded:innerWidth<760?document.body.classList.contains('library-open'):resolveLayout(presentation,workspace,innerWidth,shellState).navWidth>56,workspace,current,bookmark:!!d.bookmark,caseAttempt:!!activeCase,previousDisabled:!!activeCase||i<=0,nextDisabled:!!activeCase||i<0||i>=siblings.length-1,busy,clock:clockText(),executionLabel:labelMode(),actionLabel:actionLabel(),result:r});
}

function tabs(items:string[],active:string,attr:string):string{return items.map(x=>`<button ${attr}="${e(x)}" class="${x===active?'active':''}" aria-pressed="${x===active}">${e(x)}</button>`).join('');}
function renderQuestion():void{if(activeCase&&presentation.modes[workspace]==='case'){$('#question-tabs').innerHTML='<span class="case-reference-label">Exhibits - independent of task navigation</span>';$('#question-body').innerHTML=caseReferences(activeCase,ensureSession(store,activeCase));return;}$('#question-tabs').innerHTML=tabs(['Task','Data','Schema','Hints'],leftTab,'data-left-tab');const q=current;let html='';
 if(leftTab==='Task')html=`<span class="eyebrow">THE CHALLENGE</span><p class="question-summary">${e(q.summary)}</p><h2>Your task</h2><p class="task-text">${e(q.task)}</p><h3>Acceptance criteria</h3><ul class="requirements">${q.requirements.map(r=>`<li>${e(r)}</li>`).join('')}</ul><details class="concept-details"><summary>Concept refresher</summary>${q.concept.map(c=>`<p>${e(c)}</p>`).join('')}</details><div class="question-meta">${chips([q.minutes+' min suggested',['high','essential'].includes(q.interviewPriority??'')?'Interview essential':'Practice'])}</div><div class="mini-callout">Try your own approach first. Data and schema are available before you reveal the explanation.</div>`;
 if(leftTab==='Data')html=dataPanel();
 if(leftTab==='Schema')html=schemaPanel();
 if(leftTab==='Hints')html=`<span class="eyebrow">A LITTLE HELP</span><h2>Work one step at a time</h2><p>Hints are optional. The reference solution stays closed.</p>${q.hints.slice(0,hintCount).map((h,i)=>notice('Hint '+(i+1),h)).join('')}<button class="secondary" data-action="hint" ${hintCount>=q.hints.length?'disabled':''}>${hintCount>=q.hints.length?'All hints shown':'Reveal next hint'}</button><h3>Interview follow-ups</h3>${(q.followUps??[]).map(f=>`<p class="follow-up">${e(f)}</p>`).join('')}`;
 $('#question-body').innerHTML=html;
}
function dataPanel():string{return codeViews.dataPanel(viewContext());}
function schemaPanel():string{return codeViews.schemaPanel(viewContext());}
function labTabs():string[]{return workspaceViews.labTabs(workspaceViewsContext());}
function renderLabContent():void{return workspaceViews.renderLabContent(workspaceViewsContext());}
function codePanel(text:string):string{return workspaceViews.codePanel(workspaceViewsContext(),text);}
async function mountCode(epoch:number):Promise<void>{
 const host=$('#editor-host');if(!host)return;const key=draftKey();
 const h=await editorPool.attach(host,key,code(),current.language,value=>{if(draftKey()!==key)return;patch({code:value,status:draft().status==='completed'?'completed':'in-progress'});},()=>void run());
 if(epoch===labEpoch&&key===draftKey()){editor=h;editor.refresh();}
}

function semanticKPI():string{return workspaceViews.semanticKPI(workspaceViewsContext());}
function graphPanel(model:boolean):string{return pipelineViews.graphPanel(viewContext(),model);}
function gitPanel():string{return systemsViews.gitPanel(viewContext());}
function terminalPanel():string{return systemsViews.terminalPanel(viewContext());}
function performancePanel():string{return systemsViews.performancePanel(viewContext());}
function configEvidence():string{return systemsViews.configEvidence(viewContext());}
function mermaidPanel():string{return workspaceViews.mermaidPanel(workspaceViewsContext());}
function renderDrawer():void{
 const effective=resolveLayout(presentation,workspace,window.innerWidth,shellState);
 $('#drawer-tabs').innerHTML=outputControls(activePreferences(presentation,workspace),effective.outputSize,outputTab);
 $('#drawer-body').innerHTML=outputDetail(result,outputTab,resultPanel);
 const summary=runSummary(runState,answerFingerprint(draft(),current.starter));
 if(summary.stale)$('#drawer-body').insertAdjacentHTML('afterbegin',notice('Stale output','The answer or simulation inputs changed after this attempt. Run again to check the current state.'));
 renderRail();renderTool();updateRunBadge();
}

function resultPanel():string{return readingViews.resultPanel(readingViewsContext());}
function explanationPanel():string{return readingViews.explanationPanel(readingViewsContext());}
function visualPanel():string{return readingViews.visualPanel(readingViewsContext());}
function deepnotePanel():string{return readingViews.deepnotePanel(readingViewsContext());}

function applyLayout():void{return shellViews.applyLayout(shellViewsContext());}

function clockText():string{const secs=Math.floor((timerElapsed+(timerStart?Date.now()-timerStart:0))/1000);return `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;}
setInterval(()=>{const el=document.querySelector('#timer-value');if(el)el.textContent=clockText();},1000);
function navigate(id:string,caseId?:string,taskId?:string):void{
 const q=questions.find(q=>q.id===id);if(!q)return;
 if(current){captureView();if(busy){cancelRuntime();busy=false;runEpoch++;}persist(true);}
 const nextCase=caseId?cases.find(c=>c.id===caseId)??null:null;
 activeCase=nextCase;if(activeCase&&taskId)selectTask(store,activeCase,taskId);
 const changedLab=workspace!==q.workspace;current=q;workspace=q.workspace;
 store.settings.lastQuestion=id;store.settings.activeCase=activeCase?.id;
 if(changedLab){search='';difficulty='All levels';technology='All topics';queue='All exercises';conceptFilter='';priorityFilter='All priorities';}
 restoreView();setRoute();shellHTML();persist();
}

async function run():Promise<void>{
 if(busy){cancelRuntime();runEpoch++;busy=false;runState.phase='cancelled';result={engine:'Cancelled',columns:[],rows:[],elapsedMs:0,error:'The worker was terminated. Your draft and notes are preserved.'};drawerTab='Results';runState.result=result;setOutputSize(presentation,workspace,shellState,'compact');renderHeader();renderDrawer();applyLayout();return;}
 const q=current,key=draftKey(),runCode=code(),fingerprint=answerFingerprint(draft(),q.starter),token=++runEpoch;busy=true;runState={phase:'running',fingerprint,result:null};renderHeader();drawerTab='Results';if(resolveLayout(presentation,workspace,innerWidth,shellState).outputSize==='closed')setOutputSize(presentation,workspace,shellState,'compact');result={engine:'Preparing attempt',columns:[],rows:[],elapsedMs:0,notice:'Preparing the selected execution or review mode.'};renderDrawer();applyLayout();
 try{
 let r:QueryResult;
 if(q.executionMode==='execute'){
  if(!store.settings.runtimeConsent){if(!confirm('Load a pinned browser runtime from jsDelivr? This can download substantial WebAssembly assets. Only run code you trust; do not put secrets in a browser code lab.'))throw Error('Runtime download was not authorized.');store.settings.runtimeConsent=true;persist(true);}
  const progress=(m:string)=>{if(token===runEpoch){$('#engine-status').textContent=m;result={engine:q.engine==='sql'?'DuckDB-Wasm loading':'Pyodide loading',columns:[],rows:[],elapsedMs:0,notice:m};renderDrawer();}};
  r=q.engine==='sql'?await executeSQL(q,runCode,fixtures,progress):await executePython(q,runCode,progress);
 }else if(q.renderer==='git-visual'){const checks=gitGoal(q,git());r={engine:'Deterministic Git simulation',mode:'simulate',columns:[],rows:[],elapsedMs:0,checks,notice:'These checks examine the actual virtual repository state, not your command text. No GitHub access.'};}
 else if(q.renderer==='terminal'){const state=terminal(),last=terminalResult;const checks=last?terminalGoal(q,last.value,last.output):[];r={engine:'Virtual '+state.shell,mode:'simulate',columns:[],rows:[],elapsedMs:0,checks,notice:last?'Checked the last command output against the exercise goal. No host commands ran.':'Run a shell command first; no output has been checked.'};}
 else if(q.renderer==='dag-editor'){runGrid=simulateDAG(graph());runStatuses=Object.fromEntries(runGrid.map(r=>[r.id,r.status]));const checks=q.fixture?.targetTask?[{label:'Join completes after an intentional skip',passed:runGrid.find(r=>r.id===q.fixture?.targetTask)?.status==='success',detail:'Choose a trigger rule compatible with the fixture skip.'}]:graphChecks(graph(),q.template??'pipeline');r={engine:'DAG teaching simulator',mode:'simulate',columns:['id','status','start','end','attempts','message'],rows:runGrid.map(x=>[x.id,x.status,x.start,x.end,x.attempts,x.message]),elapsedMs:0,checks,notice:'All times are deterministic fixture values. Airflow/ADF are not running. Structural repair and run success are separate observations.'};renderLab();}
 else if(q.renderer==='semantic-model'){
  if(q.engine==='dax-subset'){const ctx={country:draft().country??'All',category:draft().category??'All'},actual=evaluateDax(code(),fixtures,graph(),ctx);const expected=evaluateDax(q.solution,fixtures,graph(),ctx);r={engine:'Bounded DAX teaching interpreter',mode:'simulate',columns:['Measure','Value','Visible rows'],rows:[[actual.name,actual.value===null?'BLANK':actual.value,actual.rowCount]],elapsedMs:0,checks:[{label:'Matches reference measure in current filter context',passed:actual.value===expected.value,detail:'A current-context check is not a proof for every possible model or filter.'}],notice:'Only the displayed DAX subset and fixture model are supported. No Power BI engine is connected.'};const el=document.querySelector('#kpi-value');if(el)el.textContent=formatNumber(actual.value);}
  else r={engine:'Star-schema teaching checks',mode:'simulate',columns:[],rows:[],elapsedMs:0,checks:modelChecks(graph(),fixtures,draft().grain??''),notice:'Checks cover supplied keys, explicit active relationships and selected grain, not a production semantic model.'};
 }else if(q.renderer==='config-editor')r={engine:'Configuration text analyzer',mode:'analyze',columns:[],rows:[],elapsedMs:0,checks:configurationChecks(q,code()),notice:'Partial text checks, not YAML/HCL validation or vendor execution. The evidence fixture remains unchanged.'};
 else if(q.renderer==='performance-investigation'){const answer=q.fixture?.diagnoses?.find((x:any)=>x.id===draft().answer);r={engine:'Evidence-based Spark review',mode:'review',columns:[],rows:[],elapsedMs:0,checks:answer?[{label:'Diagnosis fits supplied evidence',passed:answer.correct===true,detail:'Explain the causal link and what you would measure next. This does not benchmark your proposed fix.'}]:[],notice:answer?'Recorded the selected diagnosis and your reasoning.':'Choose a diagnosis before checking it.'};}
 else if(q.renderer==='multi-choice-reasoning')r={engine:'Reasoning check',mode:'review',columns:[],rows:[],elapsedMs:0,checks:draft().answer?[{label:'Selected explanation',passed:draft().answer===q.fixture?.answer,detail:'Review the explanation after making your own case.'}]:[],notice:'No runtime execution. Reasoning is saved separately from the selected choice.'};
 else if(q.renderer==='architecture-editor')r={engine:'Conceptual architecture review',mode:'review',columns:[],rows:[],elapsedMs:0,checks:graphChecks(graph(),q.template??'fabric'),notice:'Graph checks assess roles and reachability only. They do not verify real licensing, cost, security or capacity.'};
 else r={engine:q.renderer==='pyspark-editor'?'PySpark guided review - NOT EXECUTED':'Guided interview review',mode:'review',columns:[],rows:[],elapsedMs:0,notice:'Your draft/reasoning was recorded. No automatic correctness claim: use the reference checklist, explain your choices, and validate with the appropriate external runtime.'};
 if(token!==runEpoch||key!==draftKey())return;result=r;runState={phase:'complete',fingerprint,result:r};
 const checks=r.checks??[],passed=checks.length?checks.every(c=>c.passed):null;
 patch({status:draft().status==='completed'?'completed':'in-progress',attempts:[...(draft().attempts??[]),{at:new Date().toISOString(),kind:r.engine,passed,summary:checks.length?`${checks.filter(c=>c.passed).length}/${checks.length} checks`:'Review / no automated correctness claim',code:runCode.slice(0,30000)}].slice(-100)},true);
 }catch(error){if(token!==runEpoch)return;result={engine:'Attempt not completed',columns:[],rows:[],elapsedMs:0,error:(error as Error).message};runState={phase:q.executionMode==='execute'&&/fetch|network|worker could not|loading|failed to load|dynamically imported|timed out|importing a module/i.test((error as Error).message)?'unavailable':'error',fingerprint,result};patch({attempts:[...(draft().attempts??[]),{at:new Date().toISOString(),kind:'Error / not completed',passed:null,summary:(error as Error).message.slice(0,500)}].slice(-100)},true);}
 finally{if(token===runEpoch){busy=false;$('#engine-status').textContent=result?.error?'Runtime unavailable / attempt error':result?.engine??'Ready';renderHeader();renderDrawer();renderLibrary();applyLayout();}}
}
function exportBackup():void{persist(true);download('CodeDELeet-progress-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(store,null,2));}
function settings():void{return settingsViews.settings(settingsViewsContext());}
async function readJSONFile(input:HTMLInputElement,apply:(value:any)=>void):Promise<void>{return settingsViews.readJSONFile(settingsViewsContext(),input,apply);}
async function renderMermaid():Promise<void>{const source=$<HTMLTextAreaElement>('#mermaid-source').value;if(source.length>15000){toast('Mermaid input limit: 15,000 characters.',true);return;}patch({mermaid:source},true);const host=$('#mermaid-output'),qid=current.id;host.textContent='Loading optional Mermaid renderer...';try{const url=`https://cdn.jsdelivr.net/npm/mermaid@${RUNTIME_VERSIONS.mermaid}/dist/mermaid.esm.min.mjs`;const m=(await import(/* @vite-ignore */ url)).default;m.initialize({startOnLoad:false,securityLevel:'strict',theme:'neutral',suppressErrorRendering:true,maxTextSize:15000,htmlLabels:false,flowchart:{htmlLabels:false}});const {svg}=await m.render(newId('diagram'),source);if(current.id===qid&&host.isConnected){const parsed=new DOMParser().parseFromString(svg,'image/svg+xml');if(parsed.querySelector('script,foreignObject,image'))throw Error('This preview disallows scripts, embedded HTML and external images. Use plain Mermaid labels.');host.innerHTML=svg;}}catch(error){if(host.isConnected)host.innerHTML=notice('Mermaid preview unavailable',(error as Error).message+' Your source is preserved. The offline canvas and .mmd export still work.','error');}}
function command(which:'git'|'terminal'):void{
 if(which==='git'){const input=$<HTMLInputElement>('#git-command'),text=input.value.trim();if(!text)return;const r=runGit(git(),text);patch({labState:{kind:'git',value:r.state},status:'in-progress'},true);renderLab();if(!r.ok)toast(r.output,true);$('#git-command')?.focus();}
 else {const input=$<HTMLInputElement>('#terminal-command'),text=input.value.trim();if(!text)return;const r=runTerminal(terminal(),text);patch({labState:{kind:'terminal',value:r.state},status:'in-progress'},true);terminalResult=r.ok?{value:r.value,output:r.output}:null;renderLab();$('#terminal-command')?.focus();}
 const console=document.querySelector('.terminal-console');if(console)console.scrollTop=console.scrollHeight;
}
function resetLab():void{if(!confirm('Reset the current code and lab state to the exercise fixture? Notes, bookmark, confidence and attempt history are preserved.'))return;for(const key of inputMemory.keys())if(key.startsWith(draftKey()+'|'))inputMemory.delete(key);patch({code:current.starter,graph:undefined,labState:undefined,diagram:undefined,mermaid:undefined,answer:undefined,diagnosis:undefined,grain:undefined},true);result=null;runState=newRunStatus();runStatuses={};runGrid=[];terminalResult=null;graphUndo=[];graphRedo=[];selectedNode='';selectedCommit='';void editorPool.replace(draftKey(),current.starter);renderLab();renderDrawer();}
function bindControls():void{
 $('#search').oninput=()=>{search=$<HTMLInputElement>('#search').value;renderLibrary();};
 app.onclick=(event)=>{const target=event.target as Element,button=target.closest<HTMLElement>('button,a');if(!button||button.hasAttribute('disabled'))return;if(handleShellClick(button))return;
 if(button.dataset.question){document.body.classList.remove('library-open');navigate(button.dataset.question);return;}
 if(button.dataset.workspace){workspace=button.dataset.workspace as Workspace;technology='All topics';search='';difficulty='All levels';queue='All exercises';conceptFilter='';priorityFilter='All priorities';const q=filtered()[0];const inDrawer=!!button.closest('.library');if(q){navigate(q.id);document.querySelector<HTMLElement>(`${inDrawer?'.library-labs':'.workspace-nav'} [data-workspace="${workspace}"]`)?.focus({preventScroll:true});}return;}
 if(button.dataset.leftTab){leftTab=button.dataset.leftTab;renderQuestion();return;}
 if(button.dataset.labTab){rememberInputs();labTab=button.dataset.labTab;renderLab();return;}
 if(button.dataset.drawerTab){openTool(button.dataset.drawerTab as ToolId);return;}
 if(button.dataset.mobile){shellState.mobile=({question:'context',lab:'artifact',drawer:'output',tools:'tools'} as const)[button.dataset.mobile as 'question'|'lab'|'drawer'|'tools'];if(shellState.mobile==='output')setOutputSize(presentation,workspace,shellState,'expanded');if(shellState.mobile==='tools'&&!shellState.tool)shellState.tool='Notes';renderDrawer();applyLayout();return;}
 if(button.dataset.removeEdge){const g=graph();g.edges=g.edges.filter(x=>x.id!==button.dataset.removeEdge);setGraph(g);return;}
 if(button.dataset.inspectEdge){selectedEdge=button.dataset.inspectEdge;selectedNode='';renderLab();openTool('Inspector',true);return;}
 if(button.dataset.investigateNode){selectedNode=button.dataset.investigateNode;labTab='Workspace';renderLab();openTool('Inspector',true);return;}
 const action=button.dataset.action;if(!action)return;
 try{switch(action){
 case 'settings':settings();break;
 case 'library':document.body.classList.toggle('library-open');break;
 case 'export-backup':exportBackup();break;
 case 'bookmark':patch({bookmark:!draft().bookmark},true);renderHeader();renderLibrary();break;
 case 'timer':if(timerStart){timerElapsed+=Date.now()-timerStart;timerStart=null;}else timerStart=Date.now();renderHeader();break;
 case 'previous':case 'next':{const list=filtered(),i=list.findIndex(q=>q.id===current.id),q=list[i+(action==='next'?1:-1)];if(q)navigate(q.id);break;}
 case 'run':void run();break;
 case 'hint':hintCount++;renderQuestion();break;
 case 'focus':toggleFocus(shellState,presentation);renderHeader();renderRail();renderTool();applyLayout();persist(true);break;
 case 'collapse-drawer':setOutputSize(presentation,workspace,shellState,'closed');persist();renderDrawer();applyLayout();break;
 case 'reveal':revealed=true;patch({revealed:true});renderTool(true);break;
 case 'compare':$('#comparison').innerHTML='<h4>Your draft (read-only comparison)</h4>'+pre(code());break;
 case 'reset-lab':resetLab();break;
 case 'layout-graph':setGraph(autoLayout(graph()));break;
 case 'undo-graph':{const previous=graphUndo.pop();if(previous){graphRedo.push(graph());setGraph(previous,false);}break;}
 case 'redo-graph':{const next=graphRedo.pop();if(next){graphUndo.push(graph());setGraph(next,false);}break;}
 case 'fit-graph':{const canvas=document.querySelector<HTMLElement>('#graph-canvas');if(canvas){canvas.scrollTo(0,0);canvas.style.setProperty('--graph-zoom','1');}break;}
 case 'zoom-in':case 'zoom-out':{const canvas=document.querySelector<HTMLElement>('#graph-canvas');if(canvas){const z=Number(canvas.style.getPropertyValue('--graph-zoom')||1);canvas.style.setProperty('--graph-zoom',String(Math.max(.6,Math.min(2,z+(action==='zoom-in'?.2:-.2)))));}break;}
 case 'add-node':{const g=graph();if(g.nodes.length>=40)throw Error('Teaching limit: 40 nodes.');const id=newId('node');g.nodes.push({id,label:'New component',role:current.workspace==='model'?'dimension':'transform',x:35,y:55+Math.floor(g.nodes.length/3)*155,duration:3,retries:0});selectedNode=id;setGraph(g);break;}
 case 'delete-node':{const g=graph();g.nodes=g.nodes.filter(n=>n.id!==selectedNode);g.edges=g.edges.filter(x=>x.from!==selectedNode&&x.to!==selectedNode);selectedNode='';setGraph(g);break;}
 case 'connect-nodes':{const g=graph(),from=$<HTMLSelectElement>('#edge-from').value,to=$<HTMLSelectElement>('#edge-to').value;if(from===to)throw Error('Choose two different nodes.');if(g.edges.some(x=>x.from===from&&x.to===to))throw Error('That dependency already exists.');g.edges.push({id:newId('edge'),from,to,active:true,label:current.renderer==='semantic-model'?'1 : *':undefined});setGraph(g);break;}
 case 'apply-script':{const text=$<HTMLTextAreaElement>('#diagram-script').value;const g=parseDiagram(text,graph());patch({diagram:text});setGraph(g);toast('Diagram script applied to the graph.');break;}
 case 'apply-graph':inputMemory.delete(draftKey()+'|'+labTab);setGraph(validateGraph(JSON.parse($<HTMLTextAreaElement>('#graph-config').value)));toast('Graph configuration applied.');break;
 case 'export-graph':download(current.id+'-graph.json',JSON.stringify(graph(),null,2));break;
 case 'export-svg':download(current.id+'-diagram.svg',graphSVG(graph()),'image/svg+xml');break;
 case 'render-mermaid':void renderMermaid();break;
 case 'export-mermaid':download(current.id+'.mmd',$<HTMLTextAreaElement>('#mermaid-source').value,'text/plain');break;
 case 'export-code':download(current.id+(/python|spark/i.test(current.language)?'.py':/sql/i.test(current.language)?'.sql':'.txt'),code(),'text/plain');break;
 case 'embed-deepnote':{const url=safeDeepnoteURL(current.deepnoteEmbedUrl,true);if(url)$('#deepnote-embed').innerHTML=`<iframe title="Configured Deepnote preview" src="${e(url)}" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer" loading="lazy"></iframe><p class="muted">Read-only companion preview; availability and authentication are controlled by Deepnote.</p>`;break;}
 case 'save-git-file':inputMemory.delete(draftKey()+'|'+labTab);{const s=git();s.files[selectedFile]=$<HTMLTextAreaElement>('#virtual-file').value;patch({labState:{kind:'git',value:s}},true);toast('Working file saved. It is not staged.');break;}
 case 'stage-file':{const s=git();s.files[selectedFile]=$<HTMLTextAreaElement>('#virtual-file').value;const r=runGit(s,'git add "'+selectedFile.replace(/"/g,'')+'"');patch({labState:{kind:'git',value:r.state}},true);toast(r.output,!r.ok);break;}
 case 'save-terminal-file':inputMemory.delete(draftKey()+'|'+labTab);{const s=terminal();s.files[selectedFile]=$<HTMLTextAreaElement>('#virtual-file').value;if(s.files[selectedFile].length>200000)throw Error('Virtual file limit exceeded.');patch({labState:{kind:'terminal',value:s}},true);toast('Virtual file saved.');break;}
 case 'open-git':navigate('v2-git-stage');break;
 case 'check-prediction':{const choices=gitPredictions();const correct=draft().gitPrediction===choices[0].id;$('#prediction-feedback').innerHTML=notice(correct?'Prediction matches':'Revisit the state transition',correct?'Now make the change in the live virtual repository. Prediction does not move any refs.':'Track HEAD, the branch ref, the index and the working tree independently.');break;}
 }}catch(error){toast((error as Error).message,true);}
 };
 app.onchange=(event)=>{const t=event.target as HTMLInputElement;
 try{if(handleShellChange(t))return;if(t.id==='difficulty'){difficulty=t.value;renderLibrary();renderHeader();}
 else if(t.id==='queue'){queue=t.value;renderLibrary();renderHeader();}
 else if(t.id==='technology'){technology=t.value;renderLibrary();renderHeader();}
 else if(t.id==='country'||t.id==='category'){patch({[t.id]:t.value},true);renderLab();renderTool();}
 else if(t.id==='grain'){patch({grain:t.value},true);}
 else if(t.id==='status'||t.id==='confidence'){patch({[t.id]:t.value},true);renderLibrary();}
 else if(t.name==='git-prediction')patch({gitPrediction:t.value},true);
 else if(t.name==='answer'||t.name==='diagnosis-choice')patch({answer:t.value},true);
 else if(t.dataset.rubric!==undefined){const values=new Set(draft().rubric??[]);t.checked?values.add(t.dataset.rubric):values.delete(t.dataset.rubric);patch({rubric:[...values]},true);}
 else if(t.dataset.edgeActive){const g=graph();g.edges.find(x=>x.id===t.dataset.edgeActive)!.active=t.checked;setGraph(g);}
 else if(t.dataset.edgeCondition){const g=graph();g.edges.find(x=>x.id===t.dataset.edgeCondition)!.condition=t.value;setGraph(g);}
 else if(t.id.startsWith('node-')){const g=graph(),n=g.nodes.find(n=>n.id===selectedNode);if(!n)return;if(t.id==='node-label')n.label=t.value;if(t.id==='node-role')n.role=t.value;if(t.id==='node-retries')n.retries=Number(t.value);if(t.id==='node-trigger')n.triggerRule=t.value;if(t.id==='node-transient')n.transient=t.checked;if(t.id==='node-skip')n.skip=t.checked;setGraph(g);}
 else if(t.id==='git-file'||t.id==='terminal-file'){inputMemory.delete(draftKey()+'|'+labTab);selectedFile=t.value;renderLab();}
 else if(t.id==='shell-select'){const s=terminal();s.shell=t.value as 'bash'|'powershell';s.history=[];patch({labState:{kind:'terminal',value:s}},true);terminalResult=null;renderLab();}
 }catch(error){toast((error as Error).message,true);}
 };
 app.oninput=(event)=>{const t=event.target as HTMLTextAreaElement;if(t.id==='notes')patch({notes:t.value});if(t.id==='concept-filter'){conceptFilter=t.value;renderLibrary();}if(t.id==='diagnosis')patch({diagnosis:t.value});if(t.id==='mermaid-source')patch({mermaid:t.value});if(t.id==='diagram-script')patch({diagram:t.value});};
 app.onsubmit=(event)=>{const form=event.target as HTMLFormElement;if(form.id==='git-form'||form.id==='terminal-form'){event.preventDefault();command(form.id==='git-form'?'git':'terminal');}};
 app.onpointerdown=event=>{const t=event.target as Element;const node=t.closest<SVGGElement>('[data-node]');if(!node||!t.closest('#graph-canvas'))return;const svg=node.ownerSVGElement!,g=graph(),n=g.nodes.find(n=>n.id===node.dataset.node);if(!n)return;const start={x:event.clientX,y:event.clientY,nx:n.x,ny:n.y},scale=svg.viewBox.baseVal.width/svg.getBoundingClientRect().width;graphDrag=false;const move=(ev:PointerEvent)=>{const dx=(ev.clientX-start.x)*scale,dy=(ev.clientY-start.y)*scale;if(Math.abs(dx)+Math.abs(dy)>3)graphDrag=true;n.x=Math.max(0,Math.min(4000,start.nx+dx));n.y=Math.max(0,Math.min(4000,start.ny+dy));node.setAttribute('transform',`translate(${n.x},${n.y})`);};const end=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);selectedNode=n.id;selectedEdge='';if(graphDrag)setGraph(g);else renderLab();openTool('Inspector',true);};window.addEventListener('pointermove',move);window.addEventListener('pointerup',end,{once:true});event.preventDefault();};
 bindSplitters();
}
// A single persistent delegated handler survives partial panel renders.
function selectSVG(event:Event):void{const target=event.target as Element,edge=target.closest<HTMLElement>('[data-model-edge]');if(edge&&target.closest('#graph-canvas')){selectedEdge=edge.dataset.modelEdge??'';selectedNode='';renderLab();openTool('Inspector',true);return;}const commit=target.closest<HTMLElement>('[data-commit]');if(commit){selectedCommit=commit.dataset.commit??'';renderLab();}}
app.addEventListener('click',selectSVG);
app.addEventListener('keydown',event=>{const t=event.target as HTMLElement;if(t.dataset.modelEdge&&(event.key==='Enter'||event.key===' ')){event.preventDefault();selectedEdge=t.dataset.modelEdge;selectedNode='';renderLab();openTool('Inspector',true);}if(t.dataset.commit&&(event.key==='Enter'||event.key===' ')){event.preventDefault();selectedCommit=t.dataset.commit;renderLab();}if(t.dataset.node){if(event.key==='Enter'||event.key===' '){event.preventDefault();selectedNode=t.dataset.node;selectedEdge='';renderLab();openTool('Inspector',true);}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();const g=graph(),n=g.nodes.find(n=>n.id===t.dataset.node)!;n.x=Math.max(0,n.x+(event.key==='ArrowLeft'?-10:event.key==='ArrowRight'?10:0));n.y=Math.max(0,n.y+(event.key==='ArrowUp'?-10:event.key==='ArrowDown'?10:0));selectedNode=n.id;setGraph(g);}}});
function resize(event:PointerEvent,kind:'column'|'drawer'|'tool'):void{
 event.preventDefault();const ws=$('#workstation'),rect=ws.getBoundingClientRect(),m=activePreferences(presentation,workspace);document.body.classList.add('resizing');
 const move=(ev:PointerEvent)=>{if(kind==='column')m.split=Math.max(25,Math.min(60,100*(ev.clientX-rect.left)/rect.width));else if(kind==='tool')m.toolWidth=Math.max(320,Math.min(560,innerWidth-48-ev.clientX));else if(m.outputAnchor==='right')m.outputWidth=Math.max(300,Math.min(600,rect.right-ev.clientX));else {m.outputHeight=Math.max(120,Math.min(600,rect.bottom-ev.clientY));setOutputSize(presentation,workspace,shellState,'compact');}applyLayout();};
 const end=()=>{document.body.classList.remove('resizing');window.removeEventListener('pointermove',move);window.removeEventListener('pointercancel',end);persist(true);};window.addEventListener('pointermove',move);window.addEventListener('pointerup',end,{once:true});window.addEventListener('pointercancel',end,{once:true});
}

window.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){if((event.target as HTMLElement).closest('.CodeMirror'))return;event.preventDefault();void run();}if(event.altKey&&['ArrowLeft','ArrowRight'].includes(event.key)){$<HTMLButtonElement>(`[data-action="${event.key==='ArrowLeft'?'previous':'next'}"]`)?.click();event.preventDefault();}});
window.addEventListener('resize',()=>{if(current)applyLayout();});
window.addEventListener('beforeunload',()=>{if(current)persist(true);});
window.addEventListener('hashchange',handleRoute);
async function boot():Promise<void>{
 try{
 const manifest=await(await fetch('./packs/index.json')).json();builtins=await Promise.all(manifest.packs.map(async(path:string)=>validatePack(await(await fetch('./packs/'+path)).json())));fixtures=await(await fetch('./packs/fixtures.json')).json();mapping=(await(await fetch('./packs/deepnote-mapping.json')).json()).links??{};
 try{const original=localStorage.getItem(STORAGE_KEY);store=loadStore();if(original&&!JSON.parse(original).v2&&!localStorage.getItem(STORAGE_KEY+'.pre-v2'))localStorage.setItem(STORAGE_KEY+'.pre-v2',original);if(original&&!JSON.parse(original).settings?.workstation&&!localStorage.getItem(STORAGE_KEY+'.pre-v22'))localStorage.setItem(STORAGE_KEY+'.pre-v22',original);}catch{storageBlocked=true;store=emptyStore();}
 presentation=normalizePresentation(store.settings.workstation,{split:store.settings.split,drawerHeight:store.settings.drawerHeight});store.settings.focus=false;recalc();
 const authored=await(await fetch('./cases/index.json')).json();cases=authored.cases.map((c:unknown)=>validateCase(c,questions));
 const route=new URLSearchParams(location.hash.slice(1)),caseId=route.get('case')??(!route.get('exercise')?store.settings.activeCase:undefined);activeCase=cases.find(c=>c.id===caseId)??null;
 if(activeCase){const session=ensureSession(store,activeCase),requestedTask=route.get('task');if(requestedTask&&activeCase.tasks.some(t=>t.id===requestedTask))selectTask(store,activeCase,requestedTask);current=questions.find(q=>q.id===activeCase!.tasks.find(t=>t.id===session.currentTaskId)!.questionRef)!;}
 else {const id=route.get('exercise')??store.settings.lastQuestion;current=questions.find(q=>q.id===id)??questions[0];}
 workspace=current.workspace;restoreView();shellHTML();persist();
 if(storageBlocked)toast('Stored progress needs recovery. Export the raw value from Settings before starting fresh.',true);
 }catch(error){app.innerHTML=`<div class="boot-screen"><h1>Could not open the workstation</h1>${notice('Build or content error',(error as Error).message,'error')}<p>Serve the complete dist folder from an HTTP origin. Keep app, cases, packs and vendor files together.</p></div>`;}
}

void boot();
function gitPredictions():{id:string;label:string}[]{return systemsViews.gitPredictions(viewContext());}
function gitPredictionPanel():string{return systemsViews.gitPredictionPanel(viewContext());}

// Shared shell orchestration. Domain engines remain in their original modules.
function companionLinks():DeepnoteLink[]{return shellViews.companionLinks(shellViewsContext());}
function updateRunBadge():void{return shellViews.updateRunBadge(shellViewsContext());}
function renderRail():void{return shellViews.renderRail(shellViewsContext());}
let inspectorElement:HTMLElement|null=null;
function renderTool(force=false):void{return shellViews.renderTool(shellViewsContext(),force);}
function openTool(tool:ToolId,keep=false):void{return shellViews.openTool(shellViewsContext(),tool,keep);}
function rememberInputs():void{
 if(!current||!document.querySelector('#lab-content'))return;
 const inputs:Record<string,{value:string;start:number;end:number;scroll:number}>={};
 document.querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('#lab-content input:not([type=radio]):not([type=checkbox]),#lab-content textarea:not(.CodeMirror textarea):not(.code-fallback[aria-label="Code editor"])').forEach(el=>{if(el.id&&el.id!=='diagnosis'&&el.id!=='mermaid-source'&&el.id!=='diagram-script')inputs[el.id]={value:el.value,start:el.selectionStart??0,end:el.selectionEnd??0,scroll:el.scrollTop};});
 inputMemory.set(draftKey()+'|'+labTab,inputs);
}
function captureView():void{
 rememberInputs();viewMemory.set(draftKey(),{leftTab,labTab,hintCount,revealed,selectedNode,selectedEdge,selectedCommit,selectedFile,graphUndo,graphRedo,runStatuses,runGrid,terminalResult,result,runState,timerStart,timerElapsed});
}
function restoreView():void{
 const v=viewMemory.get(draftKey());
 leftTab=v?.leftTab??(presentation.modes[workspace]==='inspect'&&workspace==='code'?'Data':'Task');labTab=v?.labTab??presetFor(workspace,presentation.modes[workspace]).view;hintCount=v?.hintCount??0;revealed=v?.revealed??draft().revealed===true;selectedNode=v?.selectedNode??'';selectedEdge=v?.selectedEdge??'';selectedCommit=v?.selectedCommit??'';selectedFile=v?.selectedFile??'';graphUndo=v?.graphUndo??[];graphRedo=v?.graphRedo??[];runStatuses=v?.runStatuses??{};runGrid=v?.runGrid??[];terminalResult=v?.terminalResult??null;result=v?.result??null;runState=v?.runState??newRunStatus();timerStart=v?.timerStart??null;timerElapsed=v?.timerElapsed??0;
 if(current.renderer!=='semantic-model'&&labTab==='Model')labTab='Workspace';if(current.renderer!=='dag-editor'&&labTab==='Run grid')labTab='Workspace';
}
function renderLab():void{
 // Preserve the camera independently of graph/model state.
 const before=document.querySelector<HTMLElement>('#lab-content');const canvas=before?.querySelector<HTMLElement>('#graph-canvas');if(before?.dataset.answerKey===draftKey()&&canvas)cameraMemory.set(draftKey(),{zoom:canvas.style.getPropertyValue('--graph-zoom')||'1',x:canvas.scrollLeft,y:canvas.scrollTop});
 renderLabContent();
 $('#lab-content').dataset.answerKey=draftKey();const after=document.querySelector<HTMLElement>('#graph-canvas'),camera=cameraMemory.get(draftKey());if(after&&camera){after.style.setProperty('--graph-zoom',camera.zoom);after.scrollTo(camera.x,camera.y);}
 const inspector=document.querySelector<HTMLElement>('#lab-content .graph-inspector');
 if(inspector){inspectorElement=inspector;$('#inspector-parking').replaceChildren(inspector);}
 else if(current.renderer==='semantic-model'){inspectorElement=document.createElement('div');inspectorElement.className='graph-inspector';inspectorElement.innerHTML=modelViews.modelInspector(viewContext());$('#inspector-parking').replaceChildren(inspectorElement);}else if(!['dag-editor','architecture-editor'].includes(current.renderer!))inspectorElement=null;
 const input=inputMemory.get(draftKey()+'|'+labTab);if(input)for(const [id,v]of Object.entries(input)){const el=document.querySelector<HTMLInputElement|HTMLTextAreaElement>('#lab-content #'+id);if(el){el.value=v.value;try{el.setSelectionRange(v.start,v.end);}catch{}el.scrollTop=v.scroll;}}
 $('#task-strip').innerHTML=`<button class="text-button" data-shell="context-toggle">${icon('book')} Task</button><span>${e(current.summary)}</span>${['semantic-model','dag-editor','architecture-editor'].includes(current.renderer!)?'<button class="text-button" data-tool="Inspector">Inspector</button>':''}`;
 renderCaseParts();renderComparison();if(shellState.tool==='Inspector')renderTool(true);applyLayout();
}
function renderCaseParts():void{return shellViews.renderCaseParts(shellViewsContext());}
function renderComparison():void{return shellViews.renderComparison(shellViewsContext());}
function changeMode(slot:ModeSlot):void{return shellViews.changeMode(shellViewsContext(),slot);}
function setRoute():void{
 const value=activeCase?'case='+encodeURIComponent(activeCase.id)+'&task='+encodeURIComponent(ensureSession(store,activeCase).currentTaskId):'exercise='+encodeURIComponent(current.id);
 if(location.hash.slice(1)!==value)location.hash=value;
}
function handleRoute():void{
 const route=new URLSearchParams(location.hash.slice(1)),cid=route.get('case');
 if(cid){const c=cases.find(c=>c.id===cid);if(!c)return;const task=route.get('task')??ensureSession(store,c).currentTaskId;const t=c.tasks.find(t=>t.id===task);if(t&&(activeCase?.id!==cid||ensureSession(store,c).currentTaskId!==task))navigate(t.questionRef,cid,task);}
 else {const id=route.get('exercise');if(id&&(id!==current?.id||activeCase))navigate(id);}
}
function handleShellClick(button:HTMLElement):boolean{return shellViews.handleShellClick(shellViewsContext(),button);}
function handleShellChange(t:HTMLInputElement):boolean{return shellViews.handleShellChange(shellViewsContext(),t);}
function bindSplitters():void{return shellViews.bindSplitters(shellViewsContext());}
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('dialog[open]')){if(shellState.tool){shellViews.closeTool(shellViewsContext());}else if(shellState.focus){toggleFocus(shellState,presentation);renderRail();renderTool();applyLayout();persist(true);}}});

function shellViewsContext():shellViews.Bridge{return {get presentation(){return presentation;},set presentation(v){presentation=v;},get workspace(){return workspace;},set workspace(v){workspace=v;},get shellState(){return shellState;},set shellState(v){shellState=v;},get editorPool(){return editorPool;},draftKey,get current(){return current;},set current(v){current=v;},get mapping(){return mapping;},set mapping(v){mapping=v;},get store(){return store;},set store(v){store=v;},get runState(){return runState;},set runState(v){runState=v;},draft,$,companionLinks,get revealed(){return revealed;},set revealed(v){revealed=v;},get selectedNode(){return selectedNode;},set selectedNode(v){selectedNode=v;},get selectedEdge(){return selectedEdge;},set selectedEdge(v){selectedEdge=v;},get inspectorElement(){return inspectorElement;},set inspectorElement(v){inspectorElement=v;},explanationPanel,visualPanel,get fixtures(){return fixtures;},set fixtures(v){fixtures=v;},deepnotePanel,get activeCase(){return activeCase;},set activeCase(v){activeCase=v;},labelMode,renderRail,renderTool,applyLayout,graph,viewContext,rememberInputs,get labTab(){return labTab;},set labTab(v){labTab=v;},get leftTab(){return leftTab;},set leftTab(v){leftTab=v;},renderHeader,renderQuestion,renderLab,renderCaseParts,renderComparison,renderDrawer,persist,changeMode,openTool,get outputTab(){return outputTab;},set outputTab(v){outputTab=v;},get technology(){return technology;},set technology(v){technology=v;},renderLibrary,get cases(){return cases;},set cases(v){cases=v;},navigate,code,get search(){return search;},set search(v){search=v;},get difficulty(){return difficulty;},set difficulty(v){difficulty=v;},get queue(){return queue;},set queue(v){queue=v;},get conceptFilter(){return conceptFilter;},set conceptFilter(v){conceptFilter=v;},get priorityFilter(){return priorityFilter;},set priorityFilter(v){priorityFilter=v;},toast,patch,resize};}

function workspaceViewsContext():workspaceViews.Bridge{return {get current(){return current;},set current(v){current=v;},get labEpoch(){return labEpoch;},set labEpoch(v){labEpoch=v;},labTabs,get labTab(){return labTab;},set labTab(v){labTab=v;},$,tabs,gitPanel,terminalPanel,semanticKPI,draft,mountCode,graphPanel,get fixtures(){return fixtures;},set fixtures(v){fixtures=v;},graph,codePanel,viewContext,get runState(){return runState;},set runState(v){runState=v;},mermaidPanel,performancePanel,configEvidence,dataPanel,code};}

function readingViewsContext():readingViews.Bridge{return {get busy(){return busy;},set busy(v){busy=v;},get result(){return result;},set result(v){result=v;},actionLabel,get current(){return current;},set current(v){current=v;},get revealed(){return revealed;},set revealed(v){revealed=v;},draft,graph,get selectedNode(){return selectedNode;},set selectedNode(v){selectedNode=v;},get runStatuses(){return runStatuses;},set runStatuses(v){runStatuses=v;},git,get selectedCommit(){return selectedCommit;},set selectedCommit(v){selectedCommit=v;},companionLinks,get mapping(){return mapping;},set mapping(v){mapping=v;}};}

function settingsViewsContext():settingsViews.Bridge{return {syncImportedDraft:()=>{void editorPool.replace(draftKey(),code());navigate(current.id,activeCase?.id,activeCase?ensureSession(store,activeCase).currentTaskId:undefined);},$,get storageBlocked(){return storageBlocked;},set storageBlocked(v){storageBlocked=v;},get store(){return store;},set store(v){store=v;},get presentation(){return presentation;},set presentation(v){presentation=v;},exportBackup,toast,persist,readJSONFile,get builtins(){return builtins;},set builtins(v){builtins=v;},recalc,navigate,get current(){return current;},set current(v){current=v;},shellHTML,get mapping(){return mapping;},set mapping(v){mapping=v;},renderDrawer,handleShellChange,get workspace(){return workspace;},set workspace(v){workspace=v;},applyLayout,get runEpoch(){return runEpoch;},set runEpoch(v){runEpoch=v;},get busy(){return busy;},set busy(v){busy=v;},renderHeader,get shellState(){return shellState;},set shellState(v){shellState=v;},renderLab};}
