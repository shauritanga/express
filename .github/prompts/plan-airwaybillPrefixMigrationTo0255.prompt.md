## Plan: Airwaybill Prefix Migration to 0255

Use a two-track approach: update this repo’s UI mock data to the new 12-digit airwaybill format (0255 + 8-digit sequence), and run a controlled external data migration for real records currently using 02019.

**Steps**

1. Phase 1: Lock transformation rule (blocking).
2. Use canonical format 0255XXXXXXXX (example: 025500000001, 025500000002).
3. Apply deterministic sequencing to existing mock entries so IDs are stable and predictable.
4. Phase 2: Codebase updates (depends on phase 1).
5. Replace airwaybill/container values in [resources/js/Pages/Dashboard.tsx](resources/js/Pages/Dashboard.tsx) so all use 0255 + 8 digits.
6. Mirror the same replacements in [logistics-dashboard.html](logistics-dashboard.html) to keep both demo entry points consistent.
7. Update any AWB placeholder/example text in those files to match the new numeric pattern.
8. Phase 3: External data migration (can run in parallel after phase 1).
9. Identify systems outside this repo storing 02019-prefixed airwaybills (DB/API/reporting/integration layers).
10. Execute migration to rewrite leading 02019 → 0255, preserving suffix when safe; otherwise generate new 0255 IDs and keep old→new mapping.
11. Refresh any caches, ETL filters, or reports that key on the old prefix.
12. Phase 4: Verification (depends on phases 2 and 3).
13. Confirm UI views, filtering, and exports show only 0255-formatted airwaybills.
14. Validate external create/lookup/update flows with migrated values.
15. Reconcile counts before/after migration to ensure no record loss.

**Relevant files**

- [resources/js/Pages/Dashboard.tsx](resources/js/Pages/Dashboard.tsx): primary mock shipment dataset and AWB-related UI text.

**Verification**

1. Search check: zero occurrences of 02019 in repo files that hold AWB demo data; expected occurrences of 0255.
2. UI check: displayed airwaybill values follow 12-digit pattern starting with 0255.
3. Export check: exported rows include only updated 0255-formatted airwaybills.
4. External data check: no remaining 02019-prefix records in systems of record.

**Decisions captured**

- Included: repo data updates + external migration plan.
- Excluded: broader airwaybill rule redesign beyond prefix/format migration.
- Assumption: target sequence format is exactly like 025500000001, 025500000002.

If you approve this plan, I’ll hand off for implementation execution next.
