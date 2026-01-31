import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes (no auth required)
  const publicRoutes = ['/', '/auth/login', '/auth/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Auth routes (logged in users should not access)
  const authRoutes = ['/auth/login', '/auth/signup'];
  const isAuthRoute = authRoutes.includes(pathname);

  // Protected routes (require authentication)
  const isProtectedRoute =
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/verification') ||
    pathname.startsWith('/app') ||
    pathname.startsWith('/admin');

  // Redirect logged-out users from protected routes to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users from auth routes to app
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/app/intent';
    return NextResponse.redirect(url);
  }

  // Verification gate: check if user is verified before accessing app
  if (user && pathname.startsWith('/app')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('verification_status, terms_accepted_at')
      .eq('id', user.id)
      .single();

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin');

    // NUCLEAR OPTION: Hardcoded Admin Bypass
    // This ensures the owner can ALWAYS access, even if DB is broken
    const isHardcodedAdmin = user.email === 'jorge.pinto.correia1@gmail.com';

    // 1. Terms Gate: If terms not accepted, redirect to terms page
    // (Allow access to terms page itself)
    if (
      profile &&
      !profile.terms_accepted_at &&
      !pathname.startsWith('/onboarding/terms') &&
      !pathname.startsWith('/auth')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding/terms';
      return NextResponse.redirect(url);
    }

    // 2. Verification Gate: If not verified AND not admin, redirect to verification required
    if (
      profile &&
      profile.verification_status !== 'verified' &&
      !pathname.startsWith('/verification') &&
      !isAdmin &&
      !isHardcodedAdmin &&
      // Ensure we don't block the Terms page
      !pathname.startsWith('/onboarding/terms')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/verification/required';
      return NextResponse.redirect(url);
    }
  }

  // Admin gate: check if user is admin before accessing admin routes
  if (user && pathname.startsWith('/admin')) {
    const { data: isAdmin } = await supabase.rpc('is_admin');

    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/app/intent';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
