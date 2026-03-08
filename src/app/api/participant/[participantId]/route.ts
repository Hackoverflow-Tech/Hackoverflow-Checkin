import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { DBParticipant } from '@/types';

const DB_NAME = 'hackoverflow';
const COLLECTION = 'participants';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  try {
    const { participantId } = await params;
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const participant = await db
      .collection(COLLECTION)
      .findOne({ participantId }) as DBParticipant | null;

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Never expose password
    const { loginPassword: _, ...safe } = participant as any;
    return NextResponse.json({ participant: safe });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}