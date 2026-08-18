import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../data/categories';

export interface ParsedItem {
  id: string;
  selected: boolean;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  paymentMethod: PaymentMethod;
  note: string;
  vendorOrCustomer?: string;
  referenceNumber?: string;
  confidence?: 'high' | 'medium' | 'low';
  originalRaw?: Record<string, any>;
  errors?: string[];
}

export interface ParseResult {
  items: ParsedItem[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  incomeCount: number;
  expenseCount: number;
  fileName: string;
  fileType: string;
  warnings: string[];
}

// Category keyword matchers
const CATEGORY_KEYWORDS: Record<string, { type: TransactionType; category: string }> = {
  // Income
  'กาแฟ': { type: 'income', category: 'กาแฟ & เครื่องดื่ม' },
  'เอสเพรสโซ': { type: 'income', category: 'กาแฟ & เครื่องดื่ม' },
  'ลาเต้': { type: 'income', category: 'กาแฟ & เครื่องดื่ม' },
  'คาปูชิโน': { type: 'income', category: 'กาแฟ & เครื่องดื่ม' },
  'อเมริกาโน่': { type: 'income', category: 'กาแฟ & เครื่องดื่ม' },
  'มัทฉะ': { type: 'income', category: 'กาแฟ & เครื่องดื่ม' },
  'ชาเขียว': { type: 'income', category: 'กาแฟ & เครื่องดื่ม' },
  'ชาไทย': { type: 'income', category: 'กาแฟ & เครื่องดื่ม' },
  'โกโก้': { type: 'income', category: 'กาแฟ & เครื่องดื่ม' },
  'ชามะนาว': { type: 'income', category: 'กาแฟ & เครื่องดื่ม' },
  'เครื่องดื่ม': { type: 'income', category: 'กาแฟ & เครื่องดื่ม' },
  'น้ำส้ม': { type: 'income', category: 'กาแฟ & เครื่องดื่ม' },
  'สมูทตี้': { type: 'income', category: 'กาแฟ & เครื่องดื่ม' },
  'เบเกอรี่': { type: 'income', category: 'เบเกอรี่ & ขนมหวาน' },
  'เค้ก': { type: 'income', category: 'เบเกอรี่ & ขนมหวาน' },
  'ครัวซองต์': { type: 'income', category: 'เบเกอรี่ & ขนมหวาน' },
  'คุกกี้': { type: 'income', category: 'เบเกอรี่ & ขนมหวาน' },
  'ขนมปัง': { type: 'income', category: 'เบเกอรี่ & ขนมหวาน' },
  'บราวนี่': { type: 'income', category: 'เบเกอรี่ & ขนมหวาน' },
  'โทสต์': { type: 'income', category: 'เบเกอรี่ & ขนมหวาน' },
  'อาหาร': { type: 'income', category: 'อาหาร & ของทานเล่น' },
  'สปาเก็ตตี้': { type: 'income', category: 'อาหาร & ของทานเล่น' },
  'ข้าว': { type: 'income', category: 'อาหาร & ของทานเล่น' },
  'เฟรนช์ฟราย': { type: 'income', category: 'อาหาร & ของทานเล่น' },
  'ของทานเล่น': { type: 'income', category: 'อาหาร & ของทานเล่น' },
  'เมล็ดกาแฟถุง': { type: 'income', category: 'เมล็ดกาแฟ & อุปกรณ์' },
  'ขายเมล็ด': { type: 'income', category: 'เมล็ดกาแฟ & อุปกรณ์' },
  'จัดเลี้ยง': { type: 'income', category: 'รับจัดเลี้ยง / เหมาบริการ' },
  'เหมา': { type: 'income', category: 'รับจัดเลี้ยง / เหมาบริการ' },
  'catering': { type: 'income', category: 'รับจัดเลี้ยง / เหมาบริการ' },

  // Expense
  'ซื้อเมล็ด': { type: 'expense', category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม' },
  'เมล็ดกาแฟคั่ว': { type: 'expense', category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม' },
  'นมสด': { type: 'expense', category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม' },
  'นมโอ๊ต': { type: 'expense', category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม' },
  'นมข้น': { type: 'expense', category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม' },
  'ไซรัป': { type: 'expense', category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม' },
  'น้ำแข็ง': { type: 'expense', category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม' },
  'วิปครีม': { type: 'expense', category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม' },
  'ผงมัทฉะ': { type: 'expense', category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม' },
  'ผงโกโก้': { type: 'expense', category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม' },
  'ใบชา': { type: 'expense', category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม' },
  'เนย': { type: 'expense', category: 'วัตถุดิบเบเกอรี่ & อาหาร' },
  'แป้ง': { type: 'expense', category: 'วัตถุดิบเบเกอรี่ & อาหาร' },
  'ไข่': { type: 'expense', category: 'วัตถุดิบเบเกอรี่ & อาหาร' },
  'น้ำตาล': { type: 'expense', category: 'วัตถุดิบเบเกอรี่ & อาหาร' },
  'ชีส': { type: 'expense', category: 'วัตถุดิบเบเกอรี่ & อาหาร' },
  'แก้ว': { type: 'expense', category: 'แก้ว หลอด & บรรจุภัณฑ์' },
  'หลอด': { type: 'expense', category: 'แก้ว หลอด & บรรจุภัณฑ์' },
  'ฝาแก้ว': { type: 'expense', category: 'แก้ว หลอด & บรรจุภัณฑ์' },
  'ถุง': { type: 'expense', category: 'แก้ว หลอด & บรรจุภัณฑ์' },
  'กล่อง': { type: 'expense', category: 'แก้ว หลอด & บรรจุภัณฑ์' },
  'ทิชชู่': { type: 'expense', category: 'แก้ว หลอด & บรรจุภัณฑ์' },
  'ค่าไฟ': { type: 'expense', category: 'ค่าน้ำ ค่าไฟ & อินเทอร์เน็ต' },
  'ค่าน้ำ': { type: 'expense', category: 'ค่าน้ำ ค่าไฟ & อินเทอร์เน็ต' },
  'อินเทอร์เน็ต': { type: 'expense', category: 'ค่าน้ำ ค่าไฟ & อินเทอร์เน็ต' },
  'เน็ต': { type: 'expense', category: 'ค่าน้ำ ค่าไฟ & อินเทอร์เน็ต' },
  'ค่าเช่า': { type: 'expense', category: 'ค่าเช่าร้าน & ส่วนกลาง' },
  'ส่วนกลาง': { type: 'expense', category: 'ค่าเช่าร้าน & ส่วนกลาง' },
  'เงินเดือน': { type: 'expense', category: 'ค่าจ้างพนักงาน & ค่ากะ' },
  'ค่าจ้าง': { type: 'expense', category: 'ค่าจ้างพนักงาน & ค่ากะ' },
  'ค่ากะ': { type: 'expense', category: 'ค่าจ้างพนักงาน & ค่ากะ' },
  'ค่าแรง': { type: 'expense', category: 'ค่าจ้างพนักงาน & ค่ากะ' },
  'ซ่อม': { type: 'expense', category: 'ซ่อมบำรุง & ล้างเครื่องชง' },
  'ล้างเครื่อง': { type: 'expense', category: 'ซ่อมบำรุง & ล้างเครื่องชง' },
  'บำรุง': { type: 'expense', category: 'ซ่อมบำรุง & ล้างเครื่องชง' },
  'โฆษณา': { type: 'expense', category: 'การตลาด & โฆษณา' },
  'ยิงแอด': { type: 'expense', category: 'การตลาด & โฆษณา' },
  'ป้าย': { type: 'expense', category: 'การตลาด & โฆษณา' },
  'น้ำยาล้างจาน': { type: 'expense', category: 'ของใช้ทำความสะอาด & เบ็ดเตล็ด' },
  'ทำความสะอาด': { type: 'expense', category: 'ของใช้ทำความสะอาด & เบ็ดเตล็ด' },
  'ถุงขยะ': { type: 'expense', category: 'ของใช้ทำความสะอาด & เบ็ดเตล็ด' },
  'ไม้กวาด': { type: 'expense', category: 'ของใช้ทำความสะอาด & เบ็ดเตล็ด' },
};

// Helper: Normalize Thai date string to YYYY-MM-DD
export function normalizeDate(input: any): string {
  const today = new Date().toISOString().slice(0, 10);
  if (!input) return today;

  if (typeof input === 'number') {
    // Excel serial date number
    try {
      const date = new Date(Math.round((input - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    } catch {}
  }

  const str = String(input).trim();
  if (!str) return today;

  // Pattern 1: YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    let year = parseInt(isoMatch[1], 10);
    if (year > 2500) year -= 543; // Thai Buddhist Era conversion
    const month = String(isoMatch[2]).padStart(2, '0');
    const day = String(isoMatch[3]).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Pattern 2: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmyMatch) {
    let day = String(dmyMatch[1]).padStart(2, '0');
    let month = String(dmyMatch[2]).padStart(2, '0');
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    if (year > 2500) year -= 543; // BE to CE
    return `${year}-${month}-${day}`;
  }

  // Fallback try Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return today;
}

// Helper: Extract Time (HH:mm)
export function normalizeTime(input: any): string | undefined {
  if (!input) return undefined;
  const str = String(input).trim();
  const timeMatch = str.match(/(\d{1,2})[:.](\d{2})/);
  if (timeMatch) {
    const hh = String(timeMatch[1]).padStart(2, '0');
    const mm = String(timeMatch[2]).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return undefined;
}

// Helper: Infer Payment Method
export function inferPaymentMethod(text: string): PaymentMethod {
  const lower = text.toLowerCase();
  if (lower.includes('สด') || lower.includes('cash')) return 'cash';
  if (lower.includes('โอน') || lower.includes('transfer') || lower.includes('kbank') || lower.includes('scb') || lower.includes('ktb') || lower.includes('bbl') || lower.includes('พร้อมเพย์') || lower.includes('promptpay')) return 'qr_promptpay';
  if (lower.includes('บัตร') || lower.includes('card') || lower.includes('credit') || lower.includes('visa') || lower.includes('mastercard')) return 'credit_card';
  return 'cash';
}

// Helper: Infer Category and Type from Description
export function inferCategoryAndType(text: string, rawType?: string): { category: string; type: TransactionType } {
  const lower = text.toLowerCase();

  // If explicit type provided
  let explicitType: TransactionType | undefined;
  if (rawType) {
    const rawLower = rawType.toLowerCase();
    if (rawLower.includes('รับ') || rawLower.includes('in') || rawLower.includes('credit') || rawLower.includes('ฝาก') || rawLower.includes('ขาย') || rawLower.includes('+')) {
      explicitType = 'income';
    } else if (rawLower.includes('จ่าย') || rawLower.includes('out') || rawLower.includes('debit') || rawLower.includes('ถอน') || rawLower.includes('ซื้อ') || rawLower.includes('-')) {
      explicitType = 'expense';
    }
  }

  // Look for keywords
  for (const [kw, info] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(kw)) {
      return {
        type: explicitType || info.type,
        category: info.category,
      };
    }
  }

  // Context clues
  if (lower.includes('ขาย') || lower.includes('ลูกค้า') || lower.includes('ยอดขาย') || lower.includes('รับเงิน') || lower.includes('โอนเข้า')) {
    return {
      type: explicitType || 'income',
      category: 'กาแฟ & เครื่องดื่ม',
    };
  }

  if (lower.includes('ซื้อ') || lower.includes('จ่าย') || lower.includes('ค่า') || lower.includes('บิล') || lower.includes('สั่ง')) {
    return {
      type: explicitType || 'expense',
      category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม',
    };
  }

  const finalType = explicitType || 'income';
  return {
    type: finalType,
    category: finalType === 'income' ? 'รายรับอื่นๆ' : 'ของใช้ทำความสะอาด & เบ็ดเตล็ด',
  };
}

// Helper: Clean amount string to number
export function cleanAmount(val: any): number {
  if (typeof val === 'number') return Math.abs(val);
  if (!val) return 0;
  const str = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
}

// 1. Parse Excel / Spreadsheet File (.xlsx, .xls)
export async function parseExcelFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  return parseTableRows(rows, file.name, 'Excel Spreadsheet (.xlsx)');
}

// 2. Parse CSV File
export async function parseCsvFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[][];
        const res = parseTableRows(rows, file.name, 'CSV File (.csv)');
        resolve(res);
      },
      error: (err) => {
        reject(err);
      },
    });
  });
}

// 3. Parse Pasted / Raw Text (Tab-separated, Comma-separated, or Line-by-line SMS / Statements)
export function parsePastedText(text: string, title = 'Pasted Text'): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return createEmptyResult(title, 'Text Clipboard');
  }

  // Check if JSON
  if (trimmed.startsWith('[') || (trimmed.startsWith('{') && trimmed.includes('transactions'))) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : parsed.transactions || [];
      if (Array.isArray(list) && list.length > 0) {
        return parseJsonTransactions(list, title);
      }
    } catch {}
  }

  // Check if Table format (Tab or Comma or Semicolon)
  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return createEmptyResult(title, 'Text Clipboard');
  }

  const hasTabs = lines[0].includes('\t');
  const hasCommas = lines[0].includes(',');
  const hasPipes = lines[0].includes('|');

  if (hasTabs || hasCommas || hasPipes) {
    const delimiter = hasTabs ? '\t' : (hasPipes ? '|' : ',');
    const rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()));
    return parseTableRows(rows, title, 'Table Text (TSV/CSV)');
  }

