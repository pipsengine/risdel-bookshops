import { AppShell } from "@/components/app-shell";
import { getConfiguredProviderName, getDataProvider } from "@/data";
import { DataProviderActions } from "./DataProviderActions";

export const dynamic = "force-dynamic";

export default async function DataProviderPage() {
  const providerName = getConfiguredProviderName();
  const diagnostics = await getDataProvider().diagnostics();
  const providerLabel =
    providerName === "google-sheets"
      ? "Google Sheets"
      : providerName === "sql-server"
        ? "Microsoft SQL Server"
        : "PostgreSQL";

  return (
    <AppShell active="Administration">
      <main className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Data provider</h1>
            <p className="page-desc">
              Diagnostics for the active persistence provider. Credentials are never displayed.
            </p>
          </div>
          <span
            className={`badge ${
              diagnostics.status === "Healthy" ? "badge-success" : "badge-warning"
            }`}
          >
            {diagnostics.status}
          </span>
        </div>

        <div className="system-grid">
          <section className="card section">
            <h2>Current provider</h2>
            <p>Configured through DATA_PROVIDER. Business modules never select the backend.</p>
            <div style={{ marginTop: 14 }}>
              <div className="setting-row"><span>Provider</span><strong>{providerLabel}</strong></div>
              <div className="setting-row">
                <span>Status</span>
                <strong>{diagnostics.status}</strong>
              </div>
              <div className="setting-row">
                <span>Spreadsheet</span>
                <strong>
                  {diagnostics.spreadsheetConfigured
                    ? diagnostics.spreadsheetIdMasked || "Configured"
                    : "Not applicable"}
                </strong>
              </div>
              <div className="setting-row">
                <span>Required sheets</span>
                <strong>
                  {diagnostics.availableCount} / {diagnostics.totalCount} available
                </strong>
              </div>
              <div className="setting-row">
                <span>Schema version</span>
                <strong>{diagnostics.schemaVersion || "—"}</strong>
              </div>
              <div className="setting-row">
                <span>Last check</span>
                <strong>{diagnostics.lastCheckedAt}</strong>
              </div>
            </div>
            <DataProviderActions />
          </section>

          <section className="card section">
            <h2>Detail</h2>
            <p>{diagnostics.detail}</p>
            {providerName === "google-sheets" && (
              <div className="table-wrap" style={{ marginTop: 16 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Sheet</th>
                      <th>Present</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnostics.requiredSheets.map((sheet) => (
                      <tr key={sheet.name}>
                        <td>{sheet.name}</td>
                        <td>
                          <span
                            className={`badge ${
                              sheet.present ? "badge-success" : "badge-warning"
                            }`}
                          >
                            {sheet.present ? "Yes" : "Missing"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
