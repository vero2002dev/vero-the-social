import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function AdminPage() {
    const cookieStore = cookies();

    // We duplicate client init here to fetch stats server-side
    // Ideally we'd extract this, but for speed:
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll() { }
            },
        }
    );

    // Fetch Stats
    // Note: count(*) is faster but slightly harder with Supabase JS sometimes without head:true
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: reportCount } = await supabase.from('reports').select('*', { count: 'exact', head: true }).is('resolved_at', null);
    const { count: verifyCount } = await supabase.from('verification_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

            <div className="grid grid-cols-3 gap-6 mb-12">
                {/* Card 1 */}
                <div className="bg-gray-900 border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Users</h3>
                    <div className="text-4xl font-bold text-white">{userCount || 0}</div>
                </div>

                {/* Card 2 */}
                <div className="bg-gray-900 border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl">flag</span>
                    </div>
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Pending Reports</h3>
                    <div className="text-4xl font-bold text-red-500">{reportCount || 0}</div>
                    <a href="/admin/reports" className="text-xs text-gray-500 mt-2 block underline">View Details</a>
                </div>

                {/* Card 3 */}
                <div className="bg-gray-900 border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl">verified</span>
                    </div>
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Verification Queue</h3>
                    <div className="text-4xl font-bold text-amber-500">{verifyCount || 0}</div>
                    <a href="/admin/verify" className="text-xs text-gray-500 mt-2 block underline">Review Requests</a>
                </div>
            </div>

            <div className="p-6 bg-gray-900 border border-white/5 rounded-2xl">
                <h3 className="text-lg font-bold mb-4">System Health</h3>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-sm text-gray-300">All systems operational</span>
                </div>
            </div>
        </div>
    );
}
