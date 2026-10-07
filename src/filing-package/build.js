import path from "node:path";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile, copyFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { planFilingPackage } from "./plan.js";
import { parseMarkdown } from "../reactive-products/corpus.js";

const exec = promisify(execFile);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const esc = (s) => s.replace(/\\/g,"/").replace(/([%#&_$])/g,"\\$1");

export async function buildFilingPackage({ contract, output } = {}) {
  const plan = await planFilingPackage({ contract });
  if (!plan.ready) throw new Error(`Filing package is not buildable: ${JSON.stringify(plan.blockers)}`);
  const parent = output ? path.dirname(path.resolve(output)) : tmpdir();
  await mkdir(parent,{recursive:true});
  const dir = output ? path.resolve(output) : await mkdtemp(path.join(parent,"ubikia-filing-"));
  if (output) await mkdir(dir);
  try {
    const pdfDir=path.join(dir,"pdf-inputs"); await mkdir(pdfDir);
    const body=[];
    for (const item of plan.items) {
      if (item.kind==="markdown") {
        const bytes=await readFile(item.resolved_path);
        const parsed=parseMarkdown(bytes.toString("utf8"),item.resolved_path);
        body.push("\\newpage\n", parsed.content.trim(), "\n");
      } else {
        const target=path.join(pdfDir,`${String(item.order).padStart(3,"0")}-${path.basename(item.resolved_path)}`);
        await copyFile(item.resolved_path,target);
        body.push(`\\includepdf[pages=-,pagecommand={}]{${esc(path.relative(dir,target))}}\n`);
      }
    }
    const qmd=`---\ntitle: "${plan.filing_id}"\nformat:\n  pdf:\n    documentclass: scrreprt\nheader-includes: |\n  \\usepackage{pdfpages}\nexecute:\n  enabled: false\n---\n\n${body.join("\n")}\n`;
    await writeFile(path.join(dir,"index.qmd"),qmd,{flag:"wx"});
    await writeFile(path.join(dir,"_quarto.yml"),"project:\n  type: default\n  output-dir: _output\n",{flag:"wx"});
    try {
      await exec("quarto",["render","index.qmd","--to","pdf","--no-execute"],{cwd:dir,maxBuffer:16*1024*1024,timeout:600000});
    } catch (e) {
      if (e.code==="ENOENT") throw new Error("Quarto executable not found; install Quarto + TeX before build");
      throw new Error(`Quarto filing render failed: ${e.stderr?.trim()||e.message}`);
    }
    const rendered=path.join(dir,"_output","index.pdf");
    const bytes=await readFile(rendered);
    if (bytes.subarray(0,5).toString()!=="%PDF-") throw new Error("Rendered output is not a PDF");
    const artifactPath=path.join(dir,plan.artifact.filename);
    await rename(rendered,artifactPath);
    const manifest={schema:"ubikia.filing-package-build.v0",built_at:new Date().toISOString(),plan,
      artifact:{path:artifactPath,size:bytes.length,sha256:sha256(bytes)},publication_status:"local-draft"};
    await writeFile(path.join(dir,"manifest.json"),JSON.stringify(manifest,null,2)+"\n",{flag:"wx"});
    return {directory:dir,artifact:artifactPath,manifest};
  } catch(e) {
    if (!output) await rm(dir,{recursive:true,force:true});
    throw e;
  }
}
