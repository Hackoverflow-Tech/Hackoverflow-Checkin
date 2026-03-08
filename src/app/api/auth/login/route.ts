import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { signToken } from '@/lib/auth';
import { DBParticipant } from '@/types';

const DB_NAME = 'hackoverflow';
const COLLECTION = 'participants';

export async function POST(req: NextRequest) {
  try {
    const { participantId, password } = await req.json();

    if (!participantId || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const participant = await db
      .collection(COLLECTION)
      .findOne({ participantId }) as DBParticipant | null;

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Plain text password comparison (as set by admin dashboard)
    if (participant.loginPassword !== password) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const token = signToken({
      participantId: participant.participantId,
      name: participant.name,
      email: participant.email,
    });

    const response = NextResponse.json({ success: true, participantId });
    response.cookies.set('participant_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}