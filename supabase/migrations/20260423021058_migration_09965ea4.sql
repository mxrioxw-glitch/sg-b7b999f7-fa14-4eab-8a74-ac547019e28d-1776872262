-- Crear y eliminar una tabla dummy para forzar schema refresh
CREATE TABLE IF NOT EXISTS _schema_refresh_trigger (id INT);
DROP TABLE IF EXISTS _schema_refresh_trigger;

-- Notificar a PostgREST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';