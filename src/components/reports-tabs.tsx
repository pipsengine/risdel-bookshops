import Link from "next/link";
const tabs=[["Overview","/reports"],["Sales","/reports/sales"],["Inventory","/reports/inventory"],["Procurement","/reports/procurement"],["Customers","/reports/customers"],["Finance","/reports/finance"],["Operations","/reports/operations"]] as const;
export function ReportsTabs({active}:{active:string}){return <div className="tabs reports-tabs">{tabs.map(([n,h])=><Link key={n} href={h} className={`tab ${active===n?"active":""}`}>{n}</Link>)}</div>}
