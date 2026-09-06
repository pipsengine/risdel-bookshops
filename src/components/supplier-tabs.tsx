import Link from "next/link";
export function SupplierTabs({active}:{active:string}){const tabs=[["Directory","/suppliers"],["Product Matrix","/suppliers/products"],["Performance","/suppliers/performance"]];return <div className="catalogue-tabs">{tabs.map(([label,href])=><Link key={label} className={active===label?"active":""} href={href}>{label}</Link>)}</div>}
