"use server";
import { redirect } from "next/navigation";
import { clearSession,authenticate,getSession } from "@/lib/auth";
import { hashPassword,validatePasswordPolicy,verifyPassword } from "@/lib/password";
import { writeAudit } from "@/lib/audit";
import { usingGoogleSheets } from "@/lib/data-provider";
import { appendRow,findById,newId,SHEETS,updateRow } from "@/lib/sheets";
import { gsRevokeUserSessions } from "@/data/google-services";
import * as legacy from "@/data/providers/sql-server/legacy/auth-actions";
export type LoginState={error?:string};
export async function login(_:LoginState,fd:FormData):Promise<LoginState>{const email=String(fd.get("email")||"").trim(),password=String(fd.get("password")||""),remember=fd.get("remember")==="on";if(!email||!password)return {error:"Enter your email and password."};const result=await authenticate(email,password,remember);if(!result.ok)return {error:result.error};redirect(result.mustChangePassword?"/security/change-password":"/dashboard");return {}}
export async function logout(){await clearSession();redirect("/login")}
export type PasswordState={error?:string;success?:string};
export async function changePassword(_:PasswordState,fd:FormData):Promise<PasswordState>{if(!usingGoogleSheets())return legacy.changePassword(_,fd);const session=await getSession();if(!session?.userId)return {error:"Your session has expired. Sign in again."};const current=String(fd.get("currentPassword")||""),next=String(fd.get("newPassword")||""),confirm=String(fd.get("confirmPassword")||"");if(next!==confirm)return {error:"The new passwords do not match."};const errors=validatePasswordPolicy(next);if(errors.length)return {error:`Password must contain ${errors.join(", ")}.`};const user=await findById(SHEETS.users,session.userId);if(!user||!await verifyPassword(current,user.PasswordHash))return {error:"Current password is incorrect."};if(user.PasswordHash)await appendRow(SHEETS.passwordHistory,{Id:newId(),UserId:session.userId,PasswordHash:user.PasswordHash,CreatedAt:new Date().toISOString(),IsActive:true});await updateRow(SHEETS.users,session.userId,{PasswordHash:await hashPassword(next),MustChangePassword:false,LastPasswordChangedAt:new Date().toISOString(),UpdatedAt:new Date().toISOString(),UpdatedBy:session.userId});await gsRevokeUserSessions(session.userId);await writeAudit({userId:session.userId,action:"PASSWORD_CHANGE",module:"security",entityType:"User",entityId:session.userId,description:"User changed account password"});await clearSession();redirect("/login?passwordChanged=1");return {}}
