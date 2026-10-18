import { NextRequest, NextResponse } from 'next/server';
import dskpData from '@/data/dskp_sample.json';
import dskpCatalog from '@/data/dskp_catalog.json';
import { DSKPItem } from '@/types/erph';

const items: DSKPItem[] = dskpData as any;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject') || '';
  const form = searchParams.get('form') || '';
  const query = searchParams.get('query') || '';
  const getCatalog = searchParams.get('catalog') === 'true';

  if (getCatalog) {
    return NextResponse.json({
      catalog: dskpCatalog
    });
  }

  let filtered = items;

  if (subject) {
    filtered = filtered.filter(item => 
      item.subjek.trim().toLowerCase() === subject.trim().toLowerCase()
    );
  }

  if (form) {
    filtered = filtered.filter(item => 
      item.tingkatan.toString().trim() === form.toString().trim()
    );
  }

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(item =>
      item.sp.toLowerCase().includes(q) ||
      item.sk.toLowerCase().includes(q) ||
      item.tajuk.toLowerCase().includes(q) ||
      item.tema.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    total: filtered.length,
    items: filtered.slice(0, 50)
  });
}