  // Fallback: Line-by-Line Natural Text / Bank Notification SMS
  return parseLineByLineText(lines, title);
}

// 4. Parse JSON transactions
function parseJsonTransactions(data: any[], fileName: string): ParseResult {
  const items: ParsedItem[] = [];
  data.forEach((item, idx) => {
    const amount = cleanAmount(item.amount || item.price || item.total);
    if (amount <= 0) return;

    const rawType = (item.type || 'income').toLowerCase();
    const type: TransactionType = rawType.includes('exp') || rawType.includes('จ่าย') ? 'expense' : 'income';
    const date = normalizeDate(item.date || item.createdAt);
    const category = item.category || (type === 'income' ? 'กาแฟ & เครื่องดื่ม' : 'ของใช้ทำความสะอาด & เบ็ดเตล็ด');
    const note = item.note || item.description || item.title || item.name || (type === 'income' ? 'ขายกาแฟ/สินค้า' : 'ค่าใช้จ่ายร้าน');
    const paymentMethod = inferPaymentMethod(item.paymentMethod || item.payment || 'cash');

    items.push({
      id: 'import_' + Date.now() + '_' + idx,
      selected: true,
      type,
      amount,
      category,
      date,
      time: normalizeTime(item.time || item.createdAt),
      paymentMethod,
      note,
      vendorOrCustomer: item.vendorOrCustomer || item.vendor || item.customer,
      referenceNumber: item.referenceNumber || item.ref,
      confidence: 'high',
      originalRaw: item,
    });
  });

  return calculateResult(items, fileName, 'JSON Data');
}

