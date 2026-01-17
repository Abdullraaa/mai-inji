/**
 * Environment variable validation for the Mai Inji Frontend
 */

const requiredEnvVars = [
    'NEXT_PUBLIC_API_BASE_URL',
] as const;

export function validateEnv() {
    const missing = requiredEnvVars.filter(
        (key) => !process.env[key]
    );

    if (missing.length > 0) {
        const error = `Missing required environment variables: ${missing.join(', ')}`;
        console.error(`[FATAL] ${error}`);

        if (process.env.NODE_ENV === 'production') {
            throw new Error(error);
        }
    }
}

// Configuration object with validated environment variables
export const env = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    orderMode: (process.env.NEXT_PUBLIC_ORDER_MODE || 'whatsapp') as 'whatsapp' | 'backend',
};

// Run validation immediately if this module is imported
validateEnv();
