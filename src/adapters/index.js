/**
 * Ubikia Multi-Platform Blog Publishing Adapter Registry.
 *
 * Architecture:
 * - POSSE Strategy (Publish on Own Site / Source Corpus, Syndicate Elsewhere)
 * - Extensible Adapter Pattern for Substack, Ghost, WordPress, Dev.to, Hashnode, Git Static
 * - DHITL Compliant: All adapters default to creating a DRAFT for human review.
 */

import { createSubstackDraft } from "../substack-publisher.js";
import { loadTwinVaultConfig } from "../supabase-vault.js";

/**
 * Resolve configuration object by merging process.env with Supabase instance_config Vault.
 */
export async function resolveConfig(env = process.env) {
  const vaultMap = await loadTwinVaultConfig();
  const merged = { ...vaultMap };
  for (const k of Object.keys(env)) {
    if (env[k] !== undefined) {
      merged[k] = env[k];
      merged[k.toLowerCase()] = env[k];
    }
  }
  return merged;
}

/**
 * Registry of supported blogging platform adapters.
 */
export const ADAPTERS = {
  substack: {
    name: "Substack",
    type: "http_api",
    requiresEnv: ["SUBSTACK_SUBDOMAIN", "SUBSTACK_SID"],
    async createDraft(parsedPublication, env = process.env) {
      const cfg = await resolveConfig(env);
      const subdomain = cfg.SUBSTACK_SUBDOMAIN || cfg.substack_subdomain;
      const sid = cfg.SUBSTACK_SID || cfg.substack_sid;
      return createSubstackDraft({
        subdomain,
        sessionCookie: sid,
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
      const cfg = await resolveConfig(env);
      const baseUrl = (cfg.GHOST_URL || cfg.ghost_url)?.replace(/\/$/, "");
      const apiKey = cfg.GHOST_ADMIN_API_KEY || cfg.ghost_admin_api_key;
      if (!baseUrl || !apiKey) {
        return { ok: false, error: "Missing GHOST_URL or GHOST_ADMIN_API_KEY" };
      }
      try {
        const res = await fetch(`${baseUrl}/ghost/api/admin/posts/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Ghost ${apiKey}`,
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
      const cfg = await resolveConfig(env);
      const baseUrl = (cfg.WORDPRESS_URL || cfg.wordpress_url)?.replace(/\/$/, "");
      const user = cfg.WORDPRESS_USER || cfg.wordpress_user;
      const pass = cfg.WORDPRESS_APP_PASSWORD || cfg.wordpress_app_password;
      if (!baseUrl || !user || !pass) {
        return { ok: false, error: "Missing WORDPRESS_URL, WORDPRESS_USER or WORDPRESS_APP_PASSWORD" };
      }
      const authHeader = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
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
      const cfg = await resolveConfig(env);
      const apiKey = cfg.DEVTO_API_KEY || cfg.devto_api_key;
      if (!apiKey) return { ok: false, error: "Missing DEVTO_API_KEY" };
      try {
        const res = await fetch("https://dev.to/api/articles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
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
      const cfg = await resolveConfig(env);
      const rawBlogId = cfg.TUMBLR_BLOG_IDENTIFIER || cfg.tumblr_blog_identifier || "virteal.tumblr.com";
      const blogId = rawBlogId.replace(/\.tumblr\.com$/, "");
      const token = cfg.TUMBLR_OAUTH_TOKEN || cfg.tumblr_oauth_token;
      if (!token) return { ok: false, error: "Missing TUMBLR_OAUTH_TOKEN" };
      try {
        const res = await fetch(`https://api.tumblr.com/v2/blog/${blogId}.tumblr.com/post`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
