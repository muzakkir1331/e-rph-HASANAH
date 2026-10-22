import { RPHRecord, JadualSlot } from '@/types/erph';
import { LOGO_AL_HASANAH_BASE64 } from '@/data/logo_base64';

/**
 * Format nama fail mengikut ketetapan rasmi:
 * 'RPH CG XXXX MINGGU XXX'
 * Contoh: 'RPH CG MUZAKKIR MOHTAR MINGGU 01'
 */
export function formatRPHFileName(teacherName: string, mingguNo: number | string): string {
  const cleanedName = (teacherName || 'GURU')
    .replace(/^(Ustaz|Ustazah|Cikgu|Dr\.|Prof\.|Tuan|Puan|En\.|Pn\.)\s+/i, '')
    .trim()
    .toUpperCase();

  const formattedWeek = String(mingguNo || '1').padStart(2, '0');
  return `RPH CG ${cleanedName} MINGGU ${formattedWeek}`;
}

/**
 * Menjana 1 Muka Surat A4 Portrait Lengkap bagi Setiap Subjek/Slot
 * Mematuhi Standard KPM, TS25, SPI Bil. 3/1999 dan Format SABK Pahang
 */
export function generateKarakterCardHtml(
  rph: Partial<RPHRecord>,
  teacherName: string,
  slotIndex: number = 1,
  totalSlots: number = 1,
  schoolName: string = 'SEKOLAH KEBANGSAAN / MENENGAH'
): string {
  const elemenList = ['Penyayang', 'Berdaya Tahan', 'Berupaya Memimpin', 'Warganegara Aktif'];
  const selectedElemen = rph.karakter_data?.elemen || (rph.sp ? rph.sp.split(',').map(s => s.trim()) : ['Penyayang']);
  const catatan = rph.karakter_data?.catatan_aktiviti || rph.kriteria_kejayaan || rph.sk || '';

  return `
  <div class="a4-page-card" style="font-family: Arial, Helvetica, sans-serif; background: #ffffff; padding: 10mm 15mm; border: 2px solid #cbd5e1; border-radius: 12px; min-height: 185mm; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
    
    <!-- Header Rasmi Slide: Logo Kiri & Tajuk Kanan -->
    <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 6mm;">
      <tr>
        <td style="width: 70px; vertical-align: top; border: none;">
          <div style="width: 55px; height: 55px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <img src="${LOGO_AL_HASANAH_BASE64}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
        </td>
        <td style="text-align: right; vertical-align: top; border: none;">
          <div style="font-size: 11px; font-weight: 800; color: #1e40af; letter-spacing: 1.5px; text-transform: uppercase;">PENATARAN</div>
          <div style="font-size: 13px; font-weight: 900; color: #1d4ed8; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 1px;">KURIKULUM PERSEKOLAHAN 2027</div>
        </td>
      </tr>
    </table>

    <!-- Tajuk Slaid Utama -->
    <div style="text-align: center; margin-bottom: 6mm;">
      <div style="font-size: 18px; font-weight: 900; color: #1d4ed8; letter-spacing: -0.3px;">Pelaksanaan Aktiviti</div>
      <div style="font-size: 16px; font-weight: 800; color: #2563eb; margin-top: 2px;">Program Pembentukan Karakter (15 minit)</div>
      <div style="font-size: 15px; font-weight: 800; color: #1e3a8a; margin-top: 2px;">Sekolah Menengah</div>
    </div>

    <!-- Jadual 5 Baris Tepat Seperti Gambar -->
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #94a3b8; font-size: 12px; margin-bottom: 6mm;">
      <!-- Baris 1: Tarikh -->
      <tr style="border-bottom: 1.5px solid #cbd5e1;">
        <td style="width: 30%; background-color: #84cc16; color: #0f172a; font-weight: 800; padding: 7px 12px; border-right: 1.5px solid #cbd5e1;">
          <div style="display: flex; justify-content: space-between;"><span>Tarikh</span><span>:</span></div>
        </td>
        <td style="padding: 7px 14px; font-weight: 700; color: #1e293b; background-color: #ffffff;">
          ${rph.tarikh || '-'} ${rph.hari ? `(${rph.hari})` : ''}
        </td>
      </tr>

      <!-- Baris 2: Masa -->
      <tr style="border-bottom: 1.5px solid #cbd5e1; background-color: #f8fafc;">
        <td style="padding: 7px 12px; font-weight: 800; color: #334155; border-right: 1.5px solid #cbd5e1;">
          <div style="display: flex; justify-content: space-between;"><span>Masa</span><span>:</span></div>
        </td>
        <td style="padding: 7px 14px; font-weight: 600; color: #1e293b;">
          ${rph.masa_mula || '7.20 PAGI'} - ${rph.masa_tamat || '7.35 PAGI'} (15 minit)
        </td>
      </tr>

      <!-- Baris 3: Tahun -->
      <tr style="border-bottom: 1.5px solid #cbd5e1; background-color: #ffffff;">
        <td style="padding: 7px 12px; font-weight: 800; color: #334155; border-right: 1.5px solid #cbd5e1;">
          <div style="display: flex; justify-content: space-between;"><span>Tahun</span><span>:</span></div>
        </td>
        <td style="padding: 7px 14px; font-weight: 600; color: #1e293b;">
          Tingkatan ${rph.tingkatan || '1'} (${rph.kelas || '-'})
        </td>
      </tr>

      <!-- Baris 4: Elemen Teras Karakter -->
      <tr style="border-bottom: 1.5px solid #cbd5e1; background-color: #f8fafc;">
        <td style="padding: 9px 12px; font-weight: 800; color: #334155; border-right: 1.5px solid #cbd5e1; vertical-align: top;">
          <div style="display: flex; justify-content: space-between;"><span>Elemen Teras Karakter</span><span>:</span></div>
        </td>
        <td style="padding: 9px 14px; background-color: #ffffff;">
          <div style="line-height: 1.8;">
            ${elemenList.map(item => {
              const isChecked = selectedElemen.includes(item);
              return `
                <div style="display: flex; align-items: center; margin-bottom: 3px;">
                  <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid ${isChecked ? '#2563eb' : '#64748b'}; background: ${isChecked ? '#2563eb' : '#ffffff'}; color: #ffffff; text-align: center; line-height: 13px; font-size: 10px; font-weight: bold; border-radius: 3px; margin-right: 8px;">
                    ${isChecked ? '&#10003;' : ''}
                  </span>
                  <span style="font-weight: ${isChecked ? '800' : '500'}; color: ${isChecked ? '#0f172a' : '#475569'}; font-size: 12px;">
                    ${item}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </td>
      </tr>

      <!-- Baris 5: Catatan Aktiviti -->
      <tr style="background-color: #ffffff;">
        <td style="padding: 9px 12px; font-weight: 800; color: #334155; border-right: 1.5px solid #cbd5e1; vertical-align: top;">
          <div style="display: flex; justify-content: space-between;"><span>Catatan Aktiviti</span><span>:</span></div>
        </td>
        <td style="padding: 9px 14px; font-size: 11.5px; line-height: 1.5; color: #1e293b; vertical-align: top; white-space: pre-wrap;">
          ${catatan || '-'}
        </td>
      </tr>
    </table>

    <!-- Footer Rasmi Slaid -->
    <table style="width: 100%; border: none; border-collapse: collapse; margin-top: auto; padding-top: 4mm; border-top: 1px solid #e2e8f0;">
      <tr>
        <td style="border: none; font-size: 11px; font-weight: 800; color: #2563eb;">
          #kurikulumkita
        </td>
        <td style="border: none; text-align: center; font-size: 10px; color: #94a3b8; font-family: monospace;">
          3
        </td>
        <td style="border: none; text-align: right; font-size: 9.5px; color: #64748b; font-weight: 600;">
          Guru: <strong>${teacherName}</strong> &bull; Sesi 2027
        </td>
      </tr>
    </table>
  </div>
  `;
}

export function generateSingleRPHCardHtml(
  rph: Partial<RPHRecord>,
  teacherName: string,
  teacherEmail: string,
  slotIndex: number = 1,
  totalSlots: number = 1,
  schoolName: string = 'SEKOLAH SAYA',
  schoolLogo?: string,
  planType: 'free' | 'pro' = 'free',
  teacherSignature?: string
): string {
  // Jika ini adalah RPH Pembentukan Karakter, jana templat slaid khas 15 minit
  if (rph.jenis_rph === 'karakter' || rph.subjek?.toLowerCase().includes('karakter')) {
    return generateKarakterCardHtml(rph, teacherName, slotIndex, totalSlots, schoolName);
  }

  const isRTL = rph.arah_teks === 'rtl' || rph.kod_bahasa === 'ar' || /[\u0600-\u06FF]/.test(rph.subjek || '');
  const isPdPExecuted = rph.refleksi?.pdp_dijalankan !== false;
  const logoSrc = schoolLogo || LOGO_AL_HASANAH_BASE64;

  return `
  <div class="a4-page-card" dir="${isRTL ? 'rtl' : 'ltr'}" style="${isRTL ? 'font-family: Amiri, \"Scheherazade New\", Arial, sans-serif;' : 'font-family: Arial, sans-serif;'}">
    
    <!-- Header Rasmi Kementerian & Sekolah (Kekal Simetri LTR: Logo Kiri, Tajuk Tengah, Slot Kanan) -->
    <div class="header-box" dir="ltr">
      <table style="width: 100%; border: none; border-collapse: collapse; margin: 0 auto; background: transparent;">
        <tr>
          <td style="width: 55px; text-align: center; vertical-align: middle; border: none; background: transparent; padding: 0;">
            <img src="${logoSrc}" alt="Logo Sekolah" style="width: 46px; height: 46px; object-fit: contain; display: block; margin: 0 auto;" />
          </td>
          <td style="text-align: center; vertical-align: middle; border: none; background: transparent; padding: 0 8px;">
            <div style="font-size: 9.5px; font-weight: bold; color: #475569; letter-spacing: 0.5px; text-transform: uppercase;">
              KEMENTERIAN PENDIDIKAN MALAYSIA
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #065f46; margin: 1px 0; text-transform: uppercase;">
              ${schoolName}
            </div>
            <div style="font-size: 10px; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
              RANCANGAN PENGAJARAN HARIAN (e-RPH SESI 2026/2027)
            </div>
          </td>
          <td style="width: 65px; text-align: right; vertical-align: middle; border: none; background: transparent; padding: 0; font-size: 9px; color: #475569; font-weight: bold;">
            <span style="display: inline-block; padding: 2px 6px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px;">
              SLOT ${slotIndex}/${totalSlots}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Master Table e-RPH Siap Dijana Mengikut Format Table Rasmi KPM (A4 Landscape) -->
    <table class="rph-master-table">
      <tbody>
        <!-- Baris 1: Minggu Persekolahan, Hari & Tarikh, Masa PdPc -->
        <tr>
          <th class="rph-header-label" style="width: 13%;">Minggu / Sesi</th>
          <td style="width: 20%;">Minggu ${rph.minggu_ke || 1} &bull; Sesi 2026/2027</td>
          <th class="rph-header-label" style="width: 13%;">Hari &amp; Tarikh</th>
          <td style="width: 21%;"><strong>${rph.hari || '-'}</strong> (${rph.tarikh || '-'})</td>
          <th class="rph-header-label" style="width: 12%;">Masa PdPc</th>
          <td style="width: 21%; color: #065f46; font-weight: bold;">${rph.masa_mula || '-'} &ndash; ${rph.masa_tamat || '-'}</td>
        </tr>

        <!-- Baris 2: Tingkatan & Kelas, Mata Pelajaran, Guru Pengajar -->
        <tr>
          <th class="rph-header-label">Tingkatan / Kelas</th>
          <td>Tingkatan ${rph.tingkatan || '-'} &bull; <strong>${rph.kelas || '-'}</strong></td>
          <th class="rph-header-label">Mata Pelajaran</th>
          <td style="font-weight: 800; color: #065f46; font-size: ${isRTL ? '12px' : '10px'}; font-family: ${isRTL ? 'Amiri, serif' : 'inherit'};">
            ${rph.subjek || '-'}
          </td>
          <th class="rph-header-label">Guru Pengajar</th>
          <td><strong>${teacherName}</strong></td>
        </tr>

        <!-- Baris 3: Tema / Tajuk -->
        <tr>
          <th class="rph-header-label">Tema / Tajuk</th>
          <td colspan="5" dir="${isRTL ? 'rtl' : 'ltr'}" style="${isRTL ? 'direction: rtl; text-align: right; font-family: Amiri, serif; font-size: 11px;' : ''}">
            ${rph.tema || '-'} ${rph.tajuk ? '&bull; ' + rph.tajuk : ''}
          </td>
        </tr>

        <!-- Baris 4: Standard Kandungan (SK) -->
        <tr>
          <th class="rph-header-label">Standard Kandungan (SK)</th>
          <td colspan="5" dir="${isRTL ? 'rtl' : 'ltr'}" style="${isRTL ? 'direction: rtl; text-align: right; font-family: Amiri, serif; font-size: 11px;' : ''}">
            ${rph.sk || '-'}
          </td>
        </tr>

        <!-- Baris 5: Standard Pembelajaran (SP) -->
        <tr>
          <th class="rph-header-label">Standard Pembelajaran (SP)</th>
          <td colspan="5" dir="${isRTL ? 'rtl' : 'ltr'}" style="${isRTL ? 'direction: rtl; text-align: right; font-family: Amiri, serif; font-size: 11px;' : ''}">
            ${rph.sp || '-'}
          </td>
        </tr>

        <!-- Baris 6: Objektif Pembelajaran -->
        <tr>
          <th class="rph-header-label">Objektif Pembelajaran</th>
          <td colspan="5" dir="${isRTL ? 'rtl' : 'ltr'}" style="background-color: #f8fafc; font-weight: 500; ${isRTL ? 'direction: rtl; text-align: right; font-family: Amiri, serif; font-size: 11px; line-height: 1.5;' : ''}">
            ${rph.objektif_pembelajaran || '-'}
          </td>
        </tr>

        <!-- Baris 7: Kriteria Kejayaan -->
        <tr>
          <th class="rph-header-label">Kriteria Kejayaan</th>
          <td colspan="5" dir="${isRTL ? 'rtl' : 'ltr'}" style="${isRTL ? 'direction: rtl; text-align: right; font-family: Amiri, serif; font-size: 11px; line-height: 1.5;' : ''}">
            ${rph.kriteria_kejayaan || '-'}
          </td>
        </tr>

        <!-- Baris 8: Rangka Aktiviti Pengajaran & Pembelajaran (PdPc) -->
        <tr>
          <th class="rph-header-label" style="vertical-align: top;">Aktiviti PdPc</th>
          <td colspan="5" style="padding: 2.5px 6px;" dir="${isRTL ? 'rtl' : 'ltr'}">
            <div style="margin-bottom: 2px;">
              <strong style="color: #047857;">Set Induksi (5 min):</strong> 
              <span style="${isRTL ? 'font-family: Amiri, serif;' : ''}">${rph.aktiviti?.set_induksi || '-'}</span>
            </div>
            <div style="margin-bottom: 2px;">
              <strong style="color: #047857;">Aktiviti Utama:</strong>
              <div style="padding-left: ${isRTL ? '0' : '6px'}; padding-right: ${isRTL ? '6px' : '0'}; ${isRTL ? 'font-family: Amiri, serif;' : ''}">
                ${rph.aktiviti?.langkah_1 ? `<div>&bull; <strong>Langkah 1:</strong> ${rph.aktiviti.langkah_1}</div>` : ''}
                ${rph.aktiviti?.langkah_2 ? `<div style="margin-top: 1px;">&bull; <strong>Langkah 2:</strong> ${rph.aktiviti.langkah_2}</div>` : ''}
                ${rph.aktiviti?.langkah_3 ? `<div style="margin-top: 1px;">&bull; <strong>Langkah 3:</strong> ${rph.aktiviti.langkah_3}</div>` : ''}
              </div>
            </div>
            <div>
              <strong style="color: #047857;">Penutup &amp; Refleksi (5 min):</strong> 
              <span style="${isRTL ? 'font-family: Amiri, serif;' : ''}">${rph.aktiviti?.penutup || '-'}</span>
            </div>
          </td>
        </tr>

        <!-- Baris 9: Pengisian Kurikulum, Pedagogi & BBM (Susunan Penuh 4 Kolum Landscape) -->
        <tr>
          <th class="rph-header-label" style="vertical-align: top;">Pengisian Kurikulum</th>
          <td colspan="5" style="padding: 2.5px 6px; font-size: 9px;">
            <table style="width: 100%; border: none; border-collapse: collapse; font-size: 9px;">
              <tr>
                <td style="width: 25%; border: none; padding: 1px 4px 1px 0; vertical-align: top;">
                  <strong style="color: #1e293b;">BBM:</strong> ${(rph.pedagogi?.bbm || []).join(', ') || '-'}
                </td>
                <td style="width: 25%; border: none; padding: 1px 4px; vertical-align: top;">
                  <strong style="color: #1e293b;">EMK &amp; Nilai:</strong> ${(rph.pedagogi?.emk || []).join(', ')} ${(rph.pedagogi?.nilai_murni || []).length ? '&bull; ' + rph.pedagogi?.nilai_murni?.join(', ') : ''}
                </td>
                <td style="width: 25%; border: none; padding: 1px 4px; vertical-align: top;">
                  <strong style="color: #1e293b;">Strategi / PAK-21:</strong> ${(rph.pedagogi?.alat_pemikiran_pak21 || []).join(', ')} &bull; ${(rph.pedagogi?.strategi || []).join(', ')}
                </td>
                <td style="width: 25%; border: none; padding: 1px 0 1px 4px; vertical-align: top;">
                  <strong style="color: #1e293b;">Pentaksiran (PBD):</strong> ${(rph.pedagogi?.pentaksiran || []).join(', ') || '-'}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Baris 10: Refleksi & Penilaian Impak -->
        <tr>
          <th class="rph-header-label" style="vertical-align: top;">Refleksi &amp; Impak</th>
          <td colspan="5" style="${!isPdPExecuted ? 'background-color: #fff1f2; color: #9f1239;' : 'background-color: #f0fdf4; color: #166534;'} padding: 2.5px 6px;">
            ${!isPdPExecuted ? `
              <div style="font-weight: bold; font-size: 9.5px;">
                &#9888; PdP TIDAK DIJALANKAN ATAS SEBAB: ${rph.refleksi?.sebab_tidak_dijalankan || 'Program Rasmi Sekolah / Peperiksaan'}
              </div>
              ${rph.refleksi?.bawa_ke_kelas_seterusnya ? `
                <div style="font-size: 9px; margin-top: 1px; color: #be123c; font-weight: 600;">
                  &rarr; Tindakan Susulan: Perancangan e-RPH ini dibawa ke kelas dan sesi PdPc seterusnya.
                </div>
              ` : ''}
            ` : `
              <div style="font-weight: 600; font-size: 9.5px; line-height: 1.3;">
                ${rph.refleksi?.objektif_disalin || rph.objektif_pembelajaran || 'Murid berjaya menguasai standard pembelajaran yang ditetapkan.'}
              </div>
              <div style="font-size: 8.5px; color: #334155; margin-top: 1.5px; padding-top: 1.5px; border-top: 1px solid #bbf7d0;">
                Kehadiran: <strong>${rph.refleksi?.bilangan_murid_hadir ?? 0} orang</strong> |
                Mencapai Objektif: <strong>${rph.refleksi?.bilangan_murid_mencapai ?? 0}/${rph.refleksi?.bilangan_murid_hadir ?? 0} murid</strong> (${rph.refleksi?.peratus_mencapai ?? 0}%)
                ${rph.refleksi?.intervensi_diperlukan ? `<span style="color: #b91c1c; font-weight: bold; margin-left: 4px;">[Intervensi: ${rph.refleksi?.pilihan_intervensi}]</span>` : ''}
                ${rph.refleksi?.catatan_tambahan ? ` &bull; Catatan: ${rph.refleksi.catatan_tambahan}` : ''}
              </div>
            `}
          </td>
        </tr>

        <!-- Baris 11: Pengesahan & Semakan Pentadbir -->
        <tr>
          <td colspan="3" style="background-color: #f8fafc; font-size: 8.5px; padding: 2.5px 6px;">
            <div style="color: #64748b; font-weight: bold; font-size: 8px; text-transform: uppercase;">Disediakan Oleh:</div>
            <div style="font-weight: 800; color: #0f172a;">${teacherName}</div>
            <div style="color: #64748b; font-size: 8px;">Guru Mata Pelajaran &bull; Tarikh: ${rph.tarikh || new Date().toISOString().split('T')[0]}</div>
            ${rph.guru_tandatangan || teacherSignature ? `
              <div style="margin-top: 2px;">
                <img src="${rph.guru_tandatangan || teacherSignature}" alt="Tandatangan Guru" style="max-height: 26px; max-width: 90px; object-fit: contain; display: block;" />
              </div>
            ` : ''}
          </td>
          <td colspan="3" style="background-color: #f8fafc; font-size: 8.5px; padding: 2.5px 6px; text-align: right;">
            <div style="color: #64748b; font-weight: bold; font-size: 8px; text-transform: uppercase;">Disemak &amp; Disahkan Oleh:</div>
            ${rph.penyemak_nama ? `
              <div style="font-weight: 800; color: #0f172a;">${rph.penyemak_nama}</div>
              <div style="color: #64748b; font-size: 8px;">${rph.penyemak_jawatan || 'Pengetua / Guru Besar'} &bull; Disahkan: ${rph.penyemak_tarikh_disemak ? new Date(rph.penyemak_tarikh_disemak).toLocaleDateString('ms-MY') : '-'}</div>
              ${rph.penyemak_tandatangan ? `
                <div style="margin-top: 1px; text-align: right;">
                  <img src="${rph.penyemak_tandatangan}" alt="Tandatangan Pengetua" style="max-height: 26px; max-width: 90px; object-fit: contain; display: inline-block;" />
                </div>
              ` : ''}
              <div style="color: #059669; font-weight: bold; font-size: 7.5px;">DISEMAK &amp; DISAHKAN SECARA DIGITAL (PGB)</div>
            ` : `
              <div style="font-weight: 800; color: #0f172a;">Pengetua / PK Pentadbiran</div>
              <div style="color: #059669; font-weight: bold; font-size: 8px;">PENGESAHAN DIGITAL e-RPH KPM</div>
            `}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Watermark Pelan Percuma (Jika plan_type === 'free') -->
    ${planType === 'free' ? `
      <div class="watermark-footer" style="text-align: center; font-size: 7.5px; color: #94a3b8; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; padding-top: 2px; border-top: 1px dashed #cbd5e1;">
        Dijana Melalui e-RPH Pintar SaaS (Pelan Percuma) &bull; https://e-rph.my &bull; Naik taraf ke PRO untuk membuang tera air rasmi
      </div>
    ` : ''}

  </div>
  `;
}

/**
 * Menghasilkan Dokumen e-RPH Seminggu Penuh (Isnin hingga Jumaat)
 * Memastikan SETIAP SUBJEK mendapat TEPAT SATU MUKA SURAT A4 LANDSCAPE!
 */
export function generateWeeklyRPHHtml({
  rphList,
  teacherName,
  teacherEmail,
  weekNo,
  schoolName = 'SEKOLAH SAYA',
  schoolLogo,
  planType = 'free',
  teacherSignature
}: {
  rphList: Partial<RPHRecord>[];
  teacherName: string;
  teacherEmail: string;
  weekNo: number | string;
  schoolName?: string;
  schoolLogo?: string;
  planType?: 'free' | 'pro';
  teacherSignature?: string;
}): string {
  const formattedWeek = String(weekNo || '1').padStart(2, '0');
  const title = `RPH CG ${teacherName.toUpperCase()} MINGGU ${formattedWeek} (ISNIN-JUMAAT)`;

  const cardsHtml = rphList
    .map((rph, idx) =>
      generateSingleRPHCardHtml(
        rph,
        teacherName,
        teacherEmail,
        idx + 1,
        rphList.length,
        schoolName,
        schoolLogo,
        planType,
        teacherSignature
      )
    )
    .join('\n<!-- PAGE BREAK -->\n');

  return `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <!-- Google Fonts: Amiri & Scheherazade New untuk Sokongan Penuh Tulisan Arab & Jawi (RTL) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Scheherazade+New:wght@400;700&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Scheherazade+New:wght@400;700&display=swap');
    @page {
      size: A4 landscape;
      margin: 5mm 6mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #f8fafc;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    [dir="rtl"], .rtl-text {
      direction: rtl !important;
      unicode-bidi: isolate !important;
      font-family: 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif !important;
    }
    .a4-page-card {
      width: 100%;
      max-width: 285mm;
      margin: 0 auto 16px auto;
      background: #ffffff;
      padding: 5mm 7mm;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      page-break-after: always;
      page-break-inside: avoid;
      box-sizing: border-box;
      display: block;
    }
    @media print {
      @page {
        size: A4 landscape;
        margin: 5mm 6mm;
      }
      body {
        background: white !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .a4-page-card {
        margin: 0 !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        page-break-after: always !important;
        page-break-inside: avoid !important;
        width: 100% !important;
        max-width: 285mm !important;
        padding: 3mm 5mm !important;
        box-sizing: border-box !important;
        display: block !important;
      }
    }
    .header-box {
      border-bottom: 2px solid #059669;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .rph-master-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #1e293b;
      margin-top: 0;
      font-size: 9.5px;
      line-height: 1.3;
    }
    .rph-master-table th, .rph-master-table td {
      border: 1px solid #475569;
      padding: 3px 6px;
      vertical-align: top;
    }
    .rph-header-label {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 9px;
      text-align: left;
    }
    [dir="rtl"] .rph-header-label {
      text-align: right;
    }
  </style>
</head>
<body>
  ${cardsHtml}
</body>
</html>`;
}

/**
 * Backward compatibility: Jana RPH HTML untuk satu rekod
 */
export function generateRPHHtml(
  rph: Partial<RPHRecord>,
  teacherName: string,
  teacherEmail: string,
  schoolName: string = 'SEKOLAH SAYA',
  schoolLogo?: string,
  planType: 'free' | 'pro' = 'free',
  teacherSignature?: string
): string {
  return generateWeeklyRPHHtml({
    rphList: [rph],
    teacherName,
    teacherEmail,
    weekNo: rph.minggu_ke || 1,
    schoolName,
    schoolLogo,
    planType,
    teacherSignature
  });
}

/**
 * Mencari atau mencipta folder khas 'e-RPH DeLIMA' dalam Google Drive pengguna
 */
async function getOrCreateERPHFolder(accessToken: string): Promise<string> {
  const folderName = 'e-RPH DeLIMA';
  const query = encodeURIComponent(
    `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`
  );

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
    return 'root';
  }

  const newFolder = await createRes.json();
  return newFolder.id || 'root';
}

/**
 * Hantar e-RPH Seminggu Penuh (Isnin - Jumaat) ke Google Drive pengguna DALAM FORMAT PDF!
 * Mematuhi:
 * 1. Format Fail PDF (.pdf, mimeType: application/pdf)
 * 2. Bersifat RPH Seminggu (Isnin - Jumaat)
 * 3. Layout A4 Potrait Satu Muka Surat Setiap Subjek
 */
export async function uploadWeeklyRPHToMyDrive({
  rphList,
  teacherName,
  teacherEmail,
  weekNo,
  accessToken,
  schoolName = 'Sekolah Kebangsaan / Menengah'
}: {
  rphList: Partial<RPHRecord>[];
  teacherName: string;
  teacherEmail: string;
  weekNo: number | string;
  accessToken: string;
  schoolName?: string;
}): Promise<{
  success: boolean;
  fileName: string;
  fileId?: string;
  webViewLink?: string;
  folderName: string;
  isPDF: boolean;
  slotsCount: number;
  error?: string;
}> {
  const formattedWeek = String(weekNo || '1').padStart(2, '0');
  const fileName = formatRPHFileName(teacherName, weekNo);
  const folderName = `e-RPH DeLIMA / Minggu ${formattedWeek}`;

  if (!accessToken) {
    return {
      success: false,
      fileName: `${fileName}.pdf`,
      folderName,
      isPDF: true,
      slotsCount: rphList.length,
      error: 'Token akses Google Drive tidak ditemui. Sila log masuk dengan ID DeLIMA rasmi.',
    };
  }

  try {
    // 1. Dapatkan folder induk 'e-RPH DeLIMA'
    const parentFolderId = await getOrCreateERPHFolder(accessToken);

    // 2. Cipta atau dapatkan subfolder khusus 'Minggu XX' di bawah e-RPH DeLIMA
    let targetFolderId = parentFolderId;
    const subQuery = encodeURIComponent(
      `mimeType = 'application/vnd.google-apps.folder' and name = 'Minggu ${formattedWeek}' and '${parentFolderId}' in parents and trashed = false`
    );
    const subSearchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${subQuery}&fields=files(id,name)&spaces=drive`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (subSearchRes.ok) {
      const subData = await subSearchRes.json();
      if (subData.files && subData.files.length > 0) {
        targetFolderId = subData.files[0].id;
      } else {
        const createSubRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `Minggu ${formattedWeek}`,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId]
          }),
        });
        if (createSubRes.ok) {
          const subFolder = await createSubRes.json();
          targetFolderId = subFolder.id;
        }
      }
    }

    // 3. Jana kandungan HTML Seminggu Penuh (Setiap Subjek 1 Halaman A4 Potrait)
    const weeklyHtml = generateWeeklyRPHHtml({
      rphList,
      teacherName,
      teacherEmail,
      weekNo,
      schoolName
    });

    // 4. Muat naik dokumen ke Google Drive sebagai Google Docs sementara untuk penukaran PDF berkualiti tinggi
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const tempDocMetadata = {
      name: `TEMP_${fileName}`,
      mimeType: 'application/vnd.google-apps.document',
      parents: [targetFolderId],
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(tempDocMetadata) +
      delimiter +
      'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
      weeklyHtml +
      closeDelimiter;

    const tempUploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    let finalFileId: string | undefined;
    let finalWebViewLink: string | undefined;

    if (tempUploadRes.ok) {
      const tempDocData = await tempUploadRes.json();
      const tempDocId = tempDocData.id;

      // 5. Eksport terus daripada Google Docs ke fail PDF Rasmi (application/pdf)
      const exportPdfRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${tempDocId}/export?mimeType=application/pdf`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (exportPdfRes.ok) {
        const pdfArrayBuffer = await exportPdfRes.arrayBuffer();

        // Muat naik fail PDF kekal ke Google Drive folder sasaran
        const pdfMetadata = {
          name: `${fileName}.pdf`,
          mimeType: 'application/pdf',
          parents: [targetFolderId],
        };

        const pdfUploadRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body:
              delimiter +
              'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
              JSON.stringify(pdfMetadata) +
              delimiter +
              'Content-Type: application/pdf\r\n\r\n' +
              new Uint8Array(pdfArrayBuffer) +
              closeDelimiter,
          }
        );

        if (pdfUploadRes.ok) {
          const pdfData = await pdfUploadRes.json();
          finalFileId = pdfData.id;
          finalWebViewLink = pdfData.webViewLink;

          // Padam fail sementara Google Doc
          await fetch(`https://www.googleapis.com/drive/v3/files/${tempDocId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` }
          }).catch(() => {});
        } else {
          // Jika muat naik semula gagal, gunakan pautan tempDoc yang telah dieksport
          finalFileId = tempDocId;
        }
      } else {
        finalFileId = tempDocId;
      }
    } else {
      // Fallback: Jika akaun tidak membenarkan Docs conversion, muat naik fail HTML dengan rujukan PDF
      const directMetadata = {
        name: `${fileName}.pdf.html`,
        mimeType: 'text/html',
        parents: [targetFolderId],
      };
      const directRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body:
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(directMetadata) +
            delimiter +
            'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
            weeklyHtml +
            closeDelimiter,
        }
      );
      if (directRes.ok) {
        const dData = await directRes.json();
        finalFileId = dData.id;
        finalWebViewLink = dData.webViewLink;
      }
    }

    return {
      success: true,
      fileName: `${fileName}.pdf`,
      folderName,
      fileId: finalFileId,
      webViewLink: finalWebViewLink || (finalFileId ? `https://drive.google.com/file/d/${finalFileId}/view` : undefined),
      isPDF: true,
      slotsCount: rphList.length
    };
  } catch (err: any) {
    console.error('Ralat uploadWeeklyRPHToMyDrive:', err);
    return {
      success: false,
      fileName: `${fileName}.pdf`,
      folderName,
      isPDF: true,
      slotsCount: rphList.length,
      error: err?.message || 'Gagal menghantar e-RPH Seminggu ke Google Drive.',
    };
  }
}

/**
 * Backward compatibility: uploadRPHToMyDrive
 */
export async function uploadRPHToMyDrive(args: {
  rph: Partial<RPHRecord>;
  teacherName: string;
  teacherEmail: string;
  accessToken: string;
  schoolName?: string;
}) {
  return uploadWeeklyRPHToMyDrive({
    rphList: [args.rph],
    teacherName: args.teacherName,
    teacherEmail: args.teacherEmail,
    weekNo: args.rph.minggu_ke || 1,
    accessToken: args.accessToken,
    schoolName: args.schoolName
  });
}

/**
 * Menyimpan profil jadual waktu guru ke akaun Google Drive awan DeLIMA secara kekal
 */
export async function saveTeacherProfileToDrive({
  accessToken,
  timetable,
  teacherName,
  teacherEmail
}: {
  accessToken: string;
  timetable: JadualSlot[];
  teacherName: string;
  teacherEmail: string;
}): Promise<{ success: boolean; fileId?: string; error?: string }> {
  if (!accessToken) return { success: false, error: 'Tiada token akses Google Drive' };

  try {
    const parentFolderId = await getOrCreateERPHFolder(accessToken);
    const fileName = 'profil_guru_jadual_waktu.json';

    // Semak sama ada fail profil telah wujud
    const query = encodeURIComponent(
      `name = '${fileName}' and '${parentFolderId}' in parents and trashed = false`
    );
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const payload = JSON.stringify({
      teacherName,
      teacherEmail,
      updatedAt: new Date().toISOString(),
      timetable,
      storageType: 'google_workspace_delima_cloud'
    }, null, 2);

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const existingFileId = searchData.files[0].id;
        // Kemas kini kandungan fail sedia ada
        const updateRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: payload
          }
        );
        return { success: updateRes.ok, fileId: existingFileId };
      }
    }

    // Cipta fail baharu
    const boundary = '-------delimaProfileBoundary';
    const multipartBody =
      `\r\n--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify({
        name: fileName,
        mimeType: 'application/json',
        parents: [parentFolderId]
      }) +
      `\r\n--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      payload +
      `\r\n--${boundary}--`;

    const createRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
      }
    );

    if (createRes.ok) {
      const data = await createRes.json();
      return { success: true, fileId: data.id };
    }

    return { success: false, error: 'Gagal mencipta fail profil di Google Drive.' };
  } catch (err: any) {
    console.warn('Ralat saveTeacherProfileToDrive:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Mengambil profil jadual waktu guru dari Google Drive awan DeLIMA
 */
export async function getTeacherProfileFromDrive({
  accessToken
}: {
  accessToken: string;
}): Promise<{ success: boolean; timetable?: JadualSlot[]; error?: string }> {
  if (!accessToken) return { success: false, error: 'Tiada token akses' };

  try {
    const parentFolderId = await getOrCreateERPHFolder(accessToken);
    const fileName = 'profil_guru_jadual_waktu.json';
    const query = encodeURIComponent(
      `name = '${fileName}' and '${parentFolderId}' in parents and trashed = false`
    );
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const fileId = searchData.files[0].id;
        const downloadRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (downloadRes.ok) {
          const profileData = await downloadRes.json();
          if (Array.isArray(profileData.timetable)) {
            return { success: true, timetable: profileData.timetable };
          }
        }
      }
    }
    return { success: false, error: 'Fail profil tidak ditemui di Google Drive' };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

