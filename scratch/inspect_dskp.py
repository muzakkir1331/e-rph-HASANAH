import csv
import json
from collections import defaultdict

subjects = defaultdict(lambda: defaultdict(lambda: {'temas': set(), 'tajuks': set(), 'tema_tajuk': defaultdict(set)}))

with open('data-rujukan/dskp_master.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    total_rows = 0
    for row in reader:
        if not row or not row[0].strip() or row[0].strip() == '.':
            continue
        total_rows += 1
        subj = row[0].strip()
        ting = row[1].strip() if len(row) > 1 else ''
        tema = row[2].strip() if len(row) > 2 else ''
        tema2 = row[3].strip() if len(row) > 3 else ''
        tajuk = row[4].strip() if len(row) > 4 else ''
        tajuk2 = row[5].strip() if len(row) > 5 else ''
        
        eff_tema = tema or tema2
        eff_tajuk = tajuk or tajuk2
        
        if eff_tema:
            subjects[subj][ting]['temas'].add(eff_tema)
        if eff_tajuk:
            subjects[subj][ting]['tajuks'].add(eff_tajuk)
        if eff_tema and eff_tajuk:
            subjects[subj][ting]['tema_tajuk'][eff_tema].add(eff_tajuk)

print(f"Total valid rows: {total_rows}")
print(f"Total subjects: {len(subjects)}")

# Check some subjects
with open('scratch/subjects_summary.txt', 'w', encoding='utf-8') as out:
    out.write(f"Total subjects: {len(subjects)}\n\n")
    for subj in sorted(subjects.keys()):
        forms = sorted(subjects[subj].keys())
        out.write(f"SUBJEK: {subj}\n")
        for f in forms:
            temas = sorted(list(subjects[subj][f]['temas']))
            tajuks = sorted(list(subjects[subj][f]['tajuks']))
            out.write(f"  Tingkatan {f}: {len(temas)} tema, {len(tajuks)} tajuk\n")
            if temas:
                out.write(f"    Contoh Tema: {temas[:3]}\n")
            if tajuks:
                out.write(f"    Contoh Tajuk: {tajuks[:3]}\n")
        out.write("\n")

print("Summary written to scratch/subjects_summary.txt")
