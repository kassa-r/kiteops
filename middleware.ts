import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'
// import type { Database } from '@/lib/database.types' // Ensure this type exists or remove if not available yet

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Debug logging
  console.log('Middleware: User:', user ? user.id : 'No user');
  console.log('Middleware: Path:', req.nextUrl.pathname);

  // If user is not logged in and tries to access a protected route, redirect to login
  if (!user && req.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Define protected routes and allowed roles
  const protectedRoutes: Record<string, string[]> = {
    '/dashboard': ['instructor', 'manager'], // Both instructor and manager can access dashboard
    '/calendar': ['instructor', 'manager'],
  }

  // Check if the current path is a protected route
  const isProtectedRoute = Object.keys(protectedRoutes).some(route => req.nextUrl.pathname.startsWith(route))

  if (user && isProtectedRoute) {
    const userRole = user.user_metadata.role as string | undefined
    const allowedRoles = protectedRoutes[Object.keys(protectedRoutes).find(route => req.nextUrl.pathname.startsWith(route)) || '']
    console.log('Middleware: User Role:', userRole);
    console.log('Middleware: Allowed Roles:', allowedRoles);

    if (!userRole || !allowedRoles.includes(userRole)) {
      // User is authenticated but not authorized for this route
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/unauthorized'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    '/dashboard/:path*', // Protect all paths under /dashboard
    '/calendar/:path*',
  ],
}
