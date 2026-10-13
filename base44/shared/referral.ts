import { selectQuery, insertOne, updateWhere } from './supabase.ts';

// Logika program referal OjekTa, dipakai bersama oleh beberapa backend function.
// - Kupon hadiah: potongan ongkos kirim Rp2.000 untuk pemberi referal.
export const REFERRAL_COUPON_AMOUNT = 2000;

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function genCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

// Pastikan setiap user punya satu kode referal unik (dibuat saat pertama kali
// halaman referal dibuka). Kode disimpan di tabel referral_codes.
export async function ensureReferralCode(userId) {
  const existing = await selectQuery('referral_codes', { filter: { user_id: userId }, limit: 1 });
  if (existing.length) return existing[0].code;

  for (let i = 0; i < 5; i++) {
    const code = genCode();
    const dup = await selectQuery('referral_codes', { filter: { code }, limit: 1 });
    if (dup.length) continue;
    const now = new Date().toISOString();
    await insertOne('referral_codes', {
      id: crypto.randomUUID(),
      created_date: now,
      updated_date: now,
      created_by_id: userId,
      user_id: userId,
      code,
    });
    return code;
  }
  throw new Error('Gagal membuat kode referal');
}

// Terbitkan kupon Rp2.000 ke pemberi referal ketika order pertama penerima
// referal selesai. Idempoten: hanya SATU pemanggil yang berhasil mengubah
// status referral dari 'pending' ke 'rewarded' (update kondisional).
export async function awardReferralCoupon(order) {
  try {
    if (!order || !order.created_by_id) return null;
    const refs = await selectQuery('referrals', {
      filter: { referee_user_id: order.created_by_id, status: 'pending' },
      limit: 1,
    });
    if (!refs.length) return null;
    const ref = refs[0];

    const updated = await updateWhere(
      'referrals',
      { id: ref.id, status: 'pending' },
      {
        status: 'rewarded',
        rewarded_at: new Date().toISOString(),
        order_id: order.id,
        updated_date: new Date().toISOString(),
      }
    );
    // Sudah diproses oleh pemanggil lain — jangan terbitkan kupon dua kali.
    if (!updated.length) return null;

    const now = new Date().toISOString();
    const coupon = await insertOne('coupons', {
      id: crypto.randomUUID(),
      created_date: now,
      updated_date: now,
      created_by_id: ref.referrer_user_id,
      user_id: ref.referrer_user_id,
      type: 'delivery_discount',
      amount: REFERRAL_COUPON_AMOUNT,
      status: 'unused',
      source: 'referral',
      referee_user_id: order.created_by_id,
    });
    console.log(`Kupon referal Rp${REFERRAL_COUPON_AMOUNT} diterbitkan untuk user ${ref.referrer_user_id}`);
    return coupon;
  } catch (e) {
    console.error('awardReferralCoupon:', e.message);
    return null;
  }
}