/** Build-time release gate: real catalog, taxonomy and stable related IDs. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeQuestion} from '../public/app/core.js';
import {CATEGORIES,validateTaxonomy} from '../public/app/navigation/taxonomy.js';
import {validateCatalog} from '../public/app/lessons/validate.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,'public',p),'utf8'));
const questions=read('packs/index.json').packs.flatMap(p=>read('packs/'+p).questions).map(normalizeQuestion);
validateTaxonomy(questions);
const index=read('lessons/index.json');
if(index.schemaVersion!==1||JSON.stringify([...index.files].sort())!==JSON.stringify(['architecture.json','code.json','model.json','pipeline.json']))throw Error('Exactly four known lesson files required');
const lessons=validateCatalog(index.files.flatMap(p=>read('lessons/'+p)),questions);
if(lessons.length!==20)throw Error('V2.4 must ship exactly twenty seed lessons');
for(const cat of CATEGORIES)if(lessons.filter(l=>l.workspace===cat.workspace&&l.categoryId===cat.id).length!==1)throw Error('Exactly one seed required: '+cat.id);
console.log(`Learning gate passed: ${questions.length} stable exercises, ${CATEGORIES.length} categories, ${lessons.length} validated lessons.`);
