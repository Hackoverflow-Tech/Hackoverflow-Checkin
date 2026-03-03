import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const dashboardMatch = pathname.match(/^\/participant\/([^/]+)\/(dashboard.*)/);
    if (dashboardMatch) {
        const participantId = dashboardMatch[1];
        const result = verifyRequestToken(request);
        if (!result.valid) {
            return NextResponse.redirect(new URL(`/participant/${participantId}/login`, request.url));
        }
        if (result.payload.userId !== participantId) {
            return NextResponse.redirect(new URL(`/participant/${participantId}/login`, request.url));
        }
        return NextResponse.next();
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/participant/:participantId/dashboard/:path*'],
};
