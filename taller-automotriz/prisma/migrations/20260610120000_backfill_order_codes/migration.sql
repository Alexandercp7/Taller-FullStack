-- Backfill: las ordenes existentes tenian "code" igual a su id (cuid).
-- Reasignar codigos OT-#### secuenciales (en orden de creacion) solo a las
-- filas cuyo "code" no tenga ya el formato OT-#### / WO-####.
DO $$
DECLARE
  rec RECORD;
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM '(\d+)$') AS INTEGER)), 0) INTO next_num
  FROM work_orders
  WHERE code ~ '^(OT|WO)-\d{4,}$';

  FOR rec IN
    SELECT id FROM work_orders
    WHERE code !~ '^(OT|WO)-\d{4,}$'
    ORDER BY "createdAt" ASC
  LOOP
    next_num := next_num + 1;
    UPDATE work_orders SET code = 'OT-' || LPAD(next_num::text, 4, '0') WHERE id = rec.id;
  END LOOP;
END $$;
