import jwt from 'jsonwebtoken';

// SECURITY: JWT_SECRET is REQUIRED in production. Fail-fast if missing.
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is required in production!');
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-DO-NOT-USE-IN-PRODUCTION';
const JWT_EXPIRY = '7d'; // Magic links valid for 7 days

export interface MagicLinkPayload {
    vault: string;
    iat?: number;
    exp?: number;
}

/**
 * Generate a signed JWT token for magic link check-in
 */
export function generateMagicLinkToken(vaultAddress: string): string {
    const payload: MagicLinkPayload = {
        vault: vaultAddress,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify a magic link token and return the payload
 * Throws if token is invalid or expired
 */
export function verifyMagicLinkToken(token: string): MagicLinkPayload {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as MagicLinkPayload;
        return decoded;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Magic link has expired. Please request a new one.');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid magic link token.');
        }
        throw new Error('Token verification failed.');
    }
}

/**
 * Generate the full magic link URL
 */
export function generateMagicLinkUrl(baseUrl: string, vaultAddress: string): string {
    const token = generateMagicLinkToken(vaultAddress);
    return `${baseUrl}/api/magic-ping?vault=${vaultAddress}&token=${encodeURIComponent(token)}`;
}
