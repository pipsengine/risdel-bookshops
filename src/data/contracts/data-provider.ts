export interface DataProviderHealth{status:"Healthy"|"Not configured"|"Unavailable";detail:string}
export interface DataProvider{readonly name:"google-sheets"|"sql-server";health():Promise<DataProviderHealth>}
