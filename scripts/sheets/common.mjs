import "dotenv/config";
import { google } from "googleapis";
import crypto from "crypto";
export function spreadsheetId(){return process.env.GOOGLE_SHEETS_SPREADSHEET_ID;}
function credentials(){const client_email=process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;const private_key=process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g,"\n");if(!spreadsheetId()||!client_email||!private_key)throw new Error("Set GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in .env.local or the process environment.");return {client_email,private_key}}
export async function sheets(){const auth=new google.auth.GoogleAuth({credentials:credentials(),scopes:["https://www.googleapis.com/auth/spreadsheets"]});return google.sheets({version:"v4",auth})}
export function id(){return crypto.randomUUID()}
export function now(){return new Date().toISOString()}
export async function hashPassword(password){const salt=crypto.randomBytes(16).toString("hex");const key=await new Promise((resolve,reject)=>crypto.scrypt(password,salt,64,(e,k)=>e?reject(e):resolve(k)));return `scrypt$${salt}$${key.toString("hex")}`}
export async function loadEnvFile(){if(process.env.GOOGLE_SHEETS_SPREADSHEET_ID)return;try{const dotenv=await import("dotenv");dotenv.config({path:".env.local"})}catch{}}
