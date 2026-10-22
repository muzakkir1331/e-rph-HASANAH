import csv
import sys

def main():
    with open('data-rujukan/dskp_master.csv', mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = [r for r in reader if 'مناهج' in r.get('SUBJEK', '')]
        
    with open('scratch/manahij_analysis.txt', mode='w', encoding='utf-8') as out:
        out.write(f"Total rows: {len(rows)}\n\n")
        for t in ['4', '5']:
            out.write(f"{'='*30} TINGKATAN {t} {'='*30}\n")
            t_rows = [r for r in rows if r.get('TINGKATAN', '').strip() == t]
            seen_sk = {}
            for r in t_rows:
                tema = r.get('TEMA/BIDANG/TERAS', '').strip()
                tajuk = r.get('TAJUK/KEMAHIRAN/NILAITERAS', '').strip()
                sk = r.get('SK', '').strip()
                sp = r.get('SP', '').strip()
                if sk not in seen_sk:
                    seen_sk[sk] = {'tema': tema, 'tajuk': tajuk, 'sps': []}
                seen_sk[sk]['sps'].append(sp)
            
            for i, (sk, data) in enumerate(seen_sk.items(), 1):
                out.write(f"{i}. TEMA: '{data['tema']}' | TAJUK: '{data['tajuk']}'\n")
                out.write(f"   SK: {sk}\n")
                out.write(f"   SP count: {len(data['sps'])}\n")
                for sp in data['sps']:
                    out.write(f"     - {sp}\n")
                out.write("\n")
                
    print("Done writing to scratch/manahij_analysis.txt")

if __name__ == '__main__':
    main()
