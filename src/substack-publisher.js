/**
 * Substack Editorial Publisher for Ubikia.
 * Pure HTTP API client (no headless browser, no heavy dependencies).
 * Uses Substack session cookie (`substack.sid` / `SUBSTACK_SID`).
 *
 * Invariant: DHITL compliant. Default mode creates a DRAFT on Substack,
 * returning the draft ID & edit URL for 1-click human review & publish.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Parse frontmatter and body from a Markdown publication file.
 */
export function parseMarkdownPublication(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) {
    return {
      title: path.basename(filePath, ".md"),
      subtitle: "",
      body: content,
      tags: [],
    };
  }

  const fmText = fmMatch[1];
  const body = fmMatch[2].trim();

  const titleMatch = fmText.match(/^title:\s*["']?(.*?)["']?$/m);
  const subtitleMatch = fmText.match(/^description:\s*["']?(.*?)["']?$/m) || fmText.match(/^subtitle:\s*["']?(.*?)["']?$/m);

  return {
    title: titleMatch ? titleMatch[1].trim() : path.basename(filePath, ".md"),
    subtitle: subtitleMatch ? subtitleMatch[1].trim() : "",
    body,
  };
}

function parseRawUrls(text) {
  if (!text) return [];
  const nodes = [];
  const urlRegex = /(https?:\/\/[^\s\)\>\,\;\"]+)/g;
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }
    const rawUrl = match[0];
    const displayUrl = rawUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    nodes.push({
      type: "text",
      text: displayUrl,
      marks: [
        {
          type: "link",
          attrs: {
            href: rawUrl,
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
      ],
    });
    lastIndex = urlRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }
  return nodes;
}

/**
 * Parse inline Markdown formatting (**bold**, *italic*, `code`, [link](url), raw URLs)
 * into Substack ProseMirror text nodes with marks.
 */
export function parseFormattedInline(text) {
  if (!text) return [];
  const nodes = [];
  const regex = /(\[\s*([^\]]+)\s*\]\(\s*([^\s\)]+)\s*\)|\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plainText = text.slice(lastIndex, match.index);
      nodes.push(...parseRawUrls(plainText));
    }
    const full = match[0];
    if (full.startsWith("[")) {
      const linkText = match[2];
      const linkUrl = match[3];
      nodes.push({
        type: "text",
        text: linkText,
        marks: [
          {
            type: "link",
            attrs: {
              href: linkUrl,
              target: "_blank",
              rel: "noopener noreferrer",
            },
          },
        ],
      });
    } else if (full.startsWith("**")) {
      nodes.push({ type: "text", text: match[4], marks: [{ type: "strong" }] });
    } else if (full.startsWith("*")) {
      nodes.push({ type: "text", text: match[5], marks: [{ type: "em" }] });
    } else if (full.startsWith("`")) {
      nodes.push({ type: "text", text: match[6], marks: [{ type: "code" }] });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    nodes.push(...parseRawUrls(remaining));
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text }];
}

/**
 * Convert Markdown text into Substack ProseMirror JSON AST document structure.
 */
export function markdownToProseMirrorDoc(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const content = [];
  let currentList = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (currentList) {
        content.push(currentList);
        currentList = null;
      }
      continue;
    }

    // Horizontal Rule: --- or ***
    if (line === "---" || line === "***" || line === "___") {
      if (currentList) {
        content.push(currentList);
        currentList = null;
      }
      content.push({ type: "horizontal_rule" });
      continue;
    }

    // Headings: #, ##, ###
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      if (currentList) {
        content.push(currentList);
        currentList = null;
      }
      const level = Math.min(headingMatch[1].length, 3);
      content.push({
        type: "heading",
        attrs: { level },
        content: parseFormattedInline(headingMatch[2]),
      });
      continue;
    }

    // Blockquote: > text
    if (line.startsWith(">")) {
      if (currentList) {
        content.push(currentList);
        currentList = null;
      }
      const quoteText = line.replace(/^>\s*/, "");
      content.push({
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: parseFormattedInline(quoteText),
          },
        ],
      });
      continue;
    }

    // Bullet List Items: * item, - item, + item
    const listMatch = line.match(/^[\*\-\+]\s+(.*)$/);
    if (listMatch) {
      if (!currentList) {
        currentList = { type: "bullet_list", content: [] };
      }
      currentList.content.push({
        type: "list_item",
        content: [
          {
            type: "paragraph",
            content: parseFormattedInline(listMatch[1]),
          },
        ],
      });
      continue;
    }

    // Regular Paragraph
    if (currentList) {
      content.push(currentList);
      currentList = null;
    }

    content.push({
      type: "paragraph",
      content: parseFormattedInline(line),
    });
  }

  if (currentList) {
    content.push(currentList);
  }

  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph", content: [{ type: "text", text: "" }] }],
  };
}

/**
 * Convert plain Markdown body into Substack-compatible HTML.
 */
export function markdownToSubstackHtml(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const htmlParts = [];
  let inList = false;

  for (let line of lines) {
    line = line.trim();

    if (!line) {
      if (inList) {
        htmlParts.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (line === "---" || line === "***" || line === "___") {
      if (inList) {
        htmlParts.push("</ul>");
        inList = false;
      }
      htmlParts.push("<hr/>");
      continue;
    }

    // Inline formatting: links, bold, italic, code
    const formatted = line
      .replace(/\[\s*([^\]]+)\s*\]\(\s*([^\s\)]+)\s*\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>");

    // Headings
    if (formatted.startsWith("### ")) {
      if (inList) { htmlParts.push("</ul>"); inList = false; }
      htmlParts.push(`<h3>${formatted.slice(4)}</h3>`);
      continue;
    }
    if (formatted.startsWith("## ")) {
      if (inList) { htmlParts.push("</ul>"); inList = false; }
      htmlParts.push(`<h2>${formatted.slice(3)}</h2>`);
      continue;
    }
    if (formatted.startsWith("# ")) {
      if (inList) { htmlParts.push("</ul>"); inList = false; }
      htmlParts.push(`<h1>${formatted.slice(2)}</h1>`);
      continue;
    }

    // Blockquote
    if (formatted.startsWith("> ")) {
      if (inList) { htmlParts.push("</ul>"); inList = false; }
      htmlParts.push(`<blockquote><p>${formatted.slice(2)}</p></blockquote>`);
      continue;
    }

    // Bullet List
    const listMatch = formatted.match(/^[\*\-\+]\s+(.*)$/);
    if (listMatch) {
      if (!inList) {
        htmlParts.push("<ul>");
        inList = true;
      }
      htmlParts.push(`<li>${listMatch[1]}</li>`);
      continue;
    }

    // Regular Paragraph
    if (inList) {
      htmlParts.push("</ul>");
      inList = false;
    }
    htmlParts.push(`<p>${formatted}</p>`);
  }

  if (inList) {
    htmlParts.push("</ul>");
  }

  return htmlParts.join("\n");
}

/**
 * Create a Substack draft via direct HTTP API endpoint.
 *
 * @param {object} options
 * @param {string} options.subdomain - e.g. "baronmariani" or "jean-hugues"
 * @param {string} options.sessionCookie - `substack.sid` value
 * @param {string} options.title - Post title
 * @param {string} [options.subtitle] - Post subtitle / description
 * @param {string} options.markdownBody - Post markdown body
 * @returns {Promise<{ ok: boolean, draft_id?: number, edit_url?: string, error?: string }>}
 */
export async function createSubstackDraft(options = {}) {
  const { subdomain = "jeanhugues", sessionCookie, title, subtitle = "", markdownBody } = options;

  const activeSubdomain = subdomain || "jeanhugues";
  if (!sessionCookie) return { ok: false, error: "Missing Substack session cookie (SUBSTACK_SID)" };
  if (!title) return { ok: false, error: "Missing post title" };

  const baseUrl = `https://${activeSubdomain.replace(/\.substack\.com$/, "")}.substack.com`;
  const draftEndpoint = `${baseUrl}/api/v1/drafts`;
  const htmlContent = markdownToSubstackHtml(markdownBody);
  const proseMirrorDoc = markdownToProseMirrorDoc(markdownBody);

  const decodedCookie = decodeURIComponent(sessionCookie.trim());

  const payload = {
    draft_title: title,
    draft_subtitle: subtitle,
    draft_body: JSON.stringify(proseMirrorDoc),
    draft_html: htmlContent,
    draft_bylines: [],
    type: "newsletter",
  };

  try {
    const res = await fetch(draftEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `substack.sid=${decodedCookie}`,
        Origin: baseUrl,
        Referer: `${baseUrl}/publish`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Substack API returned HTTP ${res.status}: ${text.slice(0, 200)}` };
    }

    const data = await res.json();
    const draftId = data.id || data.draft_id;
    const editUrl = `${baseUrl}/publish/post/${draftId}`;

    return {
      ok: true,
      draft_id: draftId,
      edit_url: editUrl,
      title: data.draft_title || title,
      data,
    };
  } catch (err) {
    return { ok: false, error: `Substack HTTP request failed: ${err.message}` };
  }
}
