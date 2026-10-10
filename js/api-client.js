/**
 * ApiClient: all server communication goes through this class.
 * Provides timeout, JSON parsing, and normalized error handling.
 */
export class ApiClient {
  constructor({ baseUrl = '', timeoutMs = 12000 } = {}) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  async request(path, { method = 'GET', body, headers = {}, signal } = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    if (signal) {
      signal.addEventListener('abort', () => controller.abort(signal.reason));
    }

    try {
      const response = await fetch(this.baseUrl + path, {
        method,
        headers: body ? { 'Content-Type': 'application/json', ...headers } : headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        // Non-JSON response (proxies, gateways). Fall through to status check.
      }

      if (!response.ok) {
        throw new ApiError(data, response.status);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.name === 'AbortError') {
        throw new ApiError(null, 0, 'The request timed out. Check your connection and try again.');
      }
      throw new ApiError(null, 0, 'Network error. Check your connection and try again.');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  get(path, options = {}) {
    return this.request(path, { ...options, method: 'GET' });
  }

  post(path, body, options = {}) {
    return this.request(path, { ...options, method: 'POST', body });
  }
}

/** Normalized error shape shared by every caller. */
export class ApiError extends Error {
  constructor(payload, status, fallbackMessage) {
    const message =
      payload?.error?.message ??
      fallbackMessage ??
      'Something went wrong. Please try again.';
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload?.error?.code ?? 'UNKNOWN';
    this.fields = payload?.error?.fields ?? null;
  }
}
