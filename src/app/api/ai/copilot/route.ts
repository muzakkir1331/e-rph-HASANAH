import { NextRequest, NextResponse } from 'next/server';
import { generateRPHContent } from '@/lib/gemini';
import { GeminiCoPilotRequest } from '@/types/erph';

export async function POST(req: NextRequest) {
  try {
    const body: GeminiCoPilotRequest = await req.json();

    if (!body.subjek || !body.sk || !body.sp) {
      return NextResponse.json(
        { error: 'Parameter subjek, sk, dan sp diperlukan.' },
        { status: 400 }
      );
    }

    const result = await generateRPHContent(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Ralat Co-Pilot API Route:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menjana kandungan AI' },
      { status: 500 }
    );
  }
}
