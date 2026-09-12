import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CATEGORIES,categoriesFor,categoryFor,association,validateTaxonomy,EXERCISE_CATEGORIES} from '../public/app/navigation/taxonomy.js';
import {home,parseRoute,routeFor} from '../public/app/navigation/state.js';
import {discoveryHTML,groupedExercises,nearbyExercises,matches} from '../public/app/navigation/surfaces.js';
import {validateLesson,validateCatalog} from '../public/app/lessons/validate.js';
import {renderBlock,lessonHTML} from '../public/app/lessons/renderer.js';
import {emptyLearning,normalizeLearning,mergeLearning,updateLesson} from '../public/app/lessons/progress.js';
import {emptyStore,normalizeQuestion,migrateStore,validateStore,mergeStores} from '../public/app/core.js';
import {ensureSession,patchTask,validateCase} from '../public/app/case-study/controller.js';
import {defaultPresentation,newTransient,resolveNavigator,toggleNavigator,toggleFocus,switchMode} from '../public/app/shell/layout-controller.js';
import {railHTML} from '../public/app/shell/tool-rail.js';

const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const labs=['code','model','pipeline','architecture'];
const packs=['starter','v2-specialists'].map(n=>read(`../public/packs/${n}.json`));
const questions=packs.flatMap(p=>p.questions).map(normalizeQuestion);
const lessons=labs.flatMap(n=>read(`../public/lessons/${n}.json`));
const cases=read('../public/cases/index.json').cases.map(c=>validateCase(c,questions));
const clone=x=>structuredClone(x);
const oldTime='2025-01-01T12:00:00Z',newTime='2026-09-12T12:00:00Z';
const context=(lab='code',mode='practice')=>({nav:home(mode,lab),questions,cases,lessons,store:emptyStore(),search:'',difficulty:'All levels',technology:'All topics',queue:'All exercises',concept:'',priority:'All priorities'});

test('V24 taxonomy has exactly five unique categories per lab and covers all 51 stable IDs once',()=>{
 validateTaxonomy(questions);assert.equal(CATEGORIES.length,20);assert.equal(questions.length,51);
 assert.deepEqual(Object.keys(EXERCISE_CATEGORIES).sort(),questions.map(q=>q.id).sort());
 for(const lab of labs){assert.equal(categoriesFor(lab).length,5);for(const q of questions.filter(q=>q.workspace===lab)){assert.ok(categoryFor(lab,association(q).categoryId));assert.equal(association(q).imported,false);}}
});

test('V24 imported exercises remain in the fifth category / Imported Other without creating a sixth card',()=>{
 for(const lab of labs){const q={...questions[0],workspace:lab,id:'custom-safe'};assert.deepEqual(association(q),{categoryId:categoriesFor(lab)[4].id,subcategory:'Imported / Other',imported:true});
  const explicit={...q,categoryId:categoriesFor(lab)[0].id,subcategoryId:'Custom examples'};assert.equal(association(explicit).subcategory,'Custom examples');assert.equal(association({...q,categoryId:'wrong'}).categoryId,categoriesFor(lab)[4].id);}
});

test('V24 exactly 20 substantial seed lessons validate, one per category, with all 14 block kinds',()=>{
 const valid=validateCatalog(lessons,questions);assert.equal(valid.length,20);
 for(const cat of CATEGORIES)assert.equal(valid.filter(l=>l.workspace===cat.workspace&&l.categoryId===cat.id).length,1,cat.id);
 const all=new Set();for(const l of valid){assert.ok(l.blocks.length>=12);assert.ok(l.sources.length>0);const kinds=new Set(l.blocks.map(b=>b.kind));for(const kind of ['intro','concept','diagram','steps','code','table','workedExample','whenToUse','pitfall','checkpoint','keyTakeaways'])assert.ok(kinds.has(kind),`${l.id}/${kind}`);l.blocks.forEach(b=>all.add(b.kind));}
 assert.equal(all.size,14);
 assert.equal(valid.filter(l=>l.blocks.some(b=>b.kind==='relatedPractice')).length,19);
});

