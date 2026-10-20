import csv
import json
import sys

with open('data-rujukan/dskp_master.csv', 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.reader(f)
    header = next(reader)
    arabic_subjects = {}
    for idx, row in enumerate(reader):
        if not row or not row[0].strip() or row[0].strip() == '.':
            continue
        subj = row[0].strip()
        is_ar = any(0x0600 <= ord(c) <= 0x06FF for c in subj) or 'ARAB' in subj.upper()
        if is_ar:
            if subj not in arabic_subjects:
                arabic_subjects[subj] = {'count': 0, 'forms': set()}
            arabic_subjects[subj]['count'] += 1
            ting = row[1].strip() if len(row) > 1 else ''
            arabic_subjects[subj]['forms'].add(ting)

results = []
for s, info in sorted(arabic_subjects.items()):
    results.append({
        'subjek': s,
        'count': info['count'],
        'forms': sorted(list(info['forms']))
    })

with open('scratch/arabic_summary.json', 'w', encoding='utf-8') as out:
    json.dump(results, out, ensure_ascii=False, indent=2)

print(f"Total Arabic subjects found: {len(results)}")
for r in results:
    print(f"- {r['subjek']}: {r['count']} rows, forms: {r['forms']}")
