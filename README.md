# Risdel Books

**Current release:** v0.10.0 — Module 09 Customers & CRM

Risdel Books is the cumulative management platform for Risdel Enterprise. Google Sheets is currently the default persistence provider; SQL Server migrations/provider history are preserved for future migration.

## Quick start with Google Sheets
1. Copy `.env.example` to `.env.local`.
2. Add the service-account email/private key.
3. Run `npm install`.
4. Run `npm run sheets:init`.
5. Run `npm run dev`.

See `docs/google-sheets/SETUP.md` for the full setup.

---

# Risdel Books
Business management platform for **Risdel Enterprise**.

This repository follows an incremental-module model: every new module updates this same codebase and database architecture. Module 00 is the production foundation; future ZIP releases contain the complete application state, not isolated modules.

## Module 00 included
- Next.js + React + TypeScript
- Microsoft SQL Server foundation
- professional responsive login and application shell
- bootstrap authentication/session security
- SQL Server health check
- company/branch/warehouse foundation
- RBAC data model
- notifications/documents/audit schemas
- environment configuration
- IIS deployment documentation

## First run
```bash
cp .env.example .env.local
npm install
npm run dev
```
Open `http://localhost:3000`.

Default development bootstrap credentials (from `.env.example`):
- Email: `admin@risdel.local`
- Password: `ChangeMe@123`

**Change these immediately and never use the defaults in a production environment.**

## SQL Server
Create `RisdelBooks_Dev`, then run:
1. `scripts/database/001_foundation.sql`
2. `scripts/database/002_seed_foundation.sql`

Configure `.env.local` with a dedicated least-privilege SQL user. The application intentionally does not use `sa`.

## Commands
- `npm run dev` — local development
- `npm run typecheck` — TypeScript checks
- `npm run build` — production build
- `npm start` — start production server after build

## Repository map
- `src/app` — routes and server actions
- `src/components` — shared interface components
- `src/config` — central application configuration
- `src/lib` — infrastructure helpers
- `scripts/database` — versioned SQL scripts
- `docs` — architecture, security, deployment and module documentation
- `data/uploads` — local development attachment storage

See `docs/modules/MODULE-00.md` for the release scope.

## Module 01 — Authentication, Users, Roles & Permissions (v0.3.0)

Module 01 upgrades the Module 00 bootstrap security shell into database-backed identity and access management.

### Included
- SQL Server-backed user authentication with a secure bootstrap provisioning path.
- Node.js `scrypt` password hashing; passwords are never stored in plaintext.
- Forced password change for newly created/reset accounts.
- Configurable failed-login lockout (`LOGIN_MAX_ATTEMPTS`, `LOGIN_LOCK_MINUTES`).
- Signed HTTP-only sessions plus database session records.
- User directory, account activation/deactivation, account unlock and user detail page.
- User creation with securely generated temporary passwords.
- Administrator password reset and session invalidation.
- Standard and custom roles.
- Granular permission matrix and server-side permission enforcement.
- Login history and security overview.
- Account audit trail integration.
- Role-aware application navigation.

### Upgrade from Module 00
Run the existing Module 00 migrations first, then execute:

```sql
scripts/database/003_module01_auth_security.sql
```

With SQL Server configured, sign in using the bootstrap administrator from `.env.local`. If the account does not yet exist in `auth.Users`, Risdel Books provisions it as the protected `SUPER_ADMIN` and requires a password change. Once SQL Server is configured, the application does **not** bypass a database authentication failure using bootstrap credentials.

### Module 01 routes
- `/administration/security`
- `/administration/users`
- `/administration/users/[id]`
- `/administration/roles`
- `/administration/roles/[id]`
- `/administration/login-history`
- `/administration/sessions`
- `/security/change-password`

### Security note
The environment-backed bootstrap credential is an initial provisioning mechanism, not a normal staff account model. Use a strong unique `BOOTSTRAP_ADMIN_PASSWORD` and `AUTH_SECRET`, configure SQL Server, sign in once to provision the database administrator, then manage all normal users through Administration.


## Module 02 — Organisation Setup

Version `0.3.0` adds the production organisation master used by every later transaction module:

- Company profile and business defaults
- Branch directory, branch managers and head-office control
- Warehouse/stock-location directory and default-location control
- Sales eligibility and negative-stock policies per warehouse
- Organisation-specific RBAC permissions and audit events
- Additive SQL Server migration `scripts/database/004_module02_organisation.sql`

### Upgrade from Module 01

Do **not** recreate the database. Run only:

```sql
scripts/database/004_module02_organisation.sql
```

against the existing `RisdelBooks` database after Module 01 migrations are already present.

## Module 03 — Executive Dashboard (v0.4.0)

Module 03 replaces the setup-only dashboard with a production executive workspace. It adds branch-aware operating scope, live organisation/security KPIs, management exceptions, recent audit activity, quick actions and a shared dashboard metric/alert publication layer for later Sales, Inventory, Procurement and Finance modules.

### Upgrade from v0.3.0

Run only the additive migration below against the existing RisdelBooks database:

```sql
scripts/database/005_module03_executive_dashboard.sql
```

