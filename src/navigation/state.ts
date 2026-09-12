import type {Workspace,Question} from '../types.js';
import type {Lesson} from '../lessons/types.js';
import {WORKSPACES} from '../core.js';
import {categoryFor,association} from './taxonomy.js';
export type AppMode='practice'|'learn';
export interface NavigationState {appMode:AppMode;workspace:Workspace;surface:'lab-home'|'category-home'|'exercise'|'case'|'lesson';categoryId?:string;lessonId?:string;exerciseId?:string;section?:string;caseId?:string;taskId?:string;query?:string;queue?:string;}
export const home=(appMode:AppMode,workspace:Workspace):NavigationState=>({appMode,workspace,surface:'lab-home'});
export function routeFor(n:NavigationState):string {
 const p=new URLSearchParams();
 if(n.surface==='case'){p.set('case',n.caseId!);p.set('task',n.taskId!);}
 else if(n.surface==='exercise')p.set('exercise',n.exerciseId!);
 else {p.set('view',n.appMode);if(n.surface==='lesson'){p.set('lesson',n.lessonId!);if(n.section)p.set('section',n.section);}else{p.set('lab',n.workspace);if(n.categoryId)p.set('category',n.categoryId);if(n.query)p.set('q',n.query);if(n.queue)p.set('queue',n.queue);}}
 return p.toString();
}
export function parseRoute(hash:string,questions:Question[],lessons:Lesson[]):NavigationState {
 const p=new URLSearchParams(hash.replace(/^#/,''));
 const id=p.get('exercise'),q=questions.find(q=>q.id===id);
 if(q)return {appMode:'practice',workspace:q.workspace,surface:'exercise',exerciseId:q.id,categoryId:association(q).categoryId};
 const lesson=lessons.find(l=>l.id===p.get('lesson'));
 if(lesson&&p.get('view')==='learn'){const section=p.get('section')??undefined;return {appMode:'learn',workspace:lesson.workspace,surface:'lesson',categoryId:lesson.categoryId,lessonId:lesson.id,section:lesson.blocks.some(b=>b.id===section)?section:undefined};}
 const appMode=p.get('view')==='learn'?'learn':'practice',raw=p.get('lab')??'code',workspace=(Object.hasOwn(WORKSPACES,raw)?raw:'code') as Workspace;
 const category=categoryFor(workspace,p.get('category')??undefined);
 return {appMode,workspace,surface:category?'category-home':'lab-home',categoryId:category?.id,query:(p.get('q')??'').slice(0,200),queue:['Bookmarked','Review queue','Unfinished'].includes(p.get('queue')??'')?p.get('queue')!:undefined};
}
