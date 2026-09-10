/** Bounded, explainable checks. Not a production validator or hidden interview judge. */
import type {Question,Graph,Fixtures} from './types.js';
import type {GitState} from './git.js';
import {headId,commitAt,ancestors} from './git.js';
export type Check={label:string;passed:boolean;detail:string};
const check=(label:string,passed:boolean,detail:string):Check=>({label,passed,detail});
export function gitGoal(q:Question,s:GitState):Check[]{
 const h=commitAt(s,headId(s)),f=q.fixture?.goal;
 if(f==='staged-only')return [check('A new pipeline commit exists',h.id.startsWith('N')&&h.tree['pipeline.py']!==commitAt(s,'C').tree['pipeline.py'],'Commit the staged pipeline change.'),check('Scratch notes stay outside the commit',!Object.hasOwn(h.tree,'notes.md')&&Object.hasOwn(s.files,'notes.md'),'Untracked notes remain in the working tree.')];
 if(f==='merge')return [check('Merge has two parents',h.parents.length===2,'A true merge preserves both lines of history.'),check('Main and feature history are reachable',ancestors(s,h.id).has('C')&&ancestors(s,h.id).has('E'),'The merged commit should contain both parents.'),check('Conflict is resolved',!s.pendingMerge&&!Object.values(h.tree).some(v=>v.includes('<<<<<<<')),'Resolve markers, stage, and commit.')];
 if(f==='rebase')return [check('Feature is based on main',s.head==='feature'&&ancestors(s,h.id).has('C'),'Rebase the feature branch onto main.'),check('Feature commits were replayed',s.commits.filter(c=>c.original&&ancestors(s,h.id).has(c.id)).length===2,'The two replayed commits receive new identities; old objects remain.')];
 if(f==='fetch')return [check('Tracking ref updated',s.tracking['origin/main']==='R','Fetch refreshes the remote-tracking reference.'),check('Local branch and files unchanged',s.branches.main==='C'&&JSON.stringify(s.files)===JSON.stringify(commitAt(s,'C').tree),'Fetch does not integrate into the local branch or working tree.')];
 if(f==='rescue')return [check('HEAD is attached to a new branch',s.head!==null&&!['main','feature'].includes(s.head),'Give the detached work a named branch.'),check('Original detached commit is retained',ancestors(s,h.id).has('B'),'The new reference preserves reachability.')];
 return [];
}
export function terminalGoal(q:Question,value:unknown,output:string):Check[]{
 switch(q.fixture?.goal){
 case 'log-errors':return [check('Both matching lines, with line numbers',/2:ERROR source timeout/.test(output)&&/4:error row=7 invalid country/.test(output)&&!output.includes('INFO'),'Filter errors case-insensitively, then select the last matches.')];
 case 'paid-country':return [check('Correct paid-order counts',output.trim().split('\n').map(x=>x.trim().replace(/\s+/g,' ')).sort().join('|')==='1 SE|2 NO','Expected country counts: NO 2; SE 1.')];
 case 'paid-objects':return [check('Object pipeline retained and projected',Array.isArray(value)&&value.length===3&&JSON.stringify(value)===JSON.stringify([{country:'NO',amount:'120'},{country:'SE',amount:'60'},{country:'NO',amount:'80'}]),'Import-Csv values remain strings; return three objects with country and amount.')];
 case 'active-json':return [check('Only active API objects retained',Array.isArray(value)&&JSON.stringify(value)===JSON.stringify([{id:1,status:'active'},{id:3,status:'active'}]),'Expand the items array and filter objects, not formatted text.')];
 default:return [];
 }
}
/** Checks use a fixed vocabulary: no imported regular expression is executed. */
export function configurationChecks(q:Question,code:string):Check[]{
 const clean=code.split('\n').filter(l=>!/^\s*#/.test(l)).join('\n');
 return (q.fixture?.checks??[]).map((c:any)=>{
 let passed=false,detail='Text-level teaching check only; not parsed or applied by a vendor runtime.';
 if(c.kind==='memory-limit'){const m=/limits:\s*\n(?:[^\n]*\n)*?\s+memory:\s*["']?(\d+(?:\.\d+)?)(Mi|Gi)/.exec(clean);const n=m?Number(m[1])*(m[2]==='Gi'?1024:1):0;passed=n>Number(c.min);detail=`Detected limit ${n||'unknown'} Mi against a fixture working set of ${c.min} Mi. This is not sizing advice.`;}
 else if(c.kind==='docker-order'){const lines=clean.split('\n').map(l=>l.trim());const deps=lines.findIndex(l=>/^COPY\s+requirements\.txt\s/.test(l)),install=lines.findIndex(l=>/^RUN\s+.*pip install/.test(l)),source=lines.findIndex(l=>/^COPY\s+\.\s+\./.test(l));passed=deps>=0&&install>deps&&source>install;}
 else if(String(c.pattern).includes('prevent_destroy'))passed=/\bprevent_destroy\s*=\s*true\b/.test(clean);
 else if(String(c.pattern).startsWith('requests:'))passed=/requests:\s*\n(?:[^\n]*\n)*?\s+memory:\s*["']?\d/.test(clean);
 else if(String(c.pattern).startsWith('selector:'))passed=/selector:\s*\n\s*app:\s*worker\b/.test(clean);
 else if(String(c.pattern).startsWith('targetPort:'))passed=/targetPort:\s*8080\b/.test(clean);
 else if(String(c.pattern).startsWith('USER'))passed=clean.split('\n').some(l=>/^USER\s+(?!root\b|0\b)\S+/.test(l));
 else detail='Unsupported check descriptor. No vendor validation was performed.';
 return check(String(c.label),passed,detail);
 });
}
export function modelChecks(g:Graph,fixtures:Fixtures,grain:string):Check[]{return [check('Order-line grain',grain==='order-line','Sales contains one row per order line, not per order.'),...(['customer','product'] as const).map(key=>check(`${key} dimension filters Sales`,g.edges.some(e=>e.from===key&&e.to==='sales'&&e.active!==false),'Active single-direction dimension-to-fact path.')),...(['DimCustomer','DimProduct'] as const).map(name=>{const key=name==='DimCustomer'?'CustomerKey':'ProductKey',values=fixtures[name].rows.map(r=>r[key]);return check(`${name} key is unique`,new Set(values).size===values.length&&!values.includes(null),'The one-side key must be unique and non-null.');})];}
