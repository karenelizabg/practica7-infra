-- Esquema de la BD D1 (se aplica en cada despliegue; es idempotente)
CREATE TABLE IF NOT EXISTS users (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email  TEXT NOT NULL
);
