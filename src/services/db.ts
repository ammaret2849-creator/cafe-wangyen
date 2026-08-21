import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Transaction, CafeSettings, CafeUserProfile, StaffAccount } from '../types';

const TRANSACTIONS_COLLECTION = 'transactions';
const SETTINGS_COLLECTION = 'settings';
const USERS_COLLECTION = 'users';
const STAFF_COLLECTION = 'staff_accounts';

const LOCAL_STORAGE_TX_KEY = 'cafe_cd_transactions_cache';
const LOCAL_STORAGE_SETTINGS_KEY = 'cafe_cd_settings';
const LOCAL_STORAGE_USER_KEY = 'cafe_cd_current_user';
const LOCAL_STORAGE_CUSTOM_USERS_KEY = 'cafe_cd_phone_users';
const LOCAL_STORAGE_STAFF_KEY = 'cafe_cd_staff_accounts';

export const DEFAULT_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'staff_0812345678',
    name: 'คุณสมชาย',
    phoneNumber: '081-234-5678',
    password: '1234',
    role: 'owner',
    description: 'เจ้าของร้าน • สิทธิ์เต็มระบบ',
    createdAt: 1700000000000,
  },
  {
    id: 'staff_0899998888',
    name: 'คุณวิภาดา',
    phoneNumber: '089-999-8888',
    password: '1234',
    role: 'manager',
    description: 'ผู้จัดการร้าน • จัดการข้อมูล & รายงาน',
    createdAt: 1700000000001,
  },
  {
    id: 'staff_0921112222',
    name: 'คุณมานะ',
    phoneNumber: '092-111-2222',
    password: '1234',
    role: 'barista',
    description: 'บาริสต้า / แคชเชียร์ • บันทึกรับ-จ่ายหน้าร้าน',
    createdAt: 1700000000002,
  },
];

export const DEFAULT_CAFE_SETTINGS: CafeSettings = {
  cafeName: 'ระบบสรุปรายรับ-รายจ่าย คาเฟ่ วิทยาลัยเทคนิควังน้ำเย็น',
  cafeBranch: 'วิทยาลัยเทคนิควังน้ำเย็น',
  phone: '037-251-456',
  address: 'วิทยาลัยเทคนิควังน้ำเย็น ต.วังน้ำเย็น อ.วังน้ำเย็น จ.สระแก้ว 27210',
  taxId: '0994000165032',
  currencySymbol: '฿',
  monthlyRevenueTarget: 150000,
  monthlyExpenseBudget: 85000,
};

// Offline-first Storage Helpers
export function getLocalTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TX_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading local transactions:', err);
    return [];
  }
}

export function saveLocalTransactions(txs: Transaction[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(txs));
  } catch (err) {
    console.error('Error saving local transactions:', err);
  }
}

export function getLocalSettings(): CafeSettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (!raw) return DEFAULT_CAFE_SETTINGS;
    const parsed = JSON.parse(raw);
    if (!parsed.cafeName || parsed.cafeName.includes('Slow & Pour')) {
      parsed.cafeName = DEFAULT_CAFE_SETTINGS.cafeName;
      parsed.cafeBranch = DEFAULT_CAFE_SETTINGS.cafeBranch;
      parsed.address = DEFAULT_CAFE_SETTINGS.address;
    }
    return { ...DEFAULT_CAFE_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_CAFE_SETTINGS;
  }
}

export function saveLocalSettings(settings: CafeSettings) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving local settings:', err);
  }
}