// 5. Parse 2D Table Rows (Excel / CSV / TSV)
function parseTableRows(rows: any[][], fileName: string, fileType: string): ParseResult {
  if (!rows || rows.length === 0) {
    return createEmptyResult(fileName, fileType);
  }

  // Find Header Row (Scan top 5 rows)
  let headerIndex = -1;
  let dateCol = -1;
  let timeCol = -1;
  let descCol = -1;
  let catCol = -1;
  let typeCol = -1;
  let amountCol = -1;
  let incomeCol = -1;
  let expenseCol = -1;
  let paymentCol = -1;
  let vendorCol = -1;
  let refCol = -1;

  for (let r = 0; r < Math.min(rows.length, 6); r++) {
    const row = rows[r].map(c => String(c || '').toLowerCase().trim());
    let score = 0;

    row.forEach((cell, cIdx) => {
      if (cell.includes('วัน') || cell.includes('date') || cell.includes('timestamp')) {
        dateCol = cIdx;
        score++;
      } else if (cell.includes('เวลา') || cell.includes('time')) {
        timeCol = cIdx;
        score++;
      } else if (cell.includes('รายการ') || cell.includes('คำอธิบาย') || cell.includes('รายละเอียด') || cell.includes('description') || cell.includes('detail') || cell.includes('memo') || cell.includes('title')) {
        descCol = cIdx;
        score++;
      } else if (cell.includes('หมวด') || cell.includes('category')) {
        catCol = cIdx;
        score++;
      } else if (cell.includes('ประเภท') || cell.includes('type') || cell.includes('ทรานแซกชัน')) {
        typeCol = cIdx;
        score++;
      } else if (cell.includes('รายรับ') || cell.includes('income') || cell.includes('ฝาก') || cell.includes('credit') || cell.includes('เข้า')) {
        incomeCol = cIdx;
        score++;
      } else if (cell.includes('รายจ่าย') || cell.includes('expense') || cell.includes('ถอน') || cell.includes('debit') || cell.includes('ออก')) {
        expenseCol = cIdx;
        score++;
      } else if (cell.includes('จำนวน') || cell.includes('ยอด') || cell.includes('amount') || cell.includes('total') || cell.includes('บาท') || cell.includes('price')) {
        amountCol = cIdx;
        score++;
      } else if (cell.includes('ชำระ') || cell.includes('payment') || cell.includes('ช่องทาง') || cell.includes('วิธี')) {
        paymentCol = cIdx;
        score++;
      } else if (cell.includes('คู่ค้า') || cell.includes('ลูกค้า') || cell.includes('ร้าน') || cell.includes('vendor') || cell.includes('customer')) {
        vendorCol = cIdx;
        score++;
      } else if (cell.includes('อ้างอิง') || cell.includes('ref') || cell.includes('เลขที่')) {
        refCol = cIdx;
        score++;
      }
    });

    if (score >= 2 || (dateCol !== -1 && (amountCol !== -1 || incomeCol !== -1 || descCol !== -1))) {
      headerIndex = r;
      break;
    }
  }

  // If no header detected, assume standard column order: [0: Date, 1: Description, 2: Category, 3: Amount, 4: Type/Payment]
  const dataStartRow = headerIndex !== -1 ? headerIndex + 1 : 0;
  const items: ParsedItem[] = [];

  for (let r = dataStartRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0 || row.every(cell => !cell && cell !== 0)) continue;

    // Extract Date
    const rawDate = dateCol !== -1 ? row[dateCol] : row[0];
    const date = normalizeDate(rawDate);

    // Extract Time
    const time = timeCol !== -1 ? normalizeTime(row[timeCol]) : undefined;

    // Extract Description / Note
    let note = descCol !== -1 ? String(row[descCol] || '').trim() : '';
    if (!note && row[1]) note = String(row[1]).trim();
    if (!note) note = 'รายการคาเฟ่';

    // Extract Vendor / Customer
    const vendorOrCustomer = vendorCol !== -1 && row[vendorCol] ? String(row[vendorCol]).trim() : undefined;

    // Extract Ref
    const referenceNumber = refCol !== -1 && row[refCol] ? String(row[refCol]).trim() : undefined;

    // Extract Amounts and Type
    let type: TransactionType = 'income';
    let amount = 0;

    if (incomeCol !== -1 && expenseCol !== -1) {
      const incVal = cleanAmount(row[incomeCol]);
      const expVal = cleanAmount(row[expenseCol]);
      if (incVal > 0) {
        type = 'income';
        amount = incVal;
      } else if (expVal > 0) {
        type = 'expense';
        amount = expVal;
      }
    } else if (amountCol !== -1) {
      const rawAmt = row[amountCol];
      const rawNum = typeof rawAmt === 'number' ? rawAmt : parseFloat(String(rawAmt || '').replace(/,/g, '').trim());
      amount = Math.abs(cleanAmount(rawAmt));
      
      // If negative amount -> expense
      if (rawNum < 0) {
        type = 'expense';
      } else if (typeCol !== -1 && row[typeCol]) {
        const rawTypeStr = String(row[typeCol]).toLowerCase();
        if (rawTypeStr.includes('จ่าย') || rawTypeStr.includes('exp') || rawTypeStr.includes('out') || rawTypeStr.includes('debit') || rawTypeStr.includes('ถอน')) {
          type = 'expense';
        }
      }
    } else {
      // Find first numeric cell
      for (let c = 0; c < row.length; c++) {
        const val = cleanAmount(row[c]);
        if (val > 0) {
          amount = val;
          break;
        }
      }
    }

    if (amount <= 0) continue; // Skip rows without valid amounts

    // Infer Category and Type if not already determined
    let category = catCol !== -1 && row[catCol] ? String(row[catCol]).trim() : '';
    if (!category) {
      const inferred = inferCategoryAndType(note + ' ' + (row[typeCol] || ''), typeCol !== -1 ? String(row[typeCol]) : undefined);
      type = inferred.type;
      category = inferred.category;
    } else {
      // Check if user's custom category matches
      const inferred = inferCategoryAndType(category + ' ' + note, typeCol !== -1 ? String(row[typeCol]) : undefined);
      if (typeCol === -1 && !incomeCol) {
        type = inferred.type;
      }
    }

    // Payment Method
    const rawPayment = paymentCol !== -1 && row[paymentCol] ? String(row[paymentCol]) : note;
    const paymentMethod = inferPaymentMethod(rawPayment);

    items.push({
      id: 'import_' + Date.now() + '_' + r + '_' + Math.random().toString(36).substr(2, 4),
      selected: true,
      type,
      amount,
      category,
      date,
      time,
      paymentMethod,
      note,
      vendorOrCustomer,
      referenceNumber,
      confidence: headerIndex !== -1 ? 'high' : 'medium',
      originalRaw: row,
    });
  }

  return calculateResult(items, fileName, fileType);
}

