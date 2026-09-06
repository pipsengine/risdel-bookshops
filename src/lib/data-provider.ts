export type DataProviderName = "google-sheets" | "sql-server";
export function dataProviderName():DataProviderName{return (process.env.DATA_PROVIDER||"google-sheets")==="sql-server"?"sql-server":"google-sheets"}
export function usingGoogleSheets(){return dataProviderName()==="google-sheets"}
export function usingSqlServer(){return dataProviderName()==="sql-server"}
