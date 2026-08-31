import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { ensureBucket, uploadObject } from '../../shared/supabase.ts';

const BUCKET = 'app-uploads';
const MAX_BASE64 = 6_500_000; // ~4.8MB binary

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { base64, filename, contentType, folder } = body;
    if (!base64 || !filename || !contentType) {
      return Response.json({ error: 'base64, filename, contentType wajib diisi' }, { status: 400 });
    }
    if (base64.length > MAX_BASE64) {
      return Response.json({ error: 'Ukuran file terlalu besar' }, { status: 413 });
    }

    await ensureBucket(BUCKET, true);
    const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folder || 'photos'}/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const publicUrl = await uploadObject(BUCKET, path, base64, contentType);
    return Response.json({ url: publicUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}