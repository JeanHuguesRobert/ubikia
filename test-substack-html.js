import { resolveConfig } from "./src/adapters/index.js";

async function testSubstackHtml() {
  const cfg = await resolveConfig();
  const cookie = decodeURIComponent(cfg.substack_sid);
  const subdomain = cfg.substack_subdomain;

  const htmlContent = `
    <h1>La Naissance d'Agent John</h1>
    <p>Voici l'annonce officielle de la naissance d'Agent John, premier jumeau numérique personnel souverain.</p>
    <h2>Les Points d'Accès de l'Écosystème</h2>
    <ul>
      <li><a href="https://jhn.baronsmariani.com">Page officielle d'Agent John</a></li>
      <li><a href="https://fractavolta.com">Vitrine commerciale FractaVolta</a></li>
      <li><a href="https://cogentia.fractavolta.com">Portail R&D Cogentia</a></li>
    </ul>
    <h2>Pour aller plus loin</h2>
    <p><a href="https://github.com/JeanHuguesRobert/JeanHuguesRobert/blob/main/twin/AGENT_JOHN_FR.md">Documentation source d'Agent John sur GitHub</a></p>
  `;

  const payload = {
    draft_title: "Test Native HTML Substack Links",
    draft_subtitle: "Testing server-side HTML to ProseMirror conversion",
    draft_html: htmlContent,
    draft_bylines: [],
    type: "newsletter",
  };

  const res = await fetch(`https://${subdomain}.substack.com/api/v1/drafts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `substack.sid=${cookie}`,
      Origin: `https://${subdomain}.substack.com`,
      Referer: `https://${subdomain}.substack.com/publish`,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify(payload),
  });

  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Draft ID:", data.id);
  console.log(`Edit URL: https://${subdomain}.substack.com/publish/post/${data.id}`);
}

testSubstackHtml().catch(console.error);
