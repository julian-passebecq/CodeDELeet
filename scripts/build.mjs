import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
await rm(path.join(root,'dist'),{recursive:true,force:true});
await mkdir(path.join(root,'dist'),{recursive:true});
// Never copy the old private notebook archive back into a public build.
const assets=await import('node:fs/promises');
async function rejectArchives(folder){for(const entry of await assets.readdir(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isDirectory()){if(['OFFLINE_REFERENCE_LIBRARY_DO_NOT_PUBLISH','REFERENCE_INDEX','PROTOTYPE'].includes(entry.name))throw Error('Private research directory rejected: '+file);await rejectArchives(file);}else if(/\.(zip|ipynb)$/i.test(entry.name))throw Error('Public notebook/archive rejected: '+file);}}
await rejectArchives(path.join(root,'public'));
await cp(path.join(root,'public'),path.join(root,'dist'),{recursive:true});
await writeFile(path.join(root,'dist','build-info.json'),JSON.stringify({app:'CodeDELeet',version:'2.3.0',contentSchema:[1,2],storageSchema:1,layoutSchema:1,caseSchema:1,mermaid:'11.16.1',baseline:'4212550ca4260390b5a756d81882c3a75a5f912b'},null,2));
console.log('Built static site in dist. No serverless functions or secrets required.');
