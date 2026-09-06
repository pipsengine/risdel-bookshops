import type { DataProvider } from "@/data/contracts/data-provider";
import { databaseHealth } from "@/lib/db";
export const sqlServerProvider:DataProvider={name:"sql-server",health:databaseHealth};