const negatives={
 'unknown block kind':l=>{l.blocks[0].kind='rawHTML';},
 'unsafe URL':l=>{l.sources[0].url='javascript:alert(1)';},
 'HTTP URL':l=>{l.sources[0].url='http://example.com';},
 'credential URL':l=>{l.sources[0].url='https://user:pass@example.com';},
 'wrong category pair':l=>{l.workspace='model';},
 'unsafe workspace':l=>{l.workspace='constructor';},
 'oversized block':l=>{l.blocks[0].text='x'.repeat(16001);},
 'oversized catalog item':l=>{l.extra='x'.repeat(120001);},
 'broken Practice link':l=>{l.blocks.find(b=>b.kind==='relatedPractice').exerciseIds=['nonexistent-practice'];},
 'raw script':l=>{l.blocks[0].text='<script>alert(1)</script>';},
 'raw image handler':l=>{l.title='<img src=x onerror=alert(1)>';},
 'duplicate block ID':l=>{l.blocks[1].id=l.blocks[0].id;},
 'unsafe lesson ID':l=>{l.id='__proto__';},
 'unsafe nested key':l=>{l.extra=JSON.parse('{"__proto__":{"polluted":true}}');},
 'invalid minutes':l=>{l.minutes=0;},
 'invalid version':l=>{l.version=1.5;},
 'missing objectives':l=>{l.objectives=[];},
 'oversized diagram':l=>{const d=l.blocks.find(b=>b.kind==='diagram').diagram;d.nodes=Array.from({length:13},(_,i)=>({id:'n'+i,label:'Node'}));},
 'broken diagram edge':l=>{l.blocks.find(b=>b.kind==='diagram').diagram.edges[0].to='missing';},
 'duplicate diagram node':l=>{const d=l.blocks.find(b=>b.kind==='diagram').diagram;d.nodes[1].id=d.nodes[0].id;},
 'mismatched table':l=>{l.blocks.find(b=>b.kind==='table').rows[0]=['one'];},
};
for(const [name,mutate] of Object.entries(negatives))test('V24 lesson validator rejects '+name,()=>{const bad=clone(lessons[0]);mutate(bad);assert.throws(()=>validateLesson(bad,questions));});
test('V24 catalog rejects duplicate lesson IDs',()=>assert.throws(()=>validateCatalog([...lessons,lessons[0]],questions)));

test('V24 renderer escapes text, code, captions, sources and uses labeled original SVG without HTML interpolation',()=>{
 const html=renderBlock({kind:'code',id:'example',language:'SQL',code:'x < 3 && name === "<script>"',caption:'<&>'},'safe-lesson',questions);
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('tabindex="0"'));
 const diagram=renderBlock(lessons[0].blocks.find(b=>b.kind==='diagram'),lessons[0].id,questions);assert.ok(diagram.includes('aria-labelledby='));assert.ok(diagram.includes('<figcaption>'));assert.ok(!diagram.includes('foreignObject'));
 for(const l of lessons){const rendered=lessonHTML(l,undefined,questions,lessons.filter(x=>x.workspace===l.workspace));assert.ok(rendered.includes('data-lesson-id="'+l.id+'"'));assert.ok(rendered.includes('rel="noopener noreferrer"'));assert.ok(rendered.includes('Self-check only'));}
});

test('V24 routes preserve old exercise IDs and infer lesson lab/category rather than trusting URL fields',()=>{
 for(const q of questions){const n=parseRoute('#exercise='+q.id,questions,lessons);assert.equal(n.surface,'exercise');assert.equal(n.workspace,q.workspace);assert.equal(routeFor(n),'exercise='+q.id);}
 const n=parseRoute('#view=learn&lab=architecture&category=bogus&lesson='+lessons[0].id+'&section=flow',questions,lessons);assert.equal(n.workspace,'code');assert.equal(n.categoryId,lessons[0].categoryId);assert.equal(n.section,'flow');
 assert.equal(parseRoute('#view=learn&lesson='+lessons[0].id+'&section=missing',questions,lessons).section,undefined);
 assert.equal(parseRoute('#view=learn&lesson=missing&lab=constructor',questions,lessons).workspace,'code');
 for(const cat of CATEGORIES)for(const appMode of ['learn','practice']){const n={appMode,workspace:cat.workspace,surface:'category-home',categoryId:cat.id};const back=parseRoute(routeFor(n),questions,lessons);for(const key of Object.keys(n))assert.equal(back[key],n[key]);}
 assert.equal(routeFor({surface:'case',caseId:'order-case',taskId:'task-1'}),'case=order-case&task=task-1');
});

test('V24 home/category surfaces contain real cards and grouped discovery, not pretend attempts',()=>{
 for(const lab of labs)for(const mode of ['practice','learn']){const c=context(lab,mode),html=discoveryHTML(c);assert.equal((html.match(/data-category-card=/g)||[]).length,5);assert.ok(!html.includes('data-action="run"'));assert.ok(!html.includes('Not run'));assert.ok(html.includes('data-lab-home="'+lab+'"'));
  for(const cat of categoriesFor(lab)){c.nav={...home(mode,lab),surface:'category-home',categoryId:cat.id};const category=discoveryHTML(c);assert.ok(category.includes('data-category-progress'));assert.ok(category.includes('data-nav-home'));assert.ok(category.includes(cat.title));}}
});

