// Server-side Supabase client. Uses the publishable (anon) key + cookies for session.
// `cookies()` is async in Next.js 16, so this helper is async.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — the middleware refreshes the session,
            // so it's safe to ignore here.
          }
        },
      },
    },
  );
}

/**
 * Admin Supabase client — uses the service role key. NEVER expose to client side.
 * Use for: cron jobs, audit logging, admin invites, signed URL generation.
 */
export function createAdminClient() {
  // Lazy-import to keep this isolated from any code path that might be bundled
  // for the client.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
