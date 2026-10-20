import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import defaultJadual from '@/data/jadual_waktu.json';
import { isDeLIMAEmail } from '@/lib/firebase/config';

export const dynamic = 'force-dynamic';

// Direktori storan profil awan (Cloud Profiles) khusus bagi setiap guru
const CLOUD_PROFILES_DIR = path.join(process.cwd(), 'src', 'data', 'cloud_profiles');

function ensureDirExists() {
  if (!fs.existsSync(CLOUD_PROFILES_DIR)) {
    fs.mkdirSync(CLOUD_PROFILES_DIR, { recursive: true });
  }
}

// Menjana nama fail profil yang selamat daripada e-mel atau UID guru
function getProfileFilePath(email: string, uid?: string): string {
  const safeIdentifier = (email || uid || 'guru_delima')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  return path.join(CLOUD_PROFILES_DIR, `profile_${safeIdentifier}.json`);
}

/**
 * GET: Mengambil jadual waktu guru dari profil cloud masing-masing
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || '';
    const uid = searchParams.get('uid') || '';

    if (!email && !uid) {
      return NextResponse.json(
        { error: 'E-mel atau UID DeLIMA diperlukan untuk capaian profil cloud.' },
        { status: 400 }
      );
    }

    ensureDirExists();
    const filePath = getProfileFilePath(email, uid);

    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const profile = JSON.parse(rawData);

      return NextResponse.json({
        success: true,
        source: 'cloud_profile',
        email: profile.email || email,
        teacherName: profile.teacherName || '',
        timetable: profile.timetable || [],
        updatedAt: profile.updatedAt || null
      });
    }

    // Jika profil cloud belum wujud bagi akaun guru ini, inisialisasikan profil tersendiri
    const initialProfile = {
      email,
      uid,
      teacherName: email.split('@')[0],
      timetable: defaultJadual,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      storageType: 'cloud_workspace'
    };

    fs.writeFileSync(filePath, JSON.stringify(initialProfile, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      source: 'cloud_profile_initialized',
      email,
      teacherName: initialProfile.teacherName,
      timetable: initialProfile.timetable,
      updatedAt: initialProfile.updatedAt
    });
  } catch (error: any) {
    console.error('Ralat membaca profil cloud:', error);
    return NextResponse.json(
      { error: error?.message || 'Ralat pelayan semasa membaca profil cloud.' },
      { status: 500 }
    );
  }
}

/**
 * POST: Menyimpan jadual waktu guru ke dalam profil cloud masing-masing secara selamat
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, uid, teacherName, timetable } = body;

    if (!email && !uid) {
      return NextResponse.json(
        { error: 'E-mel atau UID DeLIMA diperlukan untuk menyimpan jadual ke profil cloud.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(timetable)) {
      return NextResponse.json(
        { error: 'Format jadual waktu tidak sah (mesti senarai slot array).' },
        { status: 400 }
      );
    }

    ensureDirExists();
    const filePath = getProfileFilePath(email, uid);

    const nowIso = new Date().toISOString();
    const profileData = {
      email,
      uid,
      teacherName: teacherName || email.split('@')[0],
      isDeLIMA: isDeLIMAEmail(email),
      timetable,
      updatedAt: nowIso,
      storageType: 'cloud_workspace'
    };

    fs.writeFileSync(filePath, JSON.stringify(profileData, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Jadual waktu guru berjaya disimpan secara kekal dalam profil cloud DeLIMA.',
      email,
      updatedAt: nowIso,
      slotsCount: timetable.length
    });
  } catch (error: any) {
    console.error('Ralat menyimpan profil cloud:', error);
    return NextResponse.json(
      { error: error?.message || 'Ralat pelayan semasa menyimpan profil cloud.' },
      { status: 500 }
    );
  }
}
