import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { appConfig } from "@/config/app";
import { can, requirePermission } from "@/lib/authz";
import { persistenceHealth } from "@/data";
import { listBranches } from "@/features/organisation/data";
import { executiveDashboardData } from "@/features/dashboard/data";

type Params={branch?:string};
const money=new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0});
const number=new Intl.NumberFormat("en-NG",{maximumFractionDigits:0});

export default async function Dashboard({searchParams}:{searchParams:Promise<Params>}){
  const session=await requirePermission("dashboard.view");
  const params=await searchParams;
  const branches=await listBranches();
  const validBranch=branches.find((b:any)=>String(b.Id)===params.branch);
  const scope=validBranch?{branchId:String(validBranch.Id)}:{};
  const [data,db]=await Promise.all([executiveDashboardData(scope),persistenceHealth()]);
  const now=new Date();
  const hour=Number(new Intl.DateTimeFormat("en-GB",{hour:"2-digit",hour12:false,timeZone:appConfig.timezone}).format(now));
  const greeting=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const dateLabel=new Intl.DateTimeFormat("en-GB",{weekday:"long",day:"2-digit",month:"long",year:"numeric",timeZone:appConfig.timezone}).format(now);
  const branchName=validBranch?.Name||"All branches";
  const businessReady=data.domains.sales||data.domains.inventory||data.domains.procurement||data.domains.finance;
  const executiveVisible=can(session,"dashboard.executive.view");
  const financialVisible=executiveVisible&&can(session,"dashboard.financial.view");
  const securityVisible=can(session,"dashboard.security.view");

  return <AppShell active="Dashboard"><main className="page executive-page">
    <div className="executive-head">
      <div><div className="eyebrow">Executive workspace · {dateLabel}</div><h1 className="page-title">{greeting}, {session.name.split(" ")[0]}</h1><p className="page-desc">A controlled view of Risdel Enterprise operations, readiness, security and emerging business performance.</p></div>
      <div className="dashboard-controls"><form method="get" className="branch-filter"><label htmlFor="branch">Operating scope</label><select id="branch" name="branch" defaultValue={validBranch?String(validBranch.Id):""}><option value="">All branches</option>{branches.filter((b:any)=>b.IsActive).map((b:any)=><option key={String(b.Id)} value={String(b.Id)}>{b.Name}</option>)}</select><button className="btn btn-secondary btn-xs" type="submit">Apply</button></form><span className="badge badge-info">v{appConfig.version}</span></div>
    </div>

    {!data.connected&&<div className="alert alert-warning dashboard-alert">The data provider (Google Sheets) is not configured or unavailable in this environment. The dashboard remains usable as a setup preview, but live management metrics require a healthy Sheets connection.</div>}

    <section className="exec-kpi-grid">
      <Kpi label="Sales today" value={financialVisible?formatMoney(data.business.salesToday):"Restricted"} meta={financialVisible?(data.domains.sales?"Live sales metric":"Activates with Sales module"):"Financial dashboard permission required"} status={financialVisible&&data.domains.sales?"live":"planned"}/>
      <Kpi label="Gross profit · month" value={financialVisible?formatMoney(data.business.grossProfitMonth):"Restricted"} meta={financialVisible?(data.domains.sales?"Current month":"Activates with Sales module"):"Financial dashboard permission required"} status={financialVisible&&data.domains.sales?"live":"planned"}/>
      <Kpi label="Inventory value" value={executiveVisible?formatMoney(data.business.inventoryValue):"Restricted"} meta={executiveVisible?(data.domains.inventory?`${formatNumber(data.business.lowStock)} low-stock items`:"Activates with Inventory module"):"Executive dashboard permission required"} status={executiveVisible&&data.domains.inventory?"live":"planned"}/>
      <Kpi label="Net exposure" value={financialVisible?netExposure(data.business.receivables,data.business.payables):"Restricted"} meta={financialVisible?(data.domains.finance?"Receivables less payables":"Activates with Finance module"):"Financial dashboard permission required"} status={financialVisible&&data.domains.finance?"live":"planned"}/>
    </section>

    <div className="executive-main-grid">
      <div className="executive-stack">
        <section className="card section performance-panel">
          <div className="section-heading"><div><h2>Business performance</h2><p>{branchName} · live metrics only; unavailable domains are never fabricated.</p></div><span className={`badge ${businessReady?"badge-success":"badge-neutral"}`}>{businessReady?"Live domains connected":"Foundation stage"}</span></div>
          <div className="performance-grid">
            <Metric label="Revenue this month" value={financialVisible?formatMoney(data.business.salesMonth):"Restricted"} ready={financialVisible&&data.domains.sales} restricted={!financialVisible}/>
            <Metric label="Transactions today" value={executiveVisible?formatNumber(data.business.transactionsToday):"Restricted"} ready={executiveVisible&&data.domains.sales} restricted={!executiveVisible}/>
            <Metric label="Receivables" value={financialVisible?formatMoney(data.business.receivables):"Restricted"} ready={financialVisible&&data.domains.finance} restricted={!financialVisible}/>
            <Metric label="Payables" value={financialVisible?formatMoney(data.business.payables):"Restricted"} ready={financialVisible&&data.domains.finance} restricted={!financialVisible}/>
            <Metric label="Open purchase orders" value={executiveVisible?formatNumber(data.business.purchaseOrdersOpen):"Restricted"} ready={executiveVisible&&data.domains.procurement} restricted={!executiveVisible}/>
            <Metric label="Low-stock items" value={executiveVisible?formatNumber(data.business.lowStock):"Restricted"} ready={executiveVisible&&data.domains.inventory} restricted={!executiveVisible}/>
          </div>
          <div className="domain-readiness"><Domain name="Catalogue" installed={data.domains.catalogue}/><Domain name="Inventory" installed={data.domains.inventory}/><Domain name="Sales" installed={data.domains.sales}/><Domain name="Procurement" installed={data.domains.procurement}/><Domain name="Finance" installed={data.domains.finance}/></div>
        </section>

        <section className="card section">
          <div className="section-heading"><div><h2>Operating footprint</h2><p>Current organisational capacity for {branchName}.</p></div>{can(session,"organisation.overview.view")&&<Link className="text-link" href="/organisation">Open organisation →</Link>}</div>
          <div className="footprint-grid"><Footprint value={data.organisation.ActiveBranches} label="Active branches" note="Enabled operating locations"/><Footprint value={data.organisation.ActiveWarehouses} label="Warehouses" note="Active stock locations"/><Footprint value={data.organisation.SalesLocations} label="Sales locations" note="Warehouses permitted to sell"/><Footprint value={data.organisation.NegativeStockLocations} label="Negative-stock enabled" note={data.organisation.NegativeStockLocations?"Requires management review":"Control operating normally"} risk={Boolean(data.organisation.NegativeStockLocations)}/></div>
        </section>

        <section className="card section">
          <div className="section-heading"><div><h2>Recent controlled activity</h2><p>Latest auditable changes across the application.</p></div>{can(session,"security.overview.view")&&<Link className="text-link" href="/administration/security">Security centre →</Link>}</div>
          {data.activity.length?<div className="activity-feed">{data.activity.map((a:any,i:number)=><div className="activity-item" key={`${a.OccurredAt}-${i}`}><span className="activity-symbol">{String(a.Action||"A").slice(0,1)}</span><div><strong>{a.Description||`${a.Action} · ${a.EntityType||a.Module}`}</strong><span>{a.DisplayName||"System"} · {a.Module}</span></div><time>{formatDateTime(a.OccurredAt)}</time></div>)}</div>:<div className="empty-state"><strong>No audit activity yet</strong><span>Controlled business and administration events will appear here as the team uses Risdel Bookshops.</span></div>}
        </section>
      </div>

      <aside className="executive-stack">
        <section className="card section attention-card"><div className="section-heading"><div><h2>Management attention</h2><p>Exceptions requiring visibility.</p></div><span className="attention-count">{data.alerts.length+(securityVisible?Number(data.security.LockedUsers||0)+Number(data.security.FailedLogins7d||0):0)}</span></div>
          <div className="attention-list">
            {securityVisible&&Number(data.security.LockedUsers)>0&&<Attention severity="critical" title={`${data.security.LockedUsers} locked account${data.security.LockedUsers===1?"":"s"}`} detail="Review account security before unlocking."/>}
            {securityVisible&&Number(data.security.FailedLogins7d)>0&&<Attention severity="warning" title={`${data.security.FailedLogins7d} failed sign-in${data.security.FailedLogins7d===1?"":"s"} in 7 days`} detail="Review login history for unusual activity."/>}
            {securityVisible&&Number(data.security.PasswordChangesDue)>0&&<Attention severity="info" title={`${data.security.PasswordChangesDue} password change${data.security.PasswordChangesDue===1?"":"s"} due`} detail="Users must change temporary passwords at sign-in."/>}
            {data.alerts.map((a:any,i:number)=><Attention key={i} severity={String(a.Severity).toLowerCase()} title={a.Title} detail={a.Message}/>) }
            {!data.alerts.length&&(!securityVisible||(!Number(data.security.LockedUsers)&&!Number(data.security.FailedLogins7d)&&!Number(data.security.PasswordChangesDue)))&&<div className="attention-clear"><span>✓</span><div><strong>No active exceptions</strong><small>Nothing requires immediate management attention.</small></div></div>}
          </div>
        </section>

        {securityVisible&&<section className="card section"><h2>Access & security</h2><p>Company-wide identity controls.</p><div className="security-score-grid"><div><span>Active users</span><strong>{data.security.ActiveUsers}</strong></div><div><span>Active roles</span><strong>{data.security.ActiveRoles}</strong></div><div><span>Locked</span><strong className={data.security.LockedUsers?"danger-text":""}>{data.security.LockedUsers}</strong></div><div><span>Inactive</span><strong>{data.security.InactiveUsers}</strong></div></div>{can(session,"admin.users.view")&&<Link href="/administration/users" className="btn btn-secondary full-button">Manage users</Link>}</section>}

        <section className="card section"><h2>Quick actions</h2><p>Common setup and management tasks.</p><div className="quick-action-list">{can(session,"organisation.company.view")&&<Quick href="/administration/company" title="Company profile" detail="Business identity & defaults"/>}{can(session,"organisation.branches.view")&&<Quick href="/administration/branches" title="Branches" detail="Operating locations"/>}{can(session,"organisation.warehouses.view")&&<Quick href="/administration/warehouses" title="Warehouses" detail="Stock locations & controls"/>}{can(session,"admin.roles.view")&&<Quick href="/administration/roles" title="Roles & permissions" detail="Access control matrix"/>}</div></section>

        <section className="card section system-strip"><div><span>Data provider</span><strong className={db.status==="Healthy"?"success-text":"warning-text"}>{db.status}</strong></div><div><span>Environment</span><strong>{appConfig.environment}</strong></div><div><span>Release</span><strong>{appConfig.version}</strong></div></section>
      </aside>
    </div>
  </main></AppShell>;
}

