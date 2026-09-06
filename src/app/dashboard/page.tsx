import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/lib/icons";
import { appConfig } from "@/config/app";
import { can, requirePermission } from "@/lib/authz";
import { listBranches } from "@/features/organisation/data";
import { executiveDashboardData } from "@/features/dashboard/data";

type Params={branch?:string};
const money=new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0});
const count=new Intl.NumberFormat("en-NG",{maximumFractionDigits:0});

export default async function Dashboard({searchParams}:{searchParams:Promise<Params>}){
 const session=await requirePermission("dashboard.view");
 const params=await searchParams;
 const branches=await listBranches();
 const validBranch=branches.find((b:any)=>String(b.Id)===params.branch);
 const data:any=await executiveDashboardData(validBranch?{branchId:String(validBranch.Id)}:{});
 const now=new Date();
 const hour=Number(new Intl.DateTimeFormat("en-GB",{hour:"2-digit",hour12:false,timeZone:appConfig.timezone}).format(now));
 const greeting=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
 const dateLabel=new Intl.DateTimeFormat("en-GB",{weekday:"long",day:"2-digit",month:"long",year:"numeric",timeZone:appConfig.timezone}).format(now);
 const financial=can(session,"dashboard.financial.view")||session.roleCode==="SUPER_ADMIN";
 const executive=can(session,"dashboard.executive.view")||session.roleCode==="SUPER_ADMIN";
 const security=can(session,"dashboard.security.view")||session.roleCode==="SUPER_ADMIN";
 const a=data.analytics||{trend:[],topProducts:[],inventory:{total:data.catalogue?.ActiveProducts||0,lowStock:data.business.lowStock||0,outOfStock:0,slowMoving:0},channels:[]};
 const attention=[
  ...(Number(data.business.lowStock||0)>0?[{tone:"danger",value:Number(data.business.lowStock),title:"Low stock items",detail:"Products below reorder level",href:"/inventory/reorder"}]:[]),
  ...(Number(data.business.approvalsPending||0)>0?[{tone:"orange",value:Number(data.business.approvalsPending),title:"Approvals pending",detail:"Requests awaiting management approval",href:"/approvals"}]:[]),
  ...(Number(data.business.overdueInvoices||0)>0?[{tone:"orange",value:Number(data.business.overdueInvoices),title:"Overdue invoices",detail:"Customer balances past due",href:"/finance/receivables"}]:[]),
  ...(Number(data.business.supplierDelays||0)>0?[{tone:"info",value:Number(data.business.supplierDelays),title:"Supplier delays",detail:"Purchase orders past expected delivery",href:"/purchasing/orders"}]:[]),
  ...data.alerts.slice(0,2).map((x:any)=>({tone:severity(x.Severity),value:"!",title:x.Title,detail:x.Message,href:"/notifications"})),
  ...(security&&Number(data.security.PasswordChangesDue||0)>0?[{tone:"neutral",value:Number(data.security.PasswordChangesDue),title:"Password changes due",detail:"Users must update temporary passwords",href:"/administration/users"}]:[])
 ];

 return <AppShell active="Dashboard"><main className="figma-dashboard figma-dashboard-v2">
   <section className="figma-hero figma-hero-v2">
     <div className="figma-hero-copy">
       <small>{dateLabel}</small>
       <h1>{greeting}, {session.name.split(" ")[0]}</h1>
       <p>Here&apos;s what&apos;s happening across your bookshop today.</p>
     </div>
     <div className="figma-quote">
       <span>“Books build people.<br/>People build a better tomorrow.”</span>
       <div className="book-stack" aria-hidden="true"><b>Learn</b><b>Read</b><b>Grow</b><b>Succeed</b></div>
     </div>
   </section>

   <section className="figma-kpis">
     <Kpi icon="cart" tone="blue" label="Sales Today" value={financial?fmtMoney(data.business.salesToday):"Restricted"} meta="Live today"/>
     <Kpi icon="report" tone="green" label="Gross Profit" value={financial?fmtMoney(data.business.grossProfitMonth):"Restricted"} meta="Current month" detail={financial&&data.business.salesMonth?`${marginPct(data.business.grossProfitMonth,data.business.salesMonth)} margin`:undefined}/>
     <Kpi icon="doc" tone="purple" label="Orders Today" value={executive?fmtNum(data.business.transactionsToday):"Restricted"} meta="Completed transactions"/>
     <Kpi icon="wallet" tone="orange" label="Cash Position" value={financial?fmtMoney(data.business.cashPosition):"Restricted"} meta="Across active accounts"/>
   </section>

   <section className="figma-top-grid">
     <div className="figma-card sales-chart-card">
       <CardHead icon="report" title="Sales Performance" subtitle="Revenue trend across all sales channels" action={<span className="chart-pills"><b>Today</b><b>7D</b><b className="active">30D</b><b>12M</b></span>}/>
       <TrendChart rows={a.trend}/>
     </div>

     <div className="figma-card attention-panel">
       <CardHead icon="bell" title="Management Attention" subtitle="Issues requiring your attention" action={<Link href="/notifications">View all</Link>}/>
       <div className="attention-rows">
        {attention.length?attention.slice(0,5).map((x:any,i:number)=><Link href={x.href} className="attention-row" key={`${x.title}-${i}`}><span className={`attention-number ${x.tone}`}>{x.value}</span><span><strong>{x.title}</strong><small>{x.detail}</small></span><b>›</b></Link>):<div className="clean-state"><span className="clean-check">✓</span><strong>No active management exceptions</strong><small>Your monitored business controls are currently clear.</small></div>}
       </div>
     </div>

     <div className="figma-card quick-panel">
       <CardHead icon="plus" title="Quick Actions" subtitle="Manage key tasks quickly"/>
       <div className="quick-tiles">
        {can(session,"sales.pos.access")&&<Quick href="/sales/pos" icon="cart" label="New Sale" tone="blue"/>}
        {can(session,"procurement.receipts.create")&&<Quick href="/purchasing/receipts" icon="package" label="Receive Stock" tone="green"/>}
        {can(session,"procurement.orders.create")&&<Quick href="/purchasing/orders" icon="doc" label="Create PO" tone="purple"/>}
        {can(session,"crm.customers.create")&&<Quick href="/customers" icon="users" label="Add Customer" tone="orange"/>}
        {can(session,"finance.expenses.create")&&<Quick href="/finance/expenses" icon="wallet" label="Record Expense" tone="red"/>}
        {can(session,"reports.view")&&<Quick href="/reports" icon="report" label="View Reports" tone="teal"/>}
       </div>
     </div>
   </section>

   <section className="figma-middle-grid">
     <div className="figma-card"><CardHead icon="sales" title="Sales Channels" subtitle="Last 30 days" action={<Link href="/reports/sales">View details →</Link>}/><ChannelChart rows={a.channels}/></div>
     <div className="figma-card"><CardHead icon="box" title="Inventory Health" subtitle="Current stock status" action={<Link href="/inventory">View inventory →</Link>}/><div className="inventory-health"><Health tone="teal" value={a.inventory.total} label="Total items" icon="box"/><Health tone="blue" value={a.inventory.lowStock} label="Low stock" icon="doc"/><Health tone="red" value={a.inventory.outOfStock} label="Out of stock" icon="plus"/><Health tone="orange" value={a.inventory.slowMoving} label="Slow moving" icon="approve"/></div></div>
     <div className="figma-card"><CardHead icon="finance" title="Financial Position" subtitle="Key financials · this month" action={<Link href="/finance">View finance →</Link>}/><div className="finance-list"><FinanceRow icon="doc" label="Receivables" value={financial?fmtMoney(data.business.receivables):"Restricted"}/><FinanceRow icon="wallet" label="Payables" value={financial?fmtMoney(data.business.payables):"Restricted"}/><FinanceRow icon="report" label="Total Expenses" value={financial?fmtMoney(data.business.expensesMonth):"Restricted"}/><FinanceRow icon="wallet" label="Net Cash Position" value={financial?fmtMoney(data.business.cashPosition):"Restricted"} strong/></div></div>
   </section>

   <section className="figma-bottom-grid">
     <div className="figma-card table-card"><CardHead icon="report" title="Top Selling Products" subtitle="Best performing items this month" action={<Link href="/reports/sales">View all →</Link>}/><TopProducts rows={a.topProducts}/></div>
     <div className="figma-card table-card"><CardHead icon="bell" title="Recent Business Activity" subtitle="Latest transactions and events" action={<Link href="/administration/audit">View all →</Link>}/><Activity rows={data.activity}/></div>
   </section>
 </main></AppShell>
}

