import { getRows,SHEETS } from "@/lib/sheets";
const n=(v:any)=>v==null||v===""?0:Number(v); const active=(r:any)=>String(r.IsActive??true).toLowerCase()!=="false";
export const money=(v:any)=>new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:2}).format(n(v));
export async function shiftCashPosition(shiftId:string){
 const [shifts,payments,movements,refunds,methods,recons,users,warehouses]=await Promise.all([getRows(SHEETS.salesShifts,true),getRows(SHEETS.salesPayments,true),getRows(SHEETS.salesTillMovements,true),getRows(SHEETS.salesRefunds,true),getRows(SHEETS.paymentMethods),getRows(SHEETS.salesShiftReconciliations,true),getRows(SHEETS.users),getRows(SHEETS.warehouses)]);
 const shift=shifts.find(x=>x.Id===shiftId&&active(x)); if(!shift)return null;
 const ps=payments.filter(x=>x.ShiftId===shiftId&&active(x)); const mv=movements.filter(x=>x.ShiftId===shiftId&&active(x));
 const cashSales=ps.filter(x=>x.PaymentMethodCode==="CASH").reduce((a,x)=>a+n(x.Amount)-n(x.ChangeGiven),0);
 const cashIn=mv.filter(x=>["CASH_IN","FLOAT_IN"].includes(x.MovementType)).reduce((a,x)=>a+n(x.Amount),0);
 const cashOut=mv.filter(x=>["CASH_OUT","CASH_DROP","CASH_PICKUP"].includes(x.MovementType)).reduce((a,x)=>a+n(x.Amount),0);
 const cashRefunds=refunds.filter(x=>x.Status==="PROCESSED"&&x.RefundMethod==="CASH"&&String(x.ProcessedAt||"")>=String(shift.OpenedAt||"")&&(!shift.ClosedAt||String(x.ProcessedAt||"")<=String(shift.ClosedAt))).reduce((a,x)=>a+n(x.Amount),0);
 const expected=n(shift.OpeningCash)+cashSales+cashIn-cashOut-cashRefunds;
 const byMethod=methods.filter(active).map(m=>({code:m.Code,name:m.Name,amount:ps.filter(x=>x.PaymentMethodCode===m.Code).reduce((a,x)=>a+n(x.Amount)-n(x.ChangeGiven),0)})).filter(x=>x.amount!==0);
 return {shift:{...shift,CashierName:users.find(u=>u.Id===shift.UserId)?.DisplayName||"Unknown",WarehouseName:warehouses.find(w=>w.Id===shift.WarehouseId)?.Name||"Unknown"},cashSales,cashIn,cashOut,cashRefunds,expected,movements:mv.sort((a,b)=>String(b.CreatedAt).localeCompare(String(a.CreatedAt))),byMethod,reconciliation:recons.find(x=>x.ShiftId===shiftId&&active(x))||null};
}
export async function cashManagementOverview(){
 const [shifts,movements,recons,settlements,users,warehouses]=await Promise.all([getRows(SHEETS.salesShifts,true),getRows(SHEETS.salesTillMovements,true),getRows(SHEETS.salesShiftReconciliations,true),getRows(SHEETS.salesCashSettlements,true),getRows(SHEETS.users),getRows(SHEETS.warehouses)]);
 const open=shifts.filter(x=>x.Status==="OPEN"&&active(x)); const pending=recons.filter(x=>x.Status==="PENDING_REVIEW"&&active(x));
 return {openShifts:open.length,pendingReviews:pending.length,unsettled:settlements.filter(x=>x.Status!=="SETTLED"&&active(x)).length,todayMovements:movements.filter(x=>String(x.CreatedAt||"").slice(0,10)===new Date().toISOString().slice(0,10)&&active(x)).length,shifts:shifts.filter(active).sort((a,b)=>String(b.OpenedAt).localeCompare(String(a.OpenedAt))).slice(0,50).map(x=>({...x,CashierName:users.find(u=>u.Id===x.UserId)?.DisplayName||"Unknown",WarehouseName:warehouses.find(w=>w.Id===x.WarehouseId)?.Name||"Unknown",ReconciliationStatus:recons.find(r=>r.ShiftId===x.Id&&active(r))?.Status||"NOT STARTED"}))};
}
