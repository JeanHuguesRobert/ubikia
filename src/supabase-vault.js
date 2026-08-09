/**
 * Supabase Vault Integration for Agent John / Ubikia.
 * Loads secrets & configuration parameters from the sovereign `instance_config` table
 * in Supabase (`https://ndiysuhzmztatpxbkezn.supabase.co`).
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://ndiysuhzmztatpxbkezn.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

/**
 * Fetch all config entries from `instance_config` table in Supabase.
 * Returns a key-value map object.
 */
export async function loadSupabaseVaultConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return {};
  }

  const endpoint = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/instance_config?select=key,value`;

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) {
      return {};
    }

    const rows = await res.json();
    const configMap = {};
    for (const row of rows) {
      if (row.key && row.value !== null && row.value !== undefined) {
        configMap[row.key] = row.value;
      }
    }
    return configMap;
  } catch (err) {
    return {};
  }
}

/**
 * Helper to resolve a secret key:
 * 1. Checks process.env[key] (env override)
 * 2. Checks Supabase `instance_config` vault
 * 3. Fallbacks to default value
 */
export async function getVaultConfigValue(key, fallback = null, vaultMap = null) {
  const envKey = key.toUpperCase();
  if (process.env[envKey]) {
    return process.env[envKey];
  }

  const map = vaultMap || (await loadSupabaseVaultConfig());
  if (map[key] !== undefined) return map[key];
  if (map[envKey.toLowerCase()] !== undefined) return map[envKey.toLowerCase()];

  return fallback;
}