test('V24 search, queues and imported fallback remain grouped and Learn progress cannot change exercise counts',()=>{
 const c=context();c.store.settings.learning=emptyLearning();updateLesson(c.store.settings.learning,lessons[0],{status:'completed'},newTime);
 assert.ok(discoveryHTML(c).includes('0 / 1 exercises complete')||discoveryHTML(c).includes('0 / '));
 c.queue='Bookmarked';assert.equal(questions.filter(q=>q.workspace==='code'&&matches(q,c)).length,0);assert.ok(groupedExercises([],c).includes('data-clear-filters'));
 c.store.drafts['sql-paid-revenue']={bookmark:true,status:'review',confidence:'Review'};assert.equal(matches(questions.find(q=>q.id==='sql-paid-revenue'),c),true);
 c.queue='Review queue';assert.equal(matches(questions.find(q=>q.id==='sql-paid-revenue'),c),true);
 c.queue='Unfinished';c.store.drafts['sql-paid-revenue'].status='completed';assert.equal(matches(questions.find(q=>q.id==='sql-paid-revenue'),c),false);
 c.queue='All exercises';c.search='grain';const found=questions.filter(q=>q.workspace==='code'&&matches(q,c));assert.ok(found.length);assert.ok(groupedExercises(found,c).includes('data-result-category'));
 const custom={...questions[0],id:'custom-safe'};c.search='';assert.ok(groupedExercises([custom],c).includes('Imported / Other'));
 c.nav={appMode:'practice',workspace:'code',surface:'exercise',exerciseId:'sql-paid-revenue',categoryId:association(questions[0]).categoryId};assert.ok(nearbyExercises(c).length<questions.filter(q=>q.workspace==='code').length);
});

test('V24 old backup migration leaves Practice drafts, cases and settings intact; no mandatory learning rewrite',()=>{
 const s=emptyStore();s.drafts['sql-paid-revenue']={code:'SELECT 42',notes:'Keep Practice',updatedAt:oldTime};ensureSession(s,cases[0]);patchTask(s,cases[0],{code:'SELECT 43',notes:'Keep case'});
 const before=clone(s),m=migrateStore(s);assert.deepEqual(s,before);assert.deepEqual(m.drafts,before.drafts);assert.deepEqual(m.caseSessions,before.caseSessions);assert.equal(m.settings.learning,undefined);
 s.settings.practiceNavigation={};assert.deepEqual(validateStore(s).settings.practiceNavigation.lastExerciseByLab,{});
});

test('V24 learning status, section and notes round trip independently of Practice and case attempts',()=>{
 const s=emptyStore();s.drafts['sql-paid-revenue']={code:'SELECT 42',notes:'Practice notes',updatedAt:oldTime};ensureSession(s,cases[0]);patchTask(s,cases[0],{code:'SELECT 43'});
 const practice=clone(s.drafts),casesBefore=clone(s.caseSessions);s.settings.learning=emptyLearning();updateLesson(s.settings.learning,lessons[0],{lastSection:'flow',notes:'Lesson notes'},oldTime);updateLesson(s.settings.learning,lessons[0],{status:'completed'},newTime);
 const restored=migrateStore(JSON.parse(JSON.stringify(s)));assert.equal(restored.settings.learning.progress[lessons[0].id].status,'completed');assert.equal(restored.settings.learning.progress[lessons[0].id].lastSection,'flow');assert.equal(restored.settings.learning.progress[lessons[0].id].notes,'Lesson notes');assert.deepEqual(restored.drafts,practice);assert.deepEqual(restored.caseSessions,casesBefore);
 updateLesson(restored.settings.learning,lessons[0],{lastSection:'code'},newTime);assert.equal(restored.settings.learning.progress[lessons[0].id].status,'completed');
});

