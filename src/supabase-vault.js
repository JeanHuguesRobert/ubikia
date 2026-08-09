/**
 * Sovereign Twin Vault Client for Agent John / Ubikia.
 * Interrogates the canonical `instance_config` table on the JHN personal Supabase instance
 * (`https://ndiysuhzmztatpxbkezn.supabase.co`).
 *
 * Schema Invariants (`instance_config`):
 * - `key`: string (e.g. 'substack_sid', 'tumblr_oauth_token')
 * - `value`: string
 * - `category`: 'secrets' | 'integrations' | 'general' | 'features'
 * - `is_secret`: boolean
 * - `is_public`: boolean
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ndiysuhzmztatpxbkezn.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let _vaultCache = null;
let _vaultCacheTimestamp = 0;
const CACHE_TTL_MS = 300_000; // 5 minutes TTL in memory

/**
 * Fetch all entries from the Twin Vault (`instance_config` table) with in-memory caching.
 *
 * @param {object} [options]
 * @param {boolean} [options.forceRefresh] - Bypass in-memory cache
 * @returns {Promise<Record<string, string>>} Key-value map of configuration entries
 */
export async function loadTwinVaultConfig(options = {}) {
  const now = Date.now();
  if (_vaultCache && !options.forceRefresh && (now - _vaultCacheTimestamp < CACHE_TTL_MS)) {
    return _vaultCache;
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return _vaultCache || {};
  }

  let endpoint = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/instance_config?select=key,value,category,is_secret`;
  if (options.category) {
    endpoint += `&category=eq.${encodeURIComponent(options.category)}`;
  }

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) {
      return _vaultCache || {};
    }

    const rows = await res.json();
    const map = {};
    for (const r of rows) {
      if (r.key && r.value !== null && r.value !== undefined) {
        map[r.key] = r.value;
        map[r.key.toUpperCase()] = r.value;
      }
    }
    _vaultCache = map;
    _vaultCacheTimestamp = now;
    return map;
  } catch (err) {
    return _vaultCache || {};
  }
}

/**
 * Write or update a secret / configuration key in the Twin Vault (`instance_config`).
 *
 * @param {string} key - e.g. "substack_sid"
 * @param {string} value - Secret value
 * @param {object} [meta] - Metadata (category, is_secret, description)
 */
export async function setTwinVaultSecret(key, value, meta = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { ok: false, error: "Supabase URL or Key missing in environment" };
  }

  const endpoint = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/instance_config`;
  const payload = {
    key: key.toLowerCase(),
    value: String(value),
    category: meta.category || "secrets",
    is_secret: meta.is_secret !== false,
    is_public: meta.is_public === true,
    description: meta.description || `Configured via Agent John / Ubikia`,
    updated_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Supabase Vault write HTTP ${res.status}: ${text.slice(0, 200)}` };
    }

    return { ok: true, key: payload.key };
  } catch (err) {
    return { ok: false, error: `Supabase Vault write failed: ${err.message}` };
  }
}

/**
 * Resolve a config value with 3-tier precedence:
 * 1. process.env (runtime override)
 * 2. Twin Vault (`instance_config` table)
 * 3. Default fallback
 */
export async function resolveVaultSecret(key, fallback = null, preloadedVaultMap = null) {
  const envKey = key.toUpperCase();
  if (process.env[envKey]) {
    return process.env[envKey];
  }

  const vaultMap = preloadedVaultMap || (await loadTwinVaultConfig());
  if (vaultMap[key] !== undefined) return vaultMap[key];
  if (vaultMap[envKey] !== undefined) return vaultMap[envKey];

  return fallback;
}
