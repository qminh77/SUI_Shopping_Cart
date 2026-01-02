import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// NOTE: This client uses the SERVICE ROLE KEY, so it bypasses RLS.
// Use strictly for server-side administrative tasks or API routes where you verify permissions manually.
export async function createSupabaseServerClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Ignored for Server Components
                    }
                },
            },
        }
    )
}
