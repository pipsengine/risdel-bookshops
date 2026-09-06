# Google Sheets setup for Risdel Bookshops

Google Sheets is the **active interim data provider**. The application architecture stays provider-agnostic.

## Steps

1. **Create a Google Cloud project** in [Google Cloud Console](https://console.cloud.google.com/).
2. **Enable the Google Sheets API** for that project.
3. **Create a service account** (IAM → Service Accounts → Create).
4. **Create a JSON key** for the service account and download it.  
   Do **not** commit this file. Prefer copying values into `.env.local`.
5. **Create a Google Spreadsheet** named e.g. `RISDEL BOOKSHOPS DATABASE`.
6. Copy the **spreadsheet ID** from the URL:  
   `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`
7. **Share the spreadsheet** with the service account email (`client_email` from the JSON).  
   Grant **Editor** access. Keep the spreadsheet **private** (not "anyone with the link").
8. Configure `.env.local`:

```env
DATA_PROVIDER=google-sheets
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CACHE_TTL_SECONDS=30
```

Private key newlines: if stored in `.env`, escape as `\n`. The application converts `\\n` to real newlines.

9. Initialise tabs, headers, and seed data:

```bash
npm run sheets:init
```

10. Start the app:

```bash
npm run dev
```

11. Verify:

- `http://localhost:3000/api/health`
- Administration → System information
- Administration → Data provider

## Useful commands

| Command | Purpose |
|---------|---------|
| `npm run sheets:init` | Create missing tabs, headers, seed foundation data (idempotent) |
| `npm run sheets:migrate` | Record/apply schema migration versions |
| `npm run sheets:export` | Export all entity sheets to `exports/<date>/` JSON + CSV |

## Login after seed

The initializer seeds `Auth_Users` using `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` with a **bcrypt** password hash (never plain text).

Until the admin user exists, Module 00 still allows bootstrap env login when the user row is missing.
