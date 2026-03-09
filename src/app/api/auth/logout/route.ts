// src/app/api/auth/logout/route.ts
// Clears the participant_token cookie set by /api/auth/login.

import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('participant_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,   // immediately expire
    path: '/',
  });
  return res;
}