import Link from "next/link";
const tabs=[["POS","/sales/pos"],["Transactions","/sales"],["Quotations","/sales/quotations"],["Sales Orders","/sales/orders"],["Invoices","/sales/invoices"],["Reservations","/sales/reservations"],["Special Orders","/sales/special-orders"],["Returns & Refunds","/sales/returns"],["Held Sales","/sales/held"],["Cashier Shifts","/sales/shifts"]] as const;
export function SalesTabs({active}:{active:string}){return <div className="catalogue-tabs">{tabs.map(([label,href])=><Link key={label} href={href} className={active===label?"active":""}>{label}</Link>)}</div>}
