import json
import csv
import re
from collections import defaultdict

# Read all subjects in dskp_master.csv
dskp_subjects = set()
with open('data-rujukan/dskp_master.csv', 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.reader(f)
    next(reader)
    for r in reader:
        if r and r[0].strip() and r[0].strip() != '.':
            dskp_subjects.add(r[0].strip())

print(f"Total DSKP subjects in CSV: {len(dskp_subjects)}")

# Timetable subjects
with open('src/data/jadual_waktu.json', 'r', encoding='utf-8') as f:
    jadual = json.load(f)
jadual_subjects = set(j['subjek'] for j in jadual)

# RPT Catalog subjects
with open('src/data/rpt_catalog.json', 'r', encoding='utf-8') as f:
    rpt_catalog = json.load(f)
rpt_subjects = set(rpt_catalog.keys())

all_test_subjects = jadual_subjects.union(rpt_subjects)

def resolve_subject(subj, dskp_list):
    if not subj:
        return None
    s = subj.strip()
    s_upper = s.upper()
    s_lower = s.lower()
    
    # 1. Direct match
    if s in dskp_list:
        return s
    
    # 2. Case-insensitive exact match
    for d in dskp_list:
        if d.upper() == s_upper:
            return d
            
    # 3. Known mappings
    alias_map = {
        'bahasa melayu': 'BAHASA MELAYU',
        'bm': 'BAHASA MELAYU',
        'bahasa inggeris': 'ENGLISH',
        'english': 'ENGLISH',
        'bi': 'ENGLISH',
        'sains': 'SAINS',
        'matematik': 'MATEMATIK',
        'sejarah': 'SEJARAH',
        'geografi': 'GEOGRAFI',
        'pendidikan islam': 'PENDIDIKAN ISLAM',
        'pendidikan seni visual': 'PENDIDIKAN SENI VISUAL',
        'psv': 'PENDIDIKAN SENI VISUAL',
        'pendidikan jasmani dan pendidikan kesihatan': 'PENDIDIKAN JASMANI',
        'pjpk': 'PENDIDIKAN JASMANI',
        'perniagaan': 'PERNIAGAAN',
        'prinsip perakaunan': 'PRINSIP PERAKAUNAN',
        'ekonomi': 'EKONOMI',
        'fizik': 'FIZIK',
        'kimia': 'KIMIA',
        'biologi': 'BIOLOGI',
        'reka bentuk dan teknologi': 'REKA BENTUK DAN TEKNOLOGI',
        'rbt': 'REKA BENTUK DAN TEKNOLOGI',
        'asas sains komputer': 'ASK',
        'sains komputer': 'SAINS KOMPUTER',
        'bahasa arab': 'اللغة العربية',
        'al-lughah al-arabiah': 'اللغة العربية',
        'lam': 'اللغة العربية المعاصرة',
        'al lughah al arabiah al muasirah': 'اللغة العربية المعاصرة',
        'usuluddin': 'أصول الدين',
        'syariah': 'الشريعة اسلامية',
        'adab wa al balaghah': 'الأدب و البلاغة',
        'manahij': 'مناهج العلوم الإسلامية',
        'maharat al-quran': 'مهارات القرءان',
        'hifz al-quran': 'حفظ القرأن',
        'kkq': 'كماهيرن ممباچ دان مڠحفظ القرءان(KKQ)',
        'tasmi': 'تسميع'
    }
    
    if s_lower in alias_map and alias_map[s_lower] in dskp_list:
        return alias_map[s_lower]
        
    for k, v in alias_map.items():
        if k in s_lower and v in dskp_list:
            return v
            
    # 4. Partial substring match
    for d in dskp_list:
        if s_upper in d.upper() or d.upper() in s_upper:
            return d
            
    return None

print("\nTesting Subject Resolution:")
for subj in sorted(all_test_subjects):
    matched = resolve_subject(subj, dskp_subjects)
    print(f"  '{subj}' -> '{matched}'")
