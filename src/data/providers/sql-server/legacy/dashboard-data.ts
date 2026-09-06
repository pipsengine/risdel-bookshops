import sql from "mssql";
import { databaseConfigured, getDb } from "@/lib/db";

type MetricRecord={MetricKey:string;NumericValue:number|null;TextValue:string|null;UpdatedAt:Date|null};
export type DashboardScope={branchId?:string|null};

export async function executiveDashboardData(scope:DashboardScope={}){
  if(!databaseConfigured()) return emptyDashboard("Database not configured");
  const db=await getDb();
  const req=db.request();
  if(scope.branchId) req.input("branchId",sql.UniqueIdentifier,scope.branchId);
  const branchFilter=scope.branchId?" AND b.Id=@branchId":"";

  const [org,security,activity,metrics,alerts]=await Promise.all([
    req.query(`SELECT
      (SELECT COUNT(*) FROM system.Branches b WHERE b.IsActive=1 ${branchFilter}) ActiveBranches,
      (SELECT COUNT(*) FROM system.Warehouses w JOIN system.Branches b ON b.Id=w.BranchId WHERE w.IsActive=1 ${branchFilter}) ActiveWarehouses,
      (SELECT COUNT(*) FROM system.Warehouses w JOIN system.Branches b ON b.Id=w.BranchId WHERE w.IsActive=1 AND w.AllowSales=1 ${branchFilter}) SalesLocations,
      (SELECT COUNT(*) FROM system.Warehouses w JOIN system.Branches b ON b.Id=w.BranchId WHERE w.IsActive=1 AND w.AllowNegativeStock=1 ${branchFilter}) NegativeStockLocations`),
    db.request().query(`SELECT
      (SELECT COUNT(*) FROM auth.Users WHERE IsActive=1) ActiveUsers,
      (SELECT COUNT(*) FROM auth.Users WHERE IsActive=0) InactiveUsers,
      (SELECT COUNT(*) FROM auth.Users WHERE LockedUntil>SYSUTCDATETIME()) LockedUsers,
      (SELECT COUNT(*) FROM auth.Users WHERE MustChangePassword=1 AND IsActive=1) PasswordChangesDue,
      (SELECT COUNT(*) FROM auth.Roles WHERE IsActive=1) ActiveRoles,
      (SELECT COUNT(*) FROM audit.LoginHistory WHERE WasSuccessful=0 AND OccurredAt>=DATEADD(DAY,-7,SYSUTCDATETIME())) FailedLogins7d`),
    db.request().query(`SELECT TOP 8 a.Action,a.Module,a.EntityType,a.Description,a.OccurredAt,u.DisplayName
      FROM audit.AuditLogs a LEFT JOIN auth.Users u ON u.Id=a.UserId
      ORDER BY a.OccurredAt DESC`),
    db.request().input("metricBranchId",sql.UniqueIdentifier,scope.branchId||null).query(`IF OBJECT_ID('system.DashboardMetrics') IS NOT NULL
      SELECT MetricKey,NumericValue,TextValue,UpdatedAt FROM system.DashboardMetrics
      WHERE IsCurrent=1 AND (BranchId=@metricBranchId OR (@metricBranchId IS NULL AND BranchId IS NULL));
      ELSE SELECT CAST(NULL AS nvarchar(120)) MetricKey,CAST(NULL AS decimal(19,4)) NumericValue,CAST(NULL AS nvarchar(500)) TextValue,CAST(NULL AS datetime2) UpdatedAt WHERE 1=0;`),
    db.request().input("alertBranchId",sql.UniqueIdentifier,scope.branchId||null).query(`IF OBJECT_ID('system.DashboardAlerts') IS NOT NULL
      SELECT TOP 8 Severity,Title,Message,Link,CreatedAt FROM system.DashboardAlerts
      WHERE IsActive=1 AND (BranchId=@alertBranchId OR BranchId IS NULL) ORDER BY CASE Severity WHEN 'CRITICAL' THEN 1 WHEN 'WARNING' THEN 2 ELSE 3 END,CreatedAt DESC;
      ELSE SELECT CAST(NULL AS nvarchar(20)) Severity,CAST(NULL AS nvarchar(180)) Title,CAST(NULL AS nvarchar(500)) Message,CAST(NULL AS nvarchar(500)) Link,CAST(NULL AS datetime2) CreatedAt WHERE 1=0;`)
  ]);
  const metricMap=Object.fromEntries((metrics.recordset as MetricRecord[]).map(m=>[m.MetricKey,m]));
  return {
    connected:true,
    organisation:org.recordset[0],
    security:security.recordset[0],
    activity:activity.recordset,
    alerts:alerts.recordset,
    business:{
      salesToday:value(metricMap,"sales.revenue.today"),
      salesMonth:value(metricMap,"sales.revenue.month"),
      grossProfitMonth:value(metricMap,"sales.gross_profit.month"),
      transactionsToday:value(metricMap,"sales.transactions.today"),
      inventoryValue:value(metricMap,"inventory.value"),
      lowStock:value(metricMap,"inventory.low_stock"),
      receivables:value(metricMap,"finance.receivables"),
      payables:value(metricMap,"finance.payables"),
      purchaseOrdersOpen:value(metricMap,"procurement.po.open"),
      updatedAt:newest(metricMap)
    },
    domains:{
      catalogue:await tableExists(db,"catalogue.Products"),
      inventory:await tableExists(db,"inventory.StockBalances"),
      sales:await tableExists(db,"sales.Sales"),
      procurement:await tableExists(db,"procurement.PurchaseOrders"),
      finance:await tableExists(db,"finance.Receivables")
    }
  };
}

function value(map:Record<string,MetricRecord>,key:string){const m=map[key];return m?.NumericValue==null?null:Number(m.NumericValue)}
function newest(map:Record<string,MetricRecord>){const dates=Object.values(map).map(x=>x.UpdatedAt?new Date(x.UpdatedAt).getTime():0).filter(Boolean);return dates.length?new Date(Math.max(...dates)):null}
async function tableExists(db:sql.ConnectionPool,name:string){const r=await db.request().input("name",sql.NVarChar(180),name).query(`SELECT CASE WHEN OBJECT_ID(@name,'U') IS NULL THEN 0 ELSE 1 END Installed`);return Boolean(r.recordset[0]?.Installed)}
function emptyDashboard(reason:string){return {connected:false,reason,organisation:{ActiveBranches:0,ActiveWarehouses:0,SalesLocations:0,NegativeStockLocations:0},security:{ActiveUsers:0,InactiveUsers:0,LockedUsers:0,PasswordChangesDue:0,ActiveRoles:0,FailedLogins7d:0},activity:[],alerts:[],business:{salesToday:null,salesMonth:null,grossProfitMonth:null,transactionsToday:null,inventoryValue:null,lowStock:null,receivables:null,payables:null,purchaseOrdersOpen:null,updatedAt:null},domains:{catalogue:false,inventory:false,sales:false,procurement:false,finance:false}}}
