import { cookies } from "next/headers";
import crypto from "crypto";
import sql from "mssql";
import { databaseConfigured, getDb } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { writeLoginHistory } from "@/lib/audit";

const COOKIE="risdel_session";
export type Session={userId:string|null;email:string;name:string;role:string;roleCode:string;permissions:string[];mustChangePassword:boolean;source:"database"|"bootstrap";exp:number};
function secret(){return process.env.AUTH_SECRET||"development-secret-change-me-please-32chars"}
function sign(payload:string){return crypto.createHmac("sha256",secret()).update(payload).digest("base64url")}
function encode(s:Session){const body=Buffer.from(JSON.stringify(s)).toString("base64url");return `${body}.${sign(body)}`}
function decode(token?:string):Session|null{if(!token)return null;const [body,sig]=token.split(".");if(!body||!sig)return null;const expected=sign(body);if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;try{const s=JSON.parse(Buffer.from(body,"base64url").toString()) as Session;return s.exp>Date.now()?s:null}catch{return null}}
function safeEqual(a:string,b:string){const aa=Buffer.from(a.padEnd(256));const bb=Buffer.from(b.padEnd(256));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb)}
export function validateBootstrapCredentials(email:string,password:string){const e=process.env.BOOTSTRAP_ADMIN_EMAIL||"admin@risdel.local";const p=process.env.BOOTSTRAP_ADMIN_PASSWORD||"ChangeMe@123";return safeEqual(email.toLowerCase(),e.toLowerCase())&&safeEqual(password,p)}

