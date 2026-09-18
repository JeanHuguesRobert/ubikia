#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function fail(message) {
  process.stderr.write(`render-suicide-corse-open-questions: ${message}\n`);
  process.exit(1);
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function inline(value) {
  let out = escapeHtml(value);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/institutmariani@gmail\.com/g, '<a href="mailto:institutmariani@gmail.com">institutmariani@gmail.com</a>');
  return out;
}

export function stripFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) return markdown;
  const end = markdown.indexOf("\n---\n", 4);
  if (end < 0) throw new Error("unterminated frontmatter");
  return markdown.slice(end + 5);
}

export function renderMarkdown(markdown) {
  const lines = stripFrontmatter(markdown).replaceAll("\r\n", "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push("<ul>\n" + list.map((item) => `  <li>${inline(item)}</li>`).join("\n") + "\n</ul>");
    list = [];
  };

  for (const line of lines) {
    if (line.startsWith("# ")) {
      flushParagraph(); flushList();
      blocks.push(`<h1>${inline(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      flushParagraph(); flushList();
      blocks.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2));
    } else if (!line.trim()) {
      flushParagraph(); flushList();
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph(); flushList();
  return blocks.join("\n\n");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith("--") || value == null) fail("expected --source, --source-repo and --output");
    args[key.slice(2)] = value;
  }
  return args;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.source || !args["source-repo"] || !args.output) fail("expected --source, --source-repo and --output");

  const source = resolve(args.source);
  const sourceRepo = resolve(args["source-repo"]);
  const output = resolve(args.output);
  const commit = execFileSync("git", ["-C", sourceRepo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const markdown = readFileSync(source, "utf8");
  const body = renderMarkdown(markdown);
  const sourcePath = "projects/suicide-corse/manuscript/questions-ouvertes.md";
  const canonical = `https://github.com/JeanHuguesRobert/barons-Mariani/blob/${commit}/${sourcePath}`;

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="source-git-commit" content="${commit}">
<title>Questions ouvertes — Suicide Corse</title>
<meta name="description" content="Questions ouvertes de l'enquête Suicide Corse auxquelles témoins et détenteurs d'archives peuvent contribuer.">
<style>
:root { color-scheme: light dark; }
body { font-family: Georgia, "Times New Roman", serif; max-width: 46rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; line-height: 1.65; color: #1a1a1a; background: #fdfdfb; }
h1 { font-size: 1.9rem; } h2 { margin-top: 2.2rem; font-size: 1.25rem; }
a { color: inherit; } li { margin: .35rem 0; }
.action { border: 1px solid #bbb; border-radius: 6px; padding: 1rem 1.2rem; margin: 2rem 0; }
footer { margin-top: 3rem; font-size: .85rem; color: #777; }
@media (prefers-color-scheme: dark) { body { color:#eee; background:#14141a; } .action { border-color:#444; } }
</style>
</head>
<body data-source-commit="${commit}">
${body}
<div class="action"><strong>Vous pouvez contribuer :</strong> <a href="temoigner.html">voir l'appel à témoignages et les modalités de contribution</a>.</div>
<footer>
<p>Projection dérivée du Corpus — source : <a href="${canonical}">${sourcePath}</a> — commit <code>${commit}</code>.</p>
<p><a href="./">Retour à Suicide Corse</a> — <a href="temoigner.html">Appel à témoignages</a>.</p>
</footer>
</body>
</html>
`;
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, html, "utf8");
  process.stdout.write(`${commit}\n`);
}
