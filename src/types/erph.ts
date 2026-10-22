// Definisi Jenis Data TypeScript untuk Sistem e-RPH Pintar

export interface TakwimMinggu {
  tahun_akademik: number;
  kumpulan: string;
  minggu_ke: number | null;
  kod_minggu?: string;
  label_minggu: string;
  tarikh_teks?: string;
  tarikh_mula: string; // YYYY-MM-DD
  tarikh_tamat: string; // YYYY-MM-DD
  adalah_cuti: boolean;
  catatan_cuti?: string | null;
  penggal?: string;
}

export interface JadualSlot {
  id?: string;
  tahun_akademik: number;
  hari: string;
  hari_index: number;
  slot_ke: number;
  kelas: string;
  masa_mula: string;
  masa_tamat: string;
  subjek: string;
  tingkatan: string;
  bilangan_murid: number;
}

export interface SubjectLocaleInfo {
  subjek_nama: string;
  kod_bahasa: 'ar' | 'en' | 'ms' | 'zh' | 'ta' | 'fr' | string;
  arah_teks: 'rtl' | 'ltr';
  fon_keluarga: string;
  labels: Record<string, string>;
}

export interface DSKPItem {
  id: number;
  subjek: string;
  tingkatan: string;
  tema: string;
  tajuk: string;
  sk: string;
  sp: string;
  objektif_lalai?: string;
  aktiviti_cadangan?: string;
}

export interface RPHActivities {
  set_induksi: string;
  langkah_1: string;
  langkah_2: string;
  langkah_3: string;
  penutup: string;
}

export interface RPHPedagogy {
  bbm: string[];
  emk: string[];
  nilai_murni: string[];
  peta_ithink: string[];
  kecerdasan_pelbagai: string[];
  kaedah: string[];
  strategi: string[];
  alat_pemikiran_pak21: string[];
  pentaksiran: string[];
}

export interface RPHReflection {
  pdp_dijalankan?: boolean; // true = PdP Dijalankan, false = Tidak Dijalankan
  sebab_tidak_dijalankan?: string; // Jawapan sendiri / sebab PdP tidak dijalankan
  bawa_ke_kelas_seterusnya?: boolean; // Bawa RPH ke kelas seterusnya
  objektif_disalin: string;
  bilangan_murid_hadir: number;
  bilangan_murid_mencapai: number;
  peratus_mencapai: number;
  intervensi_diperlukan: boolean;
  pilihan_intervensi: string;
  catatan_tambahan: string;
}

export interface UserProfile {
  id?: string;
  user_id: string;
  full_name: string;
  email: string;
  ic_number?: string;
  phone_number?: string;
  school_name: string;
  school_code?: string;
  district: string;
  state: string;
  position: string;
  school_logo?: string; // base64 or URL
  teacher_signature?: string; // base64 canvas signature
  is_onboarding_completed: boolean;
  plan_type: 'free' | 'pro';
  ai_credits_remaining: number;
  subscription_expires_at?: string;
  voucher_code_used?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SharedReviewRecord {
  id?: string;
  share_token: string;
  user_id: string;
  teacher_name: string;
  teacher_email?: string;
  school_name: string;
  school_logo?: string;
  minggu_ke: number;
  tahun_akademik: number;
  status: 'MENUNGGU_SEMAKAN' | 'DISEMAK' | 'DITOLAK';
  nama_penyemak?: string;
  jawatan_penyemak?: string;
  ulasan_penyemak?: string;
  tandatangan_penyemak?: string;
  tarikh_disemak?: string;
  rph_snapshot: Record<string, Partial<RPHRecord>> | Partial<RPHRecord>[];
  created_at?: string;
}

export interface VoucherRecord {
  id?: string;
  code: string;
  plan_type: 'free' | 'pro';
  credits_granted: number;
  duration_days: number;
  is_active: boolean;
  description?: string;
}

export interface RPHRecord {
  id?: string;
  user_id?: string;
  jadual_id?: string;
  tahun_akademik: number;
  minggu_ke: number;
  tarikh: string; // YYYY-MM-DD
  hari: string;
  masa_mula: string;
  masa_tamat: string;
  tingkatan: string;
  kelas: string;
  subjek: string;
  kod_bahasa: string;
  arah_teks: 'rtl' | 'ltr';

  tema: string;
  tajuk: string;
  sk: string;
  sp: string;
  objektif_pembelajaran: string;
  kriteria_kejayaan: string;

  aktiviti: RPHActivities;
  pedagogi: RPHPedagogy;
  refleksi: RPHReflection;

  adalah_ditangguhkan: boolean;
  sebab_penangguhan?: string;
  adalah_carry_forward: boolean;
  asal_rph_id?: string;

  status: 'DRAFT' | 'SELESAI' | 'DISEMAK';
  jenis_rph?: 'akademik' | 'karakter';
  karakter_data?: {
    elemen: string[];
    catatan_aktiviti: string;
  };

  // Pengesahan & Tandatangan Digital SaaS
  guru_tandatangan?: string;
  penyemak_nama?: string;
  penyemak_jawatan?: string;
  penyemak_ulasan?: string;
  penyemak_tandatangan?: string;
  penyemak_tarikh_disemak?: string;

  created_at?: string;
  updated_at?: string;
}

export interface KarakterData {
  elemen: string[];
  catatan_aktiviti: string;
}

export interface RPTItem {
  minggu: number;
  tarikh?: string;
  tema?: string;
  tajuk?: string;
  sk: string;
  sp: string;
  standard_prestasi?: string;
  cadangan_aktiviti: string;
  catatan?: string;
}

export interface RPTConnection {
  id?: string;
  subjek: string;
  tingkatan: string;
  google_sheet_url: string;
  nama_tab: string;
  pemetaan_lajur: {
    minggu_col: string;
    sk_col: string;
    sp_col: string;
    aktiviti_col: string;
    catatan_col?: string;
  };
  tarikh_sync_terakhir?: string;
}

export interface GeminiCoPilotRequest {
  subjek: string;
  tingkatan: string;
  kod_bahasa: string;
  sk: string;
  sp: string;
  cadangan_aktiviti_rpt?: string;
  pilihan_pedagogi?: {
    pak21?: string;
    ithink?: string;
    bbm?: string;
    emk?: string;
    durasi_minit?: number;
  };
}

export interface GeminiCoPilotResponse {
  objektif_pembelajaran: string;
  kriteria_kejayaan: string;
  aktiviti: {
    set_induksi: string;
    langkah_1: string;
    langkah_2: string;
    langkah_3: string;
    penutup: string;
  };
  cadangan_refleksi?: string;
}
