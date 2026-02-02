import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminReportsPage() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: { getAll() { return cookieStore.getAll() }, setAll() { } },
        }
    );

    // Fetch Reports with Reporter and Reported Profile details
    const { data: reports } = await supabase
        .from('reports')
        .select(`
            *,
            reporter:profiles!reporter_id(display_name, avatar_url),
            reported:profiles!reported_profile_id(display_name, avatar_url, profile_type)
        `)
        .order('created_at', { ascending: false });

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">User Reports</h1>

            <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-xs uppercase font-bold text-gray-300">
                        <tr>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Reported User</th>
                            <th className="px-6 py-4">Reason</th>
                            <th className="px-6 py-4">Details</th>
                            <th className="px-6 py-4">Reporter</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {reports?.map((report: any) => (
                            <tr key={report.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    {report.resolved_at ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                                            Resolved
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 animate-pulse">
                                            Pending
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={report.reported?.avatar_url || 'https://placehold.co/100'} className="w-8 h-8 rounded-full object-cover" />
                                        <span className="font-bold text-white">{report.reported?.display_name || 'Unknown'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-white">{report.reason}</td>
                                <td className="px-6 py-4 max-w-xs truncate">{report.details || '-'}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs">{report.reporter?.display_name || 'Unknown'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs">
                                    {new Date(report.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {!report.resolved_at && (
                                        <div className="flex justify-end gap-2">
                                            <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white">Dismiss</button>
                                            <button className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-xs text-white font-bold">Ban User</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {reports?.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    No reports found. Good job!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
