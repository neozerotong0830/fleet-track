-- Schema notes for CURSOR project (already applied: extend_asset_schema)
-- Engine hours sync trigger (apply when ready)

CREATE OR REPLACE FUNCTION public.sync_engine_hours_from_machinery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.engine_id IS NOT NULL AND NEW.running_hours IS DISTINCT FROM OLD.running_hours THEN
    UPDATE engines
    SET running_hours = NEW.running_hours
    WHERE asset_id = NEW.engine_id;

    INSERT INTO engine_installations (engine_id, machinery_id, action, hours_at_event)
    VALUES (NEW.engine_id, NEW.asset_id, 'hours_sync', NEW.running_hours);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_engine_hours ON machinery;
CREATE TRIGGER trg_sync_engine_hours
AFTER UPDATE OF running_hours ON machinery
FOR EACH ROW
EXECUTE FUNCTION public.sync_engine_hours_from_machinery();
