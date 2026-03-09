'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { DBParticipant } from '@/types';
import { ObjectId } from 'mongodb';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DB = 'hackoverflow';

async function getDb() {
  const client = await clientPromise;
  return client.db(DB);
}

/** Strips ObjectId / Date into plain JSON-safe values — same pattern as your getTeam() */
function clean(doc: any): any {
  return JSON.parse(
    JSON.stringify(doc, (_, v) => {
      if (v?.constructor?.name === 'ObjectId') return v.toString();
      if (v instanceof Date) return v.toISOString();
      return v;
    })
  );
}

async function getParticipantId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('participant_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token) as any;
  if (!payload) return null;
  return payload.participantId ?? payload.id ?? payload.sub ?? null;
}

async function logAction(
  participantId: string,
  participantName: string,
  actionType: string,
  extra?: Record<string, unknown>
) {
  try {
    const db = await getDb();
    await db.collection('checkin_logs').insertOne({
      logId: new ObjectId().toString(),
      participantId,
      participantName,
      actionType,
      timestamp: new Date(),
      ...extra,
    });
  } catch (err) {
    console.error('Log error (non-fatal):', err);
  }
}

// ─── Result type ──────────────────────────────────────────────────────────────

interface ActionResult {
  success: boolean;
  data?: DBParticipant;
  error?: string;
}

// ─── getSelf ──────────────────────────────────────────────────────────────────

/**
 * Returns the logged-in participant's data from the cookie session.
 * Called once on dashboard mount to bootstrap all state.
 */
export async function getSelf(): Promise<DBParticipant | null> {
  try {
    const participantId = await getParticipantId();
    if (!participantId) return null;

    const db = await getDb();
    const doc = await db.collection('participants').findOne({ participantId });
    if (!doc) return null;

    const { loginPassword: _, ...rest } = doc as any;
    return clean(rest) as DBParticipant;
  } catch (err) {
    console.error('getSelf error:', err);
    return null;
  }
}

// ─── College Check-In ─────────────────────────────────────────────────────────

/**
 * One-time college check-in. Idempotent — safe to call even if already done.
 */
export async function collegeCheckInAction(): Promise<ActionResult> {
  try {
    const participantId = await getParticipantId();
    if (!participantId) return { success: false, error: 'Not authenticated. Please log in.' };

    const db = await getDb();
    const doc = await db.collection('participants').findOne({ participantId });
    if (!doc) return { success: false, error: 'Participant not found.' };

    if (doc.collegeCheckIn?.status) {
      const { loginPassword: _, ...rest } = doc as any;
      return { success: true, data: clean(rest) as DBParticipant };
    }

    const now = new Date();
    await db.collection('participants').updateOne(
      { participantId },
      { $set: { 'collegeCheckIn.status': true, 'collegeCheckIn.time': now, updatedAt: now } }
    );

    await logAction(participantId, doc.name as string, 'college_checkin');

    const updated = await db.collection('participants').findOne({ participantId });
    const { loginPassword: _, ...rest } = updated as any;
    return { success: true, data: clean(rest) as DBParticipant };
  } catch (err) {
    console.error('collegeCheckIn error:', err);
    return { success: false, error: 'Failed to check in. Please try again.' };
  }
}

// ─── Lab Check-In with OTP (cyclic) ──────────────────────────────────────────

/**
 * Verifies the rotating OTP and checks the participant into the lab.
 * Used on every lab entry from the dashboard — including first time.
 */
export async function labCheckInAction(otp: string): Promise<ActionResult> {
  try {
    const participantId = await getParticipantId();
    if (!participantId) return { success: false, error: 'Not authenticated. Please log in.' };

    const db = await getDb();
    const doc = await db.collection('participants').findOne({ participantId });
    if (!doc) return { success: false, error: 'Participant not found.' };

    if (!doc.collegeCheckIn?.status) {
      return { success: false, error: 'You must check into college before entering the lab.' };
    }

    // Currently inside lab — nothing to do
    if (doc.labCheckIn?.status && !doc.labCheckOut?.status) {
      const { loginPassword: _, ...rest } = doc as any;
      return { success: true, data: clean(rest) as DBParticipant };
    }

    // ── OTP check ─────────────────────────────────────────────────────────────
    const currentOTP = await db.collection('lab_otp').findOne({});

    if (!currentOTP) {
      return { success: false, error: 'No active OTP. Ask a volunteer to generate one.' };
    }

    const trimmed = otp.trim();

    if (currentOTP.code !== trimmed) {
      await logAction(participantId, doc.name as string, 'lab_checkin', {
        otpUsed: trimmed, otpValid: false,
      });
      return { success: false, error: 'Incorrect OTP. Ask your volunteer for the current code.' };
    }

    if (new Date(currentOTP.expiresAt) < new Date()) {
      return { success: false, error: 'OTP expired. Ask your volunteer for a new one.' };
    }

    // ── Write ──────────────────────────────────────────────────────────────────
    const now = new Date();
    await db.collection('participants').updateOne(
      { participantId },
      {
        $set: {
          labCheckIn:  { status: true,  time: now, otpUsed: trimmed },
          labCheckOut: { status: false, time: null },
          updatedAt: now,
        },
      }
    );

    await logAction(participantId, doc.name as string, 'lab_checkin', {
      otpUsed: trimmed, otpValid: true,
    });

    const updated = await db.collection('participants').findOne({ participantId });
    const { loginPassword: _, ...rest } = updated as any;
    return { success: true, data: clean(rest) as DBParticipant };
  } catch (err) {
    console.error('labCheckIn error:', err);
    return { success: false, error: 'Failed to check in. Please try again.' };
  }
}

// ─── Lab Check-Out (cyclic) ───────────────────────────────────────────────────

/**
 * Checks the participant out of the lab.
 * Re-entry always requires a fresh OTP.
 */
export async function labCheckOutAction(): Promise<ActionResult> {
  try {
    const participantId = await getParticipantId();
    if (!participantId) return { success: false, error: 'Not authenticated. Please log in.' };

    const db = await getDb();
    const doc = await db.collection('participants').findOne({ participantId });
    if (!doc) return { success: false, error: 'Participant not found.' };

    if (!doc.labCheckIn?.status) {
      return { success: false, error: 'You are not currently checked into the lab.' };
    }

    if (doc.labCheckOut?.status) {
      return { success: false, error: 'Already checked out.' };
    }

    const now = new Date();
    await db.collection('participants').updateOne(
      { participantId },
      { $set: { 'labCheckOut.status': true, 'labCheckOut.time': now, updatedAt: now } }
    );

    await logAction(participantId, doc.name as string, 'lab_checkout');

    const updated = await db.collection('participants').findOne({ participantId });
    const { loginPassword: _, ...rest } = updated as any;
    return { success: true, data: clean(rest) as DBParticipant };
  } catch (err) {
    console.error('labCheckOut error:', err);
    return { success: false, error: 'Failed to check out. Please try again.' };
  }
}