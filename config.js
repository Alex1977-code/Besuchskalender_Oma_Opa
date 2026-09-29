// Supabase-Zugang: Project URL (https://xxxx.supabase.co) und den öffentlichen Schlüssel
// ("anon public" bzw. neu "Publishable key", beginnt mit sb_publishable_ oder eyJ). Der anon key ist öffentlich gedacht;
// geschützt wird über die Datenbank-Regeln in supabase/schema.sql.
// Leer lassen = Sync über server.js (falls vorhanden), sonst nur lokal.
window.SUPABASE = { url: '', key: '' };
