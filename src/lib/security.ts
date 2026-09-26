// ============================================================
// JURIVA — Security Middleware & Rate Limiting
// ============================================================
// Server-side request validation, rate limiting, and security
// headers for all API endpoints.

/**
 * In-memory rate limiter using sliding window counters.
 * Limits requests per IP address to prevent abuse.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute per IP

/**
 * Check if a request should be rate limited.
 * Returns null if allowed, or a { retryAfter } object if blocked.
 */
export function checkRateLimit(
  identifier: string,
): { allowed: boolean; retryAfter?: number; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [key, val] of rateLimitStore) {
      if (val.resetAt <= now) rateLimitStore.delete(key);
    }
  }

  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count };
}

/**
 * Extract client identifier from request headers.
 * Uses X-Forwarded-For, X-Real-IP, or falls back to a default.
 */
export function getClientIdentifier(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;

  return 'anonymous';
}

/**
 * Sanitize user input string to prevent injection attacks.
 * Removes control characters and trims whitespace.
 */
export function sanitizeInput(input: string, maxLength: number = 2000): string {
  if (typeof input !== 'string') return '';
  // Remove control characters except newlines and tabs
  // eslint-disable-next-line no-control-regex
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.trim().slice(0, maxLength);
}

/**
 * Validate that the request Content-Type is JSON.
 */
export function validateContentType(headers: Headers): boolean {
  const contentType = headers.get('content-type');
  return !!contentType && contentType.includes('application/json');
}

/**
 * Generate standard security headers for API responses.
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };
}
