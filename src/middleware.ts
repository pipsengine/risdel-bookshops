import { NextRequest,NextResponse } from "next/server";
const publicPaths=["/login","/api/health"];
export function middleware(req:NextRequest){const p=req.nextUrl.pathname;if(publicPaths.some(x=>p.startsWith(x))||p.startsWith('/_next')||p==='/favicon.ico')return NextResponse.next();if(!req.cookies.get('risdel_session'))return NextResponse.redirect(new URL('/login',req.url));return NextResponse.next()}
export const config={matcher:["/((?!_next/static|_next/image).*)"]};
