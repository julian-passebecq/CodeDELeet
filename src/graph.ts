import type {Graph,GraphNode} from './types.js';
import {validateGraph,clone,escapeHTML as e} from './core.js';
export function chainTemplate(labels:string[],ids?:string[]):Graph {
  const nodes=labels.map((label,i)=>({id:ids?.[i]??`step${i+1}`,label,role:i===0?'source':i===labels.length-1?'report':'transform',x:35+(Math.floor(i/3)%2?2-i%3:i%3)*235,y:55+Math.floor(i/3)*155,duration:3+i,retries:0}));
  return {nodes,edges:nodes.slice(1).map((n,i)=>({id:`edge${i}`,from:nodes[i].id,to:n.id}))};
}
export function graphTemplate(name='fabric'):Graph{
  if(name==='model')return {nodes:[
    {id:'customer',label:'DimCustomer',role:'dimension',x:28,y:38,fields:['CustomerKey  PK','Name','Country']},
    {id:'sales',label:'Sales',role:'fact',x:282,y:100,fields:['SaleKey  PK','OrderKey','CustomerKey  FK','ProductKey  FK','Quantity','UnitPrice','UnitCost']},
    {id:'product',label:'DimProduct',role:'dimension',x:535,y:38,fields:['ProductKey  PK','Product','Category']},
  ],edges:[{id:'customer-sales',from:'customer',to:'sales',label:'1 : *',active:true},{id:'product-sales',from:'product',to:'sales',label:'1 : *',active:true}]};
  if(['pipeline','dbt','watermark'].includes(name)){
    const ids=name==='watermark'?['read_watermark','copy','validate','persist_watermark']:name==='dbt'?['source','staging','quality','mart']:['extract','transform','quality','publish'];
    const labels=name==='watermark'?['Read watermark','Copy interval','Validate rows','Persist watermark']:name==='dbt'?['Raw orders','stg_orders','Quality gate','fct_revenue']:['Extract orders','Transform rows','Quality check','Publish mart'];
    const g=chainTemplate(labels,ids);g.edges[2].from=ids[1];g.nodes[2].transient=true;g.nodes[2].duration=4;return g;
  }
  const templates:Record<string,[string[],string[]]>={
    fabric:[['Operational source','Fabric pipeline','OneLake lakehouse','Semantic model','Power BI report'],['source','ingest','store','semantic','report']],
    databricks:[['Events','Bronze raw','Silver validated','Gold revenue','BI consumer'],['source','bronze','silver','gold','report']],
    bigquery:[['Application events','Batch ingestion','BigQuery tables','Curated SQL models','Dashboard'],['source','ingest','warehouse','transform','report']],
    infrastructure:[['Source code','Image build','Image registry','Kubernetes workload','Logs & metrics'],['source','build','registry','workload','monitor']],
    spark:[['Fact data','Shuffle / exchange','Join + aggregate','Output table'],['source','shuffle','compute','output']],
    lakehouse:[['Query engine','Catalog / metadata','Parquet data files'],['engine','catalog','files']],
  };
  const [labels,ids]=templates[name]??templates.fabric;const g=chainTemplate(labels,ids);g.nodes.forEach(n=>n.role=n.id);return g;
}
export function topologicalLayers(input:Graph):string[][]{
  const g=validateGraph(input), indegree=new Map(g.nodes.map(n=>[n.id,0]));
  const active=g.edges.filter(x=>x.active!==false);
  for(const edge of active)indegree.set(edge.to,indegree.get(edge.to)!+1);
  const remaining=new Set(g.nodes.map(n=>n.id)),layers:string[][]=[];
  while(remaining.size){const layer=[...remaining].filter(n=>indegree.get(n)===0);if(!layer.length)throw new Error('Cycle detected: remove a dependency before simulation.');layers.push(layer);for(const n of layer){remaining.delete(n);for(const edge of active.filter(e=>e.from===n))indegree.set(edge.to,indegree.get(edge.to)!-1);}}
  return layers;
}
export type TaskRun={id:string;status:'success'|'failed'|'upstream_failed';start:number;end:number;attempts:number;message:string};
export function simulateDAG(g:Graph):TaskRun[]{
  const layers=topologicalLayers(g),runs:TaskRun[]=[];
  for(const layer of layers)for(const id of layer){
    const n=g.nodes.find(n=>n.id===id)!;
    const parents=g.edges.filter(e=>e.active!==false&&e.to===id).map(e=>runs.find(r=>r.id===e.from)!);
    const start=Math.max(0,...parents.map(p=>p.end));
    if(parents.some(p=>p.status!=='success')){runs.push({id,status:'upstream_failed',start,end:start,attempts:0,message:'Blocked by a failed dependency (all-success teaching rule).'});continue;}
    const retry=n.transient&&(n.retries??0)>0,failed=n.transient&&!retry,attempts=retry?2:1;
    runs.push({id,status:failed?'failed':'success',start,end:start+(n.duration??3)*attempts,attempts,message:failed?'Fixture-injected transient failure. No retry allowed.':retry?'First attempt failed; one retry succeeded.':'Completed in the deterministic teaching model.'});
  }
  return runs;
}
export function graphChecks(g:Graph,template:string):{label:string;passed:boolean;detail:string}[]{
  let acyclic=true;try{topologicalLayers(g);}catch{acyclic=false;}
  const checks=[{label:'No dependency cycle',passed:acyclic,detail:acyclic?'The graph can be topologically ordered.':'Remove a cycle before running.'}];
  if(['pipeline','watermark','dbt'].includes(template)){
    const original=graphTemplate(template),ids=original.nodes.map(n=>n.id);
    for(let i=1;i<ids.length;i++)checks.push({label:`${ids[i-1]} to ${ids[i]}`,passed:g.edges.some(e=>e.from===ids[i-1]&&e.to===ids[i]&&e.active!==false),detail:'An explicit active dependency is required.'});
    checks.push({label:'No quality bypass',passed:!g.edges.some(e=>e.from===ids[1]&&e.to===ids[3]&&e.active!==false),detail:'The direct transform/copy-to-publish dependency must be removed for this repair exercise.'});
  }else{
    const original=graphTemplate(template),required=original.nodes.map(n=>n.id);
    for(const id of required)checks.push({label:`Role: ${id}`,passed:g.nodes.some(n=>n.role===id||n.id===id),detail:'A label alone does not prove the component meets its requirements.'});
    const reachable=new Set<string>();const start=g.nodes.find(n=>n.id===required[0]||n.role===required[0]);if(start)reachable.add(start.id);
    for(let i=0;i<g.nodes.length;i++)for(const edge of g.edges)if(edge.active!==false&&reachable.has(edge.from))reachable.add(edge.to);
    const end=g.nodes.find(n=>n.id===required.at(-1)||n.role===required.at(-1));
    checks.push({label:'Connected end-to-end path',passed:!!end&&reachable.has(end.id),detail:'Only reachability is checked, not production correctness.'});
  }
  return checks;
}
export function autoLayout(g:Graph):Graph {
  const copy=clone(g);let layers:string[][];try{layers=topologicalLayers(copy);}catch{layers=[copy.nodes.map(n=>n.id)];}
  let index=0;for(const layer of layers)for(const id of layer){const n=copy.nodes.find(n=>n.id===id)!;n.x=35+(Math.floor(index/3)%2?2-index%3:index%3)*235;n.y=50+Math.floor(index/3)*155;index++;}return copy;
}
export function parseDiagram(text:string,old?:Graph):Graph {
  if(text.length>15000)throw new Error('Diagram script is limited to 15,000 characters.');
  const nodes=new Map<string,GraphNode>(),edges:Graph['edges']=[];
  const node=(token:string):string=>{
    const match=/^([A-Za-z][A-Za-z0-9_-]{0,79})(?:\[([^\]\r\n]{1,110})\])?$/.exec(token.trim());
    if(!match)throw new Error(`Invalid node: ${token}. Use id[Label] or an existing id.`);
    const [,id,label]=match;
    if(!nodes.has(id)){const previous=old?.nodes.find(n=>n.id===id);nodes.set(id,{id,label:label??previous?.label??id,role:previous?.role??id,x:previous?.x??35+(nodes.size%3)*235,y:previous?.y??50+Math.floor(nodes.size/3)*155});}
    else if(label)nodes.get(id)!.label=label;
    return id;
  };
  for(const raw of text.split('\n')){
    const line=raw.trim();if(!line||line.startsWith('#'))continue;
    const tokens=line.split(/\s*->\s*/);if(tokens.length<1||tokens.length>15)throw new Error('Use short paths: a[Label] -> b[Label].');
    const ids=tokens.map(node);
    for(let i=1;i<ids.length;i++){if(edges.some(e=>e.from===ids[i-1]&&e.to===ids[i]))continue;edges.push({id:`edge${edges.length}`,from:ids[i-1],to:ids[i]});}
  }
  if(!nodes.size)throw new Error('Add at least one node.');
  return validateGraph({nodes:[...nodes.values()],edges});
}
export function toDiagram(g:Graph):string {return [...g.nodes.map(n=>`${n.id}[${n.label.replace(/[\]\r\n]/g,' ')}]`),...g.edges.filter(e=>e.active!==false).map(e=>`${e.from} -> ${e.to}`)].join('\n');}
export function toMermaid(g:Graph):string {return 'flowchart LR\n'+g.nodes.map(n=>`  ${n.id}["${n.label.replace(/["<>\r\n]/g,' ')}"]`).join('\n')+'\n'+g.edges.filter(e=>e.active!==false).map(e=>`  ${e.from} --> ${e.to}`).join('\n');}
export function graphSVG(g:Graph,selected='',statuses:Record<string,string>={},exporting=false):string{
  const model=g.nodes.some(n=>n.fields),width=Math.max(785,...g.nodes.map(n=>n.x+220)),height=Math.max(model?370:340,...g.nodes.map(n=>n.y+(n.fields?85+n.fields.length*21:115)));
  const markerId=exporting?'arrow-export':'arrow-live';
  const edges=g.edges.map(edge=>{const a=g.nodes.find(n=>n.id===edge.from),b=g.nodes.find(n=>n.id===edge.to);if(!a||!b)return '';const aw=a.fields?198:195,bw=b.fields?198:195;const forward=b.x>a.x;const x1=a.x+(forward?aw:0),y1=a.y+39,x2=b.x+(forward?0:bw),y2=b.y+39;const mid=(x1+x2)/2;const path=Math.abs(a.x-b.x)<30?`M${a.x+aw/2},${a.y+80} L${b.x+bw/2},${b.y}`:`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`;return `<g class="graph-edge"><path d="${path}" fill="none" stroke="${edge.active===false?'#b7bfc0':'#8b9995'}" stroke-width="1.6" ${edge.active===false?'stroke-dasharray="5 5"':''} marker-end="url(#${markerId})"/>${edge.label?`<text x="${mid}" y="${(y1+y2)/2-8}" text-anchor="middle" fill="#697773" font-size="11">${e(edge.label)}${edge.active===false?' inactive':''}</text>`:''}</g>`;}).join('');
  const nodes=g.nodes.map(n=>{const h=n.fields?70+n.fields.length*21:79;const status=statuses[n.id];const stroke=n.id===selected?'#237768':status==='failed'?'#bc654c':'#d8dedb';return `<g class="graph-node" data-node="${e(n.id)}" tabindex="0" role="button" aria-label="Select ${e(n.label)}" transform="translate(${n.x},${n.y})"><rect x="0" y="0" width="${n.fields?198:195}" height="${h}" rx="10" fill="#fff" stroke="${stroke}" stroke-width="${n.id===selected?2:1.2}"/><rect x="12" y="15" width="25" height="25" rx="6" fill="${n.role==='fact'?'#dceee7':'#f0f3f1'}"/><path d="M19 23h11m-11 5h11m-11 5h7" stroke="#56716a" stroke-width="1.5"/><text x="46" y="30" font-size="12" font-weight="600" fill="#253d35">${e(n.label.length>22?n.label.slice(0,21)+'...':n.label)}</text><text x="15" y="60" font-size="10" fill="#77827d">${e(status??n.role)}</text>${n.fields?n.fields.map((f,i)=>`<text x="15" y="${85+i*21}" font-size="11" fill="#66736e">${e(f)}</text>`).join(''):''}</g>`;}).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="graph-svg" aria-label="Interactive ${model?'data model':'dependency diagram'}" style="font-family:system-ui,sans-serif"><defs><marker id="${markerId}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#8b9995"/></marker><pattern id="dots${exporting?'export':''}" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".6" fill="#dfe5e1"/></pattern></defs><rect width="100%" height="100%" fill="#fafcfb"/><rect width="100%" height="100%" fill="url(#dots${exporting?'export':''})"/>${edges}${nodes}</svg>`;
}
export function performanceModel(partitions:number,skew:number,broadcast:boolean):number[]{
  const p=Math.max(2,Math.min(12,Math.round(partitions))),s=Math.max(0,Math.min(80,skew));
  const base=(100-s)/p;return Array.from({length:p},(_,i)=>Math.round((base+(i===0?s:0))*(broadcast?0.65:1)+4));
}
