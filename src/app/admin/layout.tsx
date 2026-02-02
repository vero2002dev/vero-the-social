import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = cookies();

    const supabase = createServerClient(
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
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Check Admin Status
    const { data: isAdmin, error } = await supabase.rpc('is_admin');

    if (!isAdmin || error) {
        console.error('Access denied or error:', error);
        redirect("/app/explore"); // Kick non-admins out
    }

    return (
        <div className="flex h-screen bg-black text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-white/5 flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold tracking-widest text-primary">VERO <span className="text-white text-xs opacity-50">ADMIN</span></h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <a href="/admin" className="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors font-medium">
                        Dashboard
                    </a>
                    <a href="/admin/reports" className="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors font-medium flex justify-between items-center">
                        Reports
                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">!</span>
                    </a>
                    <a href="/admin/verify" className="block px-4 py-3 rounded-lg hover:bg-white/5 transition-colors font-medium">
                        Verifications
                    </a>
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                        <div className="text-sm">
                            <div className="font-bold">Admin</div>
                            <a href="/app/explore" className="text-xs text-gray-400 hover:text-primary">Back to App</a>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
