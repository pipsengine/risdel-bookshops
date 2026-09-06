import Link from "next/link";
const tabs=[["Overview","/finance/tax"],["Tax Codes","/finance/tax/codes"],["Tax Profiles","/finance/tax/profiles"],["VAT & WHT Reports","/finance/tax/reports"],["Fiscal Controls","/finance/tax/fiscal"]] as const;
export function TaxTabs({active}:{active:string}){return <div className="tabs">{tabs.map(([n,h])=><Link key={n} href={h} className={`tab ${active===n?'active':''}`}>{n}</Link>)}</div>}
