'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export async function getTeam() {
  const cookieStore = await cookies();
  const token = cookieStore.get('participant_token')?.value;
  if (!token) return null;

  const payload = verifyToken(token) as any;
  if (!payload) return null;

  const participantId =
    payload.participantId ?? payload.id ?? payload.sub ?? null;
  if (!participantId) return null;

  const db = (await clientPromise).db('hackoverflow');

  const self = await db.collection('participants').findOne({ participantId });
  if (!self?.teamId) return null;

  const teammates = await db
    .collection('participants')
    .find({ teamId: self.teamId })
    .toArray();

  const clean = (doc: any) => JSON.parse(JSON.stringify(doc, (_, v) => {
    if (v?.constructor?.name === 'ObjectId') return v.toString();
    if (v instanceof Date) return v.toISOString();
    return v;
  }));

  const safe = teammates.map(d => {
    const { loginPassword: _, _id: __, ...rest } = d as any;
    return clean(rest);
  });

  const leader =
    safe.find((d: any) => d.role?.toLowerCase() === 'leader') ??
    safe.find((d: any) => d.participantId === participantId) ??
    safe[0];

  const toMember = (d: any) => ({
    id:          d.participantId,
    name:        d.name,
    email:       d.email       ?? null,
    role:        d.role        ?? null,
    github:      d.github      ?? null,
    linkedin:    d.linkedin    ?? null,
    labAllotted: d.labAllotted ?? null,
  });

  const withProject = safe.find((d: any) => d.projectName) ?? safe[0];

  return {
    teamId:             self.teamId as string,
    teamName:           (self.teamName as string) ?? `Team ${self.teamId}`,
    projectName:        withProject.projectName        ?? null,
    projectDescription: withProject.projectDescription ?? null,
    techStack:          withProject.techStack          ?? [],
    githubRepo:         withProject.githubRepo         ?? null,
    leader:             toMember(leader),
    members:            safe
                          .filter((d: any) => d.participantId !== leader.participantId)
                          .map(toMember),
  };
}