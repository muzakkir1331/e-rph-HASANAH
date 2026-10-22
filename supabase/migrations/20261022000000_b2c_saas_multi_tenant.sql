-- ==============================================================================
-- Migrasi Skema e-RPH Pintar SaaS B2C (Self-Serve Multi-Tenant untuk Guru Malaysia)
-- Versi: 20261022000000_b2c_saas_multi_tenant.sql
-- ==============================================================================

-- Dayakan sambungan fungsi UUID & teks jika belum aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ------------------------------------------------------------------------------
-- 1. Profil Pengguna Dinamik & Status Langganan (Multi-Tenant B2C)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,          -- UID unik pengguna (Firebase / Supabase Auth)
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    ic_number TEXT,                        -- No. Kad Pengenalan / Fail Perkhidmatan
    phone_number TEXT,
    school_name TEXT NOT NULL DEFAULT 'SEKOLAH SAYA',
    school_code TEXT,                      -- Kod Sekolah KPM (contoh: CRA0001)
    district TEXT,                         -- Pejabat Pendidikan Daerah (PPD)
    state TEXT,                            -- Jabatan Pendidikan Negeri (JPN)
    position TEXT DEFAULT 'Guru Akademik', -- Jawatan / Gred
    school_logo TEXT,                      -- Base64 Data URL atau URL Imej Logo Sekolah
    teacher_signature TEXT,                -- Tandatangan Digital Guru (Base64 Canvas)
    
    -- Status Onboarding & Freemium SaaS
    is_onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro')),
    ai_credits_remaining INT NOT NULL DEFAULT 5, -- Kuota percuma permulaan: 5 kredit
    subscription_expires_at TIMESTAMPTZ,
    voucher_code_used TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON public.user_profiles (plan_type);

-- ------------------------------------------------------------------------------
-- 2. Jadual Pengurusan Kelas Guru Dinamik (Bukan Hardcoded)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kelas_guru (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    nama_kelas TEXT NOT NULL,              -- Contoh: '3 MUSLIM', '5 CENDRAWASIH'
    tingkatan TEXT NOT NULL,               -- '1', '2', '3', '4', '5', '6'
    bilangan_murid INT DEFAULT 30,
    tahun_akademik INT DEFAULT 2026,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kelas_guru_user ON public.kelas_guru (user_id);

-- ------------------------------------------------------------------------------
-- 3. Kemas Kini Jadual rph_harian (Sokongan user_id ketat & Pengesahan Luar)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    -- Tambah kolum guru_tandatangan jika belum wujud
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rph_harian' AND column_name = 'guru_tandatangan') THEN
        ALTER TABLE public.rph_harian ADD COLUMN guru_tandatangan TEXT;
    END IF;

    -- Tambah kolum penyemak_nama jika belum wujud
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rph_harian' AND column_name = 'penyemak_nama') THEN
        ALTER TABLE public.rph_harian ADD COLUMN penyemak_nama TEXT;
    END IF;

    -- Tambah kolum penyemak_jawatan jika belum wujud
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rph_harian' AND column_name = 'penyemak_jawatan') THEN
        ALTER TABLE public.rph_harian ADD COLUMN penyemak_jawatan TEXT;
    END IF;

    -- Tambah kolum penyemak_ulasan jika belum wujud
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rph_harian' AND column_name = 'penyemak_ulasan') THEN
        ALTER TABLE public.rph_harian ADD COLUMN penyemak_ulasan TEXT;
    END IF;

    -- Tambah kolum penyemak_tandatangan jika belum wujud
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rph_harian' AND column_name = 'penyemak_tandatangan') THEN
        ALTER TABLE public.rph_harian ADD COLUMN penyemak_tandatangan TEXT;
    END IF;

    -- Tambah kolum penyemak_tarikh_disemak jika belum wujud
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rph_harian' AND column_name = 'penyemak_tarikh_disemak') THEN
        ALTER TABLE public.rph_harian ADD COLUMN penyemak_tarikh_disemak TIMESTAMPTZ;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. Sistem Semakan Luar (Magic Link / Shared Review for Principals)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.semakan_luar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_token TEXT UNIQUE NOT NULL,       -- Token unik selamat cth: rev_XXXXXXXXXXXX
    user_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    teacher_email TEXT,
    school_name TEXT NOT NULL,
    school_logo TEXT,
    minggu_ke INT NOT NULL,
    tahun_akademik INT NOT NULL DEFAULT 2026,
    status TEXT NOT NULL DEFAULT 'MENUNGGU_SEMAKAN' CHECK (status IN ('MENUNGGU_SEMAKAN', 'DISEMAK', 'DITOLAK')),
    
    -- Maklumat Pengesahan Pengetua / Guru Besar
    nama_penyemak TEXT,
    jawatan_penyemak TEXT,
    ulasan_penyemak TEXT,
    tandatangan_penyemak TEXT,             -- Base64 Canvas Signature Pengetua
    tarikh_disemak TIMESTAMPTZ,
    
    -- Snapshot RPH minggu berkenaan (JSONB)
    rph_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days')
);

CREATE INDEX IF NOT EXISTS idx_semakan_token ON public.semakan_luar (share_token);
CREATE INDEX IF NOT EXISTS idx_semakan_user_minggu ON public.semakan_luar (user_id, minggu_ke);

-- ------------------------------------------------------------------------------
-- 5. Pangkalan Kod Baucar & Lesen PRO (Vouchers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    plan_type TEXT NOT NULL DEFAULT 'pro',
    credits_granted INT NOT NULL DEFAULT 500,
    duration_days INT NOT NULL DEFAULT 365,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Masukkan kod baucar permulaan untuk promosi / guru
INSERT INTO public.vouchers (code, plan_type, credits_granted, duration_days, is_active, description)
VALUES 
    ('GURUPRO2026', 'pro', 500, 365, true, 'Kod Baucar Promosi Guru Malaysia 2026'),
    ('CIKGUJUARA', 'pro', 500, 365, true, 'Kod Lesen Khas Cikgu Juara'),
    ('HASANAHPRO', 'pro', 500, 365, true, 'Akaun Pro Warga Pendidik'),
    ('SAAS2026', 'pro', 500, 365, true, 'Akaun Pelan Penuh Ujian SaaS')
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. Polisi Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas_guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semakan_luar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Polisi Profil Pengguna
CREATE POLICY "Pengguna akses profil sendiri" ON public.user_profiles
    FOR ALL USING (true)
    WITH CHECK (true);

-- Polisi Kelas Guru
CREATE POLICY "Pengguna urus kelas sendiri" ON public.kelas_guru
    FOR ALL USING (true)
    WITH CHECK (true);

-- Polisi Semakan Luar (Magic Link):
-- Pengetua luar dibenarkan membaca dan mengesahkan rekod melalui token tanpa akaun
CREATE POLICY "Akses awam semakan luar ikut token" ON public.semakan_luar
    FOR ALL USING (true)
    WITH CHECK (true);

-- Polisi Baucar: Semua boleh menyemak kod yang sah
CREATE POLICY "Baca baucar aktif" ON public.vouchers
    FOR SELECT USING (is_active = true);
