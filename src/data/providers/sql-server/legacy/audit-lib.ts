import sql from "mssql";
import { databaseConfigured, getDb } from "@/lib/db";

export async function writeAudit(input:{userId?:string|null;action:string;module:string;entityType?:string|null;entityId?:string|null;description?:string;oldValues?:unknown;newValues?:unknown;branchId?:string|null}){
  if(!databaseConfigured()) return;
  try{
    const db=await getDb();
    await db.request()
      .input("userId",sql.UniqueIdentifier,input.userId||null)
      .input("action",sql.NVarChar(50),input.action)
      .input("module",sql.NVarChar(80),input.module)
      .input("entityType",sql.NVarChar(100),input.entityType||null)
      .input("entityId",sql.UniqueIdentifier,input.entityId||null)
      .input("description",sql.NVarChar(1000),input.description||null)
      .input("oldValues",sql.NVarChar(sql.MAX),input.oldValues?JSON.stringify(input.oldValues):null)
      .input("newValues",sql.NVarChar(sql.MAX),input.newValues?JSON.stringify(input.newValues):null)
      .input("branchId",sql.UniqueIdentifier,input.branchId||null)
      .query(`INSERT audit.AuditLogs(UserId,Action,Module,EntityType,EntityId,Description,OldValues,NewValues,BranchId) VALUES(@userId,@action,@module,@entityType,@entityId,@description,@oldValues,@newValues,@branchId)`);
  }catch(error){console.error("Audit write failed",error)}
}

export async function writeLoginHistory(email:string,success:boolean,userId?:string|null,reason?:string){
  if(!databaseConfigured()) return;
  try{const db=await getDb();await db.request().input("userId",sql.UniqueIdentifier,userId||null).input("email",sql.NVarChar(256),email).input("success",sql.Bit,success).input("reason",sql.NVarChar(200),reason||null).query(`INSERT audit.LoginHistory(UserId,Email,WasSuccessful,FailureReason) VALUES(@userId,@email,@success,@reason)`)}catch(error){console.error("Login history write failed",error)}
}
