# Risdel Books — Google Sheets Provider Setup

Risdel Books v0.4.1 uses Google Sheets as the default persistence provider while preserving the SQL Server provider for future migration.

## 1. Private spreadsheet
Use the existing **Risdel Books Database** spreadsheet. Keep General access set to **Restricted** and share it only with the Google Cloud service-account email as **Editor**.

Configured spreadsheet ID for this project:
`1P1gFMGXcCWdxbPaNH24BHk9-NW_yqFqydj16QyGYIQw`

## 2. Configure environment
Copy `.env.example` to `.env.local`. Set:
- `DATA_PROVIDER=google-sheets`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

Keep the private key on the server only. Never commit `.env.local` or the service-account JSON file.

## 3. Install and initialize
```bash
npm install
npm run sheets:init
npm run dev
```

`sheets:init` is idempotent. It creates missing worksheets, headers, foundation seed data, standard roles and permissions, Risdel Enterprise, Main Store, Main Warehouse, schema metadata, and the bootstrap administrator if missing.

## 4. First sign-in
Use the values configured in `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD`. The seeded administrator is required to change the temporary password.

## 5. Verify
Open **Administration → Data Provider**. Provider status should be `Healthy` and all required worksheets should be available.

## Backup/export
```bash
npm run sheets:export
```
Exports every worksheet to `exports/YYYY-MM-DD/*.json`. The `exports/` directory is ignored by Git.
