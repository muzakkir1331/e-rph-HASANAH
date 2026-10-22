import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase/client';
import { SharedReviewRecord, RPHRecord } from '@/types/erph';

export const dynamic = 'force-dynamic';

const REVIEWS_DIR = path.join(process.cwd(), 'src', 'data', 'cloud_profiles', 'reviews');
const CLOUD_PROFILES_DIR = path.join(process.cwd(), 'src', 'data', 'cloud_profiles');

function ensureDirExists() {
  if (!fs.existsSync(REVIEWS_DIR)) {
    fs.mkdirSync(REVIEWS_DIR, { recursive: true });
  }
}

/**
 * GET /api/semak/[token]
 * Mengambil data semakan RPH mingguan secara terbuka untuk Pengetua/Guru Besar
 * (Tiada log masuk diperlukan)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token semakan tidak sah.' },
        { status: 400 }
      );
    }

    ensureDirExists();
    const filePath = path.join(REVIEWS_DIR, `review_${token}.json`);

    // 1. Cuba cari dalam storan fail lokal
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return NextResponse.json({
        success: true,
        review: data as SharedReviewRecord
      });
    }

    // 2. Cuba cari dalam pangkalan data Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('semakan_luar')
          .select('*')
          .eq('share_token', token)
          .single();

        if (data && !error) {
          return NextResponse.json({
            success: true,
            review: data as SharedReviewRecord
          });
        }
      } catch (err) {
        console.warn('Amaran: Gagal ambil semakan dari Supabase:', err);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Pautan semakan tidak dijumpai atau telah tamat tempoh.'
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Ralat di GET /api/semak/[token]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat turun data semakan.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/semak/[token]
 * Pengetua / PGB menurunkan tandatangan digital, menulis ulasan, dan mengesahkan e-RPH
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await req.json();
    const {
      namaPenyemak,
      jawatanPenyemak,
      ulasanPenyemak,
      tandatanganPenyemak,
      status = 'DISEMAK'
    } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token semakan diperlukan.' },
        { status: 400 }
      );
    }

    if (!namaPenyemak || !namaPenyemak.trim()) {
      return NextResponse.json(
        { success: false, error: 'Sila masukkan Nama Penyemak / Pengetua.' },
        { status: 400 }
      );
    }

    ensureDirExists();
    const filePath = path.join(REVIEWS_DIR, `review_${token}.json`);

    let reviewData: Partial<SharedReviewRecord> = {};
    if (fs.existsSync(filePath)) {
      try {
        reviewData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch {}
    } else if (supabase) {
      try {
        const { data } = await supabase
          .from('semakan_luar')
          .select('*')
          .eq('share_token', token)
          .single();
        if (data) reviewData = data;
      } catch {}
    }

    if (!reviewData.share_token) {
      return NextResponse.json(
        { success: false, error: 'Rekod semakan tidak ditemui.' },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();
    const updatedReview: SharedReviewRecord = {
      ...reviewData,
      share_token: token,
      user_id: reviewData.user_id || '',
      teacher_name: reviewData.teacher_name || 'Guru',
      school_name: reviewData.school_name || 'SEKOLAH',
      minggu_ke: reviewData.minggu_ke || 1,
      tahun_akademik: reviewData.tahun_akademik || 2026,
      status: status as any,
      nama_penyemak: namaPenyemak.trim(),
      jawatan_penyemak: jawatanPenyemak?.trim() || 'Pengetua / Guru Besar',
      ulasan_penyemak: ulasanPenyemak?.trim() || 'e-RPH disemak dan disahkan mengikut piawaian SPI Bil. 3/1999.',
      tandatangan_penyemak: tandatanganPenyemak || reviewData.tandatangan_penyemak,
      tarikh_disemak: nowIso,
      rph_snapshot: reviewData.rph_snapshot || []
    };

    // 1. Simpan kemaskini ke fail lokal
    fs.writeFileSync(filePath, JSON.stringify(updatedReview, null, 2), 'utf-8');

    // 2. Kemas kini di Supabase
    if (supabase) {
      try {
        await supabase
          .from('semakan_luar')
          .update({
            status: updatedReview.status,
            nama_penyemak: updatedReview.nama_penyemak,
            jawatan_penyemak: updatedReview.jawatan_penyemak,
            ulasan_penyemak: updatedReview.ulasan_penyemak,
            tandatangan_penyemak: updatedReview.tandatangan_penyemak,
            tarikh_disemak: updatedReview.tarikh_disemak
          })
          .eq('share_token', token);
      } catch (err) {
        console.warn('Amaran: Gagal kemas kini semakan_luar di Supabase:', err);
      }
    }

    // 3. Salin pengesahan pengetua ke fail rekod guru supaya muncul pada paparan & cetakan guru
    try {
      const teacherUserId = updatedReview.user_id;
      const safeId = (teacherUserId || updatedReview.teacher_email || '')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_');

      if (safeId) {
        const teacherRecordsFile = path.join(CLOUD_PROFILES_DIR, `saved_records_${safeId}.json`);
        if (fs.existsSync(teacherRecordsFile)) {
          const rawRecords = JSON.parse(fs.readFileSync(teacherRecordsFile, 'utf-8'));
          const weekNum = updatedReview.minggu_ke;

          Object.keys(rawRecords).forEach(key => {
            const rec: Partial<RPHRecord> = rawRecords[key];
            if (rec && rec.minggu_ke === weekNum) {
              rec.status = 'DISEMAK';
              rec.penyemak_nama = updatedReview.nama_penyemak;
              rec.penyemak_jawatan = updatedReview.jawatan_penyemak;
              rec.penyemak_ulasan = updatedReview.ulasan_penyemak;
              rec.penyemak_tandatangan = updatedReview.tandatangan_penyemak;
              rec.penyemak_tarikh_disemak = updatedReview.tarikh_disemak;
            }
          });

          fs.writeFileSync(teacherRecordsFile, JSON.stringify(rawRecords, null, 2), 'utf-8');
        }
      }
    } catch (e) {
      console.warn('Amaran sync rekod guru:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Pengesahan dan tandatangan digital e-RPH berjaya dihantar. Terima kasih atas semakan pihak pentadbir!',
      review: updatedReview
    });
  } catch (error: any) {
    console.error('Ralat di POST /api/semak/[token]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghantar pengesahan semakan.' },
      { status: 500 }
    );
  }
}
