'use server';

import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const DB = 'hackoverflow';
const JWT_SECRET = process.env.JWT_SECRET ?? 'hackoverflow-secret';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

function clean(doc: any): any {
  return JSON.parse(
    JSON.stringify(doc, (_, v) => {
      if (v?.constructor?.name === 'ObjectId') return v.toString();
      if (v instanceof Date) return v.toISOString();
      return v;
    })
  );
}

// ─── Step 1: Look up team members by teamId ──────────────────────────────────

export interface TeamMemberPreview {
  participantId: string;
  name: string;
  role: string | null;
}

export interface GetTeamResult {
  success: boolean;
  members?: TeamMemberPreview[];
  teamName?: string;
  error?: string;
}

export async function getTeamMembersAction(teamId: string): Promise<GetTeamResult> {
  try {
    const trimmed = teamId.trim().toUpperCase();
    if (!trimmed) return { success: false, error: 'Please enter a Team ID.' };

    const client = await clientPromise;
    const db = client.db(DB);

    const members = await db
      .collection('participants')
      .find({ teamId: trimmed })
      .toArray();

    if (!members.length) {
      return { success: false, error: 'No team found with that ID. Check your ID card and try again.' };
    }

    const preview: TeamMemberPreview[] = members.map((m: any) => ({
      participantId: m.participantId,
      name: m.name,
      role: m.role ?? null,
    }));

    const teamName = members[0]?.teamName ?? `Team ${trimmed}`;

    return { success: true, members: preview, teamName };
  } catch (err) {
    console.error('getTeamMembersAction error:', err);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

// ─── Step 2: Verify password and set cookie ──────────────────────────────────

export interface LoginResult {
  success: boolean;
  error?: string;
}

export async function loginAction(
  participantId: string,
  password: string
): Promise<LoginResult> {
  try {
    if (!participantId || !password) {
      return { success: false, error: 'Missing credentials.' };
    }

    const client = await clientPromise;
    const db = client.db(DB);

    const doc = await db.collection('participants').findOne({ participantId });
    if (!doc) return { success: false, error: 'Participant not found.' };

    const stored = doc.loginPassword as string | undefined;
    if (!stored) return { success: false, error: 'No password set for this account. Contact an organizer.' };

    // Try bcrypt first (if passwords are hashed), fall back to plain compare
    let passwordMatch = false;
    try {
      const bcrypt = await import('bcryptjs');
      passwordMatch = await bcrypt.compare(password, stored);
    } catch {
      // bcryptjs not installed — fall back to plain text compare
      passwordMatch = stored === password;
    }

    // Plain text fallback if bcrypt didn't match (some passwords may not be hashed)
    if (!passwordMatch) {
      passwordMatch = stored === password;
    }

    if (!passwordMatch) {
      return { success: false, error: 'Incorrect password. Try again.' };
    }

    // Sign JWT — same payload shape as your existing auth flow
    const token = jwt.sign(
      { participantId, id: participantId, sub: participantId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const cookieStore = await cookies();
    cookieStore.set('participant_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return { success: true };
  } catch (err) {
    console.error('loginAction error:', err);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}