import { NextResponse } from 'next/server';

// Legacy Supabase OAuth callback — no longer used. Redirect to home.
export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/', request.url));
}
