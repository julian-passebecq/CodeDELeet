export type Workspace = 'code' | 'model' | 'pipeline' | 'architecture';
export type Engine = 'sql' | 'python' | 'dax-subset' | 'graph' | 'review';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Row = Record<string, string | number | boolean | null>;
export interface GraphNode {
  id: string; label: string; role: string; x: number; y: number;
  fields?: string[]; duration?: number; retries?: number; transient?: boolean;
}
export interface GraphEdge { id: string; from: string; to: string; label?: string; active?: boolean; }
export interface Graph { nodes: GraphNode[]; edges: GraphEdge[]; }
export interface Question {
  id: string; version: number; title: string; workspace: Workspace; topic: string;
  difficulty: Difficulty; minutes: number; engine: Engine; language: string;
  summary: string; concept: string[]; task: string; requirements: string[];
  starter: string; solution: string; explanation: string; hints: string[];
  sources: {label: string; url: string}[];
  dataset?: string; ordered?: boolean; template?: string;
  rubric?: string[]; expectedGrain?: string;
  pythonTests?: {args: unknown[]; expected: unknown; label: string}[];
  entrypoint?: string;
}
export interface Pack { schemaVersion: 1; id: string; title: string; version: number; questions: Question[]; }
export interface Attempt { at: string; kind: string; passed: boolean | null; summary: string; }
export interface Draft {
  code?: string; notes?: string; graph?: Graph; bookmark?: boolean;
  confidence?: 'New'|'Learning'|'Review'|'Confident'; attempts?: Attempt[];
  updatedAt?: string; rubric?: string[]; country?: string; category?: string;
  grain?: string; diagram?: string; selectedTable?: string;
  performance?: {partitions:number;skew:number;broadcast:boolean};
}
export interface Store { schemaVersion: 1; drafts: Record<string,Draft>; customPacks: Pack[]; settings: {focus:boolean; lastQuestion?:string; pyodideConsent?:boolean}; }
export interface QueryResult { engine: string; columns: string[]; rows: unknown[][]; elapsedMs: number; truncated?: boolean; error?: string; notice?: string; checks?: {label:string;passed:boolean;detail:string}[]; }
export interface Fixtures { [name: string]: { columns: {name:string; type:string}[]; rows: Row[] }; }
