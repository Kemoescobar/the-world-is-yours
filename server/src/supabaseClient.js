import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Le backend est SEUL autorisé à utiliser la clé service_role.
// Le frontend n'utilise que la clé anon (lecture/écriture restreinte par RLS, à activer avant l'ouverture publique).
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
