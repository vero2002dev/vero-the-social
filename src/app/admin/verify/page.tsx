import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function AdminVerifyPage() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: { getAll() { return cookieStore.getAll() }, setAll() { } },
        }
    );

    const { data: requests } = await supabase
        .from('verification_requests')
        .select(`
            *,
            user:profiles!user_id(display_name, avatar_url, bio)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Verification Queue</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests?.map((req: any) => (
                    <div key={req.id} className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                        {/* Evidence */}
                        <div className="grid grid-cols-2 h-48">
                            <div className="relative group">
                                <img src={req.user?.avatar_url} className="w-full h-full object-cover opacity-50" />
                                <span className="absolute bottom-2 left-2 bg-black/50 text-xs px-2 py-1 rounded">Profile</span>
                            </div>
                            <div className="relative group">
                                <img src={req.selfie_url} className="w-full h-full object-cover" />
                                <span className="absolute bottom-2 left-2 bg-black/50 text-xs px-2 py-1 rounded">Proof</span>
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-1">{req.user?.display_name}</h3>
                            <p className="text-xs text-gray-500 mb-4 h-full">User ID: {req.user_id}</p>

                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                <form action={`/api/admin/verify`} method="POST">
                                    <input type="hidden" name="id" value={req.id} />
                                    <input type="hidden" name="user_id" value={req.user_id} />
                                    <input type="hidden" name="action" value="reject" />
                                    <button type="submit" className="w-full py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-sm font-bold transition-colors">
                                        Reject
                                    </button>
                                </form>
                                <form action={`/api/admin/verify`} method="POST">
                                    <input type="hidden" name="id" value={req.id} />
                                    <input type="hidden" name="user_id" value={req.user_id} />
                                    <input type="hidden" name="action" value="approve" />
                                    <button type="submit" className="w-full py-3 bg-green-500 text-black hover:bg-green-400 rounded-xl text-sm font-bold transition-colors">
                                        Approve
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                ))}

                {requests?.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        <span className="material-symbols-outlined text-4xl mb-4 block">check_circle</span>
                        No pending verifications.
                    </div>
                )}
            </div>
        </div>
    );
}