test('V24 merge keeps newer/equal local lessons, imports newer incoming lessons and preserves absent-old-backup learning',()=>{
 const a=emptyStore(),b=emptyStore();a.settings.learning=emptyLearning();b.settings.learning=emptyLearning();
 a.drafts['sql-paid-revenue']={notes:'Practice independent',updatedAt:newTime};updateLesson(a.settings.learning,lessons[0],{status:'completed',notes:'local'},newTime);updateLesson(b.settings.learning,lessons[0],{status:'in-progress',notes:'stale'},oldTime);
 let merged=mergeStores(a,b,packs);assert.equal(merged.settings.learning.progress[lessons[0].id].notes,'local');
 b.settings.learning.progress[lessons[0].id].updatedAt=newTime;assert.equal(mergeStores(a,b,packs).settings.learning.progress[lessons[0].id].notes,'local');
 updateLesson(b.settings.learning,lessons[1],{status:'completed'},newTime);merged=mergeStores(a,b,packs);assert.equal(merged.settings.learning.progress[lessons[1].id].status,'completed');assert.deepEqual(merged.drafts,a.drafts);
 assert.deepEqual(mergeStores(merged,emptyStore(),packs).settings.learning,merged.settings.learning);
 const newer=clone(b);newer.settings.learning.progress[lessons[0].id].updatedAt='2027-01-01T00:00:00Z';assert.equal(mergeStores(a,newer,packs).settings.learning.progress[lessons[0].id].notes,'stale');
});

test('V24 learning notebook merge and safe unknown future IDs are bounded and non-destructive',()=>{
 const a=emptyLearning(),b=emptyLearning();a.notes='new';a.notesUpdatedAt=newTime;b.notes='old';b.notesUpdatedAt=oldTime;
 b.progress['future-lesson']={status:'completed',updatedAt:oldTime,lastSection:'future-section'};
 const m=mergeLearning(a,b);assert.equal(m.notes,'new');assert.equal(m.progress['future-lesson'].status,'completed');assert.deepEqual(a.progress,{});
});

for(const [name,value] of Object.entries({
 'invalid map':{progress:[]},'invalid status':{progress:{safe:{status:'wrong',updatedAt:newTime}}},'invalid time':{progress:{safe:{status:'completed',updatedAt:'nope'}}},'oversized notes':{progress:{safe:{status:'completed',updatedAt:newTime,notes:'x'.repeat(20001)}}},'unsafe section':{progress:{safe:{status:'completed',updatedAt:newTime,lastSection:'__proto__'}}},'unsafe ID':{progress:JSON.parse('{"__proto__":{"status":"completed","updatedAt":"2026-01-01T00:00:00Z"}}')},'unsafe memory':{progress:{},lastLessonByLab:{constructor:'safe'}},'oversized map':{progress:Object.fromEntries(Array.from({length:2001},(_,i)=>['lesson-'+i,{status:'completed',updatedAt:newTime}]))}
}))test('V24 backup rejects '+name,()=>{assert.throws(()=>normalizeLearning(value));const s=emptyStore();s.settings.learning=value;assert.throws(()=>validateStore(s));});

for(const width of [1600,1366,1190,1024,768,390])test(`V24 navigator state machine ${width}px is reversible, respects Focus and never changes saved widths on medium/mobile`,()=>{
 const p=defaultPresentation(),ui=newTransient(),initial=clone(p),expected=width>=1200?'expanded':width>=760?'compact':'hidden';assert.equal(resolveNavigator(p,width,ui).state,expected);
 for(const slot of ['work','inspect','case']){switchMode(p,'code',slot);toggleNavigator(p,ui,width);const n=resolveNavigator(p,width,ui);assert.equal(n.state,width>=1200?'compact':width>=760?'overlay':'drawer');assert.equal(n.width,width<760?0:56);toggleNavigator(p,ui,width);assert.equal(resolveNavigator(p,width,ui).state,expected);}
 assert.equal(p.navWidth,initial.navWidth);assert.equal(p.navCollapsed,false);
 toggleNavigator(p,ui,width);const before=resolveNavigator(p,width,ui);toggleFocus(ui,p);assert.equal(resolveNavigator(p,width,ui).state,'hidden');toggleFocus(ui,p);assert.deepEqual(resolveNavigator(p,width,ui),before);
});

test('V24 semantic right rail has ordered groups and Learn has only personal/preferences',()=>{
 const p=defaultPresentation(),ui=newTransient();const practice=railHTML(p,'code',ui,true,true);
 const ids=[...practice.matchAll(/data-rail-group="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(ids,['layout','run','reference','personal','preferences']);
 const learn=railHTML(p,'code',ui,false,false,true);assert.deepEqual([...learn.matchAll(/data-rail-group="([^"]+)"/g)].map(m=>m[1]),['personal','preferences']);
 for(const banned of ['data-mode=','data-tool="Output"','data-tool="Visual"','data-tool="Explanation"','data-tool="Inspector"','data-tool="History"'])assert.ok(!learn.includes(banned));
 for(const needed of ['data-tool="Notes"','data-tool="Theme"','data-action="settings"'])assert.ok(learn.includes(needed));
});
