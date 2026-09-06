import { dataProviderName,usingGoogleSheets } from "@/lib/data-provider";
import { databaseHealth } from "@/lib/db";
import { sheetsHealth } from "@/lib/sheets";
export async function persistenceHealth(){const health=usingGoogleSheets()?await sheetsHealth():await databaseHealth();return {provider:dataProviderName(),...health}}
