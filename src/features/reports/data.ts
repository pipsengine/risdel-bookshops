import {getRows,SHEETS} from "@/lib/sheets";
const n=(v:any)=>Number(v||0)||0; const active=(r:any)=>String(r.IsActive??true).toLowerCase()!=="false";
const thisMonth=()=>new Date().toISOString().slice(0,7);
const inMonth=(v:any)=>String(v||"").slice(0,7)===thisMonth();
const moneyRound=(v:number)=>Math.round(v*100)/100;

export async function reportsOverview(){
 const [tx,lines,balances,customers,po,inv,expenses,fulfil,schools]=await Promise.all([
  getRows(SHEETS.salesTransactions),getRows(SHEETS.salesLines),getRows(SHEETS.inventoryBalances),getRows(SHEETS.salesCustomers),getRows(SHEETS.procurementOrders),getRows(SHEETS.salesInvoices),getRows(SHEETS.financeExpenses),getRows(SHEETS.fulfilmentJobs),getRows(SHEETS.academicSchools)
 ]);
 const monthTx=tx.filter(x=>active(x)&&inMonth(x.CompletedAt||x.CreatedAt)); const revenue=monthTx.reduce((s,x)=>s+n(x.TotalAmount||x.GrandTotal),0);
 const soldQty=lines.filter(l=>monthTx.some(t=>t.Id===l.TransactionId)).reduce((s,l)=>s+n(l.Quantity),0);
 const inventoryValue=balances.filter(active).reduce((s,b)=>s+n(b.QuantityOnHand)*n(b.AverageCost),0);
 return {revenue:moneyRound(revenue),transactions:monthTx.length,units:soldQty,inventoryValue:moneyRound(inventoryValue),customers:customers.filter(active).length,openPO:po.filter(x=>!["CLOSED","CANCELLED","FULLY_RECEIVED"].includes(String(x.Status))).length,openInvoices:inv.filter(x=>n(x.BalanceDue)>0||!["PAID","CANCELLED"].includes(String(x.PaymentStatus||x.Status))).length,monthExpenses:moneyRound(expenses.filter(x=>active(x)&&inMonth(x.PaidAt||x.CreatedAt)&&["PAID","APPROVED"].includes(String(x.Status))).reduce((s,x)=>s+n(x.Amount||x.TotalAmount),0)),openFulfilments:fulfil.filter(x=>active(x)&&!["DELIVERED","COLLECTED","CANCELLED","RETURNED"].includes(String(x.Status))).length,schools:schools.filter(active).length};
}

export async function salesReport(filters:{from?:string;to?:string}={}){
 const [tx,lines,products,customers,payments]=await Promise.all([getRows(SHEETS.salesTransactions),getRows(SHEETS.salesLines),getRows(SHEETS.catalogueProducts),getRows(SHEETS.salesCustomers),getRows(SHEETS.salesPayments)]);
 const filteredTx=tx.filter(t=>{if(!active(t))return false;const d=String(t.CompletedAt||t.CreatedAt||"").slice(0,10);return (!filters.from||d>=filters.from)&&(!filters.to||d<=filters.to)});
 const rows=filteredTx.sort((a,b)=>String(b.CompletedAt||b.CreatedAt).localeCompare(String(a.CompletedAt||a.CreatedAt))).map(t=>({Date:String(t.CompletedAt||t.CreatedAt||"").slice(0,10),Transaction:t.TransactionNumber||t.SaleNumber||t.Id,Customer:customers.find(c=>c.Id===t.CustomerId)?.Name||"Walk-in",Items:lines.filter(l=>l.TransactionId===t.Id).reduce((s,l)=>s+n(l.Quantity),0),Revenue:moneyRound(n(t.TotalAmount||t.GrandTotal)),Discount:moneyRound(n(t.DiscountAmount)),PaymentMethods:payments.filter(p=>p.TransactionId===t.Id).map(p=>p.PaymentMethodName||p.PaymentMethodCode||p.Method).filter(Boolean).join(", ")||"—"}));
 const relevantLines=lines.filter(l=>filteredTx.some(t=>t.Id===l.TransactionId));
 const productMap=new Map<string,{Product:string;Qty:number;Revenue:number}>(); for(const l of relevantLines){const p=products.find(x=>x.Id===l.ProductId);const key=l.ProductId||"unknown";const cur=productMap.get(key)||{Product:p?.Name||l.ProductName||"Unknown",Qty:0,Revenue:0};cur.Qty+=n(l.Quantity);cur.Revenue+=n(l.LineTotal||l.Total);productMap.set(key,cur)}
 return {rows,topProducts:[...productMap.values()].sort((a,b)=>b.Revenue-a.Revenue).slice(0,10)};
}

