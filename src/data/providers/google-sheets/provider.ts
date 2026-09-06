import type { DataProvider } from "@/data/contracts/data-provider";
import { sheetsHealth } from "@/lib/sheets";
export const googleSheetsProvider:DataProvider={name:"google-sheets",health:sheetsHealth};
