import {getRows,SHEETS} from "@/lib/sheets";
const active=(r:any)=>String(r.IsActive??true).toLowerCase()!=="false", n=(v:any)=>Number(v||0);
export async function closeWorkspace(){
 const [periods,cycles,checklist,approvals,accruals,prepayments,events,journals,lines,coa]=await Promise.all([
  getRows(SHEETS.financePeriods),getRows(SHEETS.financeCloseCycles),getRows(SHEETS.financeCloseChecklist),getRows(SHEETS.financeCloseApprovals),getRows(SHEETS.financeAccruals),getRows(SHEETS.financePrepayments),getRows(SHEETS.financeCloseEvents),getRows(SHEETS.financeJournals),getRows(SHEETS.financeJournalLines),getRows(SHEETS.financeChartOfAccounts)
 ]);
 const ps=periods.filter(active).sort((a:any,b:any)=>String(b.StartDate).localeCompare(String(a.StartDate)));
 const cs=cycles.filter(active).sort((a:any,b:any)=>String(b.CreatedAt).localeCompare(String(a.CreatedAt)));
 const trial=(period:any)=>{const jids=new Set(journals.filter((j:any)=>active(j)&&j.Status==="POSTED"&&String(j.JournalDate)>=String(period.StartDate)&&String(j.JournalDate)<=String(period.EndDate)).map((j:any)=>j.Id));const ls=lines.filter((l:any)=>active(l)&&jids.has(l.JournalId));return {debit:ls.reduce((s:number,l:any)=>s+n(l.Debit),0),credit:ls.reduce((s:number,l:any)=>s+n(l.Credit),0)}};
 return {periods:ps,cycles:cs.map((c:any)=>{const p=ps.find((x:any)=>x.Id===c.PeriodId),items=checklist.filter((x:any)=>active(x)&&x.CloseCycleId===c.Id),tb=p?trial(p):{debit:0,credit:0};return {...c,Period:p,Checklist:items,ChecklistDone:items.filter((x:any)=>x.Status==="COMPLETED").length,ChecklistTotal:items.length,TrialDebit:tb.debit,TrialCredit:tb.credit,TrialBalanced:Math.abs(tb.debit-tb.credit)<.01}}),checklist:checklist.filter(active),approvals:approvals.filter(active),accruals:accruals.filter(active),prepayments:prepayments.filter(active),events:events.filter(active),coa:coa.filter(active)}
}
