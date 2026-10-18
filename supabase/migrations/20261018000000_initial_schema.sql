-- ==============================================================================
-- Pangkalan Data e-RPH Pintar: Skema Lengkap Supabase PostgreSQL
-- ==============================================================================

-- Dayakan sambungan fungsi teks dan UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ------------------------------------------------------------------------------
-- 1. Takwim Minggu Persekolahan 2026 (Kumpulan B & A)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.takwim_persekolahan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tahun_akademik INT NOT NULL DEFAULT 2026,
    kumpulan TEXT NOT NULL DEFAULT 'B', -- 'B' (Selangor, KL, Johor dll) atau 'A'
    minggu_ke INT,                      -- 1 hingga 43 (NULL jika minggu cuti penuh)
    label_minggu TEXT NOT NULL,         -- 'Minggu 1' atau 'CUTI PENGGAL 1'
    tarikh_mula DATE NOT NULL,
    tarikh_tamat DATE NOT NULL,
    adalah_cuti BOOLEAN NOT NULL DEFAULT false,
    catatan_cuti TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_takwim_tarikh ON public.takwim_persekolahan (tarikh_mula, tarikh_tamat);
CREATE INDEX IF NOT EXISTS idx_takwim_minggu ON public.takwim_persekolahan (tahun_akademik, minggu_ke);

