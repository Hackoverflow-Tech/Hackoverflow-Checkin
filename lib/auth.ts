import type { NextRequest } from 'next/server';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { JWTPayloadSchema, type JWTPayload } from './validation';

export const JWT_CONFIG = {
    EXPIRES_IN: '8h' as const,
    COOKIE_NAME: 'hackoverflow_session' as const,
    COOKIE_MAX_AGE: 60 * 60 * 8,
    ALGORITHM: 'HS256' as const,
} as const;

export type TokenVerificationResult =
    | { valid: true; payload: JWTPayload }
    | { valid: false; error: string };

function getJWTSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production');
        return 'development-only-secret-do-not-use-in-production-min-32-chars';
    }
    return secret;
}

export function verifyToken(token: string): TokenVerificationResult {
    try {
        const secret = getJWTSecret();
        const decoded = jwt.verify(token, secret, { algorithms: [JWT_CONFIG.ALGORITHM] });
        const result = JWTPayloadSchema.safeParse(decoded);
        if (!result.success) return { valid: false, error: 'Token payload is malformed' };
        return { valid: true, payload: result.data };
    } catch (error) {
        if (error instanceof TokenExpiredError) return { valid: false, error: 'Token has expired' };
        if (error instanceof JsonWebTokenError) return { valid: false, error: 'Token is invalid' };
        return { valid: false, error: 'Failed to verify token' };
    }
}

export function verifyRequestToken(request: NextRequest): TokenVerificationResult {
    const token = request.cookies.get(JWT_CONFIG.COOKIE_NAME)?.value;
    if (!token) return { valid: false, error: 'Authentication token is required' };
    return verifyToken(token);
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, getJWTSecret(), {
        expiresIn: JWT_CONFIG.EXPIRES_IN,
        algorithm: JWT_CONFIG.ALGORITHM,
    });
}

export function getSecureCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: JWT_CONFIG.COOKIE_MAX_AGE,
        path: '/',
    };
}

export function getClearCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 0,
        path: '/',
    };
}

export const SECURITY_HEADERS: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};
