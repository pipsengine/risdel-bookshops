# Risdel Bookshops v0.35.0 — Module 34 Fixed Assets & Depreciation

Cumulative upgrade from v0.34.0.

## Added
- Fixed asset register and asset classes.
- Acquisition and controlled capitalization with GL posting.
- Straight-line and reducing-balance monthly depreciation.
- Idempotent asset/period depreciation runs and GL journals.
- Asset transfers between branches/locations/custodians.
- Asset impairments and carrying-value controls.
- Asset disposals with gain/loss calculation and GL posting.
- Fixed asset schedule/reporting.
- Period-lock enforcement for capitalization, depreciation, impairment and disposal postings.
- Google Sheets schema GS-032 and future SQL migration reference.

## Google Sheets
Adds FixedAsset_Classes, FixedAsset_Assets, FixedAsset_DepreciationRuns, FixedAsset_DepreciationLines, FixedAsset_Transfers, FixedAsset_Disposals, FixedAsset_Impairments and FixedAsset_Events.