-- ------------------------------------------------------------------------------
-- 2. Jadual Waktu Guru
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jadual_waktu_guru (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tahun_akademik INT NOT NULL DEFAULT 2026,
    hari TEXT NOT NULL,                  -- 'ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'
    hari_index INT NOT NULL,             -- 1 = Isnin, 5 = Jumaat
    slot_ke INT NOT NULL,                -- 1, 2, 3...
    masa_mula TEXT NOT NULL,             -- '11.00 PAGI'
    masa_tamat TEXT NOT NULL,            -- '12.30 TGH HARI'
    subjek TEXT NOT NULL,                -- 'اللغة العربية المعاصرة', 'ENGLISH', 'SAINS'
    tingkatan TEXT NOT NULL,             -- '1', '2', '3', '4', '5'
    kelas TEXT NOT NULL,                 -- '3 MUSLIM', '2 BUKHARI'
    bilangan_murid INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jadual_guru_hari ON public.jadual_waktu_guru (user_id, hari_index, slot_ke);

-- ------------------------------------------------------------------------------
-- 3. Kamus 61 Label Terjemahan Pelbagai Bahasa
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kamus_label_subjek (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subjek_nama TEXT UNIQUE NOT NULL,     -- 'اللغة العربية المعاصرة', 'ENGLISH', 'SAINS', dsb
    kod_bahasa TEXT NOT NULL DEFAULT 'ms', -- 'ar', 'en', 'ms', 'zh', 'ta', 'fr'
    arah_teks TEXT NOT NULL DEFAULT 'ltr', -- 'rtl' (Arab / Jawi) atau 'ltr'
    fon_keluarga TEXT DEFAULT 'font-sans', -- 'font-amiri' untuk teks Arab
    label_kamus JSONB NOT NULL,           -- Pemetaan 61 label terjemahan
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kamus_subjek ON public.kamus_label_subjek (subjek_nama);
CREATE INDEX IF NOT EXISTS idx_kamus_bahasa ON public.kamus_label_subjek (kod_bahasa, arah_teks);

-- ------------------------------------------------------------------------------
-- 4. Pangkalan Data DSKP Master (50,000+ Standard Pembelajaran)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dskp_kurikulum (
    id BIGSERIAL PRIMARY KEY,
    subjek TEXT NOT NULL,
    tingkatan TEXT NOT NULL,
    tema TEXT,
    tajuk TEXT,
    sk_kod TEXT,
    standard_kandungan TEXT NOT NULL,
    sp_kod TEXT,
    standard_pembelajaran TEXT NOT NULL,
    objektif_lalai TEXT,
    aktiviti_cadangan TEXT,
    nilai_teras_sivik TEXT,
    tajuk_sivik TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dskp_subjek_ting ON public.dskp_kurikulum (subjek, tingkatan);
CREATE INDEX IF NOT EXISTS idx_dskp_sp_trgm ON public.dskp_kurikulum USING gin (standard_pembelajaran gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dskp_sk_trgm ON public.dskp_kurikulum USING gin (standard_kandungan gin_trgm_ops);

-- ------------------------------------------------------------------------------
-- 5. Rekod RPH Harian & Logik Carry Forward
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rph_harian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    jadual_id UUID REFERENCES public.jadual_waktu_guru(id) ON DELETE SET NULL,
    tahun_akademik INT NOT NULL DEFAULT 2026,
    minggu_ke INT NOT NULL,
    tarikh DATE NOT NULL,
    hari TEXT NOT NULL,
    masa_mula TEXT NOT NULL,
    masa_tamat TEXT NOT NULL,
    tingkatan TEXT NOT NULL,
    kelas TEXT NOT NULL,
    subjek TEXT NOT NULL,
    kod_bahasa TEXT DEFAULT 'ms',
    arah_teks TEXT DEFAULT 'ltr',
    
    -- Kandungan Kurikulum
    tema TEXT,
    tajuk TEXT,
    sk_list JSONB NOT NULL DEFAULT '[]', -- Array of { kod, teks }
    sp_list JSONB NOT NULL DEFAULT '[]', -- Array of { kod, teks }
    objektif_pembelajaran TEXT NOT NULL,
    kriteria_kejayaan TEXT,
    
    -- Aktiviti PdPc (Set Induksi, Langkah 1-3, Penutup)
    aktiviti JSONB NOT NULL DEFAULT '{
        "set_induksi": "",
        "langkah_1": "",
        "langkah_2": "",
        "langkah_3": "",
        "penutup": ""
    }',
    
    -- Elemen Pedagogi & PAK-21
    pedagogi JSONB NOT NULL DEFAULT '{
        "bbm": [],
        "emk": [],
        "nilai_murni": [],
        "peta_ithink": [],
        "kecerdasan_pelbagai": [],
        "kaedah": [],
        "strategi": [],
        "alat_pemikiran_pak21": [],
        "pentaksiran": []
    }',
    
    -- Refleksi Dinamik
    refleksi JSONB NOT NULL DEFAULT '{
        "objektif_disalin": "",
        "bilangan_murid_hadir": 30,
        "bilangan_murid_mencapai": 28,
        "peratus_mencapai": 93.3,
        "intervensi_diperlukan": false,
        "pilihan_intervensi": "",
        "catatan_tambahan": ""
    }',
    
    -- Penangguhan & Carry Forward
    adalah_ditangguhkan BOOLEAN DEFAULT false,
    sebab_penangguhan TEXT, -- 'Cuti Peristiwa', 'Program Sekolah', 'MC', 'Cuti Bencana', 'Mesyuarat'
    adalah_carry_forward BOOLEAN DEFAULT false,
    asal_rph_id UUID REFERENCES public.rph_harian(id),
    
    status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'SELESAI', 'DISEMAK'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rph_user_tarikh ON public.rph_harian (user_id, tarikh);
CREATE INDEX IF NOT EXISTS idx_rph_minggu_subjek ON public.rph_harian (user_id, minggu_ke, subjek);
CREATE INDEX IF NOT EXISTS idx_rph_postponed ON public.rph_harian (user_id, adalah_ditangguhkan);

-- ------------------------------------------------------------------------------
-- 6. Konfigurasi Penyambung RPT Google Sheets
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rpt_sambungan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subjek TEXT NOT NULL,
    tingkatan TEXT NOT NULL,
    google_sheet_url TEXT NOT NULL,
    nama_tab TEXT DEFAULT 'Sheet1',
    pemetaan_lajur JSONB DEFAULT '{
        "minggu_col": "Minggu",
        "tarikh_col": "Tarikh",
        "sk_col": "Standard Kandungan",
        "sp_col": "Standard Pembelajaran",
        "aktiviti_col": "Cadangan Aktiviti"
    }',
    data_cache JSONB,
    tarikh_sync_terakhir TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rpt_user_subjek ON public.rpt_sambungan (user_id, subjek, tingkatan);

-- ------------------------------------------------------------------------------
-- 7. Polisi Keselamatan Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.takwim_persekolahan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadual_waktu_guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kamus_label_subjek ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dskp_kurikulum ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rph_harian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpt_sambungan ENABLE ROW LEVEL SECURITY;

-- Master data: Semua pengguna yang log masuk boleh membaca
CREATE POLICY "Semua boleh baca takwim" ON public.takwim_persekolahan FOR SELECT USING (true);
CREATE POLICY "Semua boleh baca kamus label" ON public.kamus_label_subjek FOR SELECT USING (true);
CREATE POLICY "Semua boleh baca dskp" ON public.dskp_kurikulum FOR SELECT USING (true);

-- Data peribadi guru: Hanya pemilik akaun boleh baca & ubah
CREATE POLICY "Guru urus jadual sendiri" ON public.jadual_waktu_guru
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Guru urus rph sendiri" ON public.rph_harian
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Guru urus rpt sendiri" ON public.rpt_sambungan
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
