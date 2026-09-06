import {getRows,SHEETS} from "@/lib/sheets";
const n=(v:any)=>Number(v||0),active=(r:any)=>String(r.IsActive??true).toLowerCase()!=="false";
export const money=(v:any)=>new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:2}).format(n(v));
export async function expenseWorkspace(){
 const [expenses,categories,funds,pettyTx,replenishments,branches,users,cash,journals]=await Promise.all([
  getRows(SHEETS.financeExpenses,true),getRows(SHEETS.financeExpenseCategories,true),getRows(SHEETS.financePettyCashFunds,true),getRows(SHEETS.financePettyCashTransactions,true),getRows(SHEETS.financePettyCashReplenishments,true),getRows(SHEETS.branches),getRows(SHEETS.users),getRows(SHEETS.financeCashBankAccounts,true),getRows(SHEETS.financeJournals,true)
 ]);
 const e=expenses.filter(active).map((x:any)=>({...x,CategoryName:categories.find((c:any)=>c.Id===x.CategoryId)?.Name||"Uncategorised",BranchName:branches.find((b:any)=>b.Id===x.BranchId)?.Name||"—",RequestedByName:users.find((u:any)=>u.Id===x.RequestedBy)?.DisplayName||"—"})).sort((a:any,b:any)=>String(b.CreatedAt).localeCompare(String(a.CreatedAt)));
 const f=funds.filter(active).map((x:any)=>({...x,BranchName:branches.find((b:any)=>b.Id===x.BranchId)?.Name||"—",CustodianName:users.find((u:any)=>u.Id===x.CustodianUserId)?.DisplayName||"—",CashAccountName:cash.find((a:any)=>a.Id===x.CashBankAccountId)?.Name||"—"}));
 return {expenses:e,categories:categories.filter(active),funds:f,pettyTx:pettyTx.filter(active),replenishments:replenishments.filter(active),branches:branches.filter(active),users:users.filter(active),cash:cash.filter(active),journals:journals.filter(active),pending:e.filter((x:any)=>["SUBMITTED","PENDING_APPROVAL"].includes(String(x.Status))).length,approved:e.filter((x:any)=>x.Status==="APPROVED").length,unpaid:e.filter((x:any)=>x.Status==="APPROVED").reduce((a:number,x:any)=>a+n(x.TotalAmount||x.Amount),0),paidThisMonth:e.filter((x:any)=>x.Status==="PAID"&&String(x.PaidAt||"").slice(0,7)===new Date().toISOString().slice(0,7)).reduce((a:number,x:any)=>a+n(x.TotalAmount||x.Amount),0),pettyBalance:f.reduce((a:number,x:any)=>a+n(x.CurrentBalance),0)};
}
export async function expenseById(id:string){const x=await expenseWorkspace();return x.expenses.find((e:any)=>e.Id===id)||null}
