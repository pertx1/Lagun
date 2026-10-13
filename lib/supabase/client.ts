import { createBrowserClient } from "@supabase/ssr";

/** Cliente de Supabase para componentes de cliente (usa la clave anónima pública). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
