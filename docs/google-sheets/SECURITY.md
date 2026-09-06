# Google Sheets security

## Credentials

- Service account private keys must **never** be committed to Git.
- Prefer environment variables over JSON files in the repo.
- Never send Google credentials to the browser or React client bundles.
- All Sheets API calls run server-side (Server Actions, API routes, repositories, CLI scripts).

## Spreadsheet access

- Keep the workbook **private**.
- Do **not** use “Anyone with the link”.
- Share only with the application service account (Editor) and required human administrators.
- Review Google Cloud IAM and keys periodically; rotate compromised keys immediately.

## Application data

- Passwords are stored as **bcrypt hashes** only.
- Do not log password hashes, private keys, or access tokens.
- Audit and login history must avoid unnecessary sensitive payloads.
- Document binaries are **not** stored in cells — only metadata + storage references.

## Environment files

- `.env.local`, `.env.production`, credential JSON files, and `exports/` are gitignored.
- Protect production environment configuration on the host (NTFS ACLs / secrets manager).

## Least privilege

- Use a dedicated service account for Risdel Books only.
- Scope API access to Google Sheets (spreadsheets scope).
- Prefer a dedicated spreadsheet, not a shared personal workbook with unrelated data.
