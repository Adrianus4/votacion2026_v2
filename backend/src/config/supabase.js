const { createClient } = require('@supabase/supabase-js');

// Usamos la service_role key porque este cliente corre SOLO en el backend
// (nunca se expone al navegador). Esto nos permite insertar/leer sin
// pelear con Row Level Security desde el servidor, mientras que el
// frontend nunca ve esta clave.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[supabase] Variables de entorno SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configuradas');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

module.exports = supabase;
