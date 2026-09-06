import { AppShell } from "@/components/app-shell";
import { appConfig } from "@/config/app";
import { getConfiguredProviderName, persistenceHealth } from "@/data";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const persistence = await persistenceHealth();
  const provider = getConfiguredProviderName();
  const providerLabel =
    provider === "google-sheets"
      ? "Google Sheets"
      : provider === "sql-server"
        ? "SQL Server"
        : "PostgreSQL";

  return (
    <AppShell>
      <main className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Good morning</h1>
            <p className="page-desc">
              Welcome to {appConfig.name}. Module 00 foundation with pluggable data providers.
            </p>
          </div>
          <span className="badge badge-success">Foundation v{appConfig.version}</span>
        </div>

        <section className="grid grid-4">
          <div className="card kpi">
            <div className="kpi-label">System foundation</div>
            <div className="kpi-value">100%</div>
            <div className="kpi-meta">Repository, architecture & UI shell</div>
          </div>
          <div className="card kpi">
            <div className="kpi-label">Environment</div>
            <div className="kpi-value" style={{ fontSize: 22, textTransform: "capitalize" }}>
              {appConfig.environment}
            </div>
            <div className="kpi-meta">External configuration enabled</div>
          </div>
          <div className="card kpi">
            <div className="kpi-label">Data provider</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>{persistence.status}</div>
            <div className="kpi-meta">{providerLabel}</div>
          </div>
          <div className="card kpi">
            <div className="kpi-label">Active branch</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>{appConfig.branch}</div>
            <div className="kpi-meta">Multi-branch architecture ready</div>
          </div>
        </section>

        <div className="grid grid-3" style={{ marginTop: 18 }}>
          <section className="card section" style={{ gridColumn: "span 2" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <h2>Implementation progress</h2>
                <p>One evolving repository. Each future module updates this codebase.</p>
              </div>
              <span className="badge badge-info">MODULE 00</span>
            </div>
            <div className="progress-list">
              {[
                ["Project foundation", "Repository, TypeScript, configuration", "Complete"],
                ["Security foundation", "Session security, protected routes, headers", "Complete"],
                ["Data provider abstraction", "Google Sheets active; SQL preserved", "Complete"],
                ["Users, roles & permissions", "Full administration and RBAC UI", "Next"],
                ["Catalogue & inventory", "Books, products and stock operations", "Planned"],
                ["Sales & POS", "Retail transactions and cashier operations", "Planned"]
              ].map(([a, b, c]) => (
                <div className="progress-row" key={a}>
                  <div>
                    <div className="progress-title">{a}</div>
                    <div className="progress-sub">{b}</div>
                  </div>
                  <div />
                  <span
                    className={`badge ${
                      c === "Complete" ? "badge-success" : c === "Next" ? "badge-warning" : "badge-neutral"
                    }`}
                  >
                    {c}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="card section">
            <h2>System health</h2>
            <p>Core service readiness for this environment.</p>
            <div style={{ marginTop: 16 }}>
              <div className="setting-row">
                <span>Application</span>
                <strong className="health"><i className="health-dot" />Healthy</strong>
              </div>
              <div className="setting-row">
                <span>Data provider</span>
                <strong className="health">
                  <i className={`health-dot ${persistence.status === "Healthy" ? "" : "warn"}`} />
                  {providerLabel}
                </strong>
              </div>
              <div className="setting-row">
                <span>Persistence</span>
                <strong className="health">
                  <i className={`health-dot ${persistence.status === "Healthy" ? "" : "warn"}`} />
                  {persistence.status}
                </strong>
              </div>
              <div className="setting-row">
                <span>File storage</span>
                <strong className="health"><i className="health-dot" />Ready</strong>
              </div>
              <div className="setting-row">
                <span>Version</span>
                <strong>{appConfig.version}</strong>
              </div>
            </div>
          </section>
        </div>

        <section className="card section" style={{ marginTop: 18 }}>
          <h2>Foundation capabilities</h2>
          <p>Reusable platform services now available to every future module.</p>
          <div className="quick-grid">
            {[
              ["Authentication shell", "Secure signed session, login and logout"],
              ["Provider abstraction", "Repository contracts over Google Sheets / SQL"],
              ["RBAC architecture", "Permission model ready for Module 01"],
              ["Audit architecture", "Append-only activity schema"],
              ["Notifications", "In-app notification data model"],
              ["Deployment", "Standalone Next.js and IIS documentation"]
            ].map(([a, b]) => (
              <div className="quick-card" key={a}>
                <strong>{a}</strong>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