export async function inventoryReport(){
 const [balances,products,warehouses,movements]=await Promise.all([getRows(SHEETS.inventoryBalances),getRows(SHEETS.catalogueProducts),getRows(SHEETS.warehouses),getRows(SHEETS.inventoryMovements)]);
 const rows=balances.filter(active).map(b=>{const p=products.find(x=>x.Id===b.ProductId);const available=n(b.QuantityOnHand)-n(b.QuantityReserved)-n(b.QuantityDamaged);return {Code:p?.Code||"",Product:p?.Name||"Unknown",Warehouse:warehouses.find(w=>w.Id===b.WarehouseId)?.Name||"",OnHand:n(b.QuantityOnHand),Reserved:n(b.QuantityReserved),Damaged:n(b.QuantityDamaged),Available:available,AverageCost:n(b.AverageCost),Value:moneyRound(n(b.QuantityOnHand)*n(b.AverageCost)),ReorderLevel:n(p?.ReorderLevel),Status:available<=0?"OUT OF STOCK":available<=n(p?.ReorderLevel)?"LOW":"OK"}});
 return {rows,movements:movements.filter(active).sort((a,b)=>String(b.OccurredAt).localeCompare(String(a.OccurredAt))).slice(0,100)};
}

export async function procurementReport(filters:{from?:string;to?:string}={}){
 const [orders,suppliers,receipts,returns]=await Promise.all([getRows(SHEETS.procurementOrders),getRows(SHEETS.suppliers),getRows(SHEETS.procurementReceipts),getRows(SHEETS.procurementReturns)]);
 const rows=orders.filter(o=>{if(!active(o))return false;const d=String(o.OrderDate||o.CreatedAt||"").slice(0,10);return (!filters.from||d>=filters.from)&&(!filters.to||d<=filters.to)}).map(o=>({PONumber:o.PONumber||o.OrderNumber||o.Id,Supplier:suppliers.find(s=>s.Id===o.SupplierId)?.Name||"",Status:o.Status,OrderDate:String(o.OrderDate||o.CreatedAt||"").slice(0,10),ExpectedDelivery:String(o.ExpectedDeliveryDate||"").slice(0,10),Total:moneyRound(n(o.TotalAmount)),Receipts:receipts.filter(r=>r.PurchaseOrderId===o.Id&&active(r)).length,Returns:returns.filter(r=>r.PurchaseOrderId===o.Id&&active(r)).length}));
 return {rows};
}

export async function customerReport(){
 const [customers,tx,invoices,activities]=await Promise.all([getRows(SHEETS.salesCustomers),getRows(SHEETS.salesTransactions),getRows(SHEETS.salesInvoices),getRows(SHEETS.crmActivities)]);
 const rows=customers.filter(active).map(c=>{const sales=tx.filter(t=>t.CustomerId===c.Id&&active(t));const inv=invoices.filter(i=>i.CustomerId===c.Id&&active(i));return {Code:c.CustomerCode,Customer:c.Name,Type:c.CustomerType,Phone:c.Phone||"",Transactions:sales.length,Sales:moneyRound(sales.reduce((s,t)=>s+n(t.TotalAmount||t.GrandTotal),0)),Outstanding:moneyRound(inv.reduce((s,i)=>s+n(i.BalanceDue),0)),LoyaltyPoints:n(c.LoyaltyPoints),LastActivity:activities.filter(a=>a.CustomerId===c.Id&&active(a)).sort((a,b)=>String(b.ActivityAt).localeCompare(String(a.ActivityAt)))[0]?.ActivityAt||""}});
 return {rows};
}

export async function financeReport(){
 const [ledger,accounts,receivables,payables,expenses]=await Promise.all([getRows(SHEETS.financeLedgerEntries),getRows(SHEETS.financeChartOfAccounts),getRows(SHEETS.financeReceivables),getRows(SHEETS.financePayables),getRows(SHEETS.financeExpenses)]);
 const trial=accounts.filter(active).map(a=>{const ls=ledger.filter(l=>l.AccountId===a.Id&&active(l));const Debit=ls.reduce((s,l)=>s+n(l.Debit),0),Credit=ls.reduce((s,l)=>s+n(l.Credit),0);return {Code:a.Code,Account:a.Name,Type:a.AccountType,Debit:moneyRound(Debit),Credit:moneyRound(Credit),Balance:moneyRound(Debit-Credit)}}).filter(x=>x.Debit||x.Credit);
 return {trial,totalReceivables:moneyRound(receivables.filter(active).reduce((s,r)=>s+n(r.OutstandingAmount||r.Balance),0)),totalPayables:moneyRound(payables.filter(active).reduce((s,r)=>s+n(r.OutstandingAmount||r.Balance),0)),monthExpenses:moneyRound(expenses.filter(x=>active(x)&&inMonth(x.PaidAt||x.CreatedAt)).reduce((s,x)=>s+n(x.Amount||x.TotalAmount),0))};
}

export async function operationsReport(){
 const [fulfil,returns,stocktakes,approvals,notifications]=await Promise.all([getRows(SHEETS.fulfilmentJobs),getRows(SHEETS.fulfilmentReturns),getRows(SHEETS.inventoryStocktakes),getRows(SHEETS.approvalRequests),getRows(SHEETS.notifications)]);
 return {fulfilments:fulfil.filter(active),returns:returns.filter(active),stocktakes:stocktakes.filter(active),approvals:approvals.filter(active),notifications:notifications.filter(active)};
}

export async function reportExport(type:string,filters:{from?:string;to?:string}={}){
 if(type==="sales")return (await salesReport(filters)).rows;
 if(type==="inventory")return (await inventoryReport()).rows;
 if(type==="procurement")return (await procurementReport(filters)).rows;
 if(type==="customers")return (await customerReport()).rows;
 if(type==="finance")return (await financeReport()).trial;
 return [];
}
