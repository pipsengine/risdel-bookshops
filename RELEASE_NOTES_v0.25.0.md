# Risdel Bookshops v0.25.0 — Module 24 Loyalty, Membership & Customer Rewards

Cumulative update of v0.24.0.

## Added
- Loyalty membership enrolment and member numbers.
- Configurable loyalty tiers with thresholds, earn multipliers, member discounts and birthday bonuses.
- Configurable points earning and redemption rules.
- Auditable loyalty points ledger and manual adjustment controls.
- Reward voucher issuance, expiry, customer targeting and usage tracking.
- Customer promotional/store-credit wallets with transaction history.
- Loyalty campaign data foundation.
- POS rewards redemption hooks for points and reward vouchers.
- Automatic points earning and tier recalculation after completed POS sales.
- GS-022 Google Sheets schema and Module 24 RBAC permissions.
- Future relational migration reference `scripts/database/023_module24_loyalty_rewards.sql`.

## Google Sheets additions
- Loyalty_Tiers
- Loyalty_Rules
- Loyalty_Memberships
- Loyalty_Vouchers
- Loyalty_VoucherUses
- Loyalty_Wallets
- Loyalty_WalletTransactions
- Loyalty_Campaigns

Existing CRM_Customers and CRM_LoyaltyLedger records are preserved and reused.

## Additional reward operations
- Customer date of birth captured for birthday eligibility.
- Birthday, seasonal and segment reward campaigns can be configured and run with duplicate-award protection.
- POS can redeem customer wallet balance as well as points and reward vouchers.
- Completed POS sales update points, voucher-use history, wallet transactions and tier status server-side.
