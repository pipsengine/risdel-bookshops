import { NextResponse } from "next/server";
import { appConfig } from "@/config/app";
import { persistenceHealth } from "@/lib/persistence-health";
export async function GET(){const persistence=await persistenceHealth();const status=persistence.status==="Unavailable"?503:200;return NextResponse.json({status:status===200?"healthy":"degraded",application:appConfig.name,version:appConfig.version,dataProvider:persistence.provider,persistence:persistence.status,timestamp:new Date().toISOString()},{status})}
