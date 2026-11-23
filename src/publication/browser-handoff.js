import path from "node:path";
import {createHash} from "node:crypto";
import {createReadStream} from "node:fs";
import {readFile,realpath,stat} from "node:fs/promises";

/** Read-only handoff from Ubikia's existing reviewed YouTube package.
 * A handoff is NOT a permission to upload, change visibility or publish.
 * The browser's tab/DOM mapping and a specific external action grant are
 * intentionally resolved later, at the actual site.
 */
const youtubeHost = new Set(["studio.youtube.com"]);
const sha256 = /^[a-f0-9]{64}$/;
const sha40 = /^[a-f0-9]{40}$/;
async function fileHash(file){
 const hash=createHash("sha256");
 for await(const part of createReadStream(file))hash.update(part);
 return hash.digest("hex");
}
const parse=async file=>JSON.parse(await readFile(file,"utf8"));
function requireMatch(value,pattern,label){
 if(typeof value!=="string"||!pattern.test(value))throw Error("INVALID_"+label);
 return value;
}
function validYouTubeTarget(expectedUrl){
 let url;try{url=new URL(expectedUrl)}catch{throw Error("INVALID_TARGET_URL")}
 if(url.protocol!=="https:"||url.username||url.password||url.hash||
   !youtubeHost.has(url.hostname)||url.port)throw Error("TARGET_NOT_YOUTUBE_STUDIO_HTTPS");
 return url.href;
}
function artifactChild(root,name){
 if(typeof name!=="string"||name.includes("/")||name.includes("\\")||
   name==="."||name===".."||!name.trim())throw Error("UNSAFE_ARTIFACT_FILENAME");
 return path.join(root,name);
}
async function verifiedAsset(root,name){
 const file=artifactChild(root,name);
 const real=await realpath(file);
 if(real!==file && !real.startsWith(root+path.sep))throw Error("SYMLINK_ESCAPES_ARTIFACT");
 const st=await stat(real);
 if(!st.isFile()||st.size<=0||st.size>300*1024*1024)throw Error("MEDIA_FILE_SIZE_INVALID");
 return {file:real,bytes:st.size,sha256:await fileHash(real)};
}
export function replayYouTubeLedgerEntry(ledger,id){
 if(ledger?.schema!=="ubikia.publication-ledger.v0.1"||!Array.isArray(ledger.entries))
  throw Error("INVALID_PUBLICATION_LEDGER");
 const entry=ledger.entries.find(x=>x.id===id);
 if(!entry||entry.platform!=="youtube")return {found:false,id};
 return {found:true,id,status:entry.status,url:entry.url,visibility:entry.visibility,
  source:entry.source??null,
  evidence_type:entry.evidence?.type??null,
  remote_verification:entry.evidence?.remote_verification??"not_performed",
  verification_note:"historical ledger evidence, not a new live provider check"};
}
export async function prepareBrowserPublicationHandoff({
 artifactDirectory,expectedUrl,source,ledgerPath=null,browserInstanceId="fracta2-hosted"
}={}){
 const target=validYouTubeTarget(expectedUrl);
 const {repository,path:sourcePath,commit}=source||{};
 if(typeof repository!=="string"||!/^[-\w]+\/[-\w.]+$/.test(repository)||
   typeof sourcePath!=="string"||!sourcePath||path.isAbsolute(sourcePath)||
   sourcePath.includes("..")||sourcePath.includes("\\")||
   !sha40.test(commit||""))throw Error("PINNED_SOURCE_IDENTITY_REQUIRED");
 if(!/^[\w.-]+$/.test(browserInstanceId))throw Error("INVALID_BROWSER_INSTANCE_ID");
 const root=await realpath(artifactDirectory);
 const [pkg,manifest,review,ledger]=await Promise.all([
  parse(path.join(root,"youtube-package.json")),
  parse(path.join(root,"manifest.json")),
  parse(path.join(root,"review.json")),
  ledgerPath?parse(ledgerPath):Promise.resolve(null)
 ]);
 if(pkg.schema!=="ubikia.youtube-publication-package.v0.1"||
   pkg.target!=="youtube"||
   !["draft","reviewed","publication_ready"].includes(pkg.status)||
   pkg.upload_status!=="not_uploaded"||pkg.publication_result!==null)
   throw Error("PACKAGE_NOT_PREPUBLICATION");
 if(pkg.transcript?.review_status!=="reviewed"||
   pkg.transcript.filename!=="spoken.reviewed.md"||
   review.decision!=="approve"||typeof review.reviewer!=="string"||!review.reviewer.trim())
   throw Error("REVIEW_NOT_VERIFIED");
 const spoken=await verifiedAsset(root,"spoken.reviewed.md");
 if(!sha256.test(review.reviewed_sha256||"")||spoken.sha256!==review.reviewed_sha256)
   throw Error("REVIEWED_TRANSCRIPT_HASH_MISMATCH");
 const video=manifest.publication_assets?.youtube_video;
 if(!video||video.filename!==pkg.video?.filename||
   video.sha256!==pkg.video.sha256||
   !sha256.test(pkg.video.sha256||"")||
   pkg.video.mime_type!=="video/mp4"||
   !pkg.video.filename.toLowerCase().endsWith(".mp4"))
   throw Error("PACKAGE_VIDEO_PROVENANCE_MISMATCH");
 const media=await verifiedAsset(root,pkg.video.filename);
 if(media.sha256!==video.sha256)throw Error("MEDIA_SHA256_MISMATCH");
 if(!sha256.test(manifest.source_sha256||"")||
   pkg.provenance?.source_sha256!==manifest.source_sha256)
   throw Error("SOURCE_HASH_PROVENANCE_MISMATCH");
 if(typeof pkg.title!=="string"||!pkg.title.trim()||
   typeof pkg.description!=="string"||!pkg.description.trim())
   throw Error("REVIEWED_METADATA_REQUIRED");
 if(ledger){
  if(ledger.schema!=="ubikia.publication-ledger.v0.1"||!Array.isArray(ledger.entries))
   throw Error("INVALID_PUBLICATION_LEDGER");
  const duplicate=ledger.entries.find(x=>x.platform==="youtube"&&
    x.status==="published"&&x.evidence?.video_sha256===media.sha256);
  if(duplicate)throw Error("MEDIA_ALREADY_PUBLISHED:"+duplicate.id);
 }
 return {
  schema:"ubikia.browser-publication-handoff.v1",
  status:"prepared_for_dom_binding_and_act_specific_approval",
  publication_performed:false,remote_draft_created:false,
  target:{platform:"youtube",expected_url:target,browser_instance_id:browserInstanceId,
   required_origin:"https://studio.youtube.com"},
  source:{repository,path:sourcePath,commit,sha256:manifest.source_sha256,git_object_verified:false},
  reviewed:{reviewer:review.reviewer,transcript_sha256:spoken.sha256,
   transcript_file:"spoken.reviewed.md"},
  media:{path:media.file,sha256:media.sha256,bytes:media.bytes,mime_type:"video/mp4",path_scope:"planner_host_only"},
  metadata:{title:pkg.title,description:pkg.description,tags:pkg.tags||[],
   language:pkg.language,visibility_intent:pkg.visibility,
   initial_visibility:"private",made_for_kids:pkg.made_for_kids,
   altered_or_synthetic_content:pkg.altered_or_synthetic_content,
   authenticity:pkg.authenticity??manifest.authenticity??null},
  navigation:{
   discover_fields_on_current_tab:true,bind_fields_to_fresh_dom:true,
   operations:["browser.form.fill","browser.form.upload"],
   upload_file_index:null,rich_text_field_indices:null,
   account_identity_required:true,target_url_recheck_required:true,
   same_host_file_access_required:true
  },
  authority:{external_upload:"act_specific_approval_required",
   publication:"separate_act_specific_approval_required",
   implicit_publish:false},
  expected_receipts:["COP effect receipt","browser FileList bytes and read proof",
   "platform provider status / stable video id","explicit visibility and author confirmation",
   "verified-ledger upsert via existing Ubikia record command"],
  ledger:{already_published:false,registration_performed:false}
 };
}
