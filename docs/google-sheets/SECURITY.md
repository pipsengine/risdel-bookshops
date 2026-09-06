# Google Sheets Provider Security

- Keep the spreadsheet **Restricted**; never use “Anyone with the link”.
- Grant the service account access only to the Risdel Books spreadsheet.
- Never expose the service-account private key to client components or browser JavaScript.
- Never commit `.env.local`, JSON credentials, private keys or exported production data.
- Passwords remain salted scrypt hashes; no plaintext passwords are persisted.
- Server-side RBAC remains authoritative. Hiding a menu item is not used as authorization.
- Audit logs are append-oriented and normal workflows do not physically delete business/security records.
- Rotate service-account keys if exposure is suspected.
