import Link from "next/link";
const tabs=[['Overview','/organisation'],['Company','/administration/company'],['Branches','/administration/branches'],['Warehouses','/administration/warehouses']] as const;
export function OrganisationTabs({active}:{active:string}){return <div className="tabs">{tabs.map(([name,href])=><Link key={name} href={href} className={`tab ${active===name?'active':''}`}>{name}</Link>)}</div>}
