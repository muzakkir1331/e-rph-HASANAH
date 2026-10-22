import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase/client';
import { SharedReviewRecord } from '@/types/erph';

export const dynamic = 'force-dynamic';

const REVIEWS_DIR = path.join(process.cwd(), 'src', 'data', 'cloud_profiles', 'reviews');

function ensureDirExists() {
  if (!fs.existsSync(REVIEWS_DIR)) {
    fs.mkdirSync(REVIEWS_DIR, { recursive: true });
  }
}

/**
 * POST /api/semak/generate
 * Menjana pautan khas mingguan (Magic Link) untuk disemak oleh Pengetua / PGB luar
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      teacherName,
      teacherEmail,
      schoolName,
      schoolLogo,
      weekNo,
      academicYear = 2026,
      rphList
    } = body;

    if (!userId || !weekNo) {
      return NextResponse.json(
        { success: false, error: 'userId dan weekNo diperlukan untuk menjana pautan semakan.' },
        { status: 400 }
      );
    }

    ensureDirExists();

    // Jana token selamat berasaskan nanoid / crypto hex
    const rawToken = crypto.randomBytes(12).toString('hex');
    const shareToken = `rev_${rawToken}`;

    const reviewData: SharedReviewRecord = {
      share_token: shareToken,
      user_id: userId,
      teacher_name: teacherName || 'Guru',
      teacher_email: teacherEmail || '',
      school_name: schoolName || 'SEKOLAH SAYA',
      school_logo: schoolLogo || '',
      minggu_ke: Number(weekNo),
      tahun_akademik: Number(academicYear),
      status: 'MENUNGGU_SEMAKAN',
      rph_snapshot: rphList || [],
      created_at: new Date().toISOString()
    };

    // 1. Simpan ke fail lokal pelayan
    const filePath = path.join(REVIEWS_DIR, `review_${shareToken}.json`);
    fs.writeFileSync(filePath, JSON.stringify(reviewData, null, 2), 'utf-8');

    // 2. Simpan ke Supabase jika ada sambungan
    if (supabase) {
      try {
        await supabase.from('semakan_luar').insert([
          {
            share_token: shareToken,
            user_id: userId,
            teacher_name: reviewData.teacher_name,
            teacher_email: reviewData.teacher_email,
            school_name: reviewData.school_name,
            school_logo: reviewData.school_logo,
            minggu_ke: reviewData.minggu_ke,
            tahun_akademik: reviewData.tahun_akademik,
            status: 'MENUNGGU_SEMAKAN',
            rph_snapshot: reviewData.rph_snapshot
          }
        ]);
      } catch (err) {
        console.warn('Amaran: Gagal simpan ke Supabase semakan_luar:', err);
      }
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const fullReviewUrl = `${protocol}://${host}/semak/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareToken,
      reviewUrl: `/semak/${shareToken}`,
      fullReviewUrl,
      weekNo,
      message: `Pautan semakan e-RPH Minggu ${weekNo} berjaya dijana!`
    });
  } catch (error: any) {
    console.error('Ralat di POST /api/semak/generate:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menjana pautan semakan luar.' },
      { status: 500 }
    );
  }
}
