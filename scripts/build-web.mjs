import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const output=join(root,'www');
// www is generated output, never a source directory.
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
const files=(await readdir(root)).filter(name=>
 name==='index.html'||name==='style.css'||(/\.(?:js|mjs)$/.test(name)&&!name.endsWith('.test.js'))
);
for(const file of files)await cp(join(root,file),join(output,file));
await cp(join(root,'vendor'),join(output,'vendor'),{recursive:true});
try{if((await stat(join(root,'assets'))).isDirectory())await cp(join(root,'assets'),join(output,'assets'),{recursive:true});}
catch(error){if(error.code!=='ENOENT')throw error;}
console.log(`Web app prepared in www (${files.length} source files plus bundled libraries).`);
