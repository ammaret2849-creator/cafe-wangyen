export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export function formatCurrency(amount: number, currency = '฿'): string {
  if (isNaN(amount)) return `${currency}0`;
  return `${currency}${amount.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatMonthYearThai(yearMonth: string): string {
  if (!yearMonth) return '';
  if (yearMonth === 'all') return 'ข้อมูลทั้งหมดทุกเดือน';
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return yearMonth;
  
  const thaiYear = year + 543;
  return `${THAI_MONTHS_FULL[month - 1]} ${thaiYear}`;
}

export function formatDateThai(dateStr: string, withTime?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
  
  const thaiYear = year + 543;
  const dateFormatted = `${day} ${THAI_MONTHS_SHORT[month - 1]} ${thaiYear}`;
  
  if (withTime) {
    return `${dateFormatted} (${withTime} น.)`;
  }
  return dateFormatted;
}

export function getTodayDateThai(): string {
  const today = getTodayDateString();
  return formatDateThai(today);
}

export function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getDaysAgoDateString(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getFirstDayOfMonthString(yearMonth?: string): string {
  if (yearMonth && yearMonth.includes('-')) {
    return `${yearMonth}-01`;
  }
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export function getLastDayOfMonthString(yearMonth?: string): string {
  let y: number;
  let m: number;
  if (yearMonth && yearMonth.includes('-')) {
    const parts = yearMonth.split('-').map(Number);
    y = parts[0];
    m = parts[1];
  } else {
    const d = new Date();
    y = d.getFullYear();
    m = d.getMonth() + 1;
  }
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

export function formatDateRangeThai(
  startDate?: string, 
  endDate?: string, 
  startTime?: string, 
  endTime?: string
): string {
  if (!startDate && !endDate) return 'ทุกช่วงเวลา';
  
  if (startDate && endDate && startDate === endDate) {
    const dateFormatted = formatDateThai(startDate);
    if (startTime && endTime) {
      return `${dateFormatted} (เวลา ${startTime} - ${endTime} น.)`;
    } else if (startTime) {
      return `${dateFormatted} (ตั้งแต่เวลา ${startTime} น.)`;
    } else if (endTime) {
      return `${dateFormatted} (ถึงเวลา ${endTime} น.)`;
    }
    return dateFormatted;
  }

  const startPart = startDate ? formatDateThai(startDate, startTime) : 'เริ่มต้น';
  const endPart = endDate ? formatDateThai(endDate, endTime) : 'ปัจจุบัน';
  return `${startPart} ถึง ${endPart}`;
}

export function getCurrentTimeString(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}
