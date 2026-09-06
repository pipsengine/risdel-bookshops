"use server";
import { redirect } from "next/navigation";
import { clearSession, createSession, validateBootstrapCredentials } from "@/lib/auth";
export type LoginState={error?:string};
export async function login(_:LoginState,formData:FormData):Promise<LoginState>{const email=String(formData.get("email")||"").trim();const password=String(formData.get("password")||"");if(!email||!password)return {error:"Enter your email and password."};if(!validateBootstrapCredentials(email,password))return {error:"Invalid email or password."};await createSession(email,process.env.BOOTSTRAP_ADMIN_NAME||"System Administrator");redirect("/dashboard")}
export async function logout(){await clearSession();redirect("/login")}
