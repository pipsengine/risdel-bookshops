import Link from "next/link";
const tabs=[['Overview','/inventory'],['Movements','/inventory/movements'],['Transfers','/inventory/transfers'],['Adjustments','/inventory/adjustments'],['Damaged Stock','/inventory/damaged'],['Stocktaking','/inventory/stocktaking'],['Reorder Planning','/inventory/reorder']];
export function InventoryTabs({active}:{active:string}){return <div className="catalogue-tabs">{tabs.map(([label,href])=><Link key={label} className={active===label?'active':''} href={href}>{label}</Link>)}</div>}