async function setSession(session:Omit<Session,"exp">,remember=false){const hours=remember?Number(process.env.REMEMBER_SESSION_HOURS||168):Number(process.env.SESSION_HOURS||8);const exp=Date.now()+hours*3600_000;const full={...session,exp};const store=await cookies();store.set(COOKIE,encode(full),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",expires:new Date(exp)});if(databaseConfigured()&&session.userId){try{const db=await getDb();const tokenHash=crypto.createHash("sha256").update(encode(full)).digest("hex");await db.request().input("userId",sql.UniqueIdentifier,session.userId).input("tokenHash",sql.NVarChar(128),tokenHash).input("expires",sql.DateTime2,new Date(exp)).query(`INSERT auth.UserSessions(UserId,TokenHash,ExpiresAt) VALUES(@userId,@tokenHash,@expires)`)}catch{}}
}

async function loadIdentity(userId:string){const db=await getDb();const result=await db.request().input("id",sql.UniqueIdentifier,userId).query(`SELECT u.Id,u.Email,u.DisplayName,u.MustChangePassword,u.IsActive,r.Code RoleCode,r.Name RoleName,p.PermissionKey FROM auth.Users u LEFT JOIN auth.UserRoles ur ON ur.UserId=u.Id LEFT JOIN auth.Roles r ON r.Id=ur.RoleId AND r.IsActive=1 LEFT JOIN auth.RolePermissions rp ON rp.RoleId=r.Id LEFT JOIN auth.Permissions p ON p.Id=rp.PermissionId WHERE u.Id=@id`);if(!result.recordset.length||!result.recordset[0].IsActive)return null;const first=result.recordset[0];const roles=[...new Map(result.recordset.filter((x:any)=>x.RoleCode).map((x:any)=>[x.RoleCode,{code:x.RoleCode,name:x.RoleName}])).values()] as {code:string,name:string}[];const primary=roles.find(r=>r.code==="SUPER_ADMIN")||roles[0]||{code:"NO_ROLE",name:"No Role"};return {userId:String(first.Id),email:first.Email,name:first.DisplayName,role:primary.name,roleCode:primary.code,permissions:[...new Set(result.recordset.map((x:any)=>x.PermissionKey).filter(Boolean))] as string[],mustChangePassword:Boolean(first.MustChangePassword),source:"database" as const}}

export async function authenticate(email:string,password:string,remember=false){
  if(databaseConfigured()){
    try{
      const db=await getDb();
      const res=await db.request().input("email",sql.NVarChar(256),email.toLowerCase()).query(`SELECT TOP 1 Id,Email,DisplayName,PasswordHash,MustChangePassword,FailedLoginCount,LockedUntil,IsActive FROM auth.Users WHERE LOWER(Email)=@email`);
      const user=res.recordset[0];
      if(user){
        if(!user.IsActive){await writeLoginHistory(email,false,String(user.Id),"Account inactive");return {ok:false,error:"This account is inactive. Contact an administrator."} as const}
        if(user.LockedUntil&&new Date(user.LockedUntil)>new Date()){await writeLoginHistory(email,false,String(user.Id),"Account locked");return {ok:false,error:"Account temporarily locked because of repeated failed sign-in attempts."} as const}
        const valid=await verifyPassword(password,user.PasswordHash);
        if(!valid){const max=Number(process.env.LOGIN_MAX_ATTEMPTS||5);const lockMinutes=Number(process.env.LOGIN_LOCK_MINUTES||15);await db.request().input("id",sql.UniqueIdentifier,user.Id).input("max",sql.Int,max).input("lock",sql.Int,lockMinutes).query(`UPDATE auth.Users SET FailedLoginCount=FailedLoginCount+1,LockedUntil=CASE WHEN FailedLoginCount+1>=@max THEN DATEADD(MINUTE,@lock,SYSUTCDATETIME()) ELSE LockedUntil END WHERE Id=@id`);await writeLoginHistory(email,false,String(user.Id),"Invalid password");return {ok:false,error:"Invalid email or password."} as const}
        await db.request().input("id",sql.UniqueIdentifier,user.Id).query(`UPDATE auth.Users SET FailedLoginCount=0,LockedUntil=NULL,LastLoginAt=SYSUTCDATETIME() WHERE Id=@id`);
        const identity=await loadIdentity(String(user.Id));if(!identity)return {ok:false,error:"Unable to load account permissions."} as const;await setSession(identity,remember);await writeLoginHistory(email,true,String(user.Id));return {ok:true,mustChangePassword:identity.mustChangePassword} as const;
      }
      // Initial setup path: provision the environment bootstrap admin into SQL Server.
      if(validateBootstrapCredentials(email,password)){
        const hash=await hashPassword(password);const name=process.env.BOOTSTRAP_ADMIN_NAME||"System Administrator";
        const insert=await db.request().input("email",sql.NVarChar(256),email.toLowerCase()).input("name",sql.NVarChar(150),name).input("hash",sql.NVarChar(500),hash).query(`DECLARE @id uniqueidentifier=NEWID();INSERT auth.Users(Id,Email,DisplayName,PasswordHash,MustChangePassword,IsActive) VALUES(@id,@email,@name,@hash,1,1);DECLARE @role uniqueidentifier=(SELECT Id FROM auth.Roles WHERE Code='SUPER_ADMIN');IF @role IS NOT NULL INSERT auth.UserRoles(UserId,RoleId) VALUES(@id,@role);SELECT @id Id`);
        const id=String(insert.recordset[0].Id);const identity=await loadIdentity(id);if(identity){await setSession(identity,remember);await writeLoginHistory(email,true,id);return {ok:true,mustChangePassword:true} as const}
      }
    }catch(error){console.error("Database authentication failed",error);return {ok:false,error:"Authentication service is temporarily unavailable. Check the database connection."} as const}
  }
  if(!databaseConfigured()&&validateBootstrapCredentials(email,password)){
    await setSession({userId:null,email,name:process.env.BOOTSTRAP_ADMIN_NAME||"System Administrator",role:"Super Administrator",roleCode:"SUPER_ADMIN",permissions:["*"],mustChangePassword:false,source:"bootstrap"},remember);return {ok:true,mustChangePassword:false} as const;
  }
  return {ok:false,error:"Invalid email or password."} as const;
}

export async function getSession(){const store=await cookies();const session=decode(store.get(COOKIE)?.value);if(!session)return null;if(session.source==="database"&&session.userId&&databaseConfigured()){try{const identity=await loadIdentity(session.userId);if(!identity){await clearSession();return null}return {...session,...identity}}catch{return session}}return session}
export async function clearSession(){const store=await cookies();store.set(COOKIE,"",{httpOnly:true,path:"/",expires:new Date(0)})}
