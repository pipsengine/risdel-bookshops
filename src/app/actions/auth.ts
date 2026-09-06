"use server";
import { redirect } from "next/navigation";
import { authenticateUser, signOut } from "@/services/auth.service";
import { toPublicErrorMessage, UnauthorizedError } from "@/lib/errors";

export type LoginState = { error?: string };

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Enter your email and password." };
  try {
    await authenticateUser(email, password);
  } catch (error) {
    if (error instanceof UnauthorizedError) return { error: error.message };
    return { error: toPublicErrorMessage(error) };
  }
  redirect("/dashboard");
}

export async function logout() {
  await signOut();
  redirect("/login");
}