function CardHead({icon,title,subtitle,action}:{icon:string;title:string;subtitle:string;action?:ReactNode}){return <div className="figma-card-head"><div><span className="head-icon"><Icon name={icon} size={17}/></span><span><strong>{title}</strong><small>{subtitle}</small></span></div>{action&&<div className="head-action">{action}</div>}</div>}
function Kpi({icon,tone,label,value,meta,detail}:{icon:string;tone:string;label:string;value:string;meta:string;detail?:string}){return <div className={`figma-kpi ${tone}`}><span className="kpi-icon"><Icon name={icon} size={23}/></span><div className="kpi-copy"><small>{label}</small><strong>{value}</strong>{detail&&<em>{detail}</em>}</div><span className="kpi-trend"><i/> {meta}</span></div>}

function TrendChart({rows}:{rows:any[]}){
 const valid=rows?.filter((r:any)=>r?.date);
 if(!valid?.length||valid.every((x:any)=>!Number(x.revenue)&&!Number(x.profit)))return <div className="trend-empty"><Icon name="report" size={31}/><strong>No completed sales trend yet</strong><span>The chart will populate automatically as transactions are completed.</span></div>;
 const max=Math.max(1,...valid.flatMap((x:any)=>[Number(x.revenue||0),Number(x.profit||0)]));
 const pts=(k:string)=>valid.map((r:any,i:number)=>`${i/(valid.length-1||1)*100},${90-(Number(r[k]||0)/max)*72}`).join(" ");
 const last=valid[valid.length-1];
 const labelIndexes=[0,Math.floor((valid.length-1)*.25),Math.floor((valid.length-1)*.5),Math.floor((valid.length-1)*.75),valid.length-1];
 return <div className="trend-wrap">
   <div className="chart-y"><span>{compact(max)}</span><span>{compact(max*.75)}</span><span>{compact(max*.5)}</span><span>{compact(max*.25)}</span><span>0</span></div>
   <div className="trend-tooltip"><small>{formatShortDate(last.date)}</small><span><i className="blue"/>Revenue <b>{fmtMoney(last.revenue)}</b></span><span><i className="green"/>Gross Profit <b>{fmtMoney(last.profit)}</b></span></div>
   <svg className="trend-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="30-day sales trend">
    <defs><linearGradient id="revenueFillV2" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2f80ed" stopOpacity=".24"/><stop offset="100%" stopColor="#2f80ed" stopOpacity="0"/></linearGradient></defs>
    <g className="chart-grid"><path d="M0 18H100M0 36H100M0 54H100M0 72H100M0 90H100"/></g>
    <polygon points={`0,90 ${pts("revenue")} 100,90`} fill="url(#revenueFillV2)"/>
    <polyline points={pts("revenue")} className="line revenue"/>
    <polyline points={pts("profit")} className="line profit"/>
    <circle cx="100" cy={90-(Number(last.revenue||0)/max)*72} r="1.2" className="chart-dot revenue-dot"/>
    <circle cx="100" cy={90-(Number(last.profit||0)/max)*72} r="1.2" className="chart-dot profit-dot"/>
   </svg>
   <div className="chart-x">{labelIndexes.map((idx,i)=><span key={`${idx}-${i}`}>{formatAxisDate(valid[idx]?.date)}</span>)}</div>
   <div className="chart-legend"><span><i className="blue"/>Revenue</span><span><i className="green"/>Gross Profit</span></div>
 </div>
}

