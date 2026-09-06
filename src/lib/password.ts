import crypto from "crypto";

const KEYLEN = 64;

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, KEYLEN, (err, key) => err ? reject(err) : resolve(key as Buffer));
  });
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored?: string | null) {
  if (!stored) return false;
  const [scheme, salt, expectedHex] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !expectedHex) return false;
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, KEYLEN, (err, key) => err ? reject(err) : resolve(key as Buffer));
  });
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

export function validatePasswordPolicy(password: string) {
  const errors: string[] = [];
  if (password.length < 8) errors.push("at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("an uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("a lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("a number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("a special character");
  return errors;
}

export function generateTemporaryPassword() {
  return `Risdel@${crypto.randomInt(100000, 999999)}Aa`;
}
