import { NextRequest, NextResponse } from 'next/server';
import { findRPTRecord, convertToRPTItem, searchRPTRecords, rptCatalog, getSynchronizedWeeks } from '@/lib/rpt-helper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subjek = searchParams.get('subjek');
    const tingkatan = searchParams.get('tingkatan');
    const minggu = searchParams.get('minggu');
    const query = searchParams.get('q');
    const action = searchParams.get('action');

    // Kembalikan senarai minggu dan katalog subjek
    if (action === 'catalog') {
      return NextResponse.json({
        success: true,
        catalog: rptCatalog,
        weeks: getSynchronizedWeeks()
      });
    }

    // Jika carian teks disediakan
    if (query) {
      const results = searchRPTRecords(query, subjek || undefined, tingkatan || undefined);
      return NextResponse.json({
        success: true,
        count: results.length,
        items: results
      });
    }

    // Jika subjek, tingkatan, dan minggu diminta
    if (subjek && tingkatan && minggu) {
      const record = findRPTRecord(subjek, tingkatan, minggu);
      if (!record) {
        return NextResponse.json({
          success: false,
          error: `Tiada rekod RPT ditemui bagi ${subjek} Tingkatan ${tingkatan} Minggu ${minggu}.`
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        record,
        rptItem: convertToRPTItem(record)
      });
    }

    // Jika hanya subjek dan tingkatan diminta
    if (subjek && tingkatan) {
      const list = searchRPTRecords('', subjek, tingkatan);
      return NextResponse.json({
        success: true,
        count: list.length,
        items: list
      });
    }

    return NextResponse.json({
      success: true,
      catalog: rptCatalog,
      weeks: getSynchronizedWeeks()
    });
  } catch (error: any) {
    console.error('Ralat API Local RPT:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Ralat semasa memproses data RPT tempatan' },
      { status: 500 }
    );
  }
}