function ChannelChart({rows}:{rows:any[]}){
 const vals=(rows||[]).map((x:any)=>({...x,value:Number(x.value||0)}));
 const total=vals.reduce((s:number,x:any)=>s+x.value,0);
 const colors=["#2f80ed","#22b8a8","#f5a623","#7c5ce7"];
 let cumulative=0;
 const stops=vals.map((x:any,i:number)=>{const start=total?cumulative/total*100:0;cumulative+=x.value;const end=total?cumulative/total*100:0;return `${colors[i%colors.length]} ${start}% ${end}%`});
 return <div className="channel-layout"><div className="donut" style={{background:total?`conic-gradient(${stops.join(",")})`:'#eef2f7'}}><div><strong>{fmtMoney(total)}</strong><small>Total Sales</small></div></div><div className="channel-list">{vals.map((x:any,i:number)=><div key={x.name}><span><i style={{background:colors[i%colors.length]}}/>{x.name}</span><strong>{fmtMoney(x.value)} <small>{total?Math.round(x.value/total*100):0}%</small></strong></div>)}</div></div>
}
function Health({tone,value,label,icon}:{tone:string;value:number;label:string;icon:string}){return <div className={`health-tile ${tone}`}><span><Icon name={icon} size={15}/></span><strong>{fmtNum(value)}</strong><small>{label}</small></div>}
function FinanceRow({icon,label,value,strong=false}:{icon:string;label:string;value:string;strong?:boolean}){return <div className={strong?"finance-row strong":"finance-row"}><span><i><Icon name={icon} size={12}/></i>{label}</span><b>{value}</b></div>}
function Quick({href,icon,label,tone}:{href:string;icon:string;label:string;tone:string}){return <Link href={href} className={`quick-tile ${tone}`}><span><Icon name={icon} size={21}/></span><strong>{label}</strong></Link>}
function TopProducts({rows}:{rows:any[]}){return <div className="modern-table products-table"><div className="modern-tr header"><span>#</span><span>Product</span><span>Category</span><span>Units Sold</span><span>Revenue</span></div>{rows?.length?rows.map((x:any,i:number)=><div className="modern-tr" key={i}><span>{i+1}</span><span><strong>{x.name}</strong></span><span>{prettyCategory(x.category)}</span><span>{fmtNum(x.units)}</span><span><b>{fmtMoney(x.revenue)}</b></span></div>):<div className="table-empty">No completed product sales yet.</div>}</div>}
function Activity({rows}:{rows:any[]}){return <div className="modern-table activity-table"><div className="modern-tr header"><span>Time</span><span>Type</span><span>Reference</span><span>Description</span><span>User</span></div>{rows?.length?rows.slice(0,5).map((x:any,i:number)=><div className="modern-tr" key={i}><span>{formatTime(x.OccurredAt)}</span><span><i className={`activity-dot dot-${i%4}`}/>{x.Module||x.Action}</span><span className="activity-ref">{shortRef(x.EntityId||x.EntityType)}</span><span>{x.Description||`${x.Action} ${x.EntityType||"record"}`}</span><span>{x.DisplayName||"System"}</span></div>):<div className="table-empty">No recent controlled activity.</div>}</div>}
function fmtMoney(v:any){return v==null||Number.isNaN(Number(v))?"—":money.format(Number(v))}
function fmtNum(v:any){return v==null?"—":count.format(Number(v)||0)}
function compact(v:number){if(v>=1e6)return `₦${(v/1e6).toFixed(1)}M`;if(v>=1e3)return `₦${Math.round(v/1e3)}K`;return `₦${Math.round(v)}`}
function formatTime(v:any){if(!v)return "—";return new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",timeZone:appConfig.timezone}).format(new Date(v))}
function formatShortDate(v:any){if(!v)return "";return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric",timeZone:appConfig.timezone}).format(new Date(v))}
function formatAxisDate(v:any){if(!v)return "";return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",timeZone:appConfig.timezone}).format(new Date(v))}
function marginPct(gross:any,revenue:any){const r=Number(revenue||0);return r>0?`${(Number(gross||0)/r*100).toFixed(1)}%`:"0.0%"}
function severity(v:any){const s=String(v||"").toLowerCase();return s.includes("crit")||s.includes("danger")?"danger":s.includes("warn")?"orange":"info"}
function prettyCategory(v:any){const s=String(v||"Catalogue").replace(/_/g," ").toLowerCase();return s.replace(/\b\w/g,c=>c.toUpperCase())}
function shortRef(v:any){const s=String(v||"—");return s.length>16?`${s.slice(0,7)}…${s.slice(-5)}`:s}
