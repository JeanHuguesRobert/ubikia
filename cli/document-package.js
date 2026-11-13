#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {planDocumentPackage,buildDocumentPackage} from '../src/document-package/build.js';
try{
 const {positionals,values}=parseArgs({allowPositionals:true,options:{contract:{type:'string'},output:{type:'string'}}});
 const cmd=positionals[0];
 if(cmd==='plan') console.log(JSON.stringify(await planDocumentPackage(values),null,2));
 else if(cmd==='build') console.log(JSON.stringify(await buildDocumentPackage(values),null,2));
 else throw Error('Usage: node cli/document-package.js <plan|build> --contract recipe.yml [--output new-directory]');
}catch(e){console.error('document-package: '+e.message);process.exitCode=1}
