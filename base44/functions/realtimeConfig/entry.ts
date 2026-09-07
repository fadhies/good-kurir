import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const url = (secrets.get('SUPABASE_URL') || '').replace(/\/+$/, '');
    const anonKey = secrets.get('SUPABASE_ANON_KEY');
    if (!url || !anonKey) {
      return Response.json(
        { error: 'SUPABASE_URL / SUPABASE_ANON_KEY belum diatur' },
        { status: 500 }
      );
    }

    // Kunci anon memang dirancang publik: semua tabel terproteksi RLS tanpa
    // policy, jadi klien hanya bisa dipakai untuk channel Realtime Broadcast.
    // Data sensitif tetap hanya lewat endpoint ACL (supabaseCrud).
    return Response.json({ url, anonKey });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}