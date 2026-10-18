import { RPHRecord } from '@/types/erph';
import { LOGO_AL_HASANAH_BASE64 } from '@/data/logo_base64';

/**
 * Format nama fail mengikut ketetapan rasmi:
 * 'RPH CG XXXX MINGGU XXX'
 * Contoh: 'RPH CG MUZAKKIR MOHTAR MINGGU 01'
 */
export function formatRPHFileName(teacherName: string, mingguNo: number | string): string {
  // Bersihkan gelaran awal seperti Ustaz/Cikgu jika ada untuk format standard
  const cleanedName = (teacherName || 'GURU')
    .replace(/^(Ustaz|Ustazah|Cikgu|Dr\.|Prof\.|Tuan|Puan|En\.|Pn\.)\s+/i, '')
    .trim()
    .toUpperCase();

  const formattedWeek = String(mingguNo || '1').padStart(2, '0');
  return `RPH CG ${cleanedName} MINGGU ${formattedWeek}`;
}

/**
 * Menghasilkan kod HTML e-RPH yang lengkap dan cantik untuk disimpan dalam Google Drive & Google Docs
 */
export function generateRPHHtml(
  rph: Partial<RPHRecord>,
  teacherName: string,
  teacherEmail: string,
  schoolName: string = 'SEKOLAH MENENGAH AGAMA AL-HASANAH (SABK)'
): string {
  const isRTL = rph.arah_teks === 'rtl';

  return `<!DOCTYPE html>
<html lang="${rph.kod_bahasa || 'ms'}" dir="${rph.arah_teks || 'ltr'}">
<head>
  <meta charset="UTF-8">
  <title>${formatRPHFileName(teacherName, rph.minggu_ke || 1)}</title>
  <style>
    body {
      font-family: Arial, 'Amiri', Tahoma, sans-serif;
      margin: 24px;
      color: #1e293b;
      line-height: 1.5;
    }
    .header-box {
      border-bottom: 2px solid #059669;
      padding-bottom: 12px;
      margin-bottom: 16px;
      text-align: center;
    }
    .school-name {
      font-size: 18px;
      font-weight: bold;
      color: #065f46;
      margin-bottom: 4px;
    }
    .doc-title {
      font-size: 14px;
      font-weight: bold;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .meta-table td {
      padding: 6px 10px;
      font-size: 12px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
    }
    .meta-label {
      font-weight: bold;
      width: 18%;
      color: #0f172a;
      background: #f1f5f9;
    }
    .section-title {
      background: #059669;
      color: white;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: bold;
      margin-top: 14px;
      margin-bottom: 8px;
      border-radius: 4px;
    }
    .content-box {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      background: #ffffff;
      font-size: 12px;
      white-space: pre-wrap;
      margin-bottom: 10px;
    }
    .steps-list {
      margin: 0;
      padding-left: 20px;
      font-size: 12px;
    }
    .steps-list li {
      margin-bottom: 6px;
    }
    .tag {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 2px 8px;
      font-size: 11px;
      border-radius: 12px;
      margin: 2px 4px 2px 0;
    }
    .reflection-box {
      background: #f0fdf4;
      border: 1px solid #86efac;
      padding: 10px 14px;
      border-radius: 4px;
      font-size: 12px;
    }
  </style>
</head>
<body>

  <div class="header-box">
    <table style="width: 100%; border: none; border-collapse: collapse; margin: 0 auto; background: transparent;">
      <tr>
        <td style="width: 85px; text-align: center; vertical-align: middle; border: none; background: transparent; padding: 0;">
          <img src="${LOGO_AL_HASANAH_BASE64}" alt="Logo SMA Al-Hasanah" style="width: 75px; height: 75px; object-fit: contain; display: block; margin: 0 auto;" />
        </td>
        <td style="text-align: center; vertical-align: middle; border: none; background: transparent; padding: 0 12px;">
          <div style="font-size: 11px; font-weight: bold; color: #64748b; letter-spacing: 1px; text-transform: uppercase;">KEMENTERIAN PENDIDIKAN MALAYSIA</div>
          <div class="school-name">SEKOLAH MENENGAH AGAMA AL-HASANAH (SABK)</div>
          <div style="font-size: 12px; font-weight: bold; color: #059669; margin-bottom: 3px;">PAHANG DARUL MAKMUR</div>
          <div class="doc-title">REKOD PENGAJARAN &amp; PEMBELAJARAN HARIAN (e-RPH PINTAR)</div>
        </td>
        <td style="width: 85px; text-align: center; vertical-align: middle; border: none; background: transparent; padding: 0;">
          <img src="${LOGO_AL_HASANAH_BASE64}" alt="" style="width: 75px; height: 75px; object-fit: contain; display: block; margin: 0 auto; opacity: 0;" />
        </td>
      </tr>
    </table>
  </div>

  <table class="meta-table">
    <tr>
      <td class="meta-label">Nama Guru:</td>
      <td><strong>${teacherName}</strong> (${teacherEmail})</td>
      <td class="meta-label">Minggu Persekolahan:</td>
      <td><strong>Minggu ${rph.minggu_ke || 1}</strong></td>
    </tr>
    <tr>
      <td class="meta-label">Tarikh &amp; Hari:</td>
      <td>${rph.tarikh || '-'} (${rph.hari || '-'})</td>
      <td class="meta-label">Masa PdPc:</td>
      <td>${rph.masa_mula || '-'} - ${rph.masa_tamat || '-'}</td>
    </tr>
    <tr>
      <td class="meta-label">Tingkatan / Kelas:</td>
      <td>${rph.tingkatan || '-'} &bull; ${rph.kelas || '-'}</td>
      <td class="meta-label">Mata Pelajaran:</td>
      <td><strong>${rph.subjek || '-'}</strong></td>
    </tr>
    <tr>
      <td class="meta-label">Tema &amp; Tajuk:</td>
      <td colspan="3">${rph.tema || '-'} &bull; ${rph.tajuk || '-'}</td>
    </tr>
  </table>

  <div class="section-title">1. STANDARD KURIKULUM (DSKP)</div>
  <div class="content-box">
    <p><strong>Standard Kandungan (SK):</strong><br>${rph.sk || '-'}</p>
    <p style="margin-top: 8px;"><strong>Standard Pembelajaran (SP):</strong><br>${rph.sp || '-'}</p>
  </div>

  <div class="section-title">2. OBJEKTIF PEMBELAJARAN &amp; KRITERIA KEJAYAAN</div>
  <div class="content-box">
    <p><strong>Objektif Pembelajaran:</strong><br>${rph.objektif_pembelajaran || '-'}</p>
    <p style="margin-top: 8px;"><strong>Kriteria Kejayaan:</strong><br>${rph.kriteria_kejayaan || '-'}</p>
  </div>

  <div class="section-title">3. RANGKA AKTIVITI PENGAJARAN &amp; PEMBELAJARAN (PdPc)</div>
  <div class="content-box">
    <ol class="steps-list">
      <li><strong>Set Induksi (5 minit):</strong> ${rph.aktiviti?.set_induksi || '-'}</li>
      <li><strong>Langkah 1 (Penerangan &amp; Pemodelan):</strong> ${rph.aktiviti?.langkah_1 || '-'}</li>
      <li><strong>Langkah 2 (Aktiviti Murid / Kolaboratif PAK-21):</strong> ${rph.aktiviti?.langkah_2 || '-'}</li>
      <li><strong>Langkah 3 (Pengukuhan &amp; Penilaian):</strong> ${rph.aktiviti?.langkah_3 || '-'}</li>
      <li><strong>Penutup &amp; Rumusan:</strong> ${rph.aktiviti?.penutup || '-'}</li>
    </ol>
  </div>

  <div class="section-title">4. ELEMEN MERENTAS KURIKULUM &amp; PEDAGOGI (TS25)</div>
  <div class="content-box">
    <p><strong>Bahan Bantu Mengajar (BBM):</strong> ${(rph.pedagogi?.bbm || []).map(b => `<span class="tag">${b}</span>`).join(' ') || '-'}</p>
    <p style="margin-top: 6px;"><strong>Elemen Merentas Kurikulum (EMK):</strong> ${(rph.pedagogi?.emk || []).map(e => `<span class="tag">${e}</span>`).join(' ') || '-'}</p>
    <p style="margin-top: 6px;"><strong>Nilai Murni:</strong> ${(rph.pedagogi?.nilai_murni || []).map(n => `<span class="tag">${n}</span>`).join(' ') || '-'}</p>
    <p style="margin-top: 6px;"><strong>Peta Pemikiran (i-Think):</strong> ${(rph.pedagogi?.peta_ithink || []).map(i => `<span class="tag">${i}</span>`).join(' ') || '-'}</p>
    <p style="margin-top: 6px;"><strong>Pentaksiran Bilik Darjah (PBD):</strong> ${(rph.pedagogi?.pentaksiran || []).map(p => `<span class="tag">${p}</span>`).join(' ') || '-'}</p>
  </div>

  <div class="section-title">5. REFLEKSI &amp; IMPAK PEMBELAJARAN</div>
  <div class="reflection-box">
    <p><strong>Objektif Pembelajaran:</strong> ${rph.refleksi?.objektif_disalin || rph.objektif_pembelajaran || '-'}</p>
    <p style="margin-top: 6px;">
      Kehadiran Murid: <strong>${rph.refleksi?.bilangan_murid_hadir ?? 0} orang</strong> | 
      Mencapai Objektif: <strong>${rph.refleksi?.bilangan_murid_mencapai ?? 0} orang</strong> 
      (${rph.refleksi?.peratus_mencapai ?? 0}%)
    </p>
    ${rph.refleksi?.intervensi_diperlukan ? `<p style="margin-top: 6px; color: #b91c1c;"><strong>Intervensi Diperlukan:</strong> ${rph.refleksi.pilihan_intervensi}</p>` : '<p style="margin-top: 6px; color: #15803d;"><strong>Status:</strong> Semua murid menguasai objektif PdPc dengan baik.</p>'}
    ${rph.refleksi?.catatan_tambahan ? `<p style="margin-top: 6px;"><strong>Catatan Tambahan:</strong> ${rph.refleksi.catatan_tambahan}</p>` : ''}
  </div>

  <div style="margin-top: 30px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #cbd5e1; padding-top: 10px;">
    Dijana secara digital melalui Sistem e-RPH Pintar (ID DeLIMA KPM) pada ${new Date().toLocaleString('ms-MY')}
  </div>

</body>
</html>`;
}

