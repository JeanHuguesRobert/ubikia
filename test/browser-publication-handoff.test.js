import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp,readFile,writeFile,rm,symlink} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {spawnSync} from "node:child_process";
import {prepareBrowserPublicationHandoff,replayYouTubeLedgerEntry} from "../src/publication/browser-handoff.js";
const sha=x=>createHash("sha256").update(x).digest("hex");
const source={repository:"JeanHuguesRobert/barons-Mariani",path:"publications/example.md",
 commit:"0123456789abcdef0123456789abcdef01234567"};
const studio="https://studio.youtube.com/channel/TEST/videos/upload";
const json=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+"\n");
async function fixture(t){
 const root=await mkdtemp(path.join(os.tmpdir(),"ubikia-browser-handoff-"));
 t.after(()=>rm(root,{force:true,recursive:true}));
 const speech="Approved narration\n",video="not a real video, integrity fixture\n";
 const mediaHash=sha(video),sourceHash=sha("example source");
 await writeFile(path.join(root,"spoken.reviewed.md"),speech);
 await writeFile(path.join(root,"essay.youtube.mp4"),video);
 await json(path.join(root,"review.json"),{
   schema:"ubikia.spoken-review.v0.1",decision:"approve",reviewer:"Author",
   reviewed_sha256:sha(speech),source_sha256:sourceHash});
 const manifest={source_sha256:sourceHash,
   publication_assets:{youtube_video:{filename:"essay.youtube.mp4",sha256:mediaHash}}};
 const pkg={schema:"ubikia.youtube-publication-package.v0.1",target:"youtube",
   status:"draft",upload_status:"not_uploaded",publication_result:null,human_review_required:true,
   title:"An essay",description:"Reviewed author summary",language:"fr",
   tags:["rights","democracy"],visibility:"public",made_for_kids:false,
   altered_or_synthetic_content:true,
   transcript:{filename:"spoken.reviewed.md",review_status:"reviewed"},
   video:{filename:"essay.youtube.mp4",sha256:mediaHash,mime_type:"video/mp4"},
   provenance:{source_sha256:sourceHash},authenticity:{disclosure_required:true}};
 await json(path.join(root,"manifest.json"),manifest);
 await json(path.join(root,"youtube-package.json"),pkg);
 const ledgerPath=path.join(root,"ledger.json");
 await json(ledgerPath,{schema:"ubikia.publication-ledger.v0.1",entries:[]});
 return {root,manifest,pkg,ledgerPath,mediaHash};
}
test("prepare-only handoff hashes media, preserves author review and separates browser DOM from approval",async t=>{
 const f=await fixture(t);
 const before=await readFile(path.join(f.root,"youtube-package.json"));
 const plan=await prepareBrowserPublicationHandoff({artifactDirectory:f.root,expectedUrl:studio,
  source,ledgerPath:f.ledgerPath});
 assert.equal(plan.status,"prepared_for_dom_binding_and_act_specific_approval");
 assert.equal(plan.publication_performed,false);
 assert.equal(plan.remote_draft_created,false);
 assert.equal(plan.media.sha256,f.mediaHash);
 assert.equal(plan.source.commit,source.commit);
 assert.equal(plan.metadata.visibility_intent,"public");
 assert.equal(plan.metadata.initial_visibility,"private");
 assert.equal(plan.navigation.upload_file_index,null);
 assert.equal(plan.authority.publication,"separate_act_specific_approval_required");
 assert.deepEqual(await readFile(path.join(f.root,"youtube-package.json")),before);
 const cli=spawnSync(process.execPath,["cli/browser-publication-handoff.js",
   "--artifact",f.root,"--expected-url",studio,"--source-repo",source.repository,
   "--source-path",source.path,"--source-commit",source.commit,"--ledger",f.ledgerPath],
   {cwd:path.resolve(import.meta.dirname,".."),encoding:"utf8",timeout:11000});
 assert.equal(cli.status,0,cli.stderr);
 assert.equal(JSON.parse(cli.stdout).media.sha256,f.mediaHash);
});
test("tampered media or reviewed script and unapproved packages fail closed",async t=>{
 const f=await fixture(t);
 const base=()=>({artifactDirectory:f.root,expectedUrl:studio,source,ledgerPath:f.ledgerPath});
 await writeFile(path.join(f.root,"essay.youtube.mp4"),"different bytes");
 await assert.rejects(prepareBrowserPublicationHandoff(base()),/MEDIA_SHA256_MISMATCH/);
 await writeFile(path.join(f.root,"essay.youtube.mp4"),"not a real video, integrity fixture\n");
 await writeFile(path.join(f.root,"spoken.reviewed.md"),"editor changed it");
 await assert.rejects(prepareBrowserPublicationHandoff(base()),/REVIEWED_TRANSCRIPT_HASH_MISMATCH/);
 await writeFile(path.join(f.root,"spoken.reviewed.md"),"Approved narration\n");
 await json(path.join(f.root,"youtube-package.json"),{...f.pkg,upload_status:"published"});
 await assert.rejects(prepareBrowserPublicationHandoff(base()),/PACKAGE_NOT_PREPUBLICATION/);
});
test("published video hash in ledger rejects duplicate handoff",async t=>{
 const f=await fixture(t);
 await json(f.ledgerPath,{schema:"ubikia.publication-ledger.v0.1",
  entries:[{platform:"youtube",status:"published",id:"youtube:abc123",
    evidence:{video_sha256:f.mediaHash}}]});
 await assert.rejects(prepareBrowserPublicationHandoff({artifactDirectory:f.root,
  expectedUrl:studio,source,ledgerPath:f.ledgerPath}),/MEDIA_ALREADY_PUBLISHED:youtube:abc123/);
});
test("rejects foreign origin, missing pinned source and path escaping artifact root",async t=>{
 const f=await fixture(t);
 const args={artifactDirectory:f.root,expectedUrl:studio,source,ledgerPath:f.ledgerPath};
 for(const expectedUrl of ["http://studio.youtube.com/upload","https://example.org/upload",
   "https://evil.example/?next=studio.youtube.com","https://studio.youtube.com/#fragment"]){
  await assert.rejects(prepareBrowserPublicationHandoff({...args,expectedUrl}),/TARGET_NOT_YOUTUBE_STUDIO_HTTPS/);
 }
 await assert.rejects(prepareBrowserPublicationHandoff({...args,source:{...source,commit:"main"}}),
  /PINNED_SOURCE_IDENTITY_REQUIRED/);
 const outside=path.join(os.tmpdir(),"ubikia-no-external-file.mov");
 await symlink(outside,path.join(f.root,"rogue.mp4"));
 const bad={...f.pkg,video:{...f.pkg.video,filename:"../rogue.mp4"}};
 await json(path.join(f.root,"youtube-package.json"),bad);
 await assert.rejects(prepareBrowserPublicationHandoff(args),/PACKAGE_VIDEO_PROVENANCE_MISMATCH|UNSAFE_ARTIFACT_FILENAME/);
});
test("replays real Marche du Soleil ledger evidence without contacting YouTube or modifying it",async()=>{
 const sourcePath=path.resolve(import.meta.dirname,"../publications/ledger/publications.json");
 const before=await readFile(sourcePath,"utf8");
 const ledger=JSON.parse(before);
 const entry=replayYouTubeLedgerEntry(ledger,"youtube:zWxGO7Vh1s4");
 assert.equal(entry.found,true);
 assert.equal(entry.status,"published");
 assert.equal(entry.url,"https://youtu.be/zWxGO7Vh1s4");
 assert.equal(entry.remote_verification,"confirmed");
 assert.equal(entry.source?.commit,"ffb00c3275f344af18084c5b7d0c192fd86e7e70");
 assert.equal(await readFile(sourcePath,"utf8"),before);
});
