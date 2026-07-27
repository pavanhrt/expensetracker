import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client bound to the current request's cookies.
 * Use inside Server Components, Server Actions, and Route Handlers.
 * Respects RLS — reads/writes run as the signed-in user, not an admin.
 *
 * `cookies()` is async as of Next.js 15+, so this must be awaited by callers:
 *   const supabase = await createClient();
 */
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no writable cookie store —
            // safe to ignore because middleware refreshes the session too.
          }
        },
      },
    }
  );
}

/**
 * Service-role client that bypasses RLS. Only use for trusted server-side
 * work (e.g. the Claude query_expenses tool) where we've already verified
 * the requesting user's id ourselves — never expose this client's key
 * to the browser.
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
