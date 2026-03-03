'use server';

/**
 * Auth Server Actions
 *
 * @module actions/auth
 * @description Login / logout / session helpers using JWT (hackoverflow_session cookie)
 */

import { cookies } from 'next/headers';
import { z } from 'zod';
import { getParticipantById } from '@/lib/db';
import {
    generateToken,
    verifyToken,
    JWT_CONFIG,
    getSecureCookieOptions,
    getClearCookieOptions,
} from '@/lib/auth';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter';
import type { ActionResult } from '@/lib/types';

// ============================================================================
// Schemas
// ============================================================================

const LoginSchema = z.object({
    participantId: z.string().min(1, 'Participant ID is required'),
    password: z.string().min(1, 'Password is required'),
});

// ============================================================================
// Actions
// ============================================================================

/**
 * Login a participant and issue a JWT cookie.
 */
export async function loginParticipantAction(
    participantId: string,
    password: string
): Promise<ActionResult<{ participantId: string }>> {
    // Rate limit by participantId
    const rateLimitResult = await checkRateLimit(`login:${participantId}`, RateLimitPresets.LOGIN);
    if (!rateLimitResult.allowed) {
        return {
            success: false,
            error: 'Too many login attempts. Please try again later.',
            code: 'RATE_LIMITED',
        };
    }

    // Validate inputs
    const parsed = LoginSchema.safeParse({ participantId, password });
    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues[0]?.message ?? 'Invalid input.',
            code: 'VALIDATION_ERROR',
        };
    }

    // Fetch participant from DB
    let participant;
    try {
        participant = await getParticipantById(parsed.data.participantId);
    } catch {
        return {
            success: false,
            error: 'Database error. Please try again.',
            code: 'DB_ERROR',
        };
    }

    if (!participant) {
        return {
            success: false,
            error: 'Invalid ID or password.',
            code: 'NOT_FOUND',
        };
    }

    if (!participant.loginPassword) {
        return {
            success: false,
            error: 'Account login not configured. Please contact the organizers.',
            code: 'DB_ERROR',
        };
    }

    // Plain-text comparison (DB stores password as-is from registration)
    const isValid = parsed.data.password === participant.loginPassword;
    if (!isValid) {
        return {
            success: false,
            error: 'Invalid ID or password.',
            code: 'VALIDATION_ERROR',
        };
    }

    // Generate JWT and set cookie
    const token = generateToken({
        userId: participant.participantId,
        email: participant.email,
        name: participant.name,
        role: 'participant',
    });

    (await cookies()).set(JWT_CONFIG.COOKIE_NAME, token, getSecureCookieOptions());

    return {
        success: true,
        data: { participantId: participant.participantId },
    };
}

/**
 * Logout by clearing the auth cookie.
 */
export async function logoutAction(): Promise<void> {
    (await cookies()).set(JWT_CONFIG.COOKIE_NAME, '', getClearCookieOptions());
}

/**
 * Return the active session data from the JWT cookie, or null if not logged in.
 */
export async function getSessionAction() {
    const token = (await cookies()).get(JWT_CONFIG.COOKIE_NAME)?.value;
    if (!token) return null;

    const result = verifyToken(token);
    if (!result.valid) return null;

    return {
        participantId: result.payload.userId,
        name: result.payload.name ?? '',
        email: result.payload.email,
        role: result.payload.role,
        isLoggedIn: true,
    };
}
