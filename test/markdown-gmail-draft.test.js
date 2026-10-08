import test from "node:test";
import assert from "node:assert/strict";
import {planMarkdownGmailDraft} from "../src/gmail/markdown-draft.js";
const base={markdown:"# Salut\nTexte **inchangé**.",subject:"Dossier A",to:"recipient@example.org",drafts:[{draft_id:"existing",subject:"Dossier A",to:["recipient@example.org"]}]};
test("standalone markdown input updates uniquely matched draft",()=>{
  const r=planMarkdownGmailDraft(base);
  assert.equal(r.action,"update");assert.equal(r.draft_id,"existing");assert.equal(r.must_not_send,true);assert.match(r.markdown_sha256,/^[a-f0-9]{64}$/);
  assert.equal("packet_ref" in r,false);assert.equal("computation_id" in r,false);
});
test("never creates a duplicate in update or create mode",()=>{
  assert.equal(planMarkdownGmailDraft({...base,mode:"create"}).status,"blocked");
  assert.equal(planMarkdownGmailDraft({...base,drafts:[]}).reason,"draft_missing");
});
test("upsert creates only when no match, and refuses ambiguous drafts",()=>{
  assert.equal(planMarkdownGmailDraft({...base,mode:"upsert",drafts:[]}).action,"create");
  assert.equal(planMarkdownGmailDraft({...base,drafts:[...base.drafts,...base.drafts]}).reason,"ambiguous_draft");
});
test("invalid modes and non-string bodies refuse",()=>{
  assert.throws(()=>planMarkdownGmailDraft({...base,mode:"send"}));
  assert.throws(()=>planMarkdownGmailDraft({...base,markdown:undefined}));
});
