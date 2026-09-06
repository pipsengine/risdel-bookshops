import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { Icon } from "@/lib/icons";
import { appConfig } from "@/config/app";
import { can } from "@/lib/authz";
import { usingGoogleSheets } from "@/lib/data-provider";
import { getRows, SHEETS } from "@/lib/sheets";

type NavItem={label:string;href:string;icon:string;permission?:string;badge?:string};
type NavSection={label:string;items:NavItem[]};

const nav:NavSection[]=[
 {label:"Home",items:[{label:"Dashboard",href:"/dashboard",icon:"home",permission:"dashboard.view"}]},
 {label:"Commerce",items:[
  {label:"Sales",href:"/sales/pos",icon:"sales",permission:"sales.pos.access"},
  {label:"Online Store",href:"/commerce",icon:"cart",permission:"commerce.view",badge:"New"},
  {label:"Customers",href:"/customers",icon:"users",permission:"crm.customers.view"},
  {label:"Loyalty & Rewards",href:"/customers/loyalty",icon:"heart",permission:"crm.loyalty.view"},
  {label:"Academic Sales",href:"/academic-sales",icon:"school",permission:"academic.sales.view"},
  {label:"Fulfilment",href:"/fulfilment",icon:"truck",permission:"fulfilment.view"}
 ]},
 {label:"Merchandising",items:[
  {label:"Catalogue",href:"/catalogue/products",icon:"book",permission:"catalogue.products.view"},
  {label:"Pricing & Promotions",href:"/sales/pricing",icon:"wallet",permission:"pricing.view"}
 ]},
 {label:"Supply Chain",items:[
  {label:"Inventory",href:"/inventory",icon:"box",permission:"inventory.stock.view"},
  {label:"Purchasing",href:"/purchasing",icon:"cart",permission:"procurement.view"},
  {label:"Suppliers",href:"/suppliers",icon:"supplier",permission:"suppliers.view"},
  {label:"Stocktaking",href:"/inventory/stocktaking",icon:"package",permission:"inventory.stocktake.view"}
 ]},
 {label:"Finance",items:[
  {label:"Finance Overview",href:"/finance",icon:"finance",permission:"finance.view"},
  {label:"Receivables",href:"/finance/receivables",icon:"wallet",permission:"finance.receivables.view"},
  {label:"Payables",href:"/finance/payables",icon:"wallet",permission:"finance.payables.view"},
  {label:"Cash & Bank",href:"/finance/cash-bank",icon:"finance",permission:"finance.cashbank.view"},
  {label:"Expenses",href:"/finance/expenses",icon:"doc",permission:"finance.expenses.view"},
  {label:"General Ledger",href:"/finance/general-ledger",icon:"report",permission:"finance.gl.view"},
  {label:"Fixed Assets",href:"/finance/assets",icon:"package",permission:"finance.assets.view"},
  {label:"Budgets",href:"/finance/budgets",icon:"report",permission:"finance.budgets.view"},
  {label:"Financial Statements",href:"/finance/statements",icon:"report",permission:"finance.statements.view"},
  {label:"Tax & Compliance",href:"/finance/tax",icon:"approve",permission:"tax.view"},
  {label:"Period Close",href:"/finance/period-close",icon:"approve",permission:"finance.period-close.view"}
 ]},
 {label:"Intelligence",items:[
  {label:"Reports & Analytics",href:"/reports",icon:"report",permission:"reports.view"},
  {label:"Approvals",href:"/approvals",icon:"approve",permission:"workflow.approvals.view"},
  {label:"Notifications",href:"/notifications",icon:"bell",permission:"notifications.view"},
  {label:"Documents",href:"/documents",icon:"doc",permission:"documents.view"}
 ]},
 {label:"Administration",items:[
  {label:"Organisation",href:"/organisation",icon:"org",permission:"organisation.overview.view"},
  {label:"System Administration",href:"/administration/security",icon:"admin",permission:"admin.users.manage"}
 ]}
];

