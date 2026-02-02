import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 1. Check Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // 2. Parse Body
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const action = formData.get('action') as string;
    // If banning, we need reported_profile_id too, but we can fetch it or pass it.
    // Ideally pass it.
    const reported_profile_id = formData.get('reported_profile_id') as string;

    if (!id || !action) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    try {
        if (action === 'dismiss') {
            // Close report
            const { error } = await supabase
                .from('reports')
                .update({
                    resolved_at: new Date().toISOString(),
                    resolved_by: user.id,
                    action_taken: 'dismissed'
                })
                .eq('id', id);
            if (error) throw error;

        } else if (action === 'ban') {
            // 1. Close report
            const { error: e1 } = await supabase
                .from('reports')
                .update({
                    resolved_at: new Date().toISOString(),
                    resolved_by: user.id,
                    action_taken: 'banned_user'
                })
                .eq('id', id);
            if (e1) throw e1;

            // 2. Ban User in Profiles
            if (reported_profile_id) {
                const { error: e2 } = await supabase
                    .from('profiles')
                    .update({ verification_status: 'banned' })
                    .eq('id', reported_profile_id);
                if (e2) throw e2;
            }
        }

        return NextResponse.redirect(new URL('/admin/reports', request.url), 303);

    } catch (error) {
        console.error('Error processing report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
