import { Category } from '../types';

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'inc_coffee', name: 'กาแฟ & เครื่องดื่ม', type: 'income', icon: 'Coffee', color: '#B45309', isDefault: true },
  { id: 'inc_bakery', name: 'เบเกอรี่ & ขนมหวาน', type: 'income', icon: 'Cake', color: '#D97706', isDefault: true },
  { id: 'inc_food', name: 'อาหาร & ของทานเล่น', type: 'income', icon: 'Utensils', color: '#059669', isDefault: true },
  { id: 'inc_beans', name: 'เมล็ดกาแฟ & อุปกรณ์', type: 'income', icon: 'ShoppingBag', color: '#0284C7', isDefault: true },
  { id: 'inc_catering', name: 'รับจัดเลี้ยง / เหมาบริการ', type: 'income', icon: 'PartyPopper', color: '#7C3AED', isDefault: true },
  { id: 'inc_other', name: 'รายรับอื่นๆ', type: 'income', icon: 'Coins', color: '#64748B', isDefault: true },
];

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'exp_coffee_mat', name: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม', type: 'expense', icon: 'Bean', color: '#78350F', isDefault: true },
  { id: 'exp_food_mat', name: 'วัตถุดิบเบเกอรี่ & อาหาร', type: 'expense', icon: 'Egg', color: '#EA580C', isDefault: true },
  { id: 'exp_packaging', name: 'แก้ว หลอด & บรรจุภัณฑ์', type: 'expense', icon: 'Package', color: '#CA8A04', isDefault: true },
  { id: 'exp_utilities', name: 'ค่าน้ำ ค่าไฟ & อินเทอร์เน็ต', type: 'expense', icon: 'Zap', color: '#E11D48', isDefault: true },
  { id: 'exp_rent', name: 'ค่าเช่าร้าน & ส่วนกลาง', type: 'expense', icon: 'Home', color: '#DC2626', isDefault: true },
  { id: 'exp_salary', name: 'ค่าจ้างพนักงาน & ค่ากะ', type: 'expense', icon: 'Users', color: '#4F46E5', isDefault: true },
  { id: 'exp_maintenance', name: 'ซ่อมบำรุง & ล้างเครื่องชง', type: 'expense', icon: 'Wrench', color: '#475569', isDefault: true },
  { id: 'exp_marketing', name: 'การตลาด & โฆษณา', type: 'expense', icon: 'Megaphone', color: '#9333EA', isDefault: true },
  { id: 'exp_cleaning', name: 'ของใช้ทำความสะอาด & เบ็ดเตล็ด', type: 'expense', icon: 'Sparkles', color: '#0D9488', isDefault: true },
];

export const ALL_DEFAULT_CATEGORIES = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];

export const QUICK_CAFE_PRESETS = [
  { label: 'ขายกาแฟหน้าร้าน (สด)', type: 'income' as const, category: 'กาแฟ & เครื่องดื่ม', paymentMethod: 'cash' as const },
  { label: 'ยอดโอน / QR หน้าร้าน', type: 'income' as const, category: 'กาแฟ & เครื่องดื่ม', paymentMethod: 'qr_promptpay' as const },
  { label: 'ซื้อเมล็ดกาแฟคั่ว', type: 'expense' as const, category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม', paymentMethod: 'transfer' as const },
  { label: 'ซื้อนมสด / นมโอ๊ต / ไซรัป', type: 'expense' as const, category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม', paymentMethod: 'transfer' as const },
  { label: 'สั่งซื้อแก้ว 16oz + ฝา + หลอด', type: 'expense' as const, category: 'แก้ว หลอด & บรรจุภัณฑ์', paymentMethod: 'transfer' as const },
  { label: 'ค่าน้ำแข็งหลอด / วัน', type: 'expense' as const, category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม', paymentMethod: 'cash' as const },
  { label: 'ค่าไฟร้านกาแฟ', type: 'expense' as const, category: 'ค่าน้ำ ค่าไฟ & อินเทอร์เน็ต', paymentMethod: 'transfer' as const },
  { label: 'ค่าแรงพนักงาน / บาริสต้า', type: 'expense' as const, category: 'ค่าจ้างพนักงาน & ค่ากะ', paymentMethod: 'transfer' as const },
];
