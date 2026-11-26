import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

const hasClerkKeys = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

// Protected routes requiring authentication when Clerk is configured
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
]);

function applySecurityLayer(response: NextResponse): NextResponse {
  // Prevent MIME-sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking / iframe embedding
  response.headers.set('X-Frame-Options', 'DENY');
  // Enforce strict referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Modern cross-site scripting filter
  response.headers.set('X-XSS-Protection', '1; mode=block');
  // Restrict sensitive browser APIs
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  // Prevent DNS prefetching leaks
  response.headers.set('X-DNS-Prefetch-Control', 'off');

  return response;
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export default async function proxy(
  request: NextRequest,
  event: Parameters<typeof clerkHandler>[1]
) {
  if (hasClerkKeys) {
    const res = await clerkHandler(request, event);
    if (res instanceof NextResponse) {
      return applySecurityLayer(res);
    }
    return res;
  }

  return applySecurityLayer(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
