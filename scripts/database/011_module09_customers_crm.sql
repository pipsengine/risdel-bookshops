/* Risdel Books Module 09 — Customers & CRM relational migration reference.
   Google Sheets is the active provider. Preserve UUIDs on future migration. */
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name='crm') EXEC('CREATE SCHEMA crm');
-- Future relational entities: Customers (expanded), CustomerContacts, CustomerAddresses,
-- CustomerRelationships, CustomerNotes, CustomerActivities, Segments, CustomerSegments,
-- LoyaltyLedger. Enforce unique customer code and relational foreign keys during migration.
