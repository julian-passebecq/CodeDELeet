/** Presentation-only state. Resolving a narrow viewport NEVER writes preferences. */
import type { Workspace } from '../types.js';
export type ModeSlot = 'work'|'inspect'|'case';
export type OutputAnchor = 'artifact'|'context'|'workspace'|'right';
export type OutputSize = 'closed'|'compact'|'half'|'expanded';
export type ToolId = 'Explanation'|'Visual'|'Deepnote'|'Notes'|'History'|'References'|'Inspector'|'Theme';
export type ThemeId = 'sage-light'|'fluent-light'|'fluent-soft'|'slate-dark';
export interface Preset {id:string;lab:Workspace;slot:ModeSlot;label:string;context:boolean;split:number;output:OutputAnchor;view:string;}
export const PRESETS:Preset[] = [
 {id:'code.solve',lab:'code',slot:'work',label:'Solve',context:true,split:36,output:'artifact',view:'Workspace'},
 {id:'code.inspect',lab:'code',slot:'inspect',label:'Data & Debug',context:true,split:44,output:'artifact',view:'Workspace'},
 {id:'code.case-study',lab:'code',slot:'case',label:'Case Study',context:true,split:36,output:'artifact',view:'Workspace'},
 {id:'model.design',lab:'model',slot:'work',label:'Model Designer',context:false,split:32,output:'workspace',view:'Model'},
 {id:'model.measures',lab:'model',slot:'inspect',label:'Measures & Data',context:false,split:32,output:'artifact',view:'Workspace'},
 {id:'model.case-study',lab:'model',slot:'case',label:'Case Study',context:true,split:35,output:'workspace',view:'Workspace'},
 {id:'pipeline.design',lab:'pipeline',slot:'work',label:'Pipeline Designer',context:false,split:30,output:'workspace',view:'Workspace'},
 {id:'pipeline.investigate',lab:'pipeline',slot:'inspect',label:'Run Investigator',context:false,split:30,output:'workspace',view:'Run grid'},
 {id:'pipeline.case-study',lab:'pipeline',slot:'case',label:'Case Study',context:true,split:35,output:'workspace',view:'Workspace'},
 {id:'architecture.workbench',lab:'architecture',slot:'work',label:'Workbench',context:true,split:32,output:'artifact',view:'Workspace'},
 {id:'architecture.investigate',lab:'architecture',slot:'inspect',label:'Compare & Diagnose',context:false,split:32,output:'workspace',view:'Workspace'},
 {id:'architecture.case-study',lab:'architecture',slot:'case',label:'Case Study',context:true,split:35,output:'workspace',view:'Workspace'},
];
export interface ModePreferences {split:number;context:boolean;swapped:boolean;outputAnchor:OutputAnchor;outputSize:OutputSize;outputHeight:number;outputWidth:number;toolWidth:number;toolPinned:boolean;}
export interface Presentation {version:1;theme:ThemeId;terminal:'inherit'|'light'|'dark';density:'comfortable'|'compact';textSize:number;navWidth:number;navCollapsed:boolean;modes:Record<Workspace,ModeSlot>;layouts:Record<string,ModePreferences>;}
export interface TransientShell {focus:boolean;focusSnapshot?:{tool:ToolId|null;expanded:boolean;outputSize:OutputSize;preferences?:Presentation};tool:ToolId|null;toolExpanded:boolean;mobile:'context'|'artifact'|'output'|'tools';}
export interface EffectiveLayout {preset:Preset;requested:ModePreferences;context:boolean;split:number;outputAnchor:OutputAnchor;outputSize:OutputSize;toolWidth:number;pinned:boolean;navWidth:number;narrow:boolean;focus:boolean;}
const copy=<T>(v:T):T=>JSON.parse(JSON.stringify(v));
const clamp=(x:unknown,lo:number,hi:number,fallback:number):number=>typeof x==='number'&&Number.isFinite(x)?Math.max(lo,Math.min(hi,x)):fallback;
export const presetFor=(lab:Workspace,slot:ModeSlot):Preset=>PRESETS.find(p=>p.lab===lab&&p.slot===slot)!;
export function defaultMode(p:Preset):ModePreferences{return {split:p.split,context:p.context,swapped:false,outputAnchor:p.output,outputSize:'closed',outputHeight:220,outputWidth:370,toolWidth:380,toolPinned:false};}
export function defaultPresentation():Presentation{return {version:1,theme:'sage-light',terminal:'inherit',density:'comfortable',textSize:14,navWidth:228,navCollapsed:false,modes:{code:'work',model:'work',pipeline:'work',architecture:'work'},layouts:Object.fromEntries(PRESETS.map(p=>[p.id,defaultMode(p)]))};}
export function normalizePresentation(input:unknown,legacy?:{split?:number;drawerHeight?:number}):Presentation{
 const d=defaultPresentation(),v=(input&&typeof input==='object'?input:{}) as Partial<Presentation>;
 if(['sage-light','fluent-light','fluent-soft','slate-dark'].includes(v.theme??''))d.theme=v.theme!;
 if(['inherit','light','dark'].includes(v.terminal??''))d.terminal=v.terminal!;
 if(v.density==='compact')d.density='compact';d.textSize=clamp(v.textSize,13,18,14);d.navWidth=clamp(v.navWidth,200,320,228);d.navCollapsed=v.navCollapsed===true;
 for(const lab of ['code','model','pipeline','architecture'] as Workspace[]){const mode=v.modes?.[lab];if(mode&&['work','inspect','case'].includes(mode))d.modes[lab]=mode;}
 for(const p of PRESETS){const a=v.layouts?.[p.id];if(!a)continue;const m=d.layouts[p.id];m.split=clamp(a.split,25,60,m.split);m.context=typeof a.context==='boolean'?a.context:m.context;m.swapped=a.swapped===true;m.outputHeight=clamp(a.outputHeight,120,600,220);m.outputWidth=clamp(a.outputWidth,300,600,370);m.toolWidth=clamp(a.toolWidth,320,560,380);m.toolPinned=a.toolPinned===true;if(['artifact','context','workspace','right'].includes(a.outputAnchor))m.outputAnchor=a.outputAnchor;if(['closed','compact','half','expanded'].includes(a.outputSize))m.outputSize=a.outputSize;}
 if(!input&&legacy){d.layouts['code.solve'].split=clamp(legacy.split,25,60,36);d.layouts['code.solve'].outputHeight=clamp(legacy.drawerHeight,120,600,220);}
 return d;
}
export function resolveLayout(p:Presentation,lab:Workspace,width:number,ui:TransientShell):EffectiveLayout{
 const preset=presetFor(lab,p.modes[lab]),m=p.layouts[preset.id],narrow=width<1080;
 const navWidth=ui.focus?0:width<760?0:p.navCollapsed||width<1200?56:p.navWidth;
 const context=!ui.focus&&m.context;
 const available=width-navWidth-48;
 const minWorkspace=context?820:700;
 const toolWidth=Math.max(260,Math.min(ui.tool==='Theme'?320:ui.toolExpanded?Math.min(740,width-64):m.toolWidth,width-56));
 const pinned=!!ui.tool&&ui.tool!=='Theme'&&!ui.toolExpanded&&!ui.focus&&!narrow&&m.toolPinned&&available-toolWidth>=minWorkspace;
 return {preset,requested:copy(m),context,split:m.split,outputAnchor:narrow?'workspace':m.outputAnchor==='context'&&!context?'workspace':m.outputAnchor,outputSize:ui.focus?(ui.focusSnapshot?.outputSize??'closed'):m.outputSize,toolWidth,pinned,navWidth,narrow,focus:ui.focus};
}
export function newTransient():TransientShell{return {focus:false,tool:null,toolExpanded:false,mobile:'artifact'};}
export function toggleFocus(ui:TransientShell,p?:Presentation):void{
 if(!ui.focus){ui.focusSnapshot={tool:ui.tool,expanded:ui.toolExpanded,outputSize:'closed',preferences:p?copy(p):undefined};ui.focus=true;ui.tool=null;ui.toolExpanded=false;}
 else {if(p&&ui.focusSnapshot?.preferences){const before=ui.focusSnapshot.preferences;p.layouts=copy(before.layouts);p.modes=copy(before.modes);p.navWidth=before.navWidth;p.navCollapsed=before.navCollapsed;}ui.focus=false;ui.tool=ui.focusSnapshot?.tool??null;ui.toolExpanded=ui.focusSnapshot?.expanded??false;ui.focusSnapshot=undefined;}
}
export function activePreferences(p:Presentation,lab:Workspace):ModePreferences{return p.layouts[presetFor(lab,p.modes[lab]).id];}
export function setOutputSize(p:Presentation,lab:Workspace,ui:TransientShell,size:OutputSize):void{if(ui.focus&&ui.focusSnapshot)ui.focusSnapshot.outputSize=size;else activePreferences(p,lab).outputSize=size;}
export function switchMode(p:Presentation,lab:Workspace,slot:ModeSlot):Preset{p.modes[lab]=slot;return presetFor(lab,slot);}
