import bcrypt from "bcryptjs";
import { getDataProvider, getConfiguredProviderName } from "@/data";
import { UnauthorizedError } from "@/lib/errors";
import {
  clearSession,
  createSession,
  validateBootstrapCredentials
} from "@/lib/auth";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export async function authenticateUser(email: string, password: string) {
  const providerName = getConfiguredProviderName();

  if (providerName === "google-sheets") {
    const db = getDataProvider();
    const user = await db.users.findByEmail(email);

    if (!user) {
      // Module 00 fallback: bootstrap env credentials until sheets seed creates the admin.
      if (validateBootstrapCredentials(email, password)) {
        await createSession(email, process.env.BOOTSTRAP_ADMIN_NAME || "System Administrator");
        try {
          await db.loginHistory.append({
            userId: null,
            email,
            wasSuccessful: true,
            failureReason: "bootstrap-fallback"
          });
        } catch {
          /* login history is best-effort during bootstrap */
        }
        return { mode: "bootstrap" as const };
      }
      try {
        await db.loginHistory.append({
          userId: null,
          email,
          wasSuccessful: false,
          failureReason: "invalid-credentials"
        });
      } catch {
        /* ignore */
      }
      throw new UnauthorizedError("Invalid email or password.");
    }

    if (!user.isActive) {
      await db.loginHistory.append({
        userId: user.id,
        email,
        wasSuccessful: false,
        failureReason: "inactive"
      });
      throw new UnauthorizedError("This account is inactive.");
    }

    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      await db.loginHistory.append({
        userId: user.id,
        email,
        wasSuccessful: false,
        failureReason: "locked"
      });
      throw new UnauthorizedError("This account is temporarily locked.");
    }

    const hash = user.passwordHash || "";
    const ok = hash ? await bcrypt.compare(password, hash) : false;
    if (!ok) {
      const failed = (user.failedLoginCount || 0) + 1;
      const patch: { failedLoginCount: number; lockedUntil?: string | null } = {
        failedLoginCount: failed
      };
      if (failed >= MAX_FAILED) {
        patch.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString();
      }
      await db.users.update(user.id, patch);
      await db.loginHistory.append({
        userId: user.id,
        email,
        wasSuccessful: false,
        failureReason: "invalid-credentials"
      });
      throw new UnauthorizedError("Invalid email or password.");
    }

    await db.users.update(user.id, {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date().toISOString()
    });
    await db.loginHistory.append({
      userId: user.id,
      email,
      wasSuccessful: true,
      failureReason: null
    });
    await createSession(user.email, user.displayName);
    return { mode: "provider" as const, user };
  }

  // SQL / other providers: keep Module 00 bootstrap until SQL auth repositories land.
  if (!validateBootstrapCredentials(email, password)) {
    throw new UnauthorizedError("Invalid email or password.");
  }
  await createSession(email, process.env.BOOTSTRAP_ADMIN_NAME || "System Administrator");
  return { mode: "bootstrap" as const };
}

export async function signOut() {
  await clearSession();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
