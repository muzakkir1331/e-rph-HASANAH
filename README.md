# E-RPH (Sistem Rancangan Pengajaran Harian Digital)

Sistem penyediaan Rancangan Pengajaran Harian (RPH) digital pintar berasaskan DSKP KPM, dilengkapi integrasi Google Gemini AI, Firebase Auth (Google SSO DeLIMA), dan Supabase Database.

---

## 🚀 Ciri-Ciri Utama

- **Penyediaan RPH Berstruktur**: Pemilihan DSKP standard, tema, unit, standard kandungan & standard pembelajaran secara pantas.
- **Bantuan AI Pedagogi (Google Gemini)**: Penjanaan aktiviti pengajaran (Pemula, Utama, Penutup) dan pembezaan secara automatik.
- **Integrasi DeLIMA / Google SSO**: Pengesahan identiti guru melalui Firebase Authentication.
- **Pengurusan Data & Rujukan**: Rujukan Takwim KPM 2026, jadual waktu, dan DSKP master dalam Supabase.
- **Eksport & Cetak**: Paparan mesra cetak / PDF untuk semakan pentadbir dan rekod sekolah.

---

## 🛠️ Teknologi Digunakan

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), React, Tailwind CSS, Lucide React
- **Pangkalan Data**: [Supabase](https://supabase.com/) (PostgreSQL & Row Level Security)
- **Pengesahan**: [Firebase Auth](https://firebase.google.com/)
- **Kecerdasan Buatan**: [Google Gemini AI API](https://aistudio.google.com/) (`@google/genai`)

---

## 📦 Pemasangan Tempatan (Local Setup)

1. **Klon Repositori**:
   ```bash
   git clone <REPOSITORY_URL>
   cd E-RPH
   ```

2. **Pasang Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Pembolehubah Persekitaran**:
   Salin `.env.local.example` kepada `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
   Lengkapkan maklumat berikut di dalam `.env.local`:
   - Kredensial Firebase (`NEXT_PUBLIC_FIREBASE_*`)
   - Google Gemini API Key (`GEMINI_API_KEY`)
   - Kredensial Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

4. **Jalankan Pelayan Pembangunan**:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) pada pelayar anda.

---

## 📄 Skema Pangkalan Data
Fail migrasi Supabase boleh didapati di bawah direktori `supabase/migrations/`.
