import { RPTItem } from '@/types/erph';

export interface ParseSheetResult {
  success: boolean;
  spreadsheetId?: string;
  sheetName?: string;
  items: RPTItem[];
  error?: string;
}

/**
 * Mengekstrak ID Spreadsheet dan GID daripada pautan Google Sheet.
 */
export function extractSpreadsheetInfo(url: string) {
  try {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const spreadsheetId = match ? match[1] : null;

    const gidMatch = url.match(/[#&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

    return { spreadsheetId, gid };
  } catch (err) {
    return { spreadsheetId: null, gid: '0' };
  }
}

/**
 * Membaca data RPT daripada Google Sheets menggunakan Google Visualization Query / CSV Export.
 * Membolehkan guru menyambung Google Sheet (ditetapkan kepada "Anyone with link can view") tanpa setup API rumit.
 */
export async function fetchRPTFromGoogleSheet(url: string, sheetName = 'Sheet1', targetWeek?: number): Promise<ParseSheetResult> {
  const { spreadsheetId } = extractSpreadsheetInfo(url);

  if (!spreadsheetId) {
    return {
      success: false,
      items: [],
      error: 'URL Google Sheet tidak sah. Sila pastikan format URL mengandungi /d/{SPREADSHEET_ID}/'
    };
  }

  try {
    // Kaedah 1: Gviz TQ JSON
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(gvizUrl, { next: { revalidate: 300 } });

    if (!response.ok) {
      // Fallback ke CSV export jika gviz tidak aktif
      return await fetchViaCSVExport(spreadsheetId, sheetName, targetWeek);
    }

    const text = await response.text();
    // Format gviz JSON mengandungi wrapper: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
    const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);/);
    if (!jsonMatch || !jsonMatch[1]) {
      return await fetchViaCSVExport(spreadsheetId, sheetName, targetWeek);
    }

    const data = JSON.parse(jsonMatch[1]);
    const table = data.table;

    if (!table || !table.cols || !table.rows) {
      return { success: false, items: [], error: 'Format lembaran kerja tidak dapat dibaca.' };
    }

    // Cari indeks lajur
    const headers = table.cols.map((c: any) => (c.label || c.id || '').toLowerCase());
    
    // Cari baris pertama jika label kosong dalam cols
    let mingguIdx = headers.findIndex((h: string) => h.includes('minggu') || h === 'm' || h.includes('week'));
    let skIdx = headers.findIndex((h: string) => h.includes('kandungan') || h === 'sk');
    let spIdx = headers.findIndex((h: string) => h.includes('pembelajaran') || h === 'sp');
    let aktIdx = headers.findIndex((h: string) => h.includes('aktiviti') || h.includes('cadangan'));
    let tarikhIdx = headers.findIndex((h: string) => h.includes('tarikh') || h.includes('date'));

    // Jika cols tiada label, periksa baris 0
    let startRow = 0;
    if (mingguIdx === -1 && table.rows.length > 0) {
      const firstRowCols = (table.rows[0].c || []).map((c: any) => (c?.v?.toString() || '').toLowerCase());
      mingguIdx = firstRowCols.findIndex((h: string) => h.includes('minggu') || h === 'm' || h.includes('week'));
      skIdx = firstRowCols.findIndex((h: string) => h.includes('kandungan') || h === 'sk');
      spIdx = firstRowCols.findIndex((h: string) => h.includes('pembelajaran') || h === 'sp');
      aktIdx = firstRowCols.findIndex((h: string) => h.includes('aktiviti') || h.includes('cadangan'));
      tarikhIdx = firstRowCols.findIndex((h: string) => h.includes('tarikh') || h.includes('date'));
      startRow = 1;
    }

    // Default andaian jika lajur tidak dijumpai: Lajur 0: Minggu, 1: Tarikh, 2: SK, 3: SP, 4: Aktiviti
    if (mingguIdx === -1) mingguIdx = 0;
    if (skIdx === -1) skIdx = 2;
    if (spIdx === -1) spIdx = 3;
    if (aktIdx === -1) aktIdx = 4;

    const items: RPTItem[] = [];

    for (let r = startRow; r < table.rows.length; r++) {
      const row = table.rows[r].c || [];
      const getVal = (idx: number) => {
        if (idx >= 0 && row[idx]) {
          return (row[idx].f || row[idx].v?.toString() || '').trim();
        }
        return '';
      };

      const rawMinggu = getVal(mingguIdx);
      const parsedMinggu = parseInt(rawMinggu.replace(/[^0-9]/g, ''), 10);

      if (!isNaN(parsedMinggu)) {
        const item: RPTItem = {
          minggu: parsedMinggu,
          tarikh: tarikhIdx >= 0 ? getVal(tarikhIdx) : '',
          sk: getVal(skIdx),
          sp: getVal(spIdx),
          cadangan_aktiviti: getVal(aktIdx),
          catatan: ''
        };

        if (targetWeek !== undefined) {
          if (parsedMinggu === targetWeek) {
            items.push(item);
          }
        } else {
          items.push(item);
        }
      }
    }

    return {
      success: true,
      spreadsheetId,
      sheetName,
      items
    };

  } catch (err: any) {
    return {
      success: false,
      items: [],
      error: `Ralat semasa mengambil data Google Sheet: ${err.message}`
    };
  }
}

/**
 * Fallback: Muat turun melalui export CSV awam
 */
async function fetchViaCSVExport(spreadsheetId: string, sheetName: string, targetWeek?: number): Promise<ParseSheetResult> {
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(csvUrl);
    if (!res.ok) {
      throw new Error(`Google Sheet mengembalikan status HTTP ${res.status}. Pastikan dokumen dikongsi secara awam.`);
    }

    const csvText = await res.text();
    const rows = csvText.split('\n').map(r => r.split(',').map(c => c.replace(/^["']|["']$/g, '').trim()));
    
    if (rows.length < 2) {
      return { success: false, items: [], error: 'Dokumen Google Sheet kosong.' };
    }

    const header = rows[0].map(h => h.toLowerCase());
    let mingguIdx = header.findIndex(h => h.includes('minggu') || h === 'm' || h.includes('week'));
    let skIdx = header.findIndex(h => h.includes('kandungan') || h === 'sk');
    let spIdx = header.findIndex(h => h.includes('pembelajaran') || h === 'sp');
    let aktIdx = header.findIndex(h => h.includes('aktiviti') || h.includes('cadangan'));

    if (mingguIdx === -1) mingguIdx = 0;
    if (skIdx === -1) skIdx = 2;
    if (spIdx === -1) spIdx = 3;
    if (aktIdx === -1) aktIdx = 4;

    const items: RPTItem[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length <= mingguIdx) continue;
      const parsedMinggu = parseInt(row[mingguIdx].replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedMinggu)) {
        const item: RPTItem = {
          minggu: parsedMinggu,
          sk: row[skIdx] || '',
          sp: row[spIdx] || '',
          cadangan_aktiviti: row[aktIdx] || ''
        };
        if (targetWeek !== undefined) {
          if (parsedMinggu === targetWeek) items.push(item);
        } else {
          items.push(item);
        }
      }
    }

    return {
      success: true,
      spreadsheetId,
      sheetName,
      items
    };
  } catch (err: any) {
    return {
      success: false,
      items: [],
      error: err.message
    };
  }
}
