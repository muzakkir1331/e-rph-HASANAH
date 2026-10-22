import csv
import json
import os
import re
from collections import defaultdict

def clean_text(s):
    if not s:
        return ""
    # Clean whitespace and invisible characters
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def build_database():
    # Structure:
    # {
    #   "subjects": {
    #     "SAINS": {
    #       "1": {
    #         "temas": ["Kaedah Saintifik", ...],
    #         "tajuks": ["1. Pengenalan...", ...],
    #         "tema_to_tajuk": {
    #           "Kaedah Saintifik": ["1. Pengenalan..."]
    #         }
    #       }
    #     }
    #   }
    # }
    
    # Also support alias / normalized subject lookup!
    db = {
        "metadata": {
            "source": "data-rujukan/dskp_master.csv",
            "version": "1.0",
            "generated_at": "2026-10-22"
        },
        "subjects": {}
    }
    
    # We will track for each subject, each form:
    # list of all unique temas (preserving order of appearance)
    # list of all unique tajuks (preserving order of appearance)
    # mapping of tema -> list of tajuks
    
    subj_data = defaultdict(lambda: defaultdict(lambda: {
        'temas': [],
        'tajuks': [],
        'tema_to_tajuk': defaultdict(list),
        '_tema_set': set(),
        '_tajuk_set': set(),
        '_tema_tajuk_set': defaultdict(set)
    }))
    
    total_records = 0
    with open('data-rujukan/dskp_master.csv', 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)
        header = next(reader)
        for r in reader:
            if not r or not r[0].strip() or r[0].strip() == '.':
                continue
            total_records += 1
            subj = clean_text(r[0])
            ting = clean_text(r[1]) if len(r) > 1 and r[1].strip() else "1"
            
            c2_tema = clean_text(r[2]) if len(r) > 2 else ""
            c3_tema = clean_text(r[3]) if len(r) > 3 else ""
            c4_tajuk = clean_text(r[4]) if len(r) > 4 else ""
            c5_tajuk = clean_text(r[5]) if len(r) > 5 else ""
            
            # Prefer c2, fallback to c3
            # If both exist and are different, we can treat c2 as main tema and c3 as sub-tema or combine/keep c2
            tema = c2_tema or c3_tema
            tajuk = c4_tajuk or c5_tajuk
            
            # If c3 exists and differs from c2, let's also capture if c2 is empty or if c3 is a subtheme
            # If tema is empty but tajuk exists, we keep tema as empty or "-"
            target = subj_data[subj][ting]
            
            if tema:
                if tema not in target['_tema_set']:
                    target['_tema_set'].add(tema)
                    target['temas'].append(tema)
                    
            if tajuk:
                if tajuk not in target['_tajuk_set']:
                    target['_tajuk_set'].add(tajuk)
                    target['tajuks'].append(tajuk)
                    
            if tema and tajuk:
                if tajuk not in target['_tema_tajuk_set'][tema]:
                    target['_tema_tajuk_set'][tema].add(tajuk)
                    target['tema_to_tajuk'][tema].append(tajuk)

    # Format into final serializable structure
    for subj, forms in subj_data.items():
        db['subjects'][subj] = {}
        for ting, data in forms.items():
            db['subjects'][subj][ting] = {
                'temas': data['temas'],
                'tajuks': data['tajuks'],
                'tema_to_tajuk': dict(data['tema_to_tajuk'])
            }

    print(f"Total processed rows: {total_records}")
    print(f"Total subjects: {len(db['subjects'])}")
    
    output_path = 'src/data/dskp_tema_tajuk.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
        
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Saved {output_path} ({size_mb:.2f} MB)")
    
    # Also create a minified version or check size
    min_output_path = 'src/data/dskp_tema_tajuk.min.json'
    with open(min_output_path, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, separators=(',', ':'))
    min_size_mb = os.path.getsize(min_output_path) / (1024 * 1024)
    print(f"Saved minified {min_output_path} ({min_size_mb:.2f} MB)")

if __name__ == '__main__':
    build_database()
