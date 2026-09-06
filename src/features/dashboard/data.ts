import { usingGoogleSheets } from "@/lib/data-provider";
import { gsDashboard } from "@/data/google-services";
import { executiveDashboardData as sqlDashboard } from "@/data/providers/sql-server/legacy/dashboard-data";
export type DashboardScope={branchId?:string|null};
export function executiveDashboardData(scope:DashboardScope={}){return usingGoogleSheets()?gsDashboard(scope):sqlDashboard(scope)}
