import {getRows,SHEETS} from '@/lib/sheets';
import {persistenceHealth} from '@/lib/persistence-health';
const active=(r:any)=>String(r.IsActive).toLowerCase()!=='false';
export async function adminOverview(){
 const [companies,branches,warehouses,settings,sequences,payments,periods,features,integrations,audit,logins,backups,health]=await Promise.all([
  getRows(SHEETS.companies),getRows(SHEETS.branches),getRows(SHEETS.warehouses),getRows(SHEETS.settings),getRows(SHEETS.sequences),getRows(SHEETS.paymentMethods),getRows(SHEETS.financePeriods),getRows('System_FeatureFlags'),getRows('System_Integrations'),getRows(SHEETS.auditLogs),getRows(SHEETS.loginHistory),getRows('System_BackupRuns'),persistenceHealth()
 ]);
 return {companies:companies.filter(active),branches:branches.filter(active),warehouses:warehouses.filter(active),settings:settings.filter(active),sequences:sequences.filter(active),payments:payments.filter(active),periods:periods.filter(active),features:features.filter(active),integrations:integrations.filter(active),audit:audit.filter(active).slice(-100).reverse(),logins:logins.filter(active).slice(-100).reverse(),backups:backups.filter(active).slice(-30).reverse(),health};
}
export async function configurationData(){const x=await adminOverview();return {settings:x.settings,sequences:x.sequences,payments:x.payments,periods:x.periods,features:x.features,integrations:x.integrations};}
export async function auditData(){const x=await adminOverview();return {audit:x.audit,logins:x.logins};}
export async function healthData(){const x=await adminOverview();return {health:x.health,backups:x.backups,companies:x.companies,branches:x.branches,warehouses:x.warehouses};}
