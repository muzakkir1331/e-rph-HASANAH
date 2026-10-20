import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function findChromiumExecutable(): string | null {
  const candidatePaths = [
    // Windows Edge (Default on Windows 10 & 11)
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    // Windows Chrome
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    // Windows Local AppData
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    // Linux / Containers
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    // macOS
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];

  for (const p of candidatePaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  let tempHtmlPath: string | null = null;
  let tempPdfPath: string | null = null;

  try {
    const body = await req.json();
    const { html, fileName = 'RPH_Harian.pdf' } = body;

    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Kandungan HTML diperlukan untuk menjana PDF.' },
        { status: 400 }
      );
    }

    const browserPath = findChromiumExecutable();
    if (!browserPath) {
      return NextResponse.json(
        {
          success: false,
          error: 'Enjin pelayar Chromium/Edge tidak dijumpai pada sistem untuk penukaran PDF automatik.'
        },
        { status: 500 }
      );
    }

    const tempDir = os.tmpdir();
    const uniqueId = crypto.randomUUID();
    tempHtmlPath = path.join(tempDir, `erph_${uniqueId}.html`);
    tempPdfPath = path.join(tempDir, `erph_${uniqueId}.pdf`);

    // Tulis fail HTML sementara dengan pengekodan UTF-8 (menyokong tulisan Arab & tanda baca)
    fs.writeFileSync(tempHtmlPath, html, 'utf8');

    // Jana PDF menggunakan enjin Chromium Headless secara langsung tanpa dialog cetakan
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      '--run-all-compositor-stages-before-draw',
      `--print-to-pdf=${tempPdfPath}`,
      tempHtmlPath
    ];

    await new Promise<void>((resolve, reject) => {
      execFile(browserPath, args, { timeout: 25000 }, (error, stdout, stderr) => {
        if (error) {
          return reject(error);
        }
        resolve();
      });
    });

    if (!fs.existsSync(tempPdfPath)) {
      throw new Error('Fail PDF tidak berjaya dihasilkan oleh enjin Chromium.');
    }

    const pdfBuffer = fs.readFileSync(tempPdfPath);

    const safeFileName = (fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_');

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Ralat janaan PDF di /api/pdf/download:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Ralat berlaku semasa menjana fail PDF.'
      },
      { status: 500 }
    );
  } finally {
    // Bersihkan fail sementara
    if (tempHtmlPath && fs.existsSync(tempHtmlPath)) {
      try {
        fs.unlinkSync(tempHtmlPath);
      } catch {}
    }
    if (tempPdfPath && fs.existsSync(tempPdfPath)) {
      try {
        fs.unlinkSync(tempPdfPath);
      } catch {}
    }
  }
}
