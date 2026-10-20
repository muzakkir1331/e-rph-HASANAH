import os
import glob
import csv
import json
import re

# Ensure target directories exist
os.makedirs('src/data', exist_ok=True)

def parse_date_range(d_str):
    parts = re.split(r'[\u2013\u2014\-]', d_str)
    if len(parts) >= 2:
        s1 = parts[0].strip()
        s2 = parts[1].strip()
        def to_iso(s):
            try:
                s = s.replace('/', '.')
                p = s.split('.')
                if len(p) == 3:
                    return f"{p[2]}-{p[1].zfill(2)}-{p[0].zfill(2)}"
            except:
                pass
            return s
        return to_iso(s1), to_iso(s2)
    return d_str, d_str

def get_penggal(week_num, is_cuti, week_label):
    if is_cuti:
        if 'PENGGAL 1' in week_label:
            return 'Cuti Penggal 1'
        elif 'PERTENGAHAN' in week_label:
            return 'Cuti Pertengahan Tahun'
        elif 'PENGGAL 2' in week_label:
            return 'Cuti Penggal 2'
        elif 'AKHIR' in week_label:
            return 'Cuti Akhir Persekolahan'
        return 'Cuti Persekolahan'
    
    if week_num <= 9:
        return 'Penggal 1'
    elif week_num <= 19:
        return 'Penggal 2 (Fasa 1)'
    elif week_num <= 31:
        return 'Penggal 2 (Fasa 2)'
    else:
        return 'Penggal 3'

