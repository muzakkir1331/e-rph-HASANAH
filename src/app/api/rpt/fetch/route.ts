import { NextRequest, NextResponse } from 'next/server';
import { fetchRPTFromGoogleSheet } from '@/lib/google-sheets';
import { findRPTRecord, convertToRPTItem } from '@/lib/rpt-helper';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, sheetName, targetWeek, subject, form, preferLocal } = body;

    // Jika preferLocal dipilih atau jika subjek dan tingkatan dihantar tanpa URL khas
    if ((preferLocal || !url || url.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')) && subject && form && targetWeek) {
      const localRec = findRPTRecord(subject, form, targetWeek);
      if (localRec) {
        return NextResponse.json({
          success: true,
          source: 'local_rpt',
          items: [convertToRPTItem(localRec)],
          raw: localRec
        });
      }
    }

    if (!url) {
      return NextResponse.json(
        { error: 'Pautan URL Google Sheet atau maklumat subjek diperlukan.' },
        { status: 400 }
      );
    }

    const result = await fetchRPTFromGoogleSheet(url, sheetName || 'Sheet1', targetWeek);

    if (!result.success) {
      // Fallback pintar ke RPT Panitia tempatan jika Google Sheet gagal dicapai
      if (subject && form && targetWeek) {
        const localRec = findRPTRecord(subject, form, targetWeek);
        if (localRec) {
          return NextResponse.json({
            success: true,
            source: 'local_rpt_fallback',
            items: [convertToRPTItem(localRec)],
            raw: localRec
          });
        }
      }

      return NextResponse.json(
        { error: result.error || 'Gagal membaca fail Google Sheet.' },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Ralat API RPT:', error);
    return NextResponse.json(
      { error: error.message || 'Ralat pelayan semasa memproses Google Sheet' },
      { status: 500 }
    );
  }
}