/**
 * Mencari atau mencipta folder khas 'e-RPH DeLIMA' dalam Google Drive pengguna
 */
async function getOrCreateERPHFolder(accessToken: string): Promise<string> {
  const folderName = 'e-RPH DeLIMA';
  const query = encodeURIComponent(
    `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`
  );

  // 1. Semak jika folder telah wujud
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // 2. Jika belum wujud, cipta folder baharu
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.warn('Gagal mencipta folder Google Drive, memuat naik ke root My Drive:', errText);
    return 'root';
  }

  const newFolder = await createRes.json();
  return newFolder.id || 'root';
}

/**
 * Hantar e-RPH ke Google Drive pengguna dengan format nama:
 * 'RPH CG XXXX MINGGU XXX'
 */
export async function uploadRPHToMyDrive({
  rph,
  teacherName,
  teacherEmail,
  accessToken,
  schoolName = 'SMA Al-Hasanah',
}: {
  rph: Partial<RPHRecord>;
  teacherName: string;
  teacherEmail: string;
  accessToken: string;
  schoolName?: string;
}): Promise<{
  success: boolean;
  fileName: string;
  fileId?: string;
  webViewLink?: string;
  folderName: string;
  error?: string;
}> {
  const fileName = formatRPHFileName(teacherName, rph.minggu_ke || 1);
  const folderName = 'e-RPH DeLIMA';

  if (!accessToken) {
    return {
      success: false,
      fileName,
      folderName,
      error: 'Token akses Google Drive tidak ditemui. Sila pastikan anda log masuk menggunakan Google SSO dengan kebenaran My Drive.',
    };
  }

  try {
    // 1. Dapatkan atau cipta folder 'e-RPH DeLIMA'
    const folderId = await getOrCreateERPHFolder(accessToken);

    // 2. Jana dokumen HTML
    const htmlContent = generateRPHHtml(rph, teacherName, teacherEmail, schoolName);

    // 3. Sediakan Muat Naik Multipart
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: `${fileName}.html`,
      mimeType: 'text/html',
      parents: folderId !== 'root' ? [folderId] : undefined,
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
      htmlContent +
      closeDelimiter;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const errorMsg =
        errorJson?.error?.message ||
        `Ralat Google Drive API (${response.status}: ${response.statusText})`;
      return {
        success: false,
        fileName,
        folderName,
        error: errorMsg,
      };
    }

    const fileData = await response.json();
    return {
      success: true,
      fileName,
      folderName,
      fileId: fileData.id,
      webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
    };
  } catch (err: any) {
    console.error('Ralat uploadRPHToMyDrive:', err);
    return {
      success: false,
      fileName,
      folderName,
      error: err?.message || 'Gagal menghantar e-RPH ke Google Drive.',
    };
  }
}
