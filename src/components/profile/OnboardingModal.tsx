'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  School,
  User,
  ShieldCheck,
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  PenTool,
  RotateCcw,
  Building,
  MapPin,
  Briefcase,
  IdCard,
  Phone
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserProfile } from '@/types/erph';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile?: UserProfile | null;
}

export default function OnboardingModal({ isOpen, onClose, initialProfile }: OnboardingModalProps) {
  const { userProfile, teacherName, teacherEmail, updateUserProfile } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [icNumber, setIcNumber] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [schoolCode, setSchoolCode] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [stateName, setStateName] = useState<string>('Pahang');
  const [position, setPosition] = useState<string>('Guru Akademik');
  const [schoolLogo, setSchoolLogo] = useState<string>('');
  const [teacherSignature, setTeacherSignature] = useState<string>('');

  // Canvas Signature Pad
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState<boolean>(false);

  // Inisialisasi borang dengan profil sedia ada
  useEffect(() => {
    const prof = initialProfile || userProfile;
    if (prof) {
      setFullName(prof.full_name || teacherName || '');
      setIcNumber(prof.ic_number || '');
      setPhoneNumber(prof.phone_number || '');
      setSchoolName(prof.school_name || 'SMA Al-Hasanah');
      setSchoolCode(prof.school_code || 'SABK');
      setDistrict(prof.district || '');
      setStateName(prof.state || 'Pahang');
      setPosition(prof.position || 'Guru Akademik');
      setSchoolLogo(prof.school_logo || '/logo-al-hasanah.png');
      setTeacherSignature(prof.teacher_signature || '');
      if (prof.teacher_signature) {
        setHasDrawnSignature(true);
      }
    } else {
      setFullName(teacherName || '');
      setSchoolName('SMA Al-Hasanah');
      setSchoolCode('SABK');
      setSchoolLogo('/logo-al-hasanah.png');
    }
  }, [initialProfile, userProfile, teacherName, isOpen]);

  // Muat gambar tandatangan ke kanvas jika ada
  useEffect(() => {
    if (step === 3 && canvasRef.current && teacherSignature) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = teacherSignature;
      }
    }
  }, [step, teacherSignature]);

  if (!isOpen) return null;

  // Pengendalian Muat Naik Fail Logo Sekolah (PNG/JPG/WEBP)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Saiz fail melebihi 2MB. Sila pilih gambar yang lebih kecil.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSchoolLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Pengendalian Canvas Signature Pad
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawnSignature(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setTeacherSignature(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setTeacherSignature('');
    setHasDrawnSignature(false);
  };

  // Simpan Maklumat Lengkap Profil Guru
  const handleSaveProfile = async () => {
    if (!schoolName.trim()) {
      alert('Sila masukkan Nama Sekolah anda.');
      setStep(2);
      return;
    }

    setIsSaving(true);
    const success = await updateUserProfile({
      full_name: fullName.trim() || teacherName,
      ic_number: icNumber.trim(),
      phone_number: phoneNumber.trim(),
      school_name: schoolName.trim().toUpperCase(),
      school_code: schoolCode.trim().toUpperCase(),
      district: district.trim(),
      state: stateName,
      position: position.trim(),
      school_logo: schoolLogo,
      teacher_signature: teacherSignature,
      is_onboarding_completed: true
    });

    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } else {
      alert('Gagal menyimpan profil. Sila cuba lagi.');
    }
  };

  const negeriList = [
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
    'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah',
    'Sarawak', 'Selangor', 'Terengganu', 'W.P. Kuala Lumpur',
    'W.P. Labuan', 'W.P. Putrajaya'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <School className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {userProfile?.is_onboarding_completed ? 'Kemaskini Profil Pendidik & Sekolah' : 'Penyediaan Profil Guru (Onboarding SaaS)'}
              </h2>
              <p className="text-xs text-emerald-100">
                Langkah {step} daripada 3 &bull; Tetapan Multi-Tenant Guru Individu Seluruh Malaysia
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar 3 Langkah */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center space-x-2">
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                1
              </span>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">Maklumat Guru</span>
            </div>
            <div className={`flex-1 h-0.5 mx-3 ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <div className="flex items-center space-x-2">
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                2
              </span>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">Sekolah &amp; PPD</span>
            </div>
            <div className={`flex-1 h-0.5 mx-3 ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <div className="flex items-center space-x-2">
              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                3
              </span>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">Logo &amp; Tandatangan</span>
            </div>
          </div>
        </div>

        {/* Kandungan Langkah (Boleh Skrol) */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* LANGKAH 1: MAKLUMAT GURU */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 leading-relaxed flex items-start space-x-3">
                <User className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Selamat datang ke e-RPH Pintar SaaS!</span>
                  <p className="mt-0.5 text-emerald-800">
                    Sistem ini direka khas untuk guru individu di seluruh Malaysia. Maklumat peribadi anda akan dipaparkan secara rasmi pada setiap dokumen cetakan PDF dan rekod penyeliaan.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Penuh Pendidik <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: USTAZ AHMAD BIN ABDULLAH"
                  className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <IdCard className="w-3.5 h-3.5 text-slate-500" />
                    <span>No. Kad Pengenalan / Fail Perkhidmatan</span>
                  </label>
                  <input
                    type="text"
                    value={icNumber}
                    onChange={(e) => setIcNumber(e.target.value)}
                    placeholder="Contoh: 880512-06-5431"
                    className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>No. Telefon (WhatsApp)</span>
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Contoh: 019-1234567"
                    className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  <span>Jawatan / Gred Perkhidmatan</span>
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Contoh: Guru Akademik / Guru Kanan Mata Pelajaran / GPK"
                  className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* LANGKAH 2: INSTITUSI & SEKOLAH */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 leading-relaxed flex items-start space-x-3">
                <Building className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Institusi &amp; Kawasan Persekolahan</span>
                  <p className="mt-0.5 text-blue-800">
                    Tiada sebarang penetapan sekolah hardcoded. Anda bebas memasukkan nama mana-mana sekolah rendah, menengah, SABK, SBP, atau MRSM tempat anda berkhidmat.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Rasmi Sekolah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Contoh: SEKOLAH MENENGAH KEBANGSAAN DATO MAHMUD MAT"
                  className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl font-extrabold text-slate-900 focus:ring-2 focus:ring-emerald-500 uppercase"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Nama ini akan dicetak pada kepala surat (letterhead) setiap e-RPH dan fail PDF rasmi.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kod Sekolah (KPM)
                  </label>
                  <input
                    type="text"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    placeholder="Contoh: CRA0001"
                    className="w-full text-xs sm:text-sm p-2.5 bg-white border border-slate-300 rounded-xl font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>Daerah (PPD)</span>
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Contoh: Pekan / Kuantan"
                    className="w-full text-xs sm:text-sm p-2.5 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Negeri (JPN)
                  </label>
                  <select
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full text-xs sm:text-sm p-2.5 bg-white border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {negeriList.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* LANGKAH 3: LOGO SEKOLAH & TANDATANGAN DIGITAL GURU */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in">
              {/* Muat Naik Logo Sekolah */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span>Logo Sekolah Anda (Untuk Kepala Surat &amp; PDF)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Format PNG telus disyorkan. Logo akan dipaparkan di bahagian atas PDF e-RPH anda.
                    </p>
                  </div>
                  {schoolLogo && (
                    <button
                      type="button"
                      onClick={() => setSchoolLogo('')}
                      className="text-[11px] text-rose-600 font-bold hover:underline"
                    >
                      Padam Logo
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center p-2 shadow-xs flex-shrink-0 overflow-hidden">
                    {schoolLogo ? (
                      <img src={schoolLogo} alt="Pratonton Logo" className="w-full h-full object-contain" />
                    ) : (
                      <School className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      id="school-logo-file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="school-logo-file"
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{schoolLogo ? 'Tukar Logo' : 'Muat Naik Logo Sekolah'}</span>
                    </label>
                    <p className="text-[10px] text-slate-400">
                      * Jika tiada logo dimuat naik, sistem akan menggunakan logo rasmi default KPM.
                    </p>
                  </div>
                </div>
              </div>

              {/* Canvas Pad Tandatangan Digital Guru */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <PenTool className="w-4 h-4 text-emerald-600" />
                      <span>Tandatangan Digital Guru (Digital Signature)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tandatangan terus menggunakan jari, tetikus, atau stylus pada petak di bawah.
                    </p>
                  </div>
                  {hasDrawnSignature && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[11px] text-rose-600 font-bold hover:underline flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Padam Semula</span>
                    </button>
                  )}
                </div>

                <div className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-xs relative">
                  <canvas
                    ref={canvasRef}
                    width={550}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-32 touch-none cursor-crosshair bg-white"
                  />
                  {!hasDrawnSignature && !teacherSignature && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-xs font-medium">
                      Turunkan tandatangan anda di sini...
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Tandatangan ini akan diletakkan di kotak pengesahan &quot;Disediakan Oleh&quot; pada setiap cetakan e-RPH rasmi.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Notis Berjaya */}
        {saveSuccess && (
          <div className="px-6 py-2.5 bg-emerald-100 border-t border-emerald-300 text-emerald-900 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Profil pendidik dan sekolah anda berjaya dikemaskini!</span>
          </div>
        )}

        {/* Footer Navigasi Langkah */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={isSaving}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !fullName.trim()) {
                    alert('Sila masukkan Nama Penuh Pendidik.');
                    return;
                  }
                  if (step === 2 && !schoolName.trim()) {
                    alert('Sila masukkan Nama Sekolah anda.');
                    return;
                  }
                  setStep(step + 1);
                }}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all"
              >
                <span>Seterusnya</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center space-x-2 transition-all hover:scale-105"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>{isSaving ? 'Menyimpan Profil...' : 'Simpan Profil & Mula Mengajar'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
