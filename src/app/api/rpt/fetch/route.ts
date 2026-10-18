import { NextRequest, NextResponse } from 'next/server';
import { fetchRPTFromGoogleSheet } from '@/lib/google-sheets';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, sheetName, targetWeek } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'Pautan URL Google Sheet diperlukan.' },
        { status: 400 }
      );
    }

    const result = await fetchRPTFromGoogleSheet(url, sheetName || 'Sheet1', targetWeek);

    if (!result.success) {
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
