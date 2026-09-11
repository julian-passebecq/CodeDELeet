import type { GitState } from '../git.js';
import type { TerminalState } from '../terminal.js';
import type { Draft,Fixtures,Graph,Question } from '../types.js';
export interface ViewContext {current:Question;labTab:string;selectedNode:string;selectedCommit:string;selectedFile:string;graphUndo:Graph[];graphRedo:Graph[];selectedEdge:string;runStatuses:Record<string,string>;runGrid:any[];fixtures:Fixtures;draft:()=>Draft;graph:()=>Graph;git:()=>GitState;terminal:()=>TerminalState;}
