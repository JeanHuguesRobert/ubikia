/**
 * Shared retry/backoff for TTS provider adapters.
 * Provider-specific code still classifies which errors are retryable.
 */

export async function withRetries(operation, {
  maxAttempts = 4,
  retryDelayMs = 1500,
  isRetryable = defaultIsRetryable,
  label = "TTS",
  signal,
} = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation({ attempt, signal });
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === maxAttempts) throw error;
      const delay = retryDelayMs * (2 ** (attempt - 1));
      console.warn(
        `${label} attempt ${attempt}/${maxAttempts} failed: ${safeErrorMessage(error)}. Retry in ${delay} ms.`,
      );
      await sleep(delay, signal);
    }
  }
  throw lastError;
}

export function defaultIsRetryable(error) {
  if (error?.name === "AbortError") return false;
  if (Number.isInteger(error?.status)) {
    // 402 quota/payment and other 4xx (except 408/429) are not retryable.
    return error.status === 408 || error.status === 429 || error.status >= 500;
  }
  return error instanceof TypeError || error?.cause?.code === "UND_ERR_SOCKET";
}

/**
 * Errors that justify switching to a configured fallback provider for the
 * remainder of a partial render (quota, auth presence, hard capacity).
 * This is not quality-based ranking.
 */
export function isProviderCapacityError(error) {
  if (!error) return false;
  if (error.name === "AbortError") return false;
  const status = error.status;
  if (status === 402 || status === 403 || status === 429) return true;
  const message = String(error.message ?? "").toLowerCase();
  return (
    message.includes("insufficient credits")
    || message.includes("quota")
    || message.includes("rate limit")
    || message.includes("capacity")
  );
}

export function safeErrorMessage(error) {
  // Never include headers or secret-bearing payloads.
  if (!error) return "unknown error";
  if (Number.isInteger(error.status)) {
    return `${error.name ?? "Error"} (${error.status})`;
  }
  return String(error.message ?? error).slice(0, 300);
}

function sleep(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason ?? new Error("Aborted"));
    }, { once: true });
  });
}
