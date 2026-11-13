import path from 'node:path';
import {readFile,realpath,mkdir,writeFile,copyFile,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parse} from 'yaml';
const hash=b=>createHash('sha256').update(b).digest('hex');
const idOK=s=>typeof s==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(s);
const pathOK=s=>typeof s==='string'&&s.length>0&&!path.isAbsolute(s)&&!s.includes('\\')&&s.split('/').every(x=>x&&x!=='.'&&x!=='..');
const inside=(root,p)=>p===root||p.startsWith(root+path.sep);
export async function planDocumentPackage({contract}={}) {
 if(!contract) throw Error('contract required');
 const recipePath=await realpath(contract);
 const recipe=parse(await readFile(recipePath,'utf8'),{uniqueKeys:true});
 if(recipe?.schema!=='ubikia.document-package.v0'||!idOK(recipe.id)) throw Error('invalid schema/id');
 if(!recipe.email||typeof recipe.email.to!=='string'||!recipe.email.to.trim()||typeof recipe.email.subject!=='string'||!recipe.email.subject.trim()) throw Error('email to/subject required');
 if(!Array.isArray(recipe.files)||!recipe.files.length) throw Error('files required');
 const root=await realpath(path.resolve(path.dirname(recipePath),recipe.source_root||'.'));
 const blockers=[],files=[],seen=new Set();
 async function inspect(id,filename,channel,required=true){
  if(!pathOK(filename)) throw Error('unsafe path: '+id);
  const absolute=path.resolve(root,filename);
  if(!inside(root,absolute)) throw Error('outside root: '+id);
  try{
   const resolved=await realpath(absolute);
   if(!inside(root,resolved)) throw Error('symlink outside root: '+id);
   if(!(await lstat(resolved)).isFile()) throw Error('non-file: '+id);
   const bytes=await readFile(resolved);
   return {id,source:filename,resolved,channel,bytes:bytes.length,sha256:hash(bytes),state:'READY'};
  }catch(e){
   if(e.code!=='ENOENT') throw e;
   const row={id,source:filename,channel,state:required?'BLOCKED_MISSING':'OPTIONAL_MISSING'};
   if(required) blockers.push({id,reason:'missing',source:filename});
   return row;
  }
 }
 const body=await inspect('email-body',recipe.email.body,'email-body');
 for(const item of recipe.files){
  if(!idOK(item?.id)||seen.has(item.id)) throw Error('invalid/duplicate file id');
  seen.add(item.id);
  if(!['attachment','transfer'].includes(item.channel)) throw Error('invalid channel');
  files.push(await inspect(item.id,item.path,item.channel,item.required!==false));
 }
 return {schema:'ubikia.document-package-plan.v0',id:recipe.id,contract:recipePath,root,email:{to:recipe.email.to,subject:recipe.email.subject,body},files,blockers,ready:!blockers.length};
}
export async function buildDocumentPackage({contract,output}={}) {
 if(!output) throw Error('output required');
 const plan=await planDocumentPackage({contract});
 if(!plan.ready) throw Error('blocked: '+JSON.stringify(plan.blockers));
 const target=path.resolve(output);
 if(inside(plan.root,target)) throw Error('output inside source root');
 const all=[plan.email.body,...plan.files.filter(x=>x.state==='READY')];
 for(const item of all) if(hash(await readFile(item.resolved))!==item.sha256) throw Error('source changed: '+item.id);
 await mkdir(target); // never overwrite an existing package
 const results=[];
 for(const item of all){
  const rel=item.channel==='email-body'?'email/body.txt':(item.channel==='attachment'?'email/attachments/':'transfer/')+item.id+'-'+path.basename(item.source);
  const dst=path.join(target,rel);
  await mkdir(path.dirname(dst),{recursive:true});
  await copyFile(item.resolved,dst);
  const bytes=await readFile(dst);
  if(hash(bytes)!==item.sha256) throw Error('copy mismatch: '+item.id);
  results.push({id:item.id,channel:item.channel,destination:rel,source:item.source,bytes:bytes.length,sha256:item.sha256});
 }
 const manifest={schema:'ubikia.document-package-manifest.v0',id:plan.id,status:'PREPARED_NOT_SENT',email:{to:plan.email.to,subject:plan.email.subject},files:results};
 await writeFile(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 await writeFile(path.join(target,'INSTRUCTIONS.txt'),`TO: ${manifest.email.to}\nSUBJECT: ${manifest.email.subject}\n\n1. Copy email/body.txt to a draft and attach files under email/attachments.\n2. Upload files under transfer/ manually.\n3. Keep receipts and reconcile against manifest.json.\nNOT SENT, NOT RECEIVED, NOT ACCEPTED.\n`,{flag:'wx'});
 return manifest;
}