// Generate human-friendly reference number
export function generateReferenceNumber(type: 'income' | 'expense'): string {
  const prefix = type === 'income' ? 'INC' : 'EXP';
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${randomSuffix}`;
}

// Transaction Firestore & Offline Services
export async function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const newTx: Transaction = {
    ...tx,
    id,
    referenceNumber: tx.referenceNumber || generateReferenceNumber(tx.type),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // 1. Save locally immediately for offline-first responsiveness
  const currentLocal = getLocalTransactions();
  const updatedLocal = [newTx, ...currentLocal.filter(t => t.id !== id)];
  saveLocalTransactions(updatedLocal);

  // 2. Sync to Firestore
  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, id);
    await setDoc(docRef, {
      ...newTx,
      serverTime: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Firestore write queued or offline:', error);
    // Mark as offline pending in local cache
    newTx.isOfflinePending = true;
    saveLocalTransactions([newTx, ...currentLocal.filter(t => t.id !== id)]);
  }

  return newTx;
}

export async function addMultipleTransactions(txList: Omit<Transaction, 'id' | 'createdAt'>[]): Promise<Transaction[]> {
  const currentLocal = getLocalTransactions();
  const newTransactions: Transaction[] = [];

  for (let i = 0; i < txList.length; i++) {
    const tx = txList[i];
    const id = 'tx_' + (Date.now() + i) + '_' + Math.random().toString(36).substr(2, 7);
    newTransactions.push({
      ...tx,
      id,
      referenceNumber: tx.referenceNumber || generateReferenceNumber(tx.type),
      createdAt: Date.now() + i,
      updatedAt: Date.now() + i,
    });
  }

  // 1. Save all locally immediately
  const updatedLocal = [...newTransactions, ...currentLocal];
  saveLocalTransactions(updatedLocal);

  // 2. Batch write to Firestore
  try {
    const chunkSize = 400;
    for (let i = 0; i < newTransactions.length; i += chunkSize) {
      const chunk = newTransactions.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, TRANSACTIONS_COLLECTION, item.id);
        batch.set(docRef, {
          ...item,
          serverTime: serverTimestamp(),
        });
      }
      await batch.commit();
    }
  } catch (error) {
    console.warn('Firestore batch write queued or offline:', error);
    // Mark as offline pending
    for (const item of newTransactions) {
      item.isOfflinePending = true;
    }
    saveLocalTransactions(updatedLocal);
  }

  return newTransactions;
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
  const currentLocal = getLocalTransactions();
  const updatedLocal = currentLocal.map(t => {
    if (t.id === id) {
      return { ...t, ...updates, updatedAt: Date.now() };
    }
    return t;
  });
  saveLocalTransactions(updatedLocal);

  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, id);
    await setDoc(docRef, {
      ...updates,
      updatedAt: Date.now(),
      serverTime: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn('Firestore update queued or offline:', error);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const currentLocal = getLocalTransactions();
  const updatedLocal = currentLocal.filter(t => t.id !== id);
  saveLocalTransactions(updatedLocal);

  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore delete queued or offline:', error);
  }
}

export function subscribeToTransactions(
  onUpdate: (transactions: Transaction[]) => void,
  onError?: (error: Error) => void
) {
  // First emit local cache immediately
  const local = getLocalTransactions();
  if (local.length > 0) {
    onUpdate(local);
  }

  const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy('date', 'desc'));
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const firestoreList: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Transaction;
          firestoreList.push({
            ...data,
            id: docSnap.id,
          });
        });

        // Merge with local pending transactions if any
        const localTxs = getLocalTransactions();
        const pending = localTxs.filter(l => l.isOfflinePending && !firestoreList.some(f => f.id === l.id));
        const merged = [...pending, ...firestoreList].sort((a, b) => {
          return new Date(b.date + 'T' + (b.time || '00:00')).getTime() - new Date(a.date + 'T' + (a.time || '00:00')).getTime();
        });

        saveLocalTransactions(merged);
        onUpdate(merged);
      } else if (local.length === 0) {
        // First-time setup: provide initial demo cafe transactions so charts look great immediately!
        seedInitialCafeData().then(seeded => {
          if (seeded.length > 0) {
            onUpdate(seeded);
          }
        });
      }
    },
    (err) => {
      console.warn('Firestore subscription fallback to local cache:', err);
      if (onError) onError(err);
      onUpdate(getLocalTransactions());
    }
  );

  return unsubscribe;
}

// Seed initial realistic Cafe data for demonstration if empty
export async function seedInitialCafeData(): Promise<Transaction[]> {
  const existing = getLocalTransactions();
  if (existing.length > 0) return existing;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  const sampleData: Omit<Transaction, 'id' | 'createdAt'>[] = [
    // Today
    {
      type: 'income',
      amount: 4850,
      category: 'กาแฟ & เครื่องดื่ม',
      date: `${year}-${month}-${String(now.getDate()).padStart(2, '0')}`,
      time: '14:30',
      paymentMethod: 'qr_promptpay',
      note: 'ยอดขายหน้าร้านรอบบ่าย (Americano, Latte, Dirty)',
      referenceNumber: `INC-${year}${month}17-001`,
    },
    {
      type: 'income',
      amount: 1920,
      category: 'เบเกอรี่ & ขนมหวาน',
      date: `${year}-${month}-${String(now.getDate()).padStart(2, '0')}`,
      time: '12:15',
      paymentMethod: 'cash',
      note: 'Croissant x4, Basque Cheesecake x3',
      referenceNumber: `INC-${year}${month}17-002`,
    },
    {
      type: 'expense',
      amount: 2450,
      category: 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม',
      date: `${year}-${month}-${String(now.getDate()).padStart(2, '0')}`,
      time: '09:00',
      paymentMethod: 'transfer',
      note: 'ซื้อเมล็ดกาแฟ House Blend คั่วกลาง 5 กิโลกรัม (โรงคั่ว RoastLab)',
      vendorOrCustomer: 'RoastLab Roasters',
      referenceNumber: `EXP-${year}${month}17-001`,
      slipUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="400" height="600" fill="%23fffaf0"/><rect x="20" y="20" width="360" height="560" rx="8" fill="%23ffffff" stroke="%23e2e8f0" stroke-width="2"/><text x="200" y="70" font-size="20" font-weight="bold" fill="%2378350f" text-anchor="middle" font-family="sans-serif">ROASTLAB ROASTERS</text><text x="200" y="95" font-size="14" fill="%2364748b" text-anchor="middle" font-family="sans-serif">ใบเสร็จรับเงิน / Receipt</text><line x1="40" y1="120" x2="360" y2="120" stroke="%23cbd5e1" stroke-dasharray="4"/><text x="40" y="160" font-size="14" fill="%23334155" font-family="sans-serif">รายการ: House Blend (Medium)</text><text x="40" y="190" font-size="14" fill="%23334155" font-family="sans-serif">จำนวน: 5 kg @ 490.-</text><text x="40" y="230" font-size="16" font-weight="bold" fill="%230f172a" font-family="sans-serif">ยอดชำระสุทธิ: 2,450 ฿</text><text x="40" y="260" font-size="12" fill="%2364748b" font-family="sans-serif">ชำระผ่าน: โอนเงิน K-Bank</text><circle cx="200" cy="400" r="60" fill="%23f1f5f9"/><text x="200" y="405" font-size="12" fill="%2364748b" text-anchor="middle" font-family="sans-serif">PAID / ชำระแล้ว</text></svg>',
    },
    // Yesterday
    {
      type: 'income',
      amount: 6200,
      category: 'กาแฟ & เครื่องดื่ม',
      date: `${year}-${month}-${String(Math.max(1, now.getDate() - 1)).padStart(2, '0')}`,
      time: '17:00',
      paymentMethod: 'qr_promptpay',
      note: 'ยอดขายรวมหน้าร้าน',
      referenceNumber: `INC-${year}${month}16-001`,
    },
    {
      type: 'expense',
      amount: 1280,
      category: 'แก้ว หลอด & บรรจุภัณฑ์',
      date: `${year}-${month}-${String(Math.max(1, now.getDate() - 1)).padStart(2, '0')}`,
      time: '11:00',
      paymentMethod: 'transfer',
      note: 'แก้ว PET 16oz (1,000 ใบ) + ฝายกดื่ม',
      vendorOrCustomer: 'ร้าน บรรจุภัณฑ์เบเกอรี่',
      referenceNumber: `EXP-${year}${month}16-001`,
    },
    // Earlier this month
    {
      type: 'income',
      amount: 8500,
      category: 'รับจัดเลี้ยง / เหมาบริการ',
      date: `${year}-${month}-05`,
      time: '10:00',
      paymentMethod: 'transfer',
      note: 'Coffee Break สำหรับงานประชุม บริษัท ดีไซน์ จำกัด (50 แก้ว)',
      vendorOrCustomer: 'บจก. ดีไซน์ สตูดิโอ',
      referenceNumber: `INC-${year}${month}05-001`,
    },
    {
      type: 'expense',
      amount: 4500,
      category: 'ค่าน้ำ ค่าไฟ & อินเทอร์เน็ต',
      date: `${year}-${month}-03`,
      time: '13:00',
      paymentMethod: 'transfer',
      note: 'ค่าไฟฟ้าประจำเดือน กฟน.',
      referenceNumber: `EXP-${year}${month}03-001`,
    },
    {
      type: 'expense',
      amount: 18000,
      category: 'ค่าเช่าร้าน & ส่วนกลาง',
      date: `${year}-${month}-01`,
      time: '09:00',
      paymentMethod: 'transfer',
      note: 'ค่าเช่าพื้นที่ร้านกาแฟ ประจำเดือน',
      vendorOrCustomer: 'อาคารสุขุมวิท คอมเพล็กซ์',
      referenceNumber: `EXP-${year}${month}01-001`,
    },
  ];

  const seededList: Transaction[] = [];
  for (const s of sampleData) {
    const id = 'tx_seed_' + Math.random().toString(36).substr(2, 9);
    const tx: Transaction = {
      ...s,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    seededList.push(tx);
    // write to firestore quietly
    try {
      setDoc(doc(db, TRANSACTIONS_COLLECTION, id), tx);
    } catch {
      // ignore
    }
  }

  saveLocalTransactions(seededList);
  return seededList;
}

// Settings Services
export async function saveCafeSettings(settings: CafeSettings): Promise<void> {
  saveLocalSettings(settings);
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'general');
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    console.warn('Error saving settings to firestore:', err);
  }
}

export async function fetchCafeSettings(): Promise<CafeSettings> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, 'general');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as CafeSettings;
      saveLocalSettings(data);
      return data;
    }
  } catch (err) {
    console.warn('Error fetching settings from firestore:', err);
  }
  return getLocalSettings();
}

// Staff Accounts Firestore & Offline Services
export function getLocalStaffAccounts(): StaffAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_STAFF_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(DEFAULT_STAFF_ACCOUNTS));
      return DEFAULT_STAFF_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(DEFAULT_STAFF_ACCOUNTS));
      return DEFAULT_STAFF_ACCOUNTS;
    }
    return parsed;
  } catch {
    return DEFAULT_STAFF_ACCOUNTS;
  }
}

export function saveLocalStaffAccounts(accounts: StaffAccount[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Error saving local staff accounts:', err);
  }
}

export async function getStaffAccounts(): Promise<StaffAccount[]> {
  try {
    const colRef = collection(db, STAFF_COLLECTION);
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: StaffAccount[] = [];
      snap.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id } as StaffAccount);
      });
      list.sort((a, b) => a.createdAt - b.createdAt);
      saveLocalStaffAccounts(list);
      return list;
    } else {
      // Seed default staff accounts to Firestore if empty
      const batch = writeBatch(db);
      DEFAULT_STAFF_ACCOUNTS.forEach(staff => {
        const docRef = doc(db, STAFF_COLLECTION, staff.id);
        batch.set(docRef, { ...staff, serverTimestamp: serverTimestamp() });
      });
      await batch.commit();
      return DEFAULT_STAFF_ACCOUNTS;
    }
  } catch (err) {
    console.warn('Error fetching staff accounts from Firestore, using local:', err);
  }
  return getLocalStaffAccounts();
}

export async function saveStaffAccount(staff: StaffAccount): Promise<StaffAccount> {
  const current = getLocalStaffAccounts();
  const id = staff.id || 'staff_' + staff.phoneNumber.replace(/\D/g, '') || ('staff_' + Date.now());
  const updatedStaff: StaffAccount = {
    ...staff,
    id,
    updatedAt: Date.now(),
    createdAt: staff.createdAt || Date.now(),
  };

  const existsIndex = current.findIndex(s => s.id === id);
  let updatedList: StaffAccount[];
  if (existsIndex >= 0) {
    updatedList = [...current];
    updatedList[existsIndex] = updatedStaff;
  } else {
    updatedList = [...current, updatedStaff];
  }

  saveLocalStaffAccounts(updatedList);

  // Sync to Firestore
  try {
    const docRef = doc(db, STAFF_COLLECTION, id);
    await setDoc(docRef, {
      ...updatedStaff,
      serverTimestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore write staff error:', err);
  }

  return updatedStaff;
}

export async function deleteStaffAccount(id: string): Promise<void> {
  const current = getLocalStaffAccounts();
  const filtered = current.filter(s => s.id !== id);
  saveLocalStaffAccounts(filtered);

  try {
    const docRef = doc(db, STAFF_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete staff error:', err);
  }
}

export function subscribeToStaffAccounts(
  onUpdate: (staffs: StaffAccount[]) => void
) {
  // First emit local cache
  const local = getLocalStaffAccounts();
  onUpdate(local);

  try {
    const colRef = collection(db, STAFF_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: StaffAccount[] = [];
          snapshot.forEach(docSnap => {
            list.push({ ...docSnap.data(), id: docSnap.id } as StaffAccount);
          });
          list.sort((a, b) => a.createdAt - b.createdAt);
          saveLocalStaffAccounts(list);
          onUpdate(list);
        } else {
          // If Firestore is empty, seed defaults
          getStaffAccounts().then(seed => onUpdate(seed));
        }
      },
      (err) => {
        console.warn('Firestore staff subscription error:', err);
        onUpdate(getLocalStaffAccounts());
      }
    );
    return unsubscribe;
  } catch {
    return () => {};
  }
}

// User Profile & Phone/Password Authentication Services
export interface CustomPhoneUser {
  phoneNumber: string;
  name: string;
  passwordHash: string;
  role: 'owner' | 'manager' | 'barista';
  createdAt: number;
}

export function getCustomPhoneUsers(): CustomPhoneUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomPhoneUser(user: CustomPhoneUser) {
  const users = getCustomPhoneUsers();
  const filtered = users.filter(u => u.phoneNumber !== user.phoneNumber);
  localStorage.setItem(LOCAL_STORAGE_CUSTOM_USERS_KEY, JSON.stringify([...filtered, user]));
}

export async function registerWithPhoneAndName(params: {
  phoneNumber: string;
  name: string;
  password: string;
  role?: 'owner' | 'manager' | 'barista';
}): Promise<CafeUserProfile> {
  const { phoneNumber, name, password, role = 'owner' } = params;
  
  // Also register/save in staff accounts
  await saveStaffAccount({
    id: 'staff_' + phoneNumber.replace(/\D/g, ''),
    name,
    phoneNumber,
    password,
    role,
    description: role === 'owner' ? 'เจ้าของร้าน • สิทธิ์เต็มระบบ' : role === 'manager' ? 'ผู้จัดการร้าน • จัดการข้อมูล & รายงาน' : 'บาริสต้า / แคชเชียร์ • บันทึกรับ-จ่ายหน้าร้าน',
    createdAt: Date.now(),
  });

  const profile: CafeUserProfile = {
    uid: 'phone_' + phoneNumber.replace(/\D/g, ''),
    displayName: name,
    phoneNumber,
    role,
    createdAt: Date.now(),
  };

  // Save to Firestore users collection
  try {
    const userRef = doc(db, USERS_COLLECTION, profile.uid);
    await setDoc(userRef, {
      ...profile,
      serverTimestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Error saving phone user to Firestore:', err);
  }

  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
  return profile;
}

export async function loginWithPhoneAndPassword(phoneNumber: string, password: string): Promise<CafeUserProfile> {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // 1. Check in Staff Accounts
  const staffList = getLocalStaffAccounts();
  const staff = staffList.find(s => s.phoneNumber.replace(/\D/g, '') === cleanPhone);
  if (staff) {
    if (!staff.password || staff.password === password) {
      const profile: CafeUserProfile = {
        uid: staff.id,
        displayName: staff.name,
        phoneNumber: staff.phoneNumber,
        role: staff.role,
        createdAt: staff.createdAt,
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      return profile;
    } else {
      throw new Error('รหัสผ่านไม่ถูกต้อง');
    }
  }

  // 2. Check in Custom Phone users
  const users = getCustomPhoneUsers();
  const user = users.find(u => u.phoneNumber.replace(/\D/g, '') === cleanPhone);
  
  const passwordHash = btoa(encodeURIComponent(password));
  if (user && user.passwordHash === passwordHash) {
    const profile: CafeUserProfile = {
      uid: 'phone_' + cleanPhone,
      displayName: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      createdAt: user.createdAt,
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    return profile;
  }

  // 3. Check Firestore if online
  try {
    const uid = 'phone_' + cleanPhone;
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as CafeUserProfile;
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Error querying phone user from firestore:', err);
  }

  // Auto-create new staff profile if valid
  return registerWithPhoneAndName({
    phoneNumber,
    name: 'ผู้จัดการร้าน (' + (phoneNumber.slice(-4) || 'ใหม่') + ')',
    password,
    role: 'owner',
  });
}

export function getCurrentSavedUser(): CafeUserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCurrentSavedUser() {
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
}
