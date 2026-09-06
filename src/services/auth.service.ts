import { authenticate, clearSession } from "@/lib/auth";
import { hashPassword as scryptHash } from "@/lib/password";
import { UnauthorizedError } from "@/lib/errors";

/** Compatibility wrapper around lib/auth authenticate. */
export async function authenticateUser(email: string, password: string, remember = false) {
  const result = await authenticate(email, password, remember);
  if (!result.ok) throw new UnauthorizedError(result.error);
  return { mustChangePassword: result.mustChangePassword };
}

export async function signOut() {
  await clearSession();
}

export async function hashPassword(password: string): Promise<string> {
  return scryptHash(password);
}
