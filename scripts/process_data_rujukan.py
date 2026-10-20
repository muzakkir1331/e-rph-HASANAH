import csv
import json
import os
import re
from datetime import datetime

os.makedirs('src/data', exist_ok=True)
os.makedirs('supabase/seed', exist_ok=True)

# -----------------------------------------------------------------------------
# 1. Parse takwim_2026.csv
# -----------------------------------------------------------------------------
def parse_takwim():
    if os.path.exists('scripts/sync_rpt_takwim.py') and os.path.exists('rpt'):
        from sync_rpt_takwim import sync_takwim_and_rpt
        sync_takwim_and_rpt()
        return

    takwim_list = []
    with open('data-rujukan/takwim_2026.csv', 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)
        for row in reader:
            if not row or len(row) < 2:
                continue
            col0 = row[0].strip()
            col1 = row[1].strip()
            if not col0 or 'Minggu' in col0 or 'Jadual' in col0:
                continue
            
            # format date: "12/01/2026 - 16/01/2026"
            parts = col1.split('-')
            if len(parts) == 2:
                raw_start = parts[0].strip()
                raw_end = parts[1].strip()
                try:
                    d_start = datetime.strptime(raw_start, "%d/%m/%Y").strftime("%Y-%m-%d")
                except:
                    d_start = raw_start
                try:
                    d_end = datetime.strptime(raw_end, "%d/%m/%Y").strftime("%Y-%m-%d")
                except:
                    d_end = raw_end
            else:
                d_start = col1
                d_end = col1

            is_cuti = (col0 == 'CUTI')
            minggu_ke = None if is_cuti else int(col0)
            label = f"Minggu {minggu_ke}" if minggu_ke else "CUTI PERSEKOLAHAN"

            takwim_list.append({
                "tahun_akademik": 2026,
                "kumpulan": "B",
                "minggu_ke": minggu_ke,
                "label_minggu": label,
                "tarikh_mula": d_start,
                "tarikh_tamat": d_end,
                "adalah_cuti": is_cuti,
                "catatan_cuti": "Cuti Persekolahan KPM" if is_cuti else None
            })

    with open('src/data/takwim_2026.json', 'w', encoding='utf-8') as out:
        json.dump(takwim_list, out, ensure_ascii=False, indent=2)
    print(f"[OK] takwim_2026.json created with {len(takwim_list)} records.")

# -----------------------------------------------------------------------------
# 2. Parse data_konfigurasi.csv (Jadual Waktu Guru)
# -----------------------------------------------------------------------------
def parse_jadual():
    jadual_list = []
    day_map = {
        'ISNIN': (1, 'ISNIN'),
        'SELASA': (2, 'SELASA'),
        'RABU': (3, 'RABU'),
        'KHAMIS': (4, 'KHAMIS'),
        'JUMAAT': (5, 'JUMAAT')
    }

    current_day = None
    current_day_idx = None

    with open('data-rujukan/data_konfigurasi.csv', 'r', encoding='utf-8', errors='ignore') as f:
        reader = list(csv.reader(f))
        for r_idx, row in enumerate(reader):
            # check day header
            row_str = " ".join(row).upper()
            for d_name, (d_idx, d_text) in day_map.items():
                if d_name in row_str and ('BIL' in row_str or 'Site eRPHKPM' in row_str or any(d_name in c for c in row)):
                    current_day = d_text
                    current_day_idx = d_idx
                    break

            # check row slot
            if len(row) > 6 and row[1].strip().isdigit():
                slot_num = int(row[1].strip())
                kelas = row[2].strip()
                masa_mula = row[3].strip()
                masa_tamat = row[4].strip()
                subjek = row[5].strip()
                tingkatan = row[6].strip()

                if kelas and subjek and current_day:
                    jadual_list.append({
                        "tahun_akademik": 2026,
                        "hari": current_day,
                        "hari_index": current_day_idx,
                        "slot_ke": slot_num,
                        "kelas": kelas,
                        "masa_mula": masa_mula,
                        "masa_tamat": masa_tamat,
                        "subjek": subjek,
                        "tingkatan": tingkatan,
                        "bilangan_murid": 30
                    })

    with open('src/data/jadual_waktu.json', 'w', encoding='utf-8') as out:
        json.dump(jadual_list, out, ensure_ascii=False, indent=2)
    print(f"[OK] jadual_waktu.json created with {len(jadual_list)} slots.")

