import { NextRequest, NextResponse } from 'next/server';
import { getTemaAndTajuk, resolveDSKPSubject } from '@/lib/dskp-topics';
import rawData from '@/data/dskp_tema_tajuk.json';

export const dynamic = 'force-dynamic';

const db = rawData as any;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject') || '';
    const form = searchParams.get('form') || '1';
    const tema = searchParams.get('tema') || '';
    const listSubjects = searchParams.get('list_subjects') === 'true';

    if (listSubjects) {
      const subjectList = Object.keys(db.subjects).sort();
      return NextResponse.json({
        success: true,
        total: subjectList.length,
        subjects: subjectList
      });
    }

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Sila nyatakan parameter ?subject=' },
        { status: 400 }
      );
    }

    const data = getTemaAndTajuk(subject, form);

    let tajuks = data.tajuks;
    let isFilteredByTema = false;

    if (tema && tema.trim() && data.temaToTajuk[tema.trim()]) {
      const filtered = data.temaToTajuk[tema.trim()];
      if (filtered && filtered.length > 0) {
        tajuks = filtered;
        isFilteredByTema = true;
      }
    }

    return NextResponse.json({
      success: true,
      subject,
      canonicalSubject: data.canonicalSubject,
      form: data.normalizedForm,
      temas: data.temas,
      tajuks,
      isFilteredByTema,
      totalTemas: data.temas.length,
      totalTajuks: tajuks.length,
      temaToTajuk: data.temaToTajuk
    });
  } catch (error: any) {
    console.error('Error in /api/dskp/topics:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Ralat memproses pangkalan data tema DSKP' },
      { status: 500 }
    );
  }
}