// 6. Line-by-Line Natural Text Parser (SMS, Line Notes, Bank Copy)
function parseLineByLineText(lines: string[], title: string): ParseResult {
  const items: ParsedItem[] = [];

  lines.forEach((line, idx) => {
    if (!line || line.length < 3) return;

    // Look for numbers / amounts
    const amountMatch = line.match(/(?:฿|THB|บาท)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(?:฿|THB|บาท)?/);
    if (!amountMatch) return;

    const amount = cleanAmount(amountMatch[1]);
    if (amount <= 0) return;

    // Look for Date
    const date = normalizeDate(line);
    const time = normalizeTime(line);

    // Clean note by removing amount part
    let note = line.replace(amountMatch[0], '').replace(/\s+/g, ' ').trim();
    if (!note) note = 'รายการนำเข้า';

    // Infer Type & Category
    const inferred = inferCategoryAndType(line);
    const paymentMethod = inferPaymentMethod(line);

    items.push({
      id: 'import_' + Date.now() + '_' + idx,
      selected: true,
      type: inferred.type,
      amount,
      category: inferred.category,
      date,
      time,
      paymentMethod,
      note,
      confidence: 'medium',
    });
  });

  return calculateResult(items, title, 'Text / SMS Parser');
}

// Calculate summary result
function calculateResult(items: ParsedItem[], fileName: string, fileType: string): ParseResult {
  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  items.forEach(item => {
    if (item.selected) {
      if (item.type === 'income') {
        totalIncome += item.amount;
        incomeCount++;
      } else {
        totalExpense += item.amount;
        expenseCount++;
      }
    }
  });

  const netProfit = totalIncome - totalExpense;
  const warnings: string[] = [];
  if (items.length === 0) {
    warnings.push('ไม่พบข้อมูลรายการที่ถูกต้อง กรุณาตรวจสอบรูปแบบไฟล์หรือคอลัมน์');
  }

  return {
    items,
    totalIncome,
    totalExpense,
    netProfit,
    incomeCount,
    expenseCount,
    fileName,
    fileType,
    warnings,
  };
}

