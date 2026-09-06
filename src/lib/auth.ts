import { cookies } from "next/headers";
import crypto from "crypto";
import { getDataProvider } from "@/data";
import { verifyPassword } from "@/lib/password";
import { writeLoginHistory } from "@/lib/audit";

const COOKIE = "risdel_session";

export type Session = {
  userId: string | null;
  email: string;
  name: string;
  role: string;
  roleCode: string;
  permissions: string[];
  mustChangePassword: boolean;
  source: "database" | "bootstrap";
  exp: number;
};

function secret() {
  return process.env.AUTH_SECRET || "development-secret-change-me-please-32chars";
}
function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}
function encode(s: Session) {
  const body = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${body}.${sign(body)}`;
}
function decode(token?: string): Session | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    return s.exp > Date.now() ? s : null;
  } catch {
    return null;
  }
}
function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a.padEnd(256));
  const bb = Buffer.from(b.padEnd(256));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export function validateBootstrapCredentials(email: string, password: string) {
  const e = process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@risdel.local";
  const p = process.env.BOOTSTRAP_ADMIN_PASSWORD || "ChangeMe@123";
  return safeEqual(email.toLowerCase(), e.toLowerCase()) && safeEqual(password, p);
}

async function setSession(session: Omit<Session, "exp">, remember = false) {
  const hours = remember
    ? Number(process.env.REMEMBER_SESSION_HOURS || 168)
    : Number(process.env.SESSION_HOURS || 8);
  const exp = Date.now() + hours * 3600_000;
  const full: Session = { ...session, exp };
  const store = await cookies();
  store.set(COOKIE, encode(full), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(exp)
  });
  if (session.userId) {
    try {
      const db = getDataProvider();
      const tokenHash = crypto.createHash("sha256").update(encode(full)).digest("hex");
      await db.userSessions.create({
        userId: session.userId,
        sessionTokenHash: tokenHash,
        expiresAt: new Date(exp).toISOString()
      });
    } catch {
      /* session persistence is best-effort */
    }
  }
}

async function loadIdentity(userId: string): Promise<Omit<Session, "exp"> | null> {
  const db = getDataProvider();
  const user = await db.users.findById(userId);
  if (!user || !user.isActive) return null;

  const userRoles = await db.userRoles.findByUserId(userId);
  const roles = [];
  const permissionKeys = new Set<string>();

  for (const ur of userRoles) {
    const role = await db.roles.findById(ur.roleId);
    if (!role || !role.isActive) continue;
    roles.push({ code: role.code, name: role.name });
    const grants = await db.rolePermissions.findByRoleId(role.id);
    for (const grant of grants) {
      const perm = await db.permissions.findById(grant.permissionId);
      if (perm?.permissionKey) permissionKeys.add(perm.permissionKey);
    }
  }

  const primary =
    roles.find((r) => r.code === "SUPER_ADMIN") || roles[0] || { code: "NO_ROLE", name: "No Role" };

  return {
    userId: user.id,
    email: user.email,
    name: user.displayName,
    role: primary.name,
    roleCode: primary.code,
    permissions: [...permissionKeys],
    mustChangePassword: Boolean(user.mustChangePassword),
    source: "database"
  };
}

export async function authenticate(email: string, password: string, remember = false) {
  const normalised = email.trim().toLowerCase();
  try {
    const db = getDataProvider();
    const user = await db.users.findByEmail(normalised);

    if (user) {
      if (!user.isActive) {
        await writeLoginHistory(normalised, false, user.id, "Account inactive");
        return { ok: false as const, error: "This account is inactive. Contact an administrator." };
      }
      if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
        await writeLoginHistory(normalised, false, user.id, "Account locked");
        return {
          ok: false as const,
          error: "Account temporarily locked because of repeated failed sign-in attempts."
        };
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        const max = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
        const lockMinutes = Number(process.env.LOGIN_LOCK_MINUTES || 15);
        const failed = (user.failedLoginCount || 0) + 1;
        const patch: { failedLoginCount: number; lockedUntil?: string | null } = {
          failedLoginCount: failed
        };
        if (failed >= max) {
          patch.lockedUntil = new Date(Date.now() + lockMinutes * 60_000).toISOString();
        }
        await db.users.update(user.id, patch);
        await writeLoginHistory(normalised, false, user.id, "Invalid password");
        return { ok: false as const, error: "Invalid email or password." };
      }

      await db.users.update(user.id, {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date().toISOString()
      });
      const identity = await loadIdentity(user.id);
      if (!identity) return { ok: false as const, error: "Unable to load account permissions." };
      await setSession(identity, remember);
      await writeLoginHistory(normalised, true, user.id);
      return { ok: true as const, mustChangePassword: identity.mustChangePassword };
    }

    if (validateBootstrapCredentials(normalised, password)) {
      await setSession(
        {
          userId: null,
          email: normalised,
          name: process.env.BOOTSTRAP_ADMIN_NAME || "System Administrator",
          role: "Super Administrator",
          roleCode: "SUPER_ADMIN",
          permissions: ["*"],
          mustChangePassword: false,
          source: "bootstrap"
        },
        remember
      );
      await writeLoginHistory(normalised, true, null, "bootstrap-fallback");
      return { ok: true as const, mustChangePassword: false };
    }
  } catch (error) {
    console.error("Provider authentication failed", error);
    if (validateBootstrapCredentials(normalised, password)) {
      await setSession(
        {
          userId: null,
          email: normalised,
          name: process.env.BOOTSTRAP_ADMIN_NAME || "System Administrator",
          role: "Super Administrator",
          roleCode: "SUPER_ADMIN",
          permissions: ["*"],
          mustChangePassword: false,
          source: "bootstrap"
        },
        remember
      );
      return { ok: true as const, mustChangePassword: false };
    }
    return {
      ok: false as const,
      error: "Authentication service is temporarily unavailable. Check the data provider connection."
    };
  }

  return { ok: false as const, error: "Invalid email or password." };
}

export async function getSession() {
  const store = await cookies();
  const session = decode(store.get(COOKIE)?.value);
  if (!session) return null;
  if (session.source === "database" && session.userId) {
    try {
      const identity = await loadIdentity(session.userId);
      if (!identity) {
        await clearSession();
        return null;
      }
      return { ...session, ...identity };
    } catch {
      return session;
    }
  }
  return session;
}

export async function clearSession() {
  const store = await cookies();
  store.set(COOKIE, "", { httpOnly: true, path: "/", expires: new Date(0) });
}
