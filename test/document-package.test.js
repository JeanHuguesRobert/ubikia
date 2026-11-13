import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {planDocumentPackage,buildDocumentPackage} from '../src/document-package/build.js';

test('document package remains a local, non-sending WIP compiler (#43)', async () => {
 const root=await mkdtemp(path.join(tmpdir(),'ubikia-document-package-'));
 try {
  await mkdir(path.join(root,'sources'));
  await writeFile(path.join(root,'sources','body.txt'),'Draft only\n');
  await writeFile(path.join(root,'sources','exhibit.txt'),'Evidence 123\n');
  const recipe=path.join(root,'recipe.yml');
  await writeFile(recipe,[
   'schema: ubikia.document-package.v0',
   'id: synthetic-test',
   'source_root: sources',
   'email:',
   '  to: nobody@example.invalid',
   '  subject: Synthetic test only',
   '  body: body.txt',
   'files:',
   '  - id: exhibit',
   '    path: exhibit.txt',
   '    channel: attachment',
  ].join('\n')+'\n');
  const plan=await planDocumentPackage({contract:recipe});
  assert.equal(plan.ready,true);
  assert.equal(plan.files[0].state,'READY');
  const output=path.join(root,'package-out');
  const result=await buildDocumentPackage({contract:recipe,output});
  assert.equal(result.status,'PREPARED_NOT_SENT');
  assert.equal(await readFile(path.join(output,'email','body.txt'),'utf8'),'Draft only\n');
  assert.equal(await readFile(path.join(output,'email','attachments','exhibit-exhibit.txt'),'utf8'),'Evidence 123\n');
  await assert.rejects(()=>buildDocumentPackage({contract:recipe,output}),/EEXIST/);
 } finally {await rm(root,{recursive:true,force:true})}
});

test('required absent input remains blocked', async () => {
 const root=await mkdtemp(path.join(tmpdir(),'ubikia-document-package-block-'));
 try {
  await writeFile(path.join(root,'body.txt'),'Draft\n');
  const recipe=path.join(root,'recipe.yml');
  await writeFile(recipe,[
   'schema: ubikia.document-package.v0',
   'id: missing-test',
   'email:',
   '  to: nobody@example.invalid',
   '  subject: Synthetic test only',
   '  body: body.txt',
   'files:',
   '  - id: missing',
   '    path: absent.txt',
   '    channel: transfer',
  ].join('\n')+'\n');
  const plan=await planDocumentPackage({contract:recipe});
  assert.equal(plan.ready,false);
  assert.deepEqual(plan.blockers.map(b=>b.id),['missing']);
  await assert.rejects(()=>buildDocumentPackage({contract:recipe,output:path.join(root,'out')}),/blocked/);
 } finally {await rm(root,{recursive:true,force:true})}
});
