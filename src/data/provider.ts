import { usingGoogleSheets } from "@/lib/data-provider";
import { googleSheetsProvider } from "@/data/providers/google-sheets/provider";
import { sqlServerProvider } from "@/data/providers/sql-server/provider";
export function getDataProvider(){return usingGoogleSheets()?googleSheetsProvider:sqlServerProvider}