function createEmptyResult(fileName: string, fileType: string): ParseResult {
  return {
    items: [],
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    incomeCount: 0,
    expenseCount: 0,
    fileName,
    fileType,
    warnings: ['ไฟล์หรือข้อความว่างเปล่า'],
  };
}

// 7. Generate Demo Cafe Data for 1-Click Instant Testing
export function generateDemoImportData(): ParseResult {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');

  const demoItems: ParsedItem[] = [
    {
      id: 'demo_1',
      selected: true,
      type: 'income',
      amount: 4580,
      category: 'กาแฟ & เครื่องดื่ม',
      date: `${year}-${month}-01`,
      time: '08:30',
      paymentMethod: 'cash',
      note: 'ยอดขายกาแฟหน้าร้าน (สด)',
      confidence: 'high',
    },
    {
      id: 'demo_2',
      selected: true,
      type: 'income',
      amount: 6850,
      category: 'กาแฟ & เครื่องดื่ม',
      date: `${year}-${month}-01`,
      time: '12:15',
      paymentMethod: 'qr_promptpay',
      note: 'ยอดชำระสแกน QR PromptPay เครื่องดื่ม',
      confidence: 'high',
    },
    {
      id: 'demo_3',
      selected: true,
      type: 'income',
      amount: 2450,
      category: 'เบเกอรี่ & ขนมหวาน',
      date: `${year}-${month}-01`,
      time: '14:00',
      paymentMethod: 'cash',
      note: 'ครัวซองต์ & เค้กช็อกโกแลตหน้าร้าน',
      confidence: 'high',
    },
    {
      id: 'demo_4',
      selected: true,
      type: 'expense',
      amount: 3200,
      category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม',
      date: `${year}-${month}-01`,
      time: '09:00',
      paymentMethod: 'transfer',
      note: 'สั่งซื้อเมล็ดกาแฟคั่ว House Blend 5 กก.',
      vendorOrCustomer: 'โรงคั่วเชียงใหม่',
      confidence: 'high',
    },
    {
      id: 'demo_5',
      selected: true,
      type: 'expense',
      amount: 1450,
      category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม',
      date: `${year}-${month}-01`,
      time: '10:30',
      paymentMethod: 'cash',
      note: 'ซื้อนมสดพาสเจอร์ไรส์ เมจิ + นมโอ๊ต 12 กล่อง',
      confidence: 'high',
    },
    {
      id: 'demo_6',
      selected: true,
      type: 'expense',
      amount: 980,
      category: 'แก้ว หลอด & บรรจุภัณฑ์',
      date: `${year}-${month}-02`,
      time: '11:00',
      paymentMethod: 'transfer',
      note: 'สั่งซื้อแก้วร้อน 8oz + ฝา และหลอดกระดาษ',
      confidence: 'high',
    },
    {
      id: 'demo_7',
      selected: true,
      type: 'income',
      amount: 8500,
      category: 'รับจัดเลี้ยง / เหมาบริการ',
      date: `${year}-${month}-02`,
      time: '13:00',
      paymentMethod: 'transfer',
      note: 'จัด Coffee Break งานประชุมวิทยาลัยเทคนิควังน้ำเย็น',
      vendorOrCustomer: 'แผนกวิชาการ',
      confidence: 'high',
    },
    {
      id: 'demo_8',
      selected: true,
      type: 'income',
      amount: 5200,
      category: 'อาหาร & ของทานเล่น',
      date: `${year}-${month}-02`,
      time: '12:30',
      paymentMethod: 'qr_promptpay',
      note: 'สปาเก็ตตี้ & ข้าวผัดคาเฟ่',
      confidence: 'high',
    },
    {
      id: 'demo_9',
      selected: true,
      type: 'expense',
      amount: 4500,
      category: 'ค่าน้ำ ค่าไฟ & อินเทอร์เน็ต',
      date: `${year}-${month}-03`,
      time: '15:00',
      paymentMethod: 'transfer',
      note: 'ชำระค่าไฟฟ้าร้านกาแฟประจำเดือน',
      confidence: 'high',
    },
    {
      id: 'demo_10',
      selected: true,
      type: 'expense',
      amount: 15000,
      category: 'ค่าจ้างพนักงาน & ค่ากะ',
      date: `${year}-${month}-03`,
      time: '18:00',
      paymentMethod: 'transfer',
      note: 'ค่าจ้างบาริสต้าประจำร้าน (ครึ่งเดือนแรก)',
      confidence: 'high',
    },
  ];

  return calculateResult(demoItems, 'ไฟล์จำลองยอดขายคาเฟ่ (Demo Data.xlsx)', 'Spreadsheet Demo');
}

