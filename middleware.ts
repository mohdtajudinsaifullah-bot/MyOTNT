import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Tandakan route yang Boleh Dilihat Tanpa Log In (Public)
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Kalau BUKAN public route, barulah kita protect
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jwt|png|jpg|jpeg|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes and Server Actions
    '/(api|trpc)(.*)',
  ],
};