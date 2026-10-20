import csv
import json
import os
import re

os.makedirs('src/data', exist_ok=True)

# 1. Read dskp_master.csv
print("Processing data-rujukan/dskp_master.csv...")

catalog = {}
dskp_records = []

# Map of Arabic canonical names and aliases
ARABIC_CANONICAL_MAP = {
    'bahasa arab': 'اللغة العربية',
    'al-lughah al-arabiah': 'اللغة العربية',
    'al lughah al arabiah': 'اللغة العربية',
    'lughah arabiah': 'اللغة العربية',
    'lam': 'اللغة العربية المعاصرة',
    'al lughah al arabiah al muasirah': 'اللغة العربية المعاصرة',
    'al-lughah al-arabiah al-muasirah': 'اللغة العربية المعاصرة',
    'lughah muasirah': 'اللغة العربية المعاصرة',
    'usuluddin': 'أصول الدين',
    'usul al-din': 'أصول الدين',
    'usul ad-din': 'أصول الدين',
    'syariah': 'الشريعة اسلامية',
    'al-syariah': 'الشريعة اسلامية',
    'syariah islamiah': 'الشريعة اسلامية',
    'adab wa al balaghah': 'الأدب و البلاغة',
    'adab wal balaghah': 'الأدب و البلاغة',
    'al-adab wa al-balaghah': 'الأدب و البلاغة',
    'manahij': 'مناهج العلوم الإسلامية',
    'manahij al-ulum al-islamiyyah': 'مناهج العلوم الإسلامية',
    'maharat al-quran': 'مهارات القرءان',
    'hifz al-quran': 'حفظ القرأن',
    'kkq': 'كماهيرن ممباچ دان مڠحفظ القرءان(KKQ)',
    'tasmi': 'تسميع',
    'tasmi\'': 'تسميع',
    'al-quran': 'القرءان',
    'quran': 'القرءان'
}

arabic_subjects_set = set([
    'اللغة العربية',
    'اللغة العربية المعاصرة',
    'أصول الدين',
    'الشريعة اسلامية',
    'الأدب و البلاغة',
    'مناهج العلوم الإسلامية',
    'القرءان',
    'حفظ القرأن',
    'مهارات القرءان',
    'كماهيرن ممباچ دان مڠحفظ القرءان(KKQ)',
    'تسميع',
    'الأدب والنصوص',
    'النحو والصرف',
    'التفسير وعلومه',
    'التوحيد والمنطق',
    'الحديث',
    'الحديث و المصطلح (الشهادة الدينية العالية الماليزية)',
    'البلاغة (الشهادة الدينية العالية الماليزية)',
    'العروض والقافية',
    'العروض والقافية للشهادة الدينية العالية الماليزية',
    'الفقه (للشهادة الدينية العالية الماليزية)',
    'الإنشاء الأزهري',
    'المطالعة الأزهرية',
    'اللغة العربية 913',
    '٢ التجويد',
    'حفظ القرآن والتجويد',
    'تراث الدراسات الاسلامية (ULYA)',
    'تراث القرأن والسنة (ULYA)',
    'تراث اللغة العربية (ULYA)',
    'المواد الدينية (الإعدادية)',
    'الأدب والنصوص (للشهادة الدينية العالية الماليزية)',
    'النحو والصرف (للشهادة الدينية العالية الماليزية)'
])

non_arabic_core_subjects = set([
    'ENGLISH',
    'BAHASA MELAYU',
    'SAINS',
    'MATEMATIK',
    'GEOGRAFI',
    'PENDIDIKAN SENI VISUAL',
    'PERNIAGAAN',
    'PENDIDIKAN JASMANI',
    'PENDIDIKAN KESIHATAN'
])

