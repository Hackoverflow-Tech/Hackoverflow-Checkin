'use server';

/**
 * Participant Server Actions
 *
 * @module actions/participants
 * @description Server actions for participant data operations
 */

import { z } from 'zod';
import { headers } from 'next/headers';
import {
  getParticipantById,
  getParticipantByEmail,
  getAllParticipants,
  getParticipantsPaginated,
  countParticipants,
} from '@/lib/db';
import {
  toClientParticipant,
  ClientParticipant,
  ActionResult,
  createErrorResponse,
} from '@/lib/types';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter';

// ============================================================================
// Rate Limiting Helper
// ============================================================================

async function getRateLimitIdentifier(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  return forwardedFor?.split(',')[0]?.trim() ?? realIp ?? 'anonymous';
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get a participant by their ID
 */
export async function getParticipantByIdAction(
  participantId: string
): Promise<ActionResult<ClientParticipant>> {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.API);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  const parseResult = z.string().min(1, 'Participant ID is required').safeParse(participantId);
  if (!parseResult.success) {
    return createErrorResponse(
      parseResult.error.issues[0]?.message ?? 'Invalid participant ID',
      'VALIDATION_ERROR'
    );
  }

  try {
    const participant = await getParticipantById(parseResult.data);
    if (!participant) {
      return createErrorResponse('Participant not found', 'NOT_FOUND');
    }
    return { success: true, data: toClientParticipant(participant) };
  } catch (error) {
    console.error('Error fetching participant by ID:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch participant',
      'DB_ERROR'
    );
  }
}

/**
 * Get a participant by their email
 */
export async function getParticipantByEmailAction(
  email: string
): Promise<ActionResult<ClientParticipant>> {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.API);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  const parseResult = z.string().email('Invalid email address').safeParse(email);
  if (!parseResult.success) {
    return createErrorResponse(
      parseResult.error.issues[0]?.message ?? 'Invalid email',
      'VALIDATION_ERROR'
    );
  }

  try {
    const participant = await getParticipantByEmail(parseResult.data);
    if (!participant) {
      return createErrorResponse('Participant not found', 'NOT_FOUND');
    }
    return { success: true, data: toClientParticipant(participant) };
  } catch (error) {
    console.error('Error fetching participant by email:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch participant',
      'DB_ERROR'
    );
  }
}

/**
 * Get all participants (limited)
 */
export async function getParticipantsAction(
  limit = 50
): Promise<ActionResult<{ participants: ClientParticipant[]; count: number }>> {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.READ);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  const parseResult = z.number().min(1).max(100).safeParse(limit);
  const validLimit = parseResult.success ? parseResult.data : 50;

  try {
    const dbParticipants = await getAllParticipants(validLimit);
    const participants = dbParticipants.map(toClientParticipant);
    return { success: true, data: { participants, count: participants.length } };
  } catch (error) {
    console.error('Error fetching participants:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch participants',
      'DB_ERROR'
    );
  }
}

const PaginationInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

type PaginationInput = z.infer<typeof PaginationInputSchema>;

/**
 * Get participants with pagination
 */
export async function getParticipantsPaginatedAction(
  input: PaginationInput
): Promise<ActionResult<{
  participants: ClientParticipant[];
  total: number;
  pages: number;
  currentPage: number;
}>> {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.READ);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  const parseResult = PaginationInputSchema.safeParse(input);
  if (!parseResult.success) {
    return createErrorResponse(
      parseResult.error.issues[0]?.message ?? 'Invalid pagination parameters',
      'VALIDATION_ERROR'
    );
  }

  const { page, pageSize } = parseResult.data;

  try {
    const result = await getParticipantsPaginated(page, pageSize);
    return { success: true, data: { ...result, currentPage: page } };
  } catch (error) {
    console.error('Error fetching paginated participants:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch participants',
      'DB_ERROR'
    );
  }
}

/**
 * Get total participant count
 */
export async function getParticipantCountAction(): Promise<ActionResult<number>> {
  const identifier = await getRateLimitIdentifier();
  const rateLimitResult = await checkRateLimit(identifier, RateLimitPresets.READ);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return createErrorResponse(
      `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      'RATE_LIMITED'
    );
  }

  try {
    const count = await countParticipants();
    return { success: true, data: count };
  } catch (error) {
    console.error('Error counting participants:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to count participants',
      'DB_ERROR'
    );
  }
}
