import type { Workspace } from '../types.js';
export interface LessonDiagram { label:string; nodes:{id:string;label:string;detail?:string}[]; edges:{from:string;to:string;label?:string}[]; }
type Base = {id:string;title?:string};
export type LessonBlock = Base & (
 | {kind:'intro';text:string}
 | {kind:'concept';text:string;mentalModel?:string}
 | {kind:'bullets';items:string[]}
 | {kind:'steps';steps:{title:string;text:string}[]}
 | {kind:'code';language:string;code:string;caption?:string}
 | {kind:'table';columns:string[];rows:string[][]}
 | {kind:'diagram';diagram:LessonDiagram;caption?:string}
 | {kind:'comparison';left:{title:string;items:string[]};right:{title:string;items:string[]}}
 | {kind:'whenToUse';items:{signal:string;choice:string}[]}
 | {kind:'pitfall';text:string;correction?:string}
 | {kind:'workedExample';steps:string[];result?:string}
 | {kind:'checkpoint';question:string;choices?:string[];answer:string;explanation:string}
 | {kind:'keyTakeaways';items:string[]}
 | {kind:'relatedPractice';exerciseIds:string[]}
);
export interface Lesson { id:string;version:number;workspace:Workspace;categoryId:string;title:string;summary:string;minutes:number;objectives:string[];prerequisites?:string[];blocks:LessonBlock[];sources:{label:string;url:string}[]; }
export interface LessonProgress {status:'not-started'|'in-progress'|'completed';lastSection?:string;notes?:string;updatedAt:string;}
export interface LearningState {progress:Record<string,LessonProgress>;lastLessonByLab:Partial<Record<Workspace,string>>;lastCategoryByLab:Partial<Record<Workspace,string>>;notes?:string;notesUpdatedAt?:string;}
