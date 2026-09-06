/* Risdel Books Module 14 relational migration reference.
   Google Sheets is the active persistence provider in v0.15.0.
   Future SQL migration should create GoodsReceipts, GoodsReceiptLines,
   ReceiptExceptions, SupplierReturns, SupplierReturnLines, SupplierCredits
   and ThreeWayMatch entities with FK relationships to PurchaseOrders,
   Suppliers, Warehouses and Products. Preserve UUID identifiers. */