def sync_takwim_and_rpt():
    rpt_files = sorted(glob.glob('rpt/*.csv'))
    if not rpt_files:
        print("[ERROR] No files found in rpt/")
        return

    # Extract unified Takwim from reference file (e.g. rpt_sains.csv or first file)
    takwim_list = []
    seen_weeks = set()
    ref_file = 'rpt/rpt_sains.csv' if os.path.exists('rpt/rpt_sains.csv') else rpt_files[0]

    with open(ref_file, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)
        header = next(reader)
        for r in reader:
            if len(r) >= 4 and r[1].strip() in ['Tingkatan 1', 'Tingkatan 4']:
                w_raw = r[2].strip()
                t_raw = r[3].strip()
                if w_raw and w_raw not in seen_weeks:
                    seen_weeks.add(w_raw)
                    
                    is_cuti = 'CUTI' in w_raw.upper()
                    m_num = None
                    if not is_cuti:
                        m_match = re.search(r'\d+', w_raw)
                        if m_match:
                            m_num = int(m_match.group(0))
                    
                    start_iso, end_iso = parse_date_range(t_raw)
                    label = f"Minggu {m_num}" if m_num else w_raw
                    penggal = get_penggal(m_num if m_num else 0, is_cuti, w_raw)

                    takwim_list.append({
                        "tahun_akademik": 2026, # or 2027 as defined in RPT
                        "kumpulan": "B",
                        "minggu_ke": m_num,
                        "kod_minggu": w_raw,
                        "label_minggu": label,
                        "tarikh_teks": t_raw,
                        "tarikh_mula": start_iso,
                        "tarikh_tamat": end_iso,
                        "adalah_cuti": is_cuti,
                        "catatan_cuti": f"Takwim KPM: {w_raw} ({t_raw})" if is_cuti else None,
                        "penggal": penggal
                    })

    # Save takwim_2026.json
    with open('src/data/takwim_2026.json', 'w', encoding='utf-8') as out:
        json.dump(takwim_list, out, ensure_ascii=False, indent=2)
    print(f"[OK] takwim_2026.json synchronized with {len(takwim_list)} weeks/holidays from RPT.")

    # Save to data-rujukan/takwim_2026.csv as well
    with open('data-rujukan/takwim_2026.csv', 'w', encoding='utf-8', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['Minggu', 'Kumpulan B', 'Tarikh Mula', 'Tarikh Tamat', 'Status'])
        for item in takwim_list:
            writer.writerow([
                item['kod_minggu'],
                item['tarikh_teks'],
                item['tarikh_mula'],
                item['tarikh_tamat'],
                'CUTI' if item['adalah_cuti'] else 'PERSEKOLAHAN'
            ])
    print("[OK] data-rujukan/takwim_2026.csv updated.")

    # 2. Parse all RPT records from all 12 CSV files
    all_rpt = []
    catalog = {}

    for filepath in rpt_files:
        fname = os.path.basename(filepath)
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.reader(f)
            header = next(reader)
            file_rows = 0
            for r in reader:
                if len(r) >= 7:
                    subjek = r[0].strip()
                    tingkatan_raw = r[1].strip()
                    minggu_raw = r[2].strip()
                    tarikh_raw = r[3].strip()
                    tema = r[4].strip() if len(r) > 4 else ''
                    sk = r[5].strip() if len(r) > 5 else ''
                    sp = r[6].strip() if len(r) > 6 else ''
                    tp = r[7].strip() if len(r) > 7 else ''
                    catatan = r[8].strip() if len(r) > 8 else ''

                    ting_num = tingkatan_raw.replace('Tingkatan', '').strip()
                    is_cuti = 'CUTI' in minggu_raw.upper()
                    m_num = None
                    if not is_cuti:
                        m_match = re.search(r'\d+', minggu_raw)
                        if m_match:
                            m_num = int(m_match.group(0))

                    start_iso, end_iso = parse_date_range(tarikh_raw)

                    # Build catalog
                    if subjek not in catalog:
                        catalog[subjek] = {
                            "subjek": subjek,
                            "tingkatan_list": [],
                            "total_weeks": 0
                        }
                    if ting_num not in catalog[subjek]["tingkatan_list"]:
                        catalog[subjek]["tingkatan_list"].append(ting_num)

                    all_rpt.append({
                        "id": f"{fname.replace('.csv','')}_{ting_num}_{minggu_raw}".lower(),
                        "fail_asal": fname,
                        "subjek": subjek,
                        "tingkatan": ting_num,
                        "tingkatan_label": tingkatan_raw,
                        "minggu_ke": m_num,
                        "kod_minggu": minggu_raw,
                        "label_minggu": f"Minggu {m_num}" if m_num else minggu_raw,
                        "tarikh_teks": tarikh_raw,
                        "tarikh_mula": start_iso,
                        "tarikh_tamat": end_iso,
                        "adalah_cuti": is_cuti,
                        "tema": tema,
                        "sk": sk,
                        "sp": sp,
                        "standard_prestasi": tp,
                        "catatan": catatan
                    })
                    file_rows += 1
            print(f"  - {fname}: {file_rows} rekod diproses.")

    # Map Arabic & RPT aliases mengikut ketetapan fail rpt
    subject_aliases = [
        ('أصول الدين', 'rpt_usulaldin', 'Usuluddin', 'rpt_usulaldin.csv'),
        ('اللغة العربية المعاصرة', 'rpt_lam', 'Al Lughah Al Arabiah Al Muasirah', 'rpt_lam.csv'),
        ('الشريعة اسلامية', 'rpt_syariah', 'Syariah', 'rpt_syariah.csv'),
        ('الأدب والبلاغة', 'rpt_adab', 'Adab Wa Al Balaghah', 'rpt_adab.csv'),
        ('مناهج العلوم إسلامية', 'rpt_manahij', 'Manahij Al Ulum Al Islamiah', 'rpt_manahij.csv')
    ]
    for ar_name, code_name, base_name, fname in subject_aliases:
        if base_name in catalog:
            t_list = catalog[base_name]["tingkatan_list"]
            catalog[ar_name] = {
                "subjek": ar_name,
                "fail_rpt": fname,
                "tingkatan_list": t_list,
                "total_weeks": 48
            }
            catalog[code_name] = {
                "subjek": ar_name,
                "fail_rpt": fname,
                "tingkatan_list": t_list,
                "total_weeks": 48
            }

    with open('src/data/rpt_database.json', 'w', encoding='utf-8') as out:
        json.dump(all_rpt, out, ensure_ascii=False, indent=2)
    print(f"[OK] src/data/rpt_database.json created with {len(all_rpt)} total RPT entries.")

    with open('src/data/rpt_catalog.json', 'w', encoding='utf-8') as out:
        json.dump(catalog, out, ensure_ascii=False, indent=2)
    print(f"[OK] src/data/rpt_catalog.json created with {len(catalog)} subjects.")

if __name__ == '__main__':
    sync_takwim_and_rpt()
