import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE="risdel_session";
type Session={email:string;name:string;role:string;exp:number};
function secret(){return process.env.AUTH_SECRET||"development-secret-change-me-please-32chars"}
function sign(payload:string){return crypto.createHmac("sha256",secret()).update(payload).digest("base64url")}
function encode(s:Session){const body=Buffer.from(JSON.stringify(s)).toString("base64url");return `${body}.${sign(body)}`}
function decode(token?:string):Session|null{if(!token)return null;const [body,sig]=token.split(".");if(!body||!sig)return null;const expected=sign(body);if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;try{const s=JSON.parse(Buffer.from(body,"base64url").toString()) as Session;return s.exp>Date.now()?s:null}catch{return null}}
export async function createSession(email:string,name:string){const hours=Number(process.env.SESSION_HOURS||8);const exp=Date.now()+hours*3600_000;const store=await cookies();store.set(COOKIE,encode({email,name,role:"Super Administrator",exp}),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",expires:new Date(exp)})}
export async function getSession(){const store=await cookies();return decode(store.get(COOKIE)?.value)}
export async function clearSession(){const store=await cookies();store.set(COOKIE,"",{httpOnly:true,path:"/",expires:new Date(0)})}
export function validateBootstrapCredentials(email:string,password:string){const e=process.env.BOOTSTRAP_ADMIN_EMAIL||"admin@risdel.local";const p=process.env.BOOTSTRAP_ADMIN_PASSWORD||"ChangeMe@123";return crypto.timingSafeEqual(Buffer.from(email.toLowerCase().padEnd(128)),Buffer.from(e.toLowerCase().padEnd(128)))&&crypto.timingSafeEqual(Buffer.from(password.padEnd(128)),Buffer.from(p.padEnd(128)))}
