import csv
import json
import os
import re
from collections import defaultdict

def clean_text(s):
    if not s:
        return ""
    s = re.sub(r'[\r\n\t]+', ' ', s)
    s = re.sub(r'\s{2,}', ' ', s)
    return s.strip()

def build_complete_tema_tajuk_database():
    csv_path = 'data-rujukan/dskp_master.csv'
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    # Track subjects and forms
    subj_form_data = defaultdict(lambda: defaultdict(lambda: {
        'temas': [],
        'tajuks': [],
        'tema_to_tajuk': defaultdict(list),
        'tajuk_to_tema': defaultdict(list),
        '_tema_set': set(),
        '_tajuk_set': set(),
        '_tema_tajuk_set': defaultdict(set)
    }))

    all_raw_subjects = set()
    total_rows = 0

    with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if not row or not row[0].strip() or row[0].strip() == '.':
                continue
            total_rows += 1
            subj = clean_text(row[0])
            all_raw_subjects.add(subj)
            ting = clean_text(row[1]) if len(row) > 1 and row[1].strip() else "1"
            
            c2_tema = clean_text(row[2]) if len(row) > 2 else ""
            c3_tema = clean_text(row[3]) if len(row) > 3 else ""
            c4_tajuk = clean_text(row[4]) if len(row) > 4 else ""
            c5_tajuk = clean_text(row[5]) if len(row) > 5 else ""

            target = subj_form_data[subj][ting]

            # Collect tema candidates
            temas_to_add = []
            if c2_tema:
                temas_to_add.append(c2_tema)
            if c3_tema and c3_tema != c2_tema:
                temas_to_add.append(c3_tema)

            for t in temas_to_add:
                if t not in target['_tema_set']:
                    target['_tema_set'].add(t)
                    target['temas'].append(t)

            # Collect tajuk candidates
            tajuks_to_add = []
            if c4_tajuk:
                tajuks_to_add.append(c4_tajuk)
            if c5_tajuk and c5_tajuk != c4_tajuk:
                tajuks_to_add.append(c5_tajuk)

            for j in tajuks_to_add:
                if j not in target['_tajuk_set']:
                    target['_tajuk_set'].add(j)
                    target['tajuks'].append(j)

            # Associate tema -> tajuk
            primary_tema = c2_tema or c3_tema
            if primary_tema:
                for j in tajuks_to_add:
                    if j not in target['_tema_tajuk_set'][primary_tema]:
                        target['_tema_tajuk_set'][primary_tema].add(j)
                        target['tema_to_tajuk'][primary_tema].append(j)
                        if primary_tema not in target['tajuk_to_tema'][j]:
                            target['tajuk_to_tema'][j].append(primary_tema)

    # Build aliases dictionary for quick, fail-safe lookup
    alias_map = {}
    
    # 1. Exact canonical names (case variations)
    for subj in all_raw_subjects:
        alias_map[subj.lower()] = subj
        alias_map[subj.upper()] = subj
        
    # 2. Known standard curriculum aliases
    known_curriculum_aliases = {
        'bahasa melayu': 'BAHASA MELAYU',
        'bm': 'BAHASA MELAYU',
        'bahasa inggeris': 'ENGLISH',
        'english': 'ENGLISH',
        'bi': 'ENGLISH',
        'sains': 'SAINS',
        'science': 'SAINS',
        'sn': 'SAINS',
        'matematik': 'MATEMATIK',
        'mathematics': 'MATEMATIK',
        'math': 'MATEMATIK',
        'mt': 'MATEMATIK',
        'sejarah': 'SEJARAH',
        'sej': 'SEJARAH',
        'geografi': 'GEOGRAFI',
        'geo': 'GEOGRAFI',
        'pendidikan islam': 'PENDIDIKAN ISLAM',
        'pi': 'PENDIDIKAN ISLAM',
        'pendidikan seni visual': 'PENDIDIKAN SENI VISUAL',
        'psv': 'PENDIDIKAN SENI VISUAL',
        'pendidikan jasmani dan pendidikan kesihatan': 'PENDIDIKAN JASMANI',
        'pjpk': 'PENDIDIKAN JASMANI',
        'pj': 'PENDIDIKAN JASMANI',
        'pk': 'PENDIDIKAN KESIHATAN',
        'perniagaan': 'PERNIAGAAN',
        'prinsip perakaunan': 'PRINSIP PERAKAUNAN',
        'akaun': 'PRINSIP PERAKAUNAN',
        'ekonomi': 'EKONOMI',
        'fizik': 'FIZIK',
        'physics': 'FIZIK',
        'kimia': 'KIMIA',
        'chemistry': 'KIMIA',
        'biologi': 'BIOLOGI',
        'biology': 'BIOLOGI',
        'reka bentuk dan teknologi': 'REKA BENTUK DAN TEKNOLOGI',
        'rbt': 'REKA BENTUK DAN TEKNOLOGI',
        'asas sains komputer': 'ASK',
        'sains komputer': 'SAINS KOMPUTER',
        'sk': 'SAINS KOMPUTER',
        # Arabic & Dini subjects
        'bahasa arab': 'اللغة العربية',
        'al-lughah al-arabiah': 'اللغة العربية',
        'al lughah al arabiah': 'اللغة العربية',
        'lughah arabiah': 'اللغة العربية',
        'lam': 'اللغة العربية المعاصرة',
        'al-lughah al-arabiah al-muasirah': 'اللغة العربية المعاصرة',
        'al lughah al arabiah al muasirah': 'اللغة العربية المعاصرة',
        'lughah muasirah': 'اللغة العربية المعاصرة',
        'rpt_lam': 'اللغة العربية المعاصرة',
        'usuluddin': 'USULUDDIN',
        'usul al-din': 'USULUDDIN',
        'rpt_usulaldin': 'USULUDDIN',
        'syariah': 'SYARIAH',
        'rpt_syariah': 'SYARIAH',
        'al-syariah': 'SYARIAH',
        'adab wa al balaghah': 'الأدب و البلاغة',
        'adab wal balaghah': 'الأدب و البلاغة',
        'al-adab wa al-balaghah': 'الأدب و البلاغة',
        'الأدب والبلاغة': 'الأدب و البلاغة',
        'rpt_adab': 'الأدب و البلاغة',
        'manahij': 'مناهج العلوم الإسلامية',
        'manahij al-ulum al-islamiyyah': 'مناهج العلوم الإسلامية',
        'مناهج العلوم إسلامية': 'مناهج العلوم الإسلامية',
        'rpt_manahij': 'مناهج العلوم الإسلامية',
        'maharat al-quran': 'مهارات القرءان',
        'hifz al-quran': 'حفظ القرأن',
        'kkq': 'كماهيرن ممباچ دان مڠحفظ القرءan(KKQ)',
        'tasmi': 'تسميع',
        'tasmi\'': 'تسميع'
    }

    for alias, target_subj in known_curriculum_aliases.items():
        if target_subj in all_raw_subjects:
            alias_map[alias.lower()] = target_subj

    # Construct final database
    output_db = {
        "metadata": {
            "title": "Pangkalan Data Tema dan Bab DSKP KPM",
            "source": "dskp_master.csv",
            "components": ["TEMA/BIDANG/TERAS", "TAJUK/KEMAHIRAN/NILAITERAS"],
            "total_rows": total_rows,
            "total_subjects": len(subj_form_data),
            "generated_at": "2026-10-22"
        },
        "aliases": alias_map,
        "subjects": {}
    }

    for subj, forms in subj_form_data.items():
        output_db["subjects"][subj] = {
            "forms": sorted(list(forms.keys())),
            "data": {}
        }
        for ting, data in forms.items():
            output_db["subjects"][subj]["data"][ting] = {
                "temas": data['temas'],
                "tajuks": data['tajuks'],
                "tema_to_tajuk": dict(data['tema_to_tajuk'])
            }

    # Save to src/data/dskp_tema_tajuk.json
    out_file = 'src/data/dskp_tema_tajuk.json'
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(output_db, f, ensure_ascii=False, indent=2)

    size_mb = os.path.getsize(out_file) / (1024 * 1024)
    print(f"Generated {out_file} successfully! Size: {size_mb:.2f} MB")
    print(f"Subjects: {len(output_db['subjects'])}, Aliases: {len(output_db['aliases'])}")

if __name__ == '__main__':
    build_complete_tema_tajuk_database()