Do **not** recreate the database. Business KPIs intentionally display as unavailable until their owning modules are installed and begin publishing verified metrics. No demonstration revenue, stock or finance values are fabricated on the production dashboard.

## Module 04 — Product & Book Catalogue (v0.5.0)

After upgrading from v0.4.1, run `npm run sheets:init`. The initializer is idempotent and adds the `Catalogue_*` worksheets, catalogue permissions, and starter categories/subjects/academic levels to the existing private Google Spreadsheet.

Catalogue routes begin at `/catalogue/products`. The Product record is the common saleable master; books extend it with ISBN, publisher, authors, edition, academic and curriculum metadata. SQL Server migration `scripts/database/006_module04_catalogue.sql` is preserved for the future relational provider.

## Module 05 — Academic & Catalogue Master Data (v0.6.0)

Module 05 deepens catalogue governance with controlled curricula, academic sessions, terms, classes, publisher imprints, category hierarchy, bulk CSV validation/import and catalogue export. Existing book records remain compatible; new/updated book records reference controlled `CurriculumId` and `ClassId` values while retaining readable names for compatibility.

After upgrading from v0.5.0, run:

```bash
npm install
npm run sheets:init
npm run dev
```

The initializer advances the Google Sheets schema to `GS-003` and adds the new worksheets/columns to the **same** private spreadsheet. Do not create a new spreadsheet and do not delete existing tabs.

## Module 06 — Inventory Management (v0.7.0)

Inventory is controlled at product + warehouse level using a stock movement ledger and balance snapshots. Module 06 adds opening stock, movement history, warehouse transfers, controlled adjustments, damaged stock, reservations, valuation and reorder planning. After upgrading from v0.6.0 run `npm run sheets:init` to add the GS-004 worksheets to the same Google Spreadsheet.

## Module 07 — Point of Sale (v0.8.0)

Module 07 activates the Sales workspace with a stock-aware Point of Sale register. Cashiers open a controlled shift against a sales warehouse before checkout. Products can be found by name, product code, ISBN or barcode, then sold using Cash, Card/POS Terminal or Bank Transfer payments, including split payments. Held baskets can be resumed later; completed sales create receipt, payment and line records and automatically reduce warehouse inventory with `SALE` stock movements.

After upgrading from v0.7.0 run:

```bash
npm install
npm run sheets:init
npm run dev
```

The Google Sheets schema becomes **GS-005** and adds `CRM_Customers`, `System_PaymentMethods`, `Sales_CashierShifts`, `Sales_Transactions`, `Sales_TransactionLines`, `Sales_Payments`, `Sales_HeldSales`, and `Sales_HeldSaleLines` to the same private spreadsheet. Existing sheets and records are preserved.


## Module 08 — Sales Orders, Quotations & Invoices (v0.9.0)

Module 08 extends the POS foundation with customer-facing commercial documents and stock-backed order fulfilment.

### Included
- quotation builder and quotation register
- quotation status lifecycle and conversion to sales order
- direct sales order creation without quotation
- warehouse stock allocation, reservations and backorders
- sales order fulfilment with inventory ledger posting
- customer invoices generated from orders
- partial/full invoice payment recording
- outstanding receivables and overdue invoice alerts
- printable professional invoice view
- executive dashboard publication for open orders and receivables

### Google Sheets upgrade
Run `npm run sheets:init` on the same existing Risdel Books spreadsheet. The schema becomes **GS-006** and adds the `Sales_Quotations`, `Sales_QuotationLines`, `Sales_Orders`, `Sales_OrderLines`, `Sales_Invoices`, `Sales_InvoiceLines`, `Sales_InvoicePayments`, `Sales_Fulfilments`, and `Sales_FulfilmentLines` worksheets. Existing data is preserved.


## Module 09 — Customers & CRM (v0.10.0)

Module 09 expands the existing `CRM_Customers` record into the relationship-management workspace used by POS, quotations, sales orders and invoices. It adds customer types for individuals, parents/guardians, students, schools, corporate accounts, resellers, government, NGOs and religious organisations; contacts and addresses; account relationships; credit controls; purchase history and statements; notes and activities; segmentation; and loyalty ledgers.

Run `npm run sheets:init` against the same private Risdel Books spreadsheet. The schema becomes **GS-007** and adds `CRM_CustomerContacts`, `CRM_CustomerAddresses`, `CRM_CustomerRelationships`, `CRM_CustomerNotes`, `CRM_CustomerActivities`, `CRM_Segments`, `CRM_CustomerSegments`, and `CRM_LoyaltyLedger`. Existing `CRM_Customers` rows and customer IDs are preserved while missing CRM columns are added.

## Module 10 — Schools & Academic Sales (v0.11.0)
Academic Sales extends CRM school accounts with session/class book lists, availability planning and school/parent order generation. Run `npm run sheets:init` to upgrade the existing workbook to GS-008.


## Current cumulative release

**v0.13.0 — Module 12: Supplier Management**

Supplier Management adds supplier profiles, contacts, addresses, commercial terms, preferred-supplier controls, product and publisher relationships, performance reviews, and supplier document metadata.

Google Sheets schema: **GS-010**. Continue using the same private Risdel Books spreadsheet and run `npm run sheets:init` after upgrading.