function Kpi({label,value,meta,status}:{label:string;value:string;meta:string;status:"live"|"planned"}){return <div className="card executive-kpi"><div className="kpi-top"><span>{label}</span><i className={`metric-dot ${status}`}/></div><strong>{value}</strong><small>{meta}</small></div>}
function Metric({label,value,ready,restricted=false}:{label:string;value:string;ready:boolean;restricted?:boolean}){return <div className={`performance-metric ${ready?"":"metric-muted"}`}><span>{label}</span><strong>{restricted?"Restricted":ready?value:"Not available"}</strong><small>{restricted?"Additional permission required":ready?"Current operational metric":"Module not installed"}</small></div>}
function Domain({name,installed}:{name:string;installed:boolean}){return <div className={installed?"domain-chip installed":"domain-chip"}><i/>{name}<span>{installed?"Connected":"Pending"}</span></div>}
function Footprint({value,label,note,risk=false}:{value:number;label:string;note:string;risk?:boolean}){return <div className={risk?"footprint-card risk":"footprint-card"}><strong>{value}</strong><span>{label}</span><small>{note}</small></div>}
function Attention({severity,title,detail}:{severity:string;title:string;detail:string}){return <div className={`attention-item ${severity}`}><i/><div><strong>{title}</strong><span>{detail}</span></div></div>}
function Quick({href,title,detail}:{href:string;title:string;detail:string}){return <Link href={href} className="quick-action"><span>→</span><div><strong>{title}</strong><small>{detail}</small></div></Link>}
function formatMoney(v:number|null){return v==null?"—":money.format(v)}
function formatNumber(v:number|null){return v==null?"—":number.format(v)}
function netExposure(r:number|null,p:number|null){return r==null||p==null?"—":money.format(r-p)}
function formatDateTime(v:any){if(!v)return "";return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",timeZone:appConfig.timezone}).format(new Date(v))}
