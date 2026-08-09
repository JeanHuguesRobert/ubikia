import { resolveConfig } from "./src/adapters/index.js";

async function testSubstackProseMirror() {
  const cfg = await resolveConfig();
  const cookie = decodeURIComponent(cfg.substack_sid);
  const subdomain = cfg.substack_subdomain;

  const title = "L'Éveil d'Agent John : Naissance d'une IA Souveraine au Cœur de la Corse";
  const subtitle = "Et si le premier jumeau numérique personnel n'était pas né dans la Silicon Valley, mais à Corte ?";

  const htmlContent = `
    <p>Aujourd'hui marque une étape décisive dans nos travaux menés depuis Corte. <strong>Agent John est né.</strong></p>
    <p>Il ne s'agit ni d'un chatbot commercial de plus, ni d'un gadget dans le cloud d'une multinationale. Agent John est la toute première réalisation d'un <em>Jumeau Numérique Personnel Souverain</em>.</p>
    <h2>Les Points d'Accès de l'Écosystème</h2>
    <ul>
      <li><a href="https://jhn.baronsmariani.com">Accéder à la page officielle d'Agent John</a></li>
      <li><a href="https://fractavolta.com">Découvrir la vitrine officielle FractaVolta</a></li>
      <li><a href="https://cogentia.fractavolta.com">Explorer le portail de recherche Cogentia</a></li>
    </ul>
    <h2>Pour aller plus loin</h2>
    <p><a href="https://github.com/JeanHuguesRobert/JeanHuguesRobert/blob/main/twin/AGENT_JOHN_FR.md">Consulter la documentation source d'Agent John sur GitHub</a></p>
  `;

  const proseMirrorDoc = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Aujourd'hui marque une étape décisive dans nos travaux menés depuis Corte. " },
          { type: "text", text: "Agent John est né.", marks: [{ type: "strong" }] }
        ]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Il ne s'agit ni d'un chatbot commercial de plus, ni d'un gadget dans le cloud. Agent John est la première réalisation d'un " },
          { type: "text", text: "Jumeau Numérique Personnel Souverain", marks: [{ type: "em" }] },
          { type: "text", text: "." }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Les Points d'Accès de l'Écosystème" }]
      },
      {
        type: "bullet_list",
        content: [
          {
            type: "list_item",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Accéder à la page officielle d'Agent John",
                    marks: [{ type: "link", attrs: { href: "https://jhn.baronsmariani.com" } }]
                  }
                ]
              }
            ]
          },
          {
            type: "list_item",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Découvrir la vitrine officielle FractaVolta",
                    marks: [{ type: "link", attrs: { href: "https://fractavolta.com" } }]
                  }
                ]
              }
            ]
          },
          {
            type: "list_item",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Explorer le portail de recherche Cogentia",
                    marks: [{ type: "link", attrs: { href: "https://cogentia.fractavolta.com" } }]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Pour aller plus loin" }]
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Consulter la documentation source d'Agent John sur GitHub",
            marks: [{ type: "link", attrs: { href: "https://github.com/JeanHuguesRobert/JeanHuguesRobert/blob/main/twin/AGENT_JOHN_FR.md" } }]
          }
        ]
      }
    ]
  };

  const payload = {
    draft_title: title,
    draft_subtitle: subtitle,
    draft_body: JSON.stringify(proseMirrorDoc),
    draft_html: htmlContent,
    draft_bylines: [],
    type: "newsletter"
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

testSubstackProseMirror().catch(console.error);
