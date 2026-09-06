import { usingGoogleSheets } from "@/lib/data-provider";
import { gsAudit,gsLogin } from "@/data/google-services";
import * as sqlAudit from "@/data/providers/sql-server/legacy/audit-lib";
export async function writeAudit(input:{userId?:string|null;action:string;module:string;entityType?:string|null;entityId?:string|null;description?:string;oldValues?:unknown;newValues?:unknown;branchId?:string|null}){try{return usingGoogleSheets()?await gsAudit(input):await sqlAudit.writeAudit(input)}catch(error){console.error("Audit write failed",error)}}
export async function writeLoginHistory(email:string,success:boolean,userId?:string|null,reason?:string){try{return usingGoogleSheets()?await gsLogin(email,success,userId,reason):await sqlAudit.writeLoginHistory(email,success,userId,reason)}catch(error){console.error("Login history write failed",error)}}
