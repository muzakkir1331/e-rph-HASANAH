import { GoogleGenAI, Type } from '@google/genai';
import { GeminiCoPilotRequest, GeminiCoPilotResponse } from '@/types/erph';

const apiKey = process.env.GEMINI_API_KEY || '';

export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Co-Pilot Gemini AI untuk penjanaan Objektif Pembelajaran SMART dan 5 Langkah Aktiviti PdPc
 */
export async function generateRPHContent(req: GeminiCoPilotRequest): Promise<GeminiCoPilotResponse> {
  // Jika API key belum disetkan, pulangkan templat berstruktur berkualiti tinggi sebagai fallback
  if (!apiKey || !ai) {
    return generateFallbackContent(req);
  }

  const isArabic = req.kod_bahasa === 'ar' || /[\u0600-\u06FF]/.test(req.subjek);
  const isEnglish = req.kod_bahasa === 'en' || req.subjek.toUpperCase().includes('ENGLISH');

  let languageInstruction = "Gunakan Bahasa Melayu standard rasmi Kementerian Pendidikan Malaysia.";
  if (isArabic) {
    languageInstruction = "You MUST write EVERYTHING in fluent, grammatically accurate Modern Standard Arabic (الفصحى) using official KPM Kurikulum Bersepadu Dini (KBD) terminology. All fields in JSON must be in Arabic.";
  } else if (isEnglish) {
    languageInstruction = "You MUST write EVERYTHING in proper British/Malaysian curriculum English aligned with CEFR standards and Bloom's Taxonomy.";
  }

  const prompt = `
Anda ialah Penolong Co-Pilot e-RPH Pintar Kementerian Pendidikan Malaysia (KPM).
Tugas anda ialah merangka Objektif Pembelajaran (SMART / ABCD) dan 5 Langkah Aktiviti Pengajaran dan Pembelajaran (PdPc) berasaskan maklumat berikut:

MAKLUMAT KELAS & KURIKULUM:
- Subjek: ${req.subjek}
- Tingkatan: ${req.tingkatan}
- Standard Kandungan (SK): ${req.sk}
- Standard Pembelajaran (SP): ${req.sp}
- Cadangan Aktiviti daripada RPT Luaran (jika ada): ${req.cadangan_aktiviti_rpt || 'Tiada spesifik - jana mengikut sukatan'}
- Strategi PAK-21 Dipilih: ${req.pilihan_pedagogi?.pak21 || 'Think-Pair-Share'}
- Peta Pemikiran I-Think: ${req.pilihan_pedagogi?.ithink || 'Peta Buih'}
- Bahan Bantu Mengajar (BBM): ${req.pilihan_pedagogi?.bbm || 'Lembaran kerja, slaid, LCD'}
- Elemen Merentas Kurikulum (EMK): ${req.pilihan_pedagogi?.emk || 'Kreativiti dan Inovasi'}
- Tempoh Masa PdPc: ${req.pilihan_pedagogi?.durasi_minit || 60} minit

ARAHAN BAHASA:
${languageInstruction}

FORMAT JAWAPAN YANG DIKEHENDAKI:
1. Objektif Pembelajaran: Nyatakan kriteria Audience, Behavior, Condition, Degree (contoh: "Pada akhir sesi PdPc, murid dapat: 1. ... 2. ...").
2. Kriteria Kejayaan: 2 hingga 3 pernyataan jelas kejayaan murid.
3. Aktiviti PdPc (Wajib dibahagikan kepada 5 fasa):
   - set_induksi: 5 minit (Menarik minat dan mencungkil pengetahuan sedia ada).
   - langkah_1: 15 minit (Penerangan konsep utama dan pemodelan guru).
   - langkah_2: 20 minit (Aktiviti kolaboratif murid berpusatkan murid dengan PAK-21).
   - langkah_3: 15 minit (Pengukuhan, aplikasi dan pentaksiran formatif).
   - penutup: 5 minit (Rumusan kognitif dan afektif oleh murid).
4. cadangan_refleksi: Ayat templat penilaian murid berjaya mencapai objektif.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            objektif_pembelajaran: { type: Type.STRING },
            kriteria_kejayaan: { type: Type.STRING },
            aktiviti: {
              type: Type.OBJECT,
              properties: {
                set_induksi: { type: Type.STRING },
                langkah_1: { type: Type.STRING },
                langkah_2: { type: Type.STRING },
                langkah_3: { type: Type.STRING },
                penutup: { type: Type.STRING },
              },
              required: ['set_induksi', 'langkah_1', 'langkah_2', 'langkah_3', 'penutup'],
            },
            cadangan_refleksi: { type: Type.STRING },
          },
          required: ['objektif_pembelajaran', 'kriteria_kejayaan', 'aktiviti'],
        },
      },
    });

    const outputText = response.text || '{}';
    const parsed = JSON.parse(outputText);
    return parsed as GeminiCoPilotResponse;
  } catch (error: any) {
    console.error('Ralat Gemini API:', error);
    return generateFallbackContent(req);
  }
}

/**
 * Jana kandungan berkualiti tinggi jika API key tidak disediakan atau berlaku sambungan terputus
 */
function generateFallbackContent(req: GeminiCoPilotRequest): GeminiCoPilotResponse {
  const isArabic = req.kod_bahasa === 'ar' || /[\u0600-\u06FF]/.test(req.subjek);
  const isEnglish = req.kod_bahasa === 'en' || req.subjek.toUpperCase().includes('ENGLISH');
  const pak21 = req.pilihan_pedagogi?.pak21 || 'Think-Pair-Share';
  const ithink = req.pilihan_pedagogi?.ithink || 'Peta Buih';

  if (isArabic) {
    return {
      objektif_pembelajaran: `في نهاية التعليم والتعلم ، يمكن للطلاب:\n١. الاستماع والترديد الصحيح وفق معيار التعلم: (${req.sp || 'المحتوى المقترح'}).\n٢. استيعاب المعاني وتطبيقها في جمل مفيدة بنجاح.`,
      kriteria_kejayaan: `ينجح الطالب إذا استطاع:\n١. تحديد المعاني الصحيحة للكلمات بدقة.\n٢. المشاركة الفعالة في الأنشطة الصفية (${pak21}).`,
      aktiviti: {
        set_induksi: `(٥ دقائق) عرض نموذج أو صور تحفيزية لجذب انتباه الطلاب وربطها بالمعرفة السابقة.`,
        langkah_1: `(١٥ دقيقة) قراءة النموذج وشرح المعلم للمفاهيم الأساسية والألفاظ المقررة مع الترديد الجماعي.`,
        langkah_2: `(٢٠ دقيقة) نشاط تفاعلي تعاوني للطلاب في مجموعات باستخدام أسلوب (${pak21}) وتطبيق (${ithink}).`,
        langkah_3: `(١٥ دقيقة) تدريب كتابي فردي أو جماعي (أوراق العمل) لتثبيت المعلومات والتقييم التكويني.`,
        penutup: `(٥ دقائق) تلخيص الدرس من قبل بعض الطلاب وتقديم التغذية الراجعة من المعلم.`
      },
      cadangan_refleksi: `نجح معظم الطلاب في استيعاب المفاهيم وتحقيق أهداف التعلم، وتم تقديم تدريب إضافي لمن يحتاج إلى متابعة.`
    };
  }

  if (isEnglish) {
    return {
      objektif_pembelajaran: `By the end of the lesson, pupils will be able to:\n1. Understand and explain the key concepts of: ${req.sp || 'the learning standard'}.\n2. Complete the assigned collaborative task accurately using ${pak21}.`,
      kriteria_kejayaan: `Pupils will be successful if they can:\n1. Identify at least 3 main elements correctly.\n2. Present their ideas collaboratively with their peers.`,
      aktiviti: {
        set_induksi: `(5 mins) Teacher shows a visual stimulus or video clip to activate pupils' prior knowledge and introduce today's topic.`,
        langkah_1: `(15 mins) Teacher models the core concept, clarifies vocabulary, and guides pupils through key examples on the board.`,
        langkah_2: `(20 mins) Collaborative group activity where pupils engage in ${pak21} utilizing the ${ithink} thinking map.`,
        langkah_3: `(15 mins) Independent practice and formative assessment where pupils complete worksheet exercises.`,
        penutup: `(5 mins) Pupils recap what they have learned, and teacher conducts a quick exit ticket session.`
      },
      cadangan_refleksi: `Pupils demonstrated good engagement and achieved the target learning objectives with positive peer interaction.`
    };
  }

  // Bahasa Melayu Standard (Sains, BM, Matematik, dll)
  return {
    objektif_pembelajaran: `Pada akhir sesi pengajaran dan pembelajaran, sekurang-kurangnya 85% murid dapat:\n1. Menerangkan dan menghuraikan konsep berkaitan: ${req.sp || 'Standard Pembelajaran'}.\n2. Melengkapkan lembaran aktiviti kolaboratif dengan betul dan tepat.`,
    kriteria_kejayaan: `Murid dianggap berjaya sekiranya dapat:\n1. Menjawab sekurang-kurangnya 3 soalan pemahaman dengan tepat.\n2. Menghasilkan peta pemikiran ${ithink} bersama rakan sekumpulan.`,
    aktiviti: {
      set_induksi: `(5 Minit) Guru menayangkan bahan rangsangan / video pendek untuk mencungkil pengetahuan sedia ada murid berkaitan tajuk PdPc.`,
      langkah_1: `(15 Minit) Guru memberi penerangan konsep utama dan membuat demonstrasi atau pemodelan di hadapan kelas.`,
      langkah_2: `(20 Minit) Murid menjalankan aktiviti berpusatkan murid secara kolaboratif menggunakan kaedah ${pak21} dan melengkapkan ${ithink}.`,
      langkah_3: `(15 Minit) Pengukuhan melalui latihan bertulis / lembaran kerja individu untuk menilai tahap penguasaan murid secara formatif.`,
      penutup: `(5 Minit) Murid membuat rumusan kognitif dan afektif tentang isi pelajaran dibimbing oleh guru.`
    },
    cadangan_refleksi: `Murid memberikan tumpuan yang cemerlang dan berjaya menguasai objektif pembelajaran yang ditetapkan.`
  };
}
