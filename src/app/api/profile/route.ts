import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase/client';
import { UserProfile } from '@/types/erph';

export const dynamic = 'force-dynamic';

const CLOUD_PROFILES_DIR = path.join(process.cwd(), 'src', 'data', 'cloud_profiles');

function ensureDirExists() {
  if (!fs.existsSync(CLOUD_PROFILES_DIR)) {
    fs.mkdirSync(CLOUD_PROFILES_DIR, { recursive: true });
  }
}

function getProfileFilePath(identifier: string): string {
  const safeIdentifier = (identifier || 'unknown_teacher')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  return path.join(CLOUD_PROFILES_DIR, `user_profile_${safeIdentifier}.json`);
}

/**
 * GET /api/profile?userId=...&email=...
 * Mengambil maklumat profil guru, status onboarding, dan langganan (Free/Pro)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || searchParams.get('uid') || '';
    const email = searchParams.get('email') || '';

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: 'userId atau email diperlukan.' },
        { status: 400 }
      );
    }

    const identifier = userId || email;

    // 1. Cuba ambil daripada pangkalan data Supabase
    if (supabase) {
      try {
        let query = supabase.from('user_profiles').select('*');
        if (userId) {
          query = query.eq('user_id', userId);
        } else {
          query = query.eq('email', email);
        }

        const { data, error } = await query.single();
        if (data && !error) {
          return NextResponse.json({
            success: true,
            source: 'supabase',
            profile: data as UserProfile
          });
        }
      } catch (err) {
        console.warn('Amaran: Gagal mencapai Supabase user_profiles, menggunakan sandaran lokal:', err);
      }
    }

    // 2. Sandaran lokal fail storan pelayan
    ensureDirExists();
    const filePath = getProfileFilePath(identifier);

    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const profile = JSON.parse(raw);
      return NextResponse.json({
        success: true,
        source: 'local_storage',
        profile: profile as UserProfile
      });
    }

    // 3. Jika profil belum wujud langsung, jana profil lalai
    const defaultProfile: UserProfile = {
      user_id: userId || identifier,
      email: email,
      full_name: email ? email.split('@')[0] : 'Guru',
      school_name: '',
      district: '',
      state: '',
      position: 'Guru Akademik',
      is_onboarding_completed: false,
      plan_type: 'free',
      ai_credits_remaining: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(defaultProfile, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      source: 'initial_default',
      profile: defaultProfile
    });
  } catch (error: any) {
    console.error('Ralat di GET /api/profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat turun profil pengguna.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile
 * Mengemas kini atau melengkapkan profil guru (Onboarding Wizard & Tetapan)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      email,
      full_name,
      ic_number,
      phone_number,
      school_name,
      school_code,
      district,
      state,
      position,
      school_logo,
      teacher_signature,
      is_onboarding_completed
    } = body;

    if (!user_id && !email) {
      return NextResponse.json(
        { success: false, error: 'user_id atau email diperlukan.' },
        { status: 400 }
      );
    }

    const identifier = user_id || email;
    ensureDirExists();
    const filePath = getProfileFilePath(identifier);

    let existingProfile: Partial<UserProfile> = {};
    if (fs.existsSync(filePath)) {
      try {
        existingProfile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch {}
    }

    const updatedProfile: UserProfile = {
      user_id: user_id || existingProfile.user_id || identifier,
      email: email || existingProfile.email || '',
      full_name: full_name !== undefined ? full_name : (existingProfile.full_name || ''),
      ic_number: ic_number !== undefined ? ic_number : existingProfile.ic_number,
      phone_number: phone_number !== undefined ? phone_number : existingProfile.phone_number,
      school_name: school_name !== undefined ? school_name : (existingProfile.school_name || ''),
      school_code: school_code !== undefined ? school_code : existingProfile.school_code,
      district: district !== undefined ? district : (existingProfile.district || ''),
      state: state !== undefined ? state : (existingProfile.state || ''),
      position: position !== undefined ? position : (existingProfile.position || 'Guru Akademik'),
      school_logo: school_logo !== undefined ? school_logo : existingProfile.school_logo,
      teacher_signature: teacher_signature !== undefined ? teacher_signature : existingProfile.teacher_signature,
      is_onboarding_completed: is_onboarding_completed !== undefined ? is_onboarding_completed : (existingProfile.is_onboarding_completed ?? true),
      plan_type: existingProfile.plan_type || 'free',
      ai_credits_remaining: existingProfile.ai_credits_remaining !== undefined ? existingProfile.ai_credits_remaining : 5,
      subscription_expires_at: existingProfile.subscription_expires_at,
      voucher_code_used: existingProfile.voucher_code_used,
      created_at: existingProfile.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Simpan ke fail lokal pelayan
    fs.writeFileSync(filePath, JSON.stringify(updatedProfile, null, 2), 'utf-8');

    // 2. Simpan ke Supabase jika sambungan aktif
    if (supabase) {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .upsert(
            {
              user_id: updatedProfile.user_id,
              email: updatedProfile.email,
              full_name: updatedProfile.full_name,
              ic_number: updatedProfile.ic_number,
              phone_number: updatedProfile.phone_number,
              school_name: updatedProfile.school_name,
              school_code: updatedProfile.school_code,
              district: updatedProfile.district,
              state: updatedProfile.state,
              position: updatedProfile.position,
              school_logo: updatedProfile.school_logo,
              teacher_signature: updatedProfile.teacher_signature,
              is_onboarding_completed: updatedProfile.is_onboarding_completed,
              plan_type: updatedProfile.plan_type,
              ai_credits_remaining: updatedProfile.ai_credits_remaining,
              voucher_code_used: updatedProfile.voucher_code_used,
              updated_at: updatedProfile.updated_at
            },
            { onConflict: 'user_id' }
          );

        if (error) {
          console.warn('Amaran upsert Supabase user_profiles:', error.message);
        }
      } catch (err) {
        console.warn('Amaran: Gagal simpan ke Supabase user_profiles:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profil guru berjaya disimpan dan dikemaskini.',
      profile: updatedProfile
    });
  } catch (error: any) {
    console.error('Ralat di POST /api/profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan profil pengguna.' },
      { status: 500 }
    );
  }
}
