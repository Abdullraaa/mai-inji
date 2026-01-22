/**
 * Environment helpers for the Mai Inji Frontend
 *
 * Important: avoid throwing at module import time so the frontend can
 * be deployed without backend environment variables during soft launch.
 */

// Keep a non-throwing validator available for explicit use by backend-dependent code
export function validateEnv() {
    // Skip validation if we are in soft launch mode
    if (process.env.NEXT_PUBLIC_SOFT_LAUNCH_MODE === 'true') return;

    const missing: string[] = [];
    if (!process.env.NEXT_PUBLIC_API_BASE_URL) missing.push('NEXT_PUBLIC_API_BASE_URL');

    if (missing.length > 0) {
        const error = `Missing required environment variables: ${missing.join(', ')}`;
        console.error(`[FATAL] ${error}`);
        // Only throw in production if NOT in soft launch
        if (process.env.NODE_ENV === 'production') {
            throw new Error(error);
        }
    }
}

// Export a safe env object that never throws on import. `apiBaseUrl` defaults to
// the empty string when not configured so frontend-only deployments work.
export const env = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    orderMode: (process.env.NEXT_PUBLIC_ORDER_MODE || 'whatsapp') as 'whatsapp' | 'backend',
    softLaunchMode: process.env.NEXT_PUBLIC_SOFT_LAUNCH_MODE === 'true',
};

/**
 * Require that an API base URL is configured. This will throw only when
 * explicitly called by backend-dependent runtime code.
 */
export function requireApiBaseUrl(): string {
    if (env.softLaunchMode) {
        console.warn('Soft Launch Mode active: skipping API URL requirement.');
        // Return a dummy value or empty string. Callers should handle this if they rely on it.
        return '';
    }

    if (!env.apiBaseUrl) {
        const error = 'Missing required environment variables: NEXT_PUBLIC_API_BASE_URL';
        console.error(`[FATAL] ${error}`);
        throw new Error(error);
    }
    return env.apiBaseUrl;
}
