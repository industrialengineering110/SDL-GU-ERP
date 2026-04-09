# Full Clean Build Version (Best-Effort)

## Included fixes
- Governance tab crash hardening
- Sewing Costing crash hardening
- Safer config loading and saving with default merge
- Costing route cleanup in Department Hub
- Defensive handling for partial/empty PostgreSQL config
- Small type-safety cleanup in `TargetSheet.tsx`
- `SOPForm.tsx` kept in place so `FactoryAnalytics.tsx` import is valid

## Important reality check
This package is a **stability-focused cleaned version**, not a full architecture rewrite.
Many modules still use existing local/mock structures internally.

## Recommended checks after upload
- Governance opens
- Costing > Sewing Costing opens
- Factory Analytics no longer shows missing `SOPForm` import
- Planning > Line Loading still needs separate targeted debugging if it remains problematic

## Validation status
I verified that the relative import for `../components/SOPForm` exists in this package.
A full production build could not be conclusively verified in this environment because dependency installation was unstable.
