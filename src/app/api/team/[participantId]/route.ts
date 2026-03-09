// src/app/api/team/[participantId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { DBParticipant } from '@/types';

const DB_NAME    = 'hackoverflow';
const COLLECTION = 'participants';

function serialize(doc: any): any {
  return JSON.parse(
    JSON.stringify(doc, (_key, val) => {
      if (val && typeof val === 'object' && val.constructor?.name === 'ObjectId') {
        return val.toString();
      }
      if (val instanceof Date) return val.toISOString();
      return val;
    })
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  try {
    // Auth guard
    const token = req.cookies.get('participant_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { participantId } = await params;

    const client = await clientPromise;
    const db     = client.db(DB_NAME);

    // Find the requesting participant
    const self = await db
      .collection<DBParticipant>(COLLECTION)
      .findOne({ participantId }) as DBParticipant | null;

    if (!self) return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    if (!self.teamId) return NextResponse.json({ team: null });

    // Get all teammates (same teamId)
    const teamDocs = await db
      .collection<DBParticipant>(COLLECTION)
      .find({ teamId: self.teamId })
      .toArray();

    if (!teamDocs.length) return NextResponse.json({ team: null });

    // Strip passwords, serialize ObjectIds/Dates
    const safe = teamDocs.map(d => {
      const { loginPassword: _, ...rest } = d as any;
      return serialize(rest);
    });

    // Map DBParticipant → TeamMember (matches team/page.tsx interface exactly)
    const toMember = (d: any) => ({
      id:             d.participantId,
      name:           d.name,
      email:          d.email          ?? null,
      role:           d.role           ?? null,
      github:         d.github         ?? null,   // store in DB if needed
      linkedin:       d.linkedin       ?? null,   // store in DB if needed
      labAllotted:    d.labAllotted    ?? null,
      collegeCheckIn: d.collegeCheckIn ?? null,
      labCheckIn:     d.labCheckIn     ?? null,
    });

    // Leader = role === 'leader', else fall back to the requesting participant
    const leaderDoc =
      safe.find((d: any) => d.role?.toLowerCase() === 'leader') ??
      safe.find((d: any) => d.participantId === participantId) ??
      safe[0];

    const leader  = toMember(leaderDoc);
    const members = safe
      .filter((d: any) => d.participantId !== leaderDoc.participantId)
      .map(toMember);

    // Project info — pull from any member that has it (consistent across team)
    const withProject = safe.find((d: any) => d.projectName) ?? safe[0];

    const team = {
      teamId:             self.teamId,
      teamName:           self.teamName           ?? `Team ${self.teamId}`,
      projectName:        withProject.projectName        ?? null,
      projectDescription: withProject.projectDescription ?? null,
      techStack:          withProject.techStack          ?? [],
      githubRepo:         withProject.githubRepo         ?? null,
      leader,
      members,
    };

    return NextResponse.json({ team });
  } catch (err) {
    console.error('[GET /api/team/[participantId]]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}