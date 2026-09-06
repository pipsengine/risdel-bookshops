import Link from "next/link";
export function CustomerTabs({active}:{active:string}){const tabs=[["Directory","/customers"],["Segments","/customers/segments"],["Credit Control","/customers/credit"],["Loyalty","/customers/loyalty"]];return <div className="catalogue-tabs">{tabs.map(([label,href])=><Link key={label} className={active===label?"active":""} href={href}>{label}</Link>)}</div>}
