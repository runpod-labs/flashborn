import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

// Auth runs app-wide; pages decide their own gating. Public card pages
// (/card/*) stay reachable without a session.
export default convexAuthNextjsMiddleware();

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
