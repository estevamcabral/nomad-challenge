-- SQL
DO $$
DECLARE
r RECORD;
    target_schema text := 'public'; -- ajuste se necessário
BEGIN
FOR r IN
SELECT format('DROP TABLE IF EXISTS %I.%I CASCADE;', schemaname, tablename) AS stmt
FROM pg_tables
WHERE schemaname = target_schema
    LOOP
        RAISE NOTICE 'Executando: %', r.stmt;
EXECUTE r.stmt;
END LOOP;
END $$;