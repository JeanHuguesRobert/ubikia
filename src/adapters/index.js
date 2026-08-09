/**
 * Ubikia Multi-Platform Blog Publishing Adapter Registry.
 *
 * Architecture:
 * - POSSE Strategy (Publish on Own Site / Source Corpus, Syndicate Elsewhere)
 * - Extensible Adapter Pattern for Substack, Ghost, WordPress, Dev.to, Hashnode, Git Static
 * - DHITL Compliant: All adapters default to creating a DRAFT for human review.
 */

import { createSubstackDraft } from "../substack-publisher.js";

/**
 * Registry of supported blogging platform adapters.
 */
export const ADAPTERS = {
  substack: {
    name: "Substack",
    type: "http_api",
    requiresEnv: ["SUBSTACK_SUBDOMAIN", "SUBSTACK_SID"],
    async createDraft(parsedPublication, env = process.env) {
      return createSubstackDraft({
        subdomain: env.SUBSTACK_SUBDOMAIN,
        sessionCookie: env.SUBSTACK_SID,
        title: parsedPublication.title,
        subtitle: parsedPublication.subtitle,
        markdownBody: parsedPublication.body,
      });
    },
  },

  ghost: {
    name: "Ghost CMS",
    type: "admin_api",
    requiresEnv: ["GHOST_URL", "GHOST_ADMIN_API_KEY"],
    async createDraft(parsedPublication, env = process.env) {
      // Ghost Admin REST API endpoint: POST /ghost/api/admin/posts/
      const baseUrl = env.GHOST_URL?.replace(/\/$/, "");
      if (!baseUrl || !env.GHOST_ADMIN_API_KEY) {
        return { ok: false, error: "Missing GHOST_URL or GHOST_ADMIN_API_KEY" };
      }
      try {
        const res = await fetch(`${baseUrl}/ghost/api/admin/posts/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Ghost ${env.GHOST_ADMIN_API_KEY}`,
          },
          body: JSON.stringify({
            posts: [
              {
                title: parsedPublication.title,
                custom_excerpt: parsedPublication.subtitle,
                markdown: parsedPublication.body,
                status: "draft",
              },
            ],
          }),
        });
        if (!res.ok) return { ok: false, error: `Ghost API HTTP ${res.status}` };
        const data = await res.json();
        const post = data.posts?.[0];
        return {
          ok: true,
          draft_id: post?.id,
          edit_url: `${baseUrl}/ghost/#/editor/post/${post?.id}`,
          data,
        };
      } catch (err) {
        return { ok: false, error: `Ghost draft creation failed: ${err.message}` };
      }
    },
  },

  wordpress: {
    name: "WordPress REST API",
    type: "rest_api",
    requiresEnv: ["WORDPRESS_URL", "WORDPRESS_USER", "WORDPRESS_APP_PASSWORD"],
    async createDraft(parsedPublication, env = process.env) {
      const baseUrl = env.WORDPRESS_URL?.replace(/\/$/, "");
      if (!baseUrl || !env.WORDPRESS_USER || !env.WORDPRESS_APP_PASSWORD) {
        return { ok: false, error: "Missing WORDPRESS_URL, WORDPRESS_USER or WORDPRESS_APP_PASSWORD" };
      }
      const authHeader = "Basic " + Buffer.from(`${env.WORDPRESS_USER}:${env.WORDPRESS_APP_PASSWORD}`).toString("base64");
      try {
        const res = await fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            title: parsedPublication.title,
            excerpt: parsedPublication.subtitle,
            content: parsedPublication.body,
            status: "draft",
          }),
        });
        if (!res.ok) return { ok: false, error: `WordPress API HTTP ${res.status}` };
        const data = await res.json();
        return {
          ok: true,
          draft_id: data.id,
          edit_url: data.link || `${baseUrl}/wp-admin/post.php?post=${data.id}&action=edit`,
          data,
        };
      } catch (err) {
        return { ok: false, error: `WordPress draft creation failed: ${err.message}` };
      }
    },
  },

  devto: {
    name: "Dev.to (Forem)",
    type: "rest_api",
    requiresEnv: ["DEVTO_API_KEY"],
    async createDraft(parsedPublication, env = process.env) {
      if (!env.DEVTO_API_KEY) return { ok: false, error: "Missing DEVTO_API_KEY" };
      try {
        const res = await fetch("https://dev.to/api/articles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": env.DEVTO_API_KEY,
          },
          body: JSON.stringify({
            article: {
              title: parsedPublication.title,
              description: parsedPublication.subtitle,
              body_markdown: parsedPublication.body,
              published: false, // Draft!
            },
          }),
        });
        if (!res.ok) return { ok: false, error: `Dev.to API HTTP ${res.status}` };
        const data = await res.json();
        return {
          ok: true,
          draft_id: data.id,
          edit_url: data.url || "https://dev.to/dashboard",
          data,
        };
      } catch (err) {
        return { ok: false, error: `Dev.to draft creation failed: ${err.message}` };
      }
    },
  },

  tumblr: {
    name: "Tumblr Micro-blogging",
    type: "rest_api",
    requiresEnv: ["TUMBLR_BLOG_IDENTIFIER", "TUMBLR_OAUTH_TOKEN"],
    async createDraft(parsedPublication, env = process.env) {
      const blogId = (env.TUMBLR_BLOG_IDENTIFIER || "virteal.tumblr.com").replace(/\.tumblr\.com$/, "");
      if (!env.TUMBLR_OAUTH_TOKEN) return { ok: false, error: "Missing TUMBLR_OAUTH_TOKEN" };
      try {
        const res = await fetch(`https://api.tumblr.com/v2/blog/${blogId}.tumblr.com/post`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.TUMBLR_OAUTH_TOKEN}`,
          },
          body: JSON.stringify({
            type: "text",
            title: parsedPublication.title,
            body: parsedPublication.body,
            state: "draft", // DHITL compliant draft!
          }),
        });
        if (!res.ok) return { ok: false, error: `Tumblr API HTTP ${res.status}` };
        const data = await res.json();
        const postId = data.response?.id;
        return {
          ok: true,
          draft_id: postId,
          edit_url: `https://www.tumblr.com/blog/view/${blogId}/drafts`,
          data,
        };
      } catch (err) {
        return { ok: false, error: `Tumblr draft creation failed: ${err.message}` };
      }
    },
  },
};

/**
 * Get list of available adapter names.
 */
export function getAvailableAdapters() {
  return Object.keys(ADAPTERS);
}
