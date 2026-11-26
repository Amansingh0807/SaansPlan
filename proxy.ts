import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import { planGenerationLimiter, standardApiLimiter } from '@/lib/security/rate-limiter';

const hasClerkKeys = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

// Protected routes requiring authentication when Clerk is configured
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

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
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
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
  const pathname = request.nextUrl.pathname;

  // Rate Limiting on API endpoints
  if (pathname.startsWith('/api/')) {
    const clientId = getClientIdentifier(request);
    const limiter = pathname === '/api/plan' ? planGenerationLimiter : standardApiLimiter;
    const rateCheck = limiter.check(clientId);

    if (!rateCheck.allowed) {
      const retryAfterSec = Math.ceil(rateCheck.resetMs / 1000);
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded. Please wait before making more requests.',
          retryAfterSeconds: retryAfterSec,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(limiter['maxRequests'] ?? 60),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

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
