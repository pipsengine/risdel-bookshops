# Database bootstrap
1. Create `RisdelBooks_Dev` in SQL Server.
2. Create a least-privilege application login/user (do not use `sa` for the web app).
3. Run `001_foundation.sql`.
4. Run `002_seed_foundation.sql`.
5. Copy `.env.example` to `.env.local` and enter the connection values.
The bootstrap web login is environment-backed in Module 00; database-backed user authentication is completed in Module 01.
