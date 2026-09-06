import { getDataProvider, persistenceHealth } from "@/data";

export type DashboardScope = { branchId?: string | null };

type MetricRecord = {
  MetricKey: string;
  NumericValue: number | null;
  TextValue: string | null;
  UpdatedAt: string | null;
};

export async function executiveDashboardData(scope: DashboardScope = {}) {
  const health = await persistenceHealth();
  if (health.status !== "Healthy" && health.status !== "Degraded") {
    return emptyDashboard(
      health.status === "Not configured"
        ? "Data provider not configured"
        : health.detail || "Data provider unavailable"
    );
  }

  try {
    const db = getDataProvider();
    const [branches, warehouses, users, roles, login, audits, metrics, alerts] = await Promise.all([
      db.branches.findMany({ pageSize: 500 }),
      db.warehouses.findMany({ pageSize: 500 }),
      db.users.findMany({ pageSize: 500 }),
      db.roles.findMany({ pageSize: 200, activeOnly: true }),
      db.loginHistory.findMany({ pageSize: 500 }),
      db.audit.findMany({ pageSize: 20 }),
      db.dashboard.listMetrics(),
      db.dashboard.listAlerts()
    ]);

    const scopedBranches = scope.branchId
      ? branches.items.filter((b) => b.id === scope.branchId)
      : branches.items;
    const scopedBranchIds = new Set(scopedBranches.map((b) => b.id));
    const scopedWarehouses = warehouses.items.filter((w) => scopedBranchIds.has(w.branchId));

    const weekAgo = Date.now() - 7 * 24 * 3600_000;
    const now = Date.now();
    const userMap = new Map(users.items.map((u) => [u.id, u.displayName]));

    const metricMap = Object.fromEntries(
      metrics
        .filter((m) => m.isActive)
        .map((m) => {
          const numeric = Number(m.value);
          const record: MetricRecord = {
            MetricKey: m.metricKey,
            NumericValue: Number.isFinite(numeric) ? numeric : null,
            TextValue: m.value,
            UpdatedAt: m.updatedAt ?? null
          };
          return [m.metricKey, record] as const;
        })
    );

    const activity = audits.items.slice(0, 8).map((a) => ({
      Action: a.action,
      Module: a.module,
      EntityType: a.entityType,
      Description: a.description,
      OccurredAt: a.occurredAt,
      DisplayName: a.userId ? userMap.get(a.userId) ?? null : null
    }));

    const alertRows = alerts
      .filter((a) => a.isActive && (!a.expiresAt || new Date(a.expiresAt).getTime() > now))
      .slice(0, 8)
      .map((a) => ({
        Severity: a.severity,
        Title: a.title,
        Message: a.message,
        Link: null as string | null,
        CreatedAt: a.createdAt
      }));

    return {
      connected: true,
      organisation: {
        ActiveBranches: scopedBranches.filter((b) => b.isActive).length,
        ActiveWarehouses: scopedWarehouses.filter((w) => w.isActive).length,
        SalesLocations: scopedWarehouses.filter((w) => w.isActive && w.allowSales).length,
        NegativeStockLocations: scopedWarehouses.filter(
          (w) => w.isActive && w.allowNegativeStock
        ).length
      },
      security: {
        ActiveUsers: users.items.filter((u) => u.isActive).length,
        InactiveUsers: users.items.filter((u) => !u.isActive).length,
        LockedUsers: users.items.filter(
          (u) => u.lockedUntil && new Date(u.lockedUntil).getTime() > now
        ).length,
        PasswordChangesDue: users.items.filter((u) => u.isActive && u.mustChangePassword).length,
        ActiveRoles: roles.items.length,
        FailedLogins7d: login.items.filter(
          (h) => !h.wasSuccessful && new Date(h.occurredAt).getTime() >= weekAgo
        ).length
      },
      activity,
      alerts: alertRows,
      business: {
        salesToday: value(metricMap, "sales.revenue.today"),
        salesMonth: value(metricMap, "sales.revenue.month"),
        grossProfitMonth: value(metricMap, "sales.gross_profit.month"),
        transactionsToday: value(metricMap, "sales.transactions.today"),
        inventoryValue: value(metricMap, "inventory.value"),
        lowStock: value(metricMap, "inventory.low_stock"),
        receivables: value(metricMap, "finance.receivables"),
        payables: value(metricMap, "finance.payables"),
        purchaseOrdersOpen: value(metricMap, "procurement.po.open"),
        updatedAt: newest(metricMap)
      },
      domains: {
        catalogue: false,
        inventory: false,
        sales: false,
        procurement: false,
        finance: false
      }
    };
  } catch (error) {
    console.error("Executive dashboard load failed", error);
    return emptyDashboard(
      error instanceof Error ? error.message : "Unable to load dashboard data"
    );
  }
}

function value(map: Record<string, MetricRecord>, key: string) {
  const m = map[key];
  return m?.NumericValue == null ? null : Number(m.NumericValue);
}

function newest(map: Record<string, MetricRecord>) {
  const dates = Object.values(map)
    .map((x) => (x.UpdatedAt ? new Date(x.UpdatedAt).getTime() : 0))
    .filter(Boolean);
  return dates.length ? new Date(Math.max(...dates)).toISOString() : null;
}

function emptyDashboard(reason: string) {
  return {
    connected: false,
    reason,
    organisation: {
      ActiveBranches: 0,
      ActiveWarehouses: 0,
      SalesLocations: 0,
      NegativeStockLocations: 0
    },
    security: {
      ActiveUsers: 0,
      InactiveUsers: 0,
      LockedUsers: 0,
      PasswordChangesDue: 0,
      ActiveRoles: 0,
      FailedLogins7d: 0
    },
    activity: [] as {
      Action: string;
      Module: string;
      EntityType?: string | null;
      Description?: string | null;
      OccurredAt: string;
      DisplayName?: string | null;
    }[],
    alerts: [] as {
      Severity: string;
      Title: string;
      Message: string;
      Link: string | null;
      CreatedAt: string;
    }[],
    business: {
      salesToday: null as number | null,
      salesMonth: null as number | null,
      grossProfitMonth: null as number | null,
      transactionsToday: null as number | null,
      inventoryValue: null as number | null,
      lowStock: null as number | null,
      receivables: null as number | null,
      payables: null as number | null,
      purchaseOrdersOpen: null as number | null,
      updatedAt: null as string | null
    },
    domains: {
      catalogue: false,
      inventory: false,
      sales: false,
      procurement: false,
      finance: false
    }
  };
}
