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
    const target_user_id = formData.get('user_id') as string;
    const action = formData.get('action') as string;

    if (!id || !target_user_id || !action) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    try {
        if (action === 'approve') {
            // Transaction-like updates

            // A. Mark Request Approved
            const { error: e1 } = await supabase
                .from('verification_requests')
                .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
                .eq('id', id);
            if (e1) throw e1;

            // B. Update Profile to Verified
            const { error: e2 } = await supabase
                .from('profiles')
                .update({ verification_status: 'verified', verified_at: new Date().toISOString() })
                .eq('id', target_user_id);
            if (e2) throw e2;

        } else if (action === 'reject') {
            // A. Mark Request Rejected
            const { error } = await supabase
                .from('verification_requests')
                .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user.id })
                .eq('id', id);
            if (error) throw error;

            // B. Optionally mark profile as rejected?
            const { error: e2 } = await supabase
                .from('profiles')
                .update({ verification_status: 'rejected' })
                .eq('id', target_user_id);
            if (e2) throw e2;
        }

        // Redirect back to admin page
        return NextResponse.redirect(new URL('/admin/verify', request.url), 303);

    } catch (error) {
        console.error('Error processing verification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