record_id = 1
with open('data-rujukan/dskp_master.csv', 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.reader(f)
    header = next(reader)
    for row in reader:
        if not row or not row[0].strip() or row[0].strip() == '.':
            continue
        subj = row[0].strip()
        ting = row[1].strip() if len(row) > 1 else "1"

        if subj not in catalog:
            catalog[subj] = []
        if ting and ting not in catalog[subj]:
            catalog[subj].append(ting)

        # Include all rows for Arabic subjects
        is_arabic = (subj in arabic_subjects_set) or any(0x0600 <= ord(c) <= 0x06FF for c in subj)
        is_core = any(subj.upper().startswith(c) for c in non_arabic_core_subjects)

        # If it's an Arabic subject or core subject sample
        if is_arabic or (is_core and record_id < 12000):
            # Extract fields accurately
            tema = row[2].strip() if len(row) > 2 and row[2].strip() else (row[3].strip() if len(row) > 3 else "")
            tajuk = row[4].strip() if len(row) > 4 and row[4].strip() else (row[5].strip() if len(row) > 5 else "")
            sk = row[6].strip() if len(row) > 6 else ""
            sp = row[7].strip() if len(row) > 7 else ""
            obj = row[10].strip() if len(row) > 10 and row[10].strip() else ""
            xtvt = row[15].strip() if len(row) > 15 and row[15].strip() else ""

            # Only add if it has SK or SP or Tajuk
            if sk or sp or tajuk:
                dskp_records.append({
                    "id": record_id,
                    "subjek": subj,
                    "tingkatan": ting,
                    "tema": tema,
                    "tajuk": tajuk,
                    "sk": sk,
                    "sp": sp,
                    "objektif_lalai": obj or sp,
                    "aktiviti_cadangan": xtvt
                })
                record_id += 1

print(f"Total DSKP records extracted: {len(dskp_records)}")
arabic_count = sum(1 for r in dskp_records if any(0x0600 <= ord(c) <= 0x06FF for c in r['subjek']))
print(f"Total Arabic DSKP records: {arabic_count}")

# Save dskp_catalog.json
with open('src/data/dskp_catalog.json', 'w', encoding='utf-8') as out:
    json.dump(catalog, out, ensure_ascii=False, indent=2)

# Save dskp_sample.json
with open('src/data/dskp_sample.json', 'w', encoding='utf-8') as out:
    json.dump(dskp_records, out, ensure_ascii=False, indent=2)

# Also update rpt_catalog.json to explicitly include Bahasa Arab & Arabic subjects
with open('src/data/rpt_catalog.json', 'r', encoding='utf-8') as f:
    rpt_cat = json.load(f)

# Ensure distinct entries for Bahasa Arab and Al Lughah Al Arabiah Al Muasirah
if 'Bahasa Arab' not in rpt_cat:
    rpt_cat['Bahasa Arab'] = {
        "subjek": "Bahasa Arab",
        "tingkatan_list": ["1", "2", "3", "4", "5"],
        "total_weeks": 44
    }

if 'اللغة العربية' not in rpt_cat:
    rpt_cat['اللغة العربية'] = {
        "subjek": "اللغة العربية",
        "tingkatan_list": ["1", "2", "3", "4", "5"],
        "total_weeks": 44
    }

if 'اللغة العربية المعاصرة' not in rpt_cat:
    rpt_cat['اللغة العربية المعاصرة'] = {
        "subjek": "اللغة العربية المعاصرة",
        "tingkatan_list": ["1", "2", "3", "4", "5"],
        "total_weeks": 44
    }

if 'أصول الدين' not in rpt_cat:
    rpt_cat['أصول الدين'] = {
        "subjek": "أصول الدين",
        "tingkatan_list": ["1", "2", "3", "4", "5"],
        "total_weeks": 44
    }

if 'الشريعة اسلامية' not in rpt_cat:
    rpt_cat['الشريعة اسلامية'] = {
        "subjek": "الشريعة اسلامية",
        "tingkatan_list": ["1", "2", "3", "4", "5"],
        "total_weeks": 44
    }

if 'الأدب و البلاغة' not in rpt_cat:
    rpt_cat['الأدب و البلاغة'] = {
        "subjek": "الأدب و البلاغة",
        "tingkatan_list": ["4", "5"],
        "total_weeks": 44
    }

with open('src/data/rpt_catalog.json', 'w', encoding='utf-8') as out:
    json.dump(rpt_cat, out, ensure_ascii=False, indent=2)

print("Saved updated dskp_catalog.json, dskp_sample.json, and rpt_catalog.json successfully!")