export async function AppShell({children,active="Dashboard"}:{children:ReactNode;active?:string}){
 const user=await getSession();
 if(!user)redirect('/login');
 if(user.mustChangePassword&&active!=="Security") redirect('/security/change-password');
 const badges=await shellBadges(user.userId||undefined);

 return <div className="rb-shell rb-shell-v2">
   <aside className="rb-sidebar">
     <Link href="/dashboard" className="rb-brand" aria-label="Risdel Bookshops home">
       <span className="rb-book-logo"><i/><i/></span>
       <span><strong>Risdel Bookshops</strong><small>Knowledge for a Brighter Tomorrow</small></span>
     </Link>

     <nav className="rb-nav">
       {nav.map(section=>{
         const items=section.items.filter(i=>!i.permission||can(user,i.permission));
         if(!items.length)return null;
         return <section className="rb-nav-section" key={section.label}>
           <div className="rb-nav-label"><span>{section.label}</span><b>⌄</b></div>
           {items.map(item=><Link key={item.label} className={`rb-nav-item ${active===item.label?'active':''}`} href={item.href}>
             <span className="rb-nav-icon"><Icon name={item.icon}/></span>
             <span className="rb-nav-text">{item.label}</span>
             {item.badge&&<span className="rb-nav-badge">{item.badge}</span>}
             {item.label==="Approvals"&&badges.approvals>0&&<span className="rb-nav-count">{cap(badges.approvals)}</span>}
             {item.label==="Notifications"&&badges.notifications>0&&<span className="rb-nav-count">{cap(badges.notifications)}</span>}
           </Link>)}
         </section>
       })}
     </nav>

     <div className="rb-sidebar-foot">
       <Link href="/catalogue/products" className="rb-motto-card">
         <span className="rb-mini-books"><i/><i/><i/></span>
         <span><strong>Books</strong><small>Build People</small></span>
         <b>›</b>
       </Link>
     </div>
   </aside>

   <div className="rb-main">
     <header className="rb-topbar">
       <div className="rb-search"><Icon name="search" size={18}/><input aria-label="Global search" placeholder="Search books, customers, orders, invoices, etc..."/><kbd>Ctrl + K</kbd></div>
       <div className="rb-top-actions">
         {can(user,"notifications.view")&&<Link href="/notifications" className="rb-top-icon" title="Notifications"><Icon name="bell"/>{badges.notifications>0&&<span className="rb-top-count">{cap(badges.notifications)}</span>}</Link>}
         {can(user,"workflow.approvals.view")&&<Link href="/approvals" className="rb-top-icon" title="Approvals"><Icon name="approve"/>{badges.approvals>0&&<span className="rb-top-count">{cap(badges.approvals)}</span>}</Link>}
         <span className="rb-divider"/>
         <span className="rb-branch"><Icon name="org" size={15}/><strong>{appConfig.branch}</strong><span>⌄</span></span>
         <span className="rb-divider"/>
         <div className="rb-profile"><div className="rb-profile-avatar">{initials(user.name)}</div><div><strong>{user.name}</strong><small>{user.role}</small></div><span>⌄</span></div>
         <form action={logout}><button className="rb-signout" title="Sign out"><Icon name="logout"/></button></form>
       </div>
     </header>
     {children}
   </div>
 </div>
}

async function shellBadges(userId?:string){
 if(!usingGoogleSheets())return {notifications:0,approvals:0};
 try{
  const [notifications,approvals]=await Promise.all([getRows(SHEETS.notifications),getRows(SHEETS.approvalRequests)]);
  const unread=notifications.filter((n:any)=>activeRow(n)&&(!n.UserId||String(n.UserId)===String(userId||""))&&!truthy(n.IsRead)).length;
  const pending=approvals.filter((a:any)=>activeRow(a)&&String(a.Status)==="PENDING").length;
  return {notifications:unread,approvals:pending};
 }catch{return {notifications:0,approvals:0}}
}
function activeRow(v:any){return v?.IsActive===undefined||truthy(v.IsActive)}
function truthy(v:any){return v===true||v===1||["true","yes","1","active"].includes(String(v||"").toLowerCase())}
function cap(v:number){return v>99?"99+":String(v)}
function initials(v:string){return v.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"R"}