// 8. Download Sample Template Files (Excel & CSV)
export function downloadSampleExcelTemplate() {
  const sampleData = [
    ['วันที่ (Date)', 'เวลา (Time)', 'รายการ / คำอธิบาย (Description)', 'หมวดหมู่ (Category)', 'ประเภท (Type)', 'จำนวนเงิน (Amount)', 'วิธีชำระ (Payment)', 'ร้านค้า/ลูกค้า (Vendor/Customer)', 'หมายเหตุ (Note)'],
    ['2026-08-01', '08:30', 'ขายกาแฟ & ชา หน้าร้าน', 'กาแฟ & เครื่องดื่ม', 'รายรับ', 3500, 'เงินสด', 'ลูกค้าหน้าร้าน', 'ยอดขายช่วงเช้า'],
    ['2026-08-01', '11:45', 'ยอดโอนสแกน QR เครื่องดื่ม + ขนม', 'กาแฟ & เครื่องดื่ม', 'รายรับ', 5200, 'โอน/QR', 'ลูกค้าทั่วไป', ''],
    ['2026-08-01', '14:00', 'ขายเค้กและครัวซองต์', 'เบเกอรี่ & ขนมหวาน', 'รายรับ', 1850, 'เงินสด', '', ''],
    ['2026-08-01', '09:00', 'ซื้อเมล็ดกาแฟคั่ว Specialty', 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม', 'รายจ่าย', 2400, 'โอนเงิน', 'โรงคั่วกาแฟ', 'เมล็ดคั่วกลาง 4 กก.'],
    ['2026-08-01', '10:30', 'ซื้อนมสด & ไซรัปคาราเมล', 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม', 'รายจ่าย', 890, 'เงินสด', 'แม็คโคร', ''],
    ['2026-08-02', '13:00', 'รับจัดเลี้ยงเบรคประชุมอาจารย์', 'รับจัดเลี้ยง / เหมาบริการ', 'รายรับ', 6500, 'โอนเงิน', 'วิทยาลัยเทคนิควังน้ำเย็น', 'จัดเลี้ยง 50 ที่'],
    ['2026-08-02', '16:00', 'สั่งซื้อแก้ว 16oz สกรีนโลโก้', 'แก้ว หลอด & บรรจุภัณฑ์', 'รายจ่าย', 1650, 'โอนเงิน', 'โรงงานบรรจุภัณฑ์', 'แก้ว 1,000 ใบ'],
    ['2026-08-03', '15:30', 'ค่าไฟฟ้าและค่าน้ำร้าน', 'ค่าน้ำ ค่าไฟ & อินเทอร์เน็ต', 'รายจ่าย', 3850, 'โอนเงิน', 'การไฟฟ้า', 'บิลเดือนสิงหาคม'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'เทมเพลตรายรับรายจ่าย');

  // Set column widths
  ws['!cols'] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 32 },
    { wch: 28 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
    { wch: 24 },
  ];

  XLSX.writeFile(wb, 'Cafe_Income_Expense_Template.xlsx');
}

export function downloadSampleCsvTemplate() {
  const csvContent = "\uFEFF" + // UTF-8 BOM for Thai support in Excel
    "วันที่,เวลา,รายการ,หมวดหมู่,ประเภท,จำนวนเงิน,วิธีชำระ,หมายเหตุ\n" +
    "2026-08-01,08:30,ขายกาแฟหน้าร้าน,กาแฟ & เครื่องดื่ม,รายรับ,3500,เงินสด,ช่วงเช้า\n" +
    "2026-08-01,12:00,ยอดสแกน QR โอนเข้า,กาแฟ & เครื่องดื่ม,รายรับ,4800,โอน/QR,เที่ยง\n" +
    "2026-08-01,09:30,ซื้อเมล็ดกาแฟคั่ว 3 กก.,เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม,รายจ่าย,1800,โอนเงิน,โรงคั่ว\n" +
    "2026-08-01,11:00,ซื้อนมสด เมจิ 8 แกลลอน,เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม,รายจ่าย,720,เงินสด,แม็คโคร\n" +
    "2026-08-02,14:00,ขายเบเกอรี่และเค้ก,เบเกอรี่ & ขนมหวาน,รายรับ,2100,เงินสด,บ่าย\n";

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Cafe_Income_Expense_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
