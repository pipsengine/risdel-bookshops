import {getRows,SHEETS} from "@/lib/sheets";
const active=(r:any)=>String(r.IsActive??true).toLowerCase()!=="false";
const n=(v:any)=>Number(v||0);
export const money=(v:any)=>new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN"}).format(n(v));
export async function taxWorkspace(){
 const [codes,customers,suppliers,cProfiles,sProfiles,exemptions,vatReturns,wht,whtRemit,fiscalDocs,fiscalSettings,sales,invoices,supplierInvoices,periods,products]=await Promise.all([
  getRows(SHEETS.taxCodes),getRows(SHEETS.salesCustomers),getRows(SHEETS.suppliers),getRows(SHEETS.taxCustomerProfiles),getRows(SHEETS.taxSupplierProfiles),getRows(SHEETS.taxExemptions),getRows(SHEETS.taxVatReturns),getRows(SHEETS.taxWhtTransactions),getRows(SHEETS.taxWhtRemittances),getRows(SHEETS.taxFiscalDocuments),getRows(SHEETS.taxFiscalSettings),getRows(SHEETS.salesTransactions),getRows(SHEETS.salesInvoices),getRows(SHEETS.financeSupplierInvoices),getRows(SHEETS.financePeriods),getRows(SHEETS.catalogueProducts)
 ]);
 const activeCodes=codes.filter(active);const taxByCode=new Map(activeCodes.map((x:any)=>[String(x.Code),x]));
 const productTax={standard:0,zero:0,exempt:0,unclassified:0};for(const p of products.filter(active)){const c=taxByCode.get(String(p.TaxCode||"")) as any;if(!c)productTax.unclassified++;else if(c.Treatment==="ZERO_RATED")productTax.zero++;else if(c.Treatment==="EXEMPT")productTax.exempt++;else productTax.standard++}
 const outputVAT=sales.filter((x:any)=>active(x)&&x.Status!=="CANCELLED").reduce((a:number,x:any)=>a+n(x.TaxTotal),0)+invoices.filter((x:any)=>active(x)&&x.Status!=="CANCELLED").reduce((a:number,x:any)=>a+n(x.TaxTotal),0);
 const inputVAT=supplierInvoices.filter((x:any)=>active(x)&&!["REJECTED","CANCELLED"].includes(String(x.Status))).reduce((a:number,x:any)=>a+n(x.TaxAmount),0);
 const whtOutstanding=wht.filter((x:any)=>active(x)&&!['REMITTED','CANCELLED'].includes(String(x.Status))).reduce((a:number,x:any)=>a+n(x.Amount),0);
 return {codes:activeCodes,customers:customers.filter(active),suppliers:suppliers.filter(active),customerProfiles:cProfiles.filter(active),supplierProfiles:sProfiles.filter(active),exemptions:exemptions.filter(active),vatReturns:vatReturns.filter(active).sort((a:any,b:any)=>String(b.PeriodEnd).localeCompare(String(a.PeriodEnd))),wht:wht.filter(active),whtRemittances:whtRemit.filter(active),fiscalDocs:fiscalDocs.filter(active),fiscalSettings:fiscalSettings.filter(active),periods:periods.filter(active),products:products.filter(active),outputVAT,inputVAT,netVAT:outputVAT-inputVAT,whtOutstanding,productTax};
}
export async function taxCodeMap(){const rows=await getRows(SHEETS.taxCodes);return new Map(rows.filter(active).map((r:any)=>[String(r.Code),r]));}
export async function resolveProductTax(product:any,taxableBase:number){const map=await taxCodeMap();const code=String(product?.TaxCode||"");const tax=map.get(code) as any;if(!tax)return {taxCode:"",taxRate:0,taxAmount:0,treatment:"UNCLASSIFIED"};const rate=n(tax.Rate);return {taxCode:code,taxRate:rate,taxAmount:Math.round(Math.max(0,taxableBase)*rate)/100,treatment:String(tax.Treatment||"STANDARD")};}
