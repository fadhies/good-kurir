import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  getById as sbGet,
  insertOne,
  updateById as sbUpdate,
  updateWhere as sbUpdateWhere,
  deleteById as sbDelete,
  selectQuery,
} from '../../shared/supabase.ts';

// Frontend-facing CRUD for Supabase tables. Enforces per-table access control
// server-side because the service_role key bypasses Supabase RLS.

function isAdmin(user) { return user?.role === 'admin'; }

function isParticipant(row, userId) {
  return Array.isArray(row?.participants) && row.participants.includes(userId);
}

// Read ACL per table.
function canRead(table, user, row) {
  if (!row) return false;
  if (isAdmin(user)) return true;
  switch (table) {
    case 'orders':
      return row.created_by_id === user.id || row.driver_id === user.id || row.status === 'pending_match';
    case 'driver_profiles':
      return row.created_by_id === user.id;
    case 'notifications':
    case 'wallet_transactions':
    case 'driver_remittances':
    case 'withdrawal_requests':
      return row.user_id === user.id;
    case 'chat_messages':
      return isParticipant(row, user.id);
    default:
      return false;
  }
}

// Write (update) ACL per table.
function canWrite(table, user, row) {
  if (!row) return false;
  if (isAdmin(user)) return true;
  switch (table) {
    case 'orders':
      return row.created_by_id === user.id || row.driver_id === user.id;
    case 'driver_profiles':
      return row.created_by_id === user.id;
    case 'notifications':
      return row.user_id === user.id;
    case 'chat_messages':
      return row.created_by_id === user.id;
    case 'wallet_transactions':
    case 'driver_remittances':
    case 'withdrawal_requests':
      return false; // admin only
    default:
      return false;
  }
}

// Create ACL per table (checked against the payload before insert).
function canCreate(table, user, data) {
  if (isAdmin(user)) return true;
  switch (table) {
    case 'orders':
    case 'chat_messages':
      return true; // created_by_id is forced to user.id
    case 'notifications':
      return data?.user_id === user.id;
    case 'driver_profiles':
      return data?.user_id === user.id;
    case 'driver_remittances':
    case 'withdrawal_requests':
      return data?.user_id === user.id;
    case 'wallet_transactions':
      return false; // admin only (backend creates directly via supabase.ts)
    default:
      return false;
  }
}

function canDelete(table, user, row) {
  if (isAdmin(user)) return true;
  switch (table) {
    case 'notifications':
      return row?.user_id === user.id;
    default:
      return false; // admin only
  }
}

// Build the access-scoped PostgREST `or`/filter for a non-admin filter call.
function scopeFilter(table, user, filter) {
  const f = { ...(filter || {}) };
  // chat_messages.participants is a jsonb array; translate a plain string
  // filter (used by the chat listener) into a containment query for everyone.
  if (table === 'chat_messages') {
    if (f.participants && typeof f.participants === 'string') {
      f.participants = { $cs: [f.participants] };
    } else if (!f.participants && !isAdmin(user)) {
      f.participants = { $cs: [user.id] };
    }
  }
  if (isAdmin(user)) return f;
  switch (table) {
    case 'driver_profiles':
      f.created_by_id = user.id; // force own profile
      return f;
    case 'notifications':
    case 'wallet_transactions':
    case 'driver_remittances':
    case 'withdrawal_requests':
      f.user_id = user.id; // force own records
      return f;
    default:
      return f;
  }
}

function orderOrScope(table, user) {
  if (table !== 'orders' || isAdmin(user)) return undefined;
  return `or=(created_by_id.eq.${user.id},driver_id.eq.${user.id},status.eq.pending_match)`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { op, table = 'orders' } = body;

    if (op === 'list') {
      if (!isAdmin(user)) return Response.json({ error: 'Forbidden' }, { status: 403 });
      const rows = await selectQuery(table, { order: body.sort, limit: body.limit });
      return Response.json({ ok: true, data: rows });
    }

    if (op === 'filter') {
      const filter = scopeFilter(table, user, body.query || {});
      const or = orderOrScope(table, user);
      const rows = await selectQuery(table, { filter, order: body.sort, limit: body.limit, or });
      return Response.json({ ok: true, data: rows });
    }

    if (op === 'get') {
      const row = await sbGet(table, body.id);
      if (!row) return Response.json({ ok: true, data: null });
      if (!canRead(table, user, row)) return Response.json({ ok: true, data: null });
      return Response.json({ ok: true, data: row });
    }

    if (op === 'create') {
      const data = body.data || {};
      if (!canCreate(table, user, data)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const row = await insertOne(table, {
        ...data,
        id,
        created_date: now,
        updated_date: now,
        created_by_id: user.id,
      });
      return Response.json({ ok: true, data: row });
    }

    if (op === 'update') {
      const existing = await sbGet(table, body.id);
      if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });
      if (!canWrite(table, user, existing)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const patch = { ...(body.patch || {}), updated_date: new Date().toISOString() };
      delete patch.id;
      delete patch.created_by_id;
      const row = await sbUpdate(table, body.id, patch);
      return Response.json({ ok: true, data: row });
    }

    if (op === 'updateMany') {
      // Only used for marking own notifications as read (and admin bulk on
      // wallet_transactions). Convert Mongo-style $set to a plain patch.
      const raw = body.patch || {};
      const patch = raw.$set ? raw.$set : raw;
      patch.updated_date = new Date().toISOString();
      delete patch.id;
      delete patch.created_by_id;
      const filter = { ...(body.query || {}) };
      if (!isAdmin(user)) {
        if (table === 'notifications') filter.user_id = user.id;
        else return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      const rows = await sbUpdateWhere(table, filter, patch);
      return Response.json({ ok: true, data: rows });
    }

    if (op === 'delete') {
      const existing = await sbGet(table, body.id);
      if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });
      if (!canDelete(table, user, existing)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      await sbDelete(table, body.id);
      return Response.json({ ok: true, data: { id: body.id } });
    }

    return Response.json({ error: 'Unknown op: ' + op }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}