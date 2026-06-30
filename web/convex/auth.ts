import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";

// Password = email/password sign-up/in. Anonymous = one-click guest login for
// demos/judging. Profiles (credits, admin, displayName) are created lazily by
// users.ensureProfile on first authenticated load.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Anonymous],
});
