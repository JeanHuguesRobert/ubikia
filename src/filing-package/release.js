import path from "node:path";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { loadFilingContract } from "./contract.js";

const exec=promisify(execFile);
const sha256=(b)=>createHash("sha256").update(b).digest("hex");

async function gh(args) {
  try { return await exec("gh",args,{maxBuffer:16*1024*1024,timeout:120000}); }
  catch(e) {
    if(e.code==="ENOENT") throw new Error("GitHub CLI (gh) not found");
    throw new Error(`gh ${args.join(" ")} failed: ${e.stderr?.trim()||e.message}`);
  }
}

export async function freezeFilingPackage({contract, build, apply=false}={}) {
  if(!contract||!build) throw new Error("--contract and --build are required");
  const c=await loadFilingContract(contract);
  const manifest=JSON.parse(await readFile(path.join(path.resolve(build),"manifest.json"),"utf8"));
  const artifact=path.join(path.resolve(build),c.data.artifact.filename);
  const local=await readFile(artifact); const digest=sha256(local);
  if(manifest.artifact?.sha256!==digest) throw new Error("Local artifact hash differs from build manifest");
  const target=manifest.plan?.source_commit;
  if(!target) throw new Error("Build manifest has no source commit");
  const commands=[
    ["gh","release","create",c.data.release.tag,"--repo",c.data.release.repository,"--target",target,
      "--title",c.data.release.title,"--notes",`Frozen filing package candidate; SHA-256 ${digest}`,"--draft"],
    ["gh","release","upload",c.data.release.tag,artifact,"--repo",c.data.release.repository],
    ["gh","release","download",c.data.release.tag,"--repo",c.data.release.repository,
      "--pattern",c.data.artifact.filename,"--dir","<verification-temp>"]
  ];
  if(!apply) return {mode:"dry-run",commands,digest,target,release:c.data.release,artifact};
  await gh(commands[0].slice(1)); await gh(commands[1].slice(1));
  const verifyDir=await mkdtemp(path.join(tmpdir(),"ubikia-release-verify-"));
  try {
    await gh(["release","download",c.data.release.tag,"--repo",c.data.release.repository,
      "--pattern",c.data.artifact.filename,"--dir",verifyDir]);
    const remote=await readFile(path.join(verifyDir,c.data.artifact.filename));
    const remoteDigest=sha256(remote);
    if(remoteDigest!==digest) throw new Error(`Remote asset SHA-256 mismatch: local=${digest} remote=${remoteDigest}`);
    return {mode:"draft-created-and-verified",digest,remote_digest:remoteDigest,target,
      release_url:`https://github.com/${c.data.release.repository}/releases/tag/${c.data.release.tag}`};
  } finally { await rm(verifyDir,{recursive:true,force:true}); }
}

export async function publishFilingPackage({contract,apply=false}={}) {
  if(!contract) throw new Error("--contract is required");
  const c=await loadFilingContract(contract);
  const command=["gh","release","edit",c.data.release.tag,"--repo",c.data.release.repository,"--draft=false"];
  if(!apply) return {mode:"dry-run",command,warning:"Publishing is the irreversible immutable-release boundary."};
  await gh(command.slice(1));
  return {mode:"published",release_url:`https://github.com/${c.data.release.repository}/releases/tag/${c.data.release.tag}`};
}
