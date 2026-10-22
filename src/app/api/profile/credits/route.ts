import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase/client';
import { UserProfile } from '@/types/erph';

export const dynamic = 'force-dynamic';

const CLOUD_PROFILES_DIR = path.join(process.cwd(), 'src', 'data', 'cloud_profiles');

function getProfileFilePath(identifier: string): string {
  const safeIdentifier = (identifier || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  return path.join(CLOUD_PROFILES_DIR, `user_profile_${safeIdentifier}.json`);
}

/**
 * POST /api/profile/credits
 * Menyemak dan menolak 1 kredit AI bagi setiap janaan RPH Co-Pilot.
 * Pelan PRO mempunyai akses tanpa had.
 * Pelan FREE terhad kepada 5 kredit permulaan.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, amount = 1 } = body;

    const identifier = userId || email;
    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'userId atau email diperlukan.' },
        { status: 400 }
      );
    }

    const filePath = getProfileFilePath(identifier);
    let profile: Partial<UserProfile> = {};

    if (fs.existsSync(filePath)) {
      try {
        profile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch {}
    }

    const isPro = profile.plan_type === 'pro';
    const currentCredits = profile.ai_credits_remaining !== undefined ? profile.ai_credits_remaining : 5;

    // Jika pelan percuma dan kredit telah habis
    if (!isPro && currentCredits <= 0) {
      return NextResponse.json(
        {
          success: false,
          code: 'CREDIT_LIMIT_REACHED',
          error: 'Kuota janaan AI percuma anda telah habis (0 kredit baki). Sila naik taraf ke Pelan PRO untuk menikmati janaan tanpa had.',
          creditsRemaining: 0,
          planType: 'free'
        },
        { status: 403 }
      );
    }

    // Tolak kredit jika Free tier
    const newCredits = isPro ? currentCredits : Math.max(0, currentCredits - amount);

    profile.ai_credits_remaining = newCredits;
    profile.updated_at = new Date().toISOString();

    if (!fs.existsSync(CLOUD_PROFILES_DIR)) {
      fs.mkdirSync(CLOUD_PROFILES_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(profile, null, 2), 'utf-8');

    if (supabase) {
      try {
        await supabase
          .from('user_profiles')
          .update({ ai_credits_remaining: newCredits, updated_at: profile.updated_at })
          .eq('user_id', profile.user_id || identifier);
      } catch (err) {
        console.warn('Amaran: Gagal kemas kini kredit di Supabase:', err);
      }
    }

    return NextResponse.json({
      success: true,
      isPro,
      creditsRemaining: newCredits,
      deducted: isPro ? 0 : amount
    });
  } catch (error: any) {
    console.error('Ralat di POST /api/profile/credits:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyemak kredit AI.' },
      { status: 500 }
    );
  }
}
