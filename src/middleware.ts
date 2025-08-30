import { NextResponse, NextRequest } from 'next/server';

// Define protected routes
const protectedRoutes: string[] = ['/'];
// Define public routes that don't require authentication
const publicRoutes: string[] = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth_token')?.value;

  console.log(`Middleware - Path: ${pathname}, Auth token: ${authToken ? 'exists' : 'missing'}`);

  // Allow all requests to proceed
  // Client-side components will handle the actual protection logic
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};