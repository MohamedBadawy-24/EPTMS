-- ─── Baseline Immutability Trigger (Layer 3) ─────────────────────────────────
-- This is the ULTIMATE safety net for baseline date immutability.
-- Even if Zod validation (Layer 1) and the Service layer (Layer 2) are bypassed,
-- the database itself will reject any attempt to modify baseline_date.
--
-- This trigger fires BEFORE UPDATE on the milestones table and raises an
-- exception if the old baseline_date differs from the new baseline_date.

CREATE OR REPLACE FUNCTION prevent_baseline_overwrite()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.baseline_date IS DISTINCT FROM NEW.baseline_date THEN
    RAISE EXCEPTION 'BASELINE_IMMUTABLE: Cannot overwrite baseline_date once set. Milestone ID: %, Attempted change: % → %',
      OLD.id,
      OLD.baseline_date,
      NEW.baseline_date
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS trg_baseline_immutability ON milestones;

CREATE TRIGGER trg_baseline_immutability
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION prevent_baseline_overwrite();

-- Verify the trigger is installed
DO $$
BEGIN
  RAISE NOTICE 'Baseline immutability trigger installed successfully on milestones table.';
END $$;
