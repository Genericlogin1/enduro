import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/new'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('enduro_token')?.value;
  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED_PATHS.some((p) => path === p || path.startsWith(p + '/'));
  if (!token && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