# -----------------------------------------------------------------------------
# 3. Parse menu_jadual.csv (61 Labels & Dropdown Options)
# -----------------------------------------------------------------------------
def parse_menu_jadual():
    with open('data-rujukan/menu_jadual.csv', 'r', encoding='utf-8', errors='ignore') as f:
        reader = list(csv.reader(f))
    
    header = reader[0]
    
    # 3.1 Extract Pedagogy Options (Cols 0 - 20)
    options = {
        "kelas": [],
        "masa": [],
        "bbm": [],
        "emk": [],
        "nilai_murni": [],
        "peta_ithink": [],
        "kecerdasan_pelbagai": [],
        "kaedah": [],
        "kbkk": [],
        "strategi": [],
        "alat_pemikiran_pak21": [],
        "pentaksiran": ["Latihan bertulis / Lembaran kerja", "Pemerhatian", "Lisan", "Amali", "Soal jawab / kuiz"]
    }

    col_target_map = {
        0: "kelas",
        1: "masa",
        3: "bbm",
        4: "emk",
        5: "nilai_murni",
        7: "peta_ithink",
        8: "kecerdasan_pelbagai",
        9: "kaedah",
        10: "kbkk",
        12: "strategi",
        15: "alat_pemikiran_pak21"
    }

    for r in range(1, len(reader)):
        row = reader[r]
        for col_idx, opt_key in col_target_map.items():
            if len(row) > col_idx:
                val = row[col_idx].strip()
                if val and val != "TIADA" and val != "-" and len(val) > 1 and not val.isdigit() and val not in options[opt_key]:
                    # avoid http links in options
                    if not val.startswith("http"):
                        options[opt_key].append(val)

    with open('src/data/pedagogi_options.json', 'w', encoding='utf-8') as out:
        json.dump(options, out, ensure_ascii=False, indent=2)
    print(f"[OK] pedagogi_options.json created.")

    # 3.2 Extract 61 Labels per Subject (Cols 27 - 88)
    label_cols = []
    for c in range(27, len(header)):
        cname = header[c].strip()
        if cname:
            label_cols.append((c, cname))

    # Clean canonical keys for 61 labels
    def clean_key(name):
        k = re.sub(r'[^a-zA-Z0-9]+', '_', name.lower()).strip('_')
        return k[:40]

    subject_dictionary = {}
    for r in range(2, len(reader)):
        row = reader[r]
        if len(row) <= 28:
            continue
        subj_name = row[28].strip()
        if not subj_name or subj_name == "SUBJEK" or subj_name.isdigit():
            continue

        # Detect language and direction
        has_arabic = bool(re.search(r'[\u0600-\u06FF]', subj_name))
        is_english = 'ENGLISH' in subj_name.upper() or 'DLP' in subj_name.upper()
        is_chinese = 'CINA' in subj_name.upper() or bool(re.search(r'[\u4e00-\u9fff]', subj_name))
        is_tamil = 'TAMIL' in subj_name.upper() or bool(re.search(r'[\u0b80-\u0bff]', subj_name))
        is_french = 'PERANCIS' in subj_name.upper()

        if has_arabic:
            lang = 'ar'
            direction = 'rtl'
            font = 'font-amiri'
        elif is_english:
            lang = 'en'
            direction = 'ltr'
            font = 'font-sans'
        elif is_chinese:
            lang = 'zh'
            direction = 'ltr'
            font = 'font-sans'
        elif is_tamil:
            lang = 'ta'
            direction = 'ltr'
            font = 'font-sans'
        elif is_french:
            lang = 'fr'
            direction = 'ltr'
            font = 'font-sans'
        else:
            lang = 'ms'
            direction = 'ltr'
            font = 'font-sans'

        # Map the 61 labels
        labels_map = {}
        for c_idx, c_header in label_cols:
            val = row[c_idx].strip() if len(row) > c_idx else ""
            labels_map[c_header] = val if val else c_header

        subject_dictionary[subj_name] = {
            "subjek_nama": subj_name,
            "kod_bahasa": lang,
            "arah_teks": direction,
            "fon_keluarga": font,
            "labels": labels_map
        }

    with open('src/data/kamus_61_labels.json', 'w', encoding='utf-8') as out:
        json.dump(subject_dictionary, out, ensure_ascii=False, indent=2)
    print(f"[OK] kamus_61_labels.json created with {len(subject_dictionary)} subjects.")

# -----------------------------------------------------------------------------
# 4. Parse dskp_master.csv (Subject/Form catalog and sample curriculum)
# -----------------------------------------------------------------------------
def parse_dskp():
    subjects_catalog = {}
    sample_records = []
    
    with open('data-rujukan/dskp_master.csv', 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)
        header = next(reader)
        for idx, row in enumerate(reader):
            if not row or not row[0].strip() or row[0].strip() == '.':
                continue
            subj = row[0].strip()
            ting = row[1].strip() if len(row) > 1 else "1"
            
            if subj not in subjects_catalog:
                subjects_catalog[subj] = []
            if ting and ting not in subjects_catalog[subj]:
                subjects_catalog[subj].append(ting)
                
            # Keep sample records for quick development preview
            # (especially for Arabic, English, Science)
            if idx < 500 or any(s in subj for s in ['اللغة العربية المعاصرة', 'ENGLISH', 'SAINS']):
                if len(sample_records) < 2500:
                    sample_records.append({
                        "id": idx + 1,
                        "subjek": subj,
                        "tingkatan": ting,
                        "tema": row[2].strip() if len(row) > 2 else "",
                        "tajuk": row[4].strip() if len(row) > 4 else "",
                        "sk": row[6].strip() if len(row) > 6 else "",
                        "sp": row[7].strip() if len(row) > 7 else "",
                        "objektif_lalai": row[10].strip() if len(row) > 10 else "",
                        "aktiviti_cadangan": row[15].strip() if len(row) > 15 else ""
                    })

    with open('src/data/dskp_catalog.json', 'w', encoding='utf-8') as out:
        json.dump(subjects_catalog, out, ensure_ascii=False, indent=2)
    with open('src/data/dskp_sample.json', 'w', encoding='utf-8') as out:
        json.dump(sample_records, out, ensure_ascii=False, indent=2)
    print(f"[OK] dskp_catalog.json created with {len(subjects_catalog)} subjects.")
    print(f"[OK] dskp_sample.json created with {len(sample_records)} curriculum sample records.")

if __name__ == '__main__':
    parse_takwim()
    parse_jadual()
    parse_menu_jadual()
    parse_dskp()
