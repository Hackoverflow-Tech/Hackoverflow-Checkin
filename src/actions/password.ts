'use server';

import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { signToken } from '@/lib/auth';

interface Result {
  success: boolean;
  error?: string;
}

// Set Password (one-time, on first arrival)
export async function setPasswordAction(
  participantId: string,
  password: string
): Promise<Result> {
  try {
    if (!participantId || !password)
      return { success: false, error: 'Participant ID and password are required.' };

    const db = (await clientPromise).db('hackoverflow');
    const participant = await db.collection('participants').findOne({ participantId });

    if (!participant)
      return { success: false, error: 'Participant not found.' };

    if (participant.loginPassword)
      return { success: false, error: 'Password has already been set for this account.' };

    await db.collection('participants').updateOne(
      { participantId },
      { $set: { loginPassword: password, updatedAt: new Date() } }
    );

    return { success: true };
  } catch (err) {
    console.error('setPassword error:', err);
    return { success: false, error: 'Failed to set password. Please try again.' };
  }
}

// Verify Password + Set Auth Cookie (used at lab check-in gate)
export async function verifyAndLoginAction(
  participantId: string,
  password: string
): Promise<Result> {
  try {
    if (!participantId || !password)
      return { success: false, error: 'Please enter your password.' };

    const db = (await clientPromise).db('hackoverflow');
    const participant = await db.collection('participants').findOne({ participantId });

    if (!participant)
      return { success: false, error: 'Participant not found.' };

    if (participant.loginPassword !== password)
      return { success: false, error: 'Incorrect password. Please try again.' };

    const token = signToken({
      participantId,
      name: participant.name as string,
      email: participant.email as string,
    });
    const cookieStore = await cookies();
    cookieStore.set('participant_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true };
  } catch (err) {
    console.error('verifyAndLogin error:', err);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}