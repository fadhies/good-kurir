import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  getById as sbGet,
  insertOne,
  updateById as sbUpdate,
  deleteById as sbDelete,
  selectQuery,
} from '../../shared/supabase.ts';

// Frontend-facing CRUD for Supabase tables. Enforces per-table access control
// server-side because the service_role key bypasses Supabase RLS.
// Currently wired for the `orders` table (Order entity migration).

const TABLE = 'orders';

function isAdmin(user) { return user?.role === 'admin'; }

// Order read ACL: owner OR assigned driver OR pending_match OR admin.
function canReadOrder(user, row) {
  if (!row) return false;
  if (isAdmin(user)) return true;
  return row.created_by_id === user.id || row.driver_id === user.id || row.status === 'pending_match';
}
// Order write ACL: owner OR assigned driver OR admin.
function canWriteOrder(user, row) {
  if (!row) return false;
  if (isAdmin(user)) return true;
  return row.created_by_id === user.id || row.driver_id === user.id;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { op } = body;

    if (op === 'list') {
      if (!isAdmin(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const rows = await selectQuery(TABLE, { order: body.sort, limit: body.limit });
      return Response.json({ ok: true, data: rows });
    }

    if (op === 'filter') {
      const filter = body.query || {};
      const or = isAdmin(user)
        ? undefined
        : `or=(created_by_id.eq.${user.id},driver_id.eq.${user.id},status.eq.pending_match)`;
      const rows = await selectQuery(TABLE, { filter, order: body.sort, limit: body.limit, or });
      return Response.json({ ok: true, data: rows });
    }

    if (op === 'get') {
      const row = await sbGet(TABLE, body.id);
      if (!row) return Response.json({ ok: true, data: null });
      if (!canReadOrder(user, row)) return Response.json({ ok: true, data: null });
      return Response.json({ ok: true, data: row });
    }

    if (op === 'create') {
      const data = body.data || {};
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const row = await insertOne(TABLE, {
        ...data,
        id,
        created_date: now,
        updated_date: now,
        created_by_id: user.id,
      });
      return Response.json({ ok: true, data: row });
    }

    if (op === 'update') {
      const existing = await sbGet(TABLE, body.id);
      if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });
      if (!canWriteOrder(user, existing)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const patch = { ...(body.patch || {}), updated_date: new Date().toISOString() };
      delete patch.id;
      delete patch.created_by_id;
      const row = await sbUpdate(TABLE, body.id, patch);
      return Response.json({ ok: true, data: row });
    }

    if (op === 'delete') {
      if (!isAdmin(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      await sbDelete(TABLE, body.id);
      return Response.json({ ok: true, data: { id: body.id } });
    }

    return Response.json({ error: 'Unknown op: ' + op }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}