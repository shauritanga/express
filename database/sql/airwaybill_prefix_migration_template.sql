-- Airwaybill prefix migration template
-- Goal: change airwaybill numbers from prefix 02019 to 0255
-- Example: 020190000001 -> 025500000001
--
-- IMPORTANT:
-- 1) Replace <TABLE_NAME> and <COLUMN_NAME> before running.
-- 2) Run in a transaction window with application writes paused if possible.
-- 3) Test in staging first.

-- =========================
-- 0) PRECHECK
-- =========================
-- Count rows that will be changed.
SELECT COUNT(*) AS rows_to_change
FROM <TABLE_NAME>
WHERE <COLUMN_NAME> LIKE '02019%';

-- Preview changes before update.
SELECT
    <COLUMN_NAME> AS old_awb,
    CONCAT('0255', SUBSTRING(<COLUMN_NAME>, 6)) AS new_awb
FROM <TABLE_NAME>
WHERE <COLUMN_NAME> LIKE '02019%'
LIMIT 100;

-- Check for possible collisions before applying update.
-- Collision means the target 0255 value already exists.
SELECT COUNT(*) AS potential_collisions
FROM <TABLE_NAME> src
WHERE src.<COLUMN_NAME> LIKE '02019%'
  AND EXISTS (
      SELECT 1
      FROM <TABLE_NAME> dst
      WHERE dst.<COLUMN_NAME> = CONCAT('0255', SUBSTRING(src.<COLUMN_NAME>, 6))
  );

-- =========================
-- 1) BACKUP MAPPING
-- =========================
-- Create a backup mapping table so rollback is possible.
-- PostgreSQL: use TEXT and TIMESTAMP
-- MySQL: use VARCHAR and DATETIME
CREATE TABLE IF NOT EXISTS airwaybill_prefix_backup (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    old_awb VARCHAR(64) NOT NULL,
    new_awb VARCHAR(64) NOT NULL,
    migrated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO airwaybill_prefix_backup (old_awb, new_awb)
SELECT
    <COLUMN_NAME> AS old_awb,
    CONCAT('0255', SUBSTRING(<COLUMN_NAME>, 6)) AS new_awb
FROM <TABLE_NAME>
WHERE <COLUMN_NAME> LIKE '02019%';

-- =========================
-- 2) APPLY UPDATE
-- =========================
-- Wrap this section in a transaction in your DB client.
-- BEGIN;

UPDATE <TABLE_NAME>
SET <COLUMN_NAME> = CONCAT('0255', SUBSTRING(<COLUMN_NAME>, 6))
WHERE <COLUMN_NAME> LIKE '02019%';

-- COMMIT;

-- =========================
-- 3) POSTCHECK
-- =========================
SELECT COUNT(*) AS remaining_old_prefix
FROM <TABLE_NAME>
WHERE <COLUMN_NAME> LIKE '02019%';

SELECT COUNT(*) AS updated_new_prefix
FROM <TABLE_NAME>
WHERE <COLUMN_NAME> LIKE '0255%';

-- Optional: sample the migrated values.
SELECT <COLUMN_NAME>
FROM <TABLE_NAME>
WHERE <COLUMN_NAME> LIKE '0255%'
ORDER BY <COLUMN_NAME>
LIMIT 100;

-- =========================
-- 4) ROLLBACK (IF NEEDED)
-- =========================
-- Use only if rollback is required.
-- BEGIN;

UPDATE <TABLE_NAME> t
SET <COLUMN_NAME> = b.old_awb
FROM airwaybill_prefix_backup b
WHERE t.<COLUMN_NAME> = b.new_awb;

-- COMMIT;

-- =========================
-- NOTES
-- =========================
-- If your system enforces exact 12-digit numeric AWB values,
-- validate that all existing 02019 records already follow that structure.
-- If some values are malformed, isolate and correct them before migration.
