import { secrets } from 'base44:runtime';
import { selectQuery } from '../../shared/supabase.ts';

// Migrasi sekali jalan: trigger realtime broadcast untuk admin_chat_messages.
// Setiap INSERT/UPDATE/DELETE mengirim sinyal ke topik admin_chat:<driver_id>
// agar chat langsung admin-driver (AdminDriverChat) dapat pembaruan realtime;
// polling 30 detik tetap menjadi jaring pengaman.
export default async function(req) {
  try {
    const token = (secrets.get('SUPABASE_ACCESS_TOKEN') || '').trim();
    const url = (secrets.get('SUPABASE_URL') || '').replace(/\/+$/, '');
    if (!token || !url) {
      return Response.json({ error: 'SUPABASE_ACCESS_TOKEN / SUPABASE_URL belum diatur' }, { status: 500 });
    }
    const match = url.match(/^https:\/\/([a-z0-9]{20})\.supabase\.co/i);
    if (!match) return Response.json({ error: 'SUPABASE_URL tidak dikenali' }, { status: 500 });
    const projectRef = match[1];

    const sql = `
      create or replace function public.broadcast_admin_chat_changes()
      returns trigger
      security definer
      set search_path = ''
      as $fn$
      declare
        r record;
      begin
        r := case when tg_op = 'DELETE' then old else new end;
        begin
          perform realtime.send(
            jsonb_build_object('driver_id', r.driver_id),
            tg_op,
            'admin_chat:' || r.driver_id,
            false
          );
        exception when others then
          null;
        end;
        return null;
      end;
      $fn$ language plpgsql;

      drop trigger if exists broadcast_admin_chat_changes_trigger on public.admin_chat_messages;
      create trigger broadcast_admin_chat_changes_trigger
      after insert or update or delete on public.admin_chat_messages
      for each row execute function public.broadcast_admin_chat_changes();
    `;
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    if (!res.ok) {
      return Response.json({ error: `Management API ${res.status}: ${text}` }, { status: 500 });
    }

    // Pastikan endpoint ACL tetap membaca tabel dengan baik.
    const probe = await selectQuery('admin_chat_messages', { filter: {}, limit: 1 });
    return Response.json({ ok: true, result: text, probe_count: probe.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}