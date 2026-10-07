import path from "node:path";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { loadFilingContract } from "./contract.js";
import { gitValue } from "../reactive-products/corpus.js";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function planFilingPackage({ contract } = {}) {
  if (!contract) throw new Error("--contract is required");
  const loaded = await loadFilingContract(contract);
  const repositoryRoot = gitValue(loaded.sourceRoot, ["rev-parse","--show-toplevel"]);
  const sourceCommit = repositoryRoot ? gitValue(repositoryRoot, ["rev-parse","HEAD"]) : null;
  const status = repositoryRoot ? gitValue(repositoryRoot, ["status","--porcelain","--untracked-files=normal"]) : null;
  const items = [];
  const blockers = [];
  let order = 0;
  for (const section of loaded.data.sections) {
    for (const item of section.items) {
      order += 1;
      const required = item.required !== false && item.status !== "optional";
      if (!item.path) {
        const row = { order, section:section.id, ...item, required, resolved_path:null, exists:false, sha256:null,
          state: required ? "BLOCKED_PATH_UNASSIGNED" : "OPTIONAL_UNASSIGNED" };
        items.push(row); if (required) blockers.push({ item:item.id, reason:"path_unassigned" }); continue;
      }
      const resolved = path.resolve(loaded.sourceRoot, item.path);
      try {
        const bytes = await readFile(resolved);
        items.push({ order, section:section.id, ...item, required, resolved_path:resolved, exists:true,
          size:bytes.length, sha256:sha256(bytes), state:"READY" });
      } catch (e) {
        const row={ order, section:section.id, ...item, required, resolved_path:resolved, exists:false, sha256:null,
          state: required ? "BLOCKED_MISSING" : "OPTIONAL_MISSING" };
        items.push(row); if (required) blockers.push({ item:item.id, reason:"missing", path:resolved });
      }
    }
  }
  if (loaded.data.source_clean_required === true && status) blockers.push({ item:"source_repository", reason:"dirty_worktree" });
  return {
    schema:"ubikia.filing-package-plan.v0", contract:loaded.path, filing_id:loaded.data.id,
    source_root:loaded.sourceRoot, source_repository_root:repositoryRoot, source_commit:sourceCommit,
    source_git_dirty: status === null ? null : status !== "", artifact:loaded.data.artifact,
    release:loaded.data.release, items, blockers, ready:blockers.length===0
  };
}
