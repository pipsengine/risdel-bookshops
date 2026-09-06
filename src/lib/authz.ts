import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Session } from "@/lib/auth";

export async function requireSession():Promise<Session>{const session=await getSession();if(!session){redirect("/login");throw new Error("Unauthenticated")}return session}
export async function requirePermission(permission:string):Promise<Session>{const session=await requireSession();if(session.roleCode==="SUPER_ADMIN"||session.permissions.includes(permission))return session;redirect("/unauthorized");throw new Error("Unauthorized")}
export function can(session:{roleCode?:string;permissions:string[]}|null,permission:string){return !!session&&(session.roleCode==="SUPER_ADMIN"||session.permissions.includes(permission))}
