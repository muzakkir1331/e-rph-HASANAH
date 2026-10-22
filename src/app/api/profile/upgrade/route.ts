import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase/client';
import { UserProfile } from '@/types/erph';

export const dynamic = 'force-dynamic';

const CLOUD_PROFILES_DIR = path.join(process.cwd(), 'src', 'data', 'cloud_profiles');

const VALID_VOUCHERS: Record<string, { credits: number; days: number; description: string }> = {
  'GURUPRO2026': { credits: 500, days: 365, description: 'Baucar Promosi Khas Guru Malaysia 2026' },
  'CIKGUJUARA': { credits: 500, days: 365, description: 'Penebusan Lesen PRO Cikgu Juara' },
  'HASANAHPRO': { credits: 500, days: 365, description: 'Lesen Pendidik Komuniti Pro' },
  'SAAS2026': { credits: 500, days: 365, description: 'Akaun Akses Penuh Pelan SaaS' },
  'PROGURU': { credits: 300, days: 180, description: 'Pakej Setengah Tahun Guru Pro' }
};

function getProfileFilePath(identifier: string): string {
  const safeIdentifier = (identifier || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  return path.join(CLOUD_PROFILES_DIR, `user_profile_${safeIdentifier}.json`);
}

/**
 * POST /api/profile/upgrade
 * Menaik taraf akaun guru ke Pelan PRO melalui Kod Baucar atau Pembayaran Langganan
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, voucherCode, paymentMethod } = body;

    const identifier = userId || email;
    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'userId atau email diperlukan.' },
        { status: 400 }
      );
    }

    let planDurationDays = 365;
    let creditsAdded = 500;
    let methodUsed = 'direct_upgrade';
    let voucherNormalized = '';

    // Jika pengguna memasukkan kod baucar
    if (voucherCode && typeof voucherCode === 'string') {
      voucherNormalized = voucherCode.trim().toUpperCase();
      const voucherInfo = VALID_VOUCHERS[voucherNormalized];

      if (!voucherInfo) {
        return NextResponse.json(
          {
            success: false,
            error: `Kod baucar/lesen "${voucherNormalized}" tidak sah atau telah tamat tempoh.`
          },
          { status: 400 }
        );
      }

      creditsAdded = voucherInfo.credits;
      planDurationDays = voucherInfo.days;
      methodUsed = `voucher_${voucherNormalized}`;
    } else if (paymentMethod) {
      methodUsed = `payment_${paymentMethod}`;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + planDurationDays);

    // Ambil profil sedia ada
    const filePath = getProfileFilePath(identifier);
    let currentProfile: Partial<UserProfile> = {};
    if (fs.existsSync(filePath)) {
      try {
        currentProfile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch {}
    }

    const updatedProfile: UserProfile = {
      user_id: userId || currentProfile.user_id || identifier,
      email: email || currentProfile.email || '',
      full_name: currentProfile.full_name || 'Guru',
      school_name: currentProfile.school_name || 'SEKOLAH SAYA',
      district: currentProfile.district || '',
      state: currentProfile.state || '',
      position: currentProfile.position || 'Guru Akademik',
      school_logo: currentProfile.school_logo,
      teacher_signature: currentProfile.teacher_signature,
      is_onboarding_completed: currentProfile.is_onboarding_completed ?? true,
      plan_type: 'pro',
      ai_credits_remaining: (currentProfile.ai_credits_remaining || 0) + creditsAdded,
      subscription_expires_at: expiryDate.toISOString(),
      voucher_code_used: voucherNormalized || methodUsed,
      created_at: currentProfile.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Simpan ke storan lokal
    if (!fs.existsSync(CLOUD_PROFILES_DIR)) {
      fs.mkdirSync(CLOUD_PROFILES_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(updatedProfile, null, 2), 'utf-8');

    // Simpan ke Supabase
    if (supabase) {
      try {
        await supabase.from('user_profiles').upsert(
          {
            user_id: updatedProfile.user_id,
            email: updatedProfile.email,
            plan_type: 'pro',
            ai_credits_remaining: updatedProfile.ai_credits_remaining,
            subscription_expires_at: updatedProfile.subscription_expires_at,
            voucher_code_used: updatedProfile.voucher_code_used,
            updated_at: updatedProfile.updated_at
          },
          { onConflict: 'user_id' }
        );
      } catch (err) {
        console.warn('Amaran: Gagal kemas kini naik taraf ke Supabase:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: voucherNormalized
        ? `Tahniah! Kod baucar "${voucherNormalized}" berjaya ditebus. Anda kini dinaik taraf ke Pelan PRO!`
        : `Tahniah! Anda kini aktif dalam Pelan PRO dengan akses penuh tanpa had.`,
      profile: updatedProfile
    });
  } catch (error: any) {
    console.error('Ralat di POST /api/profile/upgrade:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses naik taraf profil.' },
      { status: 500 }
    );
  }
}
