import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect all super-admin governance routes server-side
  if (pathname.startsWith('/super-admin')) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(`${backendUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Token expired or rejected by backend, remove cookie and redirect
        const redirectRes = NextResponse.redirect(new URL('/login', request.url));
        redirectRes.cookies.delete('admin_token');
        return redirectRes;
      }

      const result = await response.json();
      const user = result.data?.user;

      if (!user || user.role !== 'super_admin') {
        // Not super admin, redirect to general dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (err) {
      console.error('Middleware network authentication guard failure:', err);
      // Fallback redirect on system down or fetch failure
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/super-admin/:path*'],
};
