import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
await rm(path.join(root,'dist'),{recursive:true,force:true});
await mkdir(path.join(root,'dist'),{recursive:true});
await cp(path.join(root,'public'),path.join(root,'dist'),{recursive:true});
await writeFile(path.join(root,'dist','build-info.json'),JSON.stringify({app:'CodeDELeet',version:'2.0.0',contentSchema:[1,2],storageSchema:1,baseline:'d3c7c21ba79a082da21925b5ee0dce69212577fe'},null,2));
console.log('Built static site in dist. No serverless functions or secrets required.');
