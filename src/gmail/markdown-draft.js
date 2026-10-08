import { createHash } from "node:crypto";

/** Pure planning boundary for markdown -> Gmail draft. No Gmail dependency. */
const digest = s => createHash("sha256").update(Buffer.from(s,"utf8")).digest("hex");
export function planMarkdownGmailDraft({ markdown, subject, to, drafts, mode = "update" }) {
  if (typeof markdown !== "string" || !markdown.length) throw Error("markdown_required");
  if (typeof subject !== "string" || !subject.trim() || typeof to !== "string" || !to.includes("@")) throw Error("draft_identity_required");
  if (!["create","update","upsert"].includes(mode)) throw Error("invalid_mode");
  if (!Array.isArray(drafts)) throw Error("draft_inventory_required");
  const matches=drafts.filter(d=>d.subject===subject && (Array.isArray(d.to)?d.to:[d.to]).includes(to));
  if (matches.length>1) return {schema:"ubikia.gmail-draft-plan/v1",status:"blocked",reason:"ambiguous_draft",matches:matches.length};
  if (mode==="create" && matches.length) return {schema:"ubikia.gmail-draft-plan/v1",status:"blocked",reason:"draft_already_exists"};
  if (mode==="update" && !matches.length) return {schema:"ubikia.gmail-draft-plan/v1",status:"blocked",reason:"draft_missing"};
  const existing=matches[0];
  if (existing && !existing.draft_id) throw Error("draft_id_missing");
  return {
    schema:"ubikia.gmail-draft-plan/v1",
    status:"ready", action:existing?"update":"create",
    draft_id:existing?.draft_id ?? null,
    to,subject,markdown_sha256:digest(markdown),
    content_type:"text/plain",
    must_not_send:true,
  };
}
