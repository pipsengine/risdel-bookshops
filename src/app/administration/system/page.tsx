import { AppShell } from "@/components/app-shell";
import { appConfig } from "@/config/app";
import { getConfiguredProviderName, persistenceHealth } from "@/data";
import { databaseConfigured } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SystemInfo() {
  const persistence = await persistenceHealth();
  const provider = getConfiguredProviderName();
  const providerLabel =
    provider === "google-sheets"
      ? "Google Sheets"
      : provider === "sql-server"
        ? "Microsoft SQL Server"
        : "PostgreSQL";

  return (
    <AppShell active="Administration">
      <main className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">System information</h1>
            <p className="page-desc">Environment, platform configuration and foundation health.</p>
          </div>
          <span className="badge badge-success">Operational</span>
        </div>

        <div className="system-grid">
          <section className="card section">
            <h2>Application</h2>
            <p>Current application identity and runtime.</p>
            <div style={{ marginTop: 14 }}>
              <div className="setting-row"><span>System</span><strong>{appConfig.name}</strong></div>
              <div className="setting-row"><span>Company</span><strong>{appConfig.company}</strong></div>
              <div className="setting-row"><span>Version</span><strong>{appConfig.version}</strong></div>
              <div className="setting-row">
                <span>Environment</span>
                <strong style={{ textTransform: "capitalize" }}>{appConfig.environment}</strong>
              </div>
              <div className="setting-row"><span>Timezone</span><strong>{appConfig.timezone}</strong></div>
              <div className="setting-row"><span>Currency</span><strong>{appConfig.currency}</strong></div>
            </div>
          </section>

          <section className="card section">
            <h2>Service health</h2>
            <p>Connection readiness without exposing credentials.</p>
            <div style={{ marginTop: 14 }}>
              <div className="setting-row">
                <span>Application</span>
                <strong><span className="badge badge-success">Healthy</span></strong>
              </div>
              <div className="setting-row">
                <span>Data provider</span>
                <strong>{providerLabel}</strong>
              </div>
              <div className="setting-row">
                <span>Provider status</span>
                <strong>
                  <span
                    className={`badge ${
                      persistence.status === "Healthy" ? "badge-success" : "badge-warning"
                    }`}
                  >
                    {persistence.status}
                  </span>
                </strong>
              </div>
              {persistence.spreadsheetIdMasked && (
                <div className="setting-row">
                  <span>Spreadsheet</span>
                  <strong>{persistence.spreadsheetIdMasked}</strong>
                </div>
              )}
              <div className="setting-row">
                <span>SQL configured</span>
                <strong>{databaseConfigured() ? "Yes" : "No"}</strong>
              </div>
              <div className="setting-row">
                <span>Storage</span>
                <strong><span className="badge badge-success">Ready</span></strong>
              </div>
            </div>
          </section>
        </div>

        <section className="card section" style={{ marginTop: 18 }}>
          <h2>Persistence detail</h2>
          <p>{persistence.detail}</p>
          {persistence.lastSuccessfulReadAt && (
            <p className="muted" style={{ marginTop: 8 }}>
              Last successful read: {persistence.lastSuccessfulReadAt}
            </p>
          )}
          <div style={{ marginTop: 14 }}>
            <Link className="btn btn-secondary" href="/administration/data-provider">
              Open data provider diagnostics
            </Link>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
