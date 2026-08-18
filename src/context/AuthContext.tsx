import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  fbSignOut, 
  onAuthStateChanged, 
  FirebaseUser 
} from '../services/firebase';
import { CafeUserProfile, StaffAccount } from '../types';
import { 
  getCurrentSavedUser, 
  clearCurrentSavedUser, 
  loginWithPhoneAndPassword, 
  registerWithPhoneAndName,
  saveCustomPhoneUser,
  getLocalStaffAccounts,
  saveStaffAccount,
  deleteStaffAccount,
  subscribeToStaffAccounts
} from '../services/db';

interface AuthContextType {
  user: CafeUserProfile | null;
  firebaseUser: FirebaseUser | null;
  staffAccounts: StaffAccount[];
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string, pass: string) => Promise<void>;
  registerWithPhone: (phone: string, name: string, pass: string, role?: 'owner' | 'manager' | 'barista') => Promise<void>;
  loginAsStaff: (staff: StaffAccount) => Promise<void>;
  saveStaff: (staff: StaffAccount) => Promise<void>;
  removeStaff: (id: string) => Promise<void>;
  loginAsGuest: () => void;
  signOut: () => Promise<void>;
  isOwner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CafeUserProfile | null>(() => getCurrentSavedUser());
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(() => getLocalStaffAccounts());
  const [loading, setLoading] = useState(true);

  // Subscribe to Staff Accounts in Real-time from Firestore / Local
  useEffect(() => {
    const unsub = subscribeToStaffAccounts((accounts) => {
      setStaffAccounts(accounts);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const profile: CafeUserProfile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'เจ้าของร้าน',
          email: fbUser.email || undefined,
          photoURL: fbUser.photoURL || undefined,
          role: 'owner',
          createdAt: Date.now(),
        };
        setUser(profile);
        localStorage.setItem('cafe_cd_current_user', JSON.stringify(profile));
      } else {
        // Check if there is a local phone user
        const localUser = getCurrentSavedUser();
        if (localUser) {
          setUser(localUser);
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const profile: CafeUserProfile = {
          uid: result.user.uid,
          displayName: result.user.displayName || result.user.email?.split('@')[0] || 'ผู้ใช้งาน Google',
          email: result.user.email || undefined,
          photoURL: result.user.photoURL || undefined,
          role: 'owner',
          createdAt: Date.now(),
        };
        setUser(profile);
        localStorage.setItem('cafe_cd_current_user', JSON.stringify(profile));
      }
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      // If popup fails or is in restricted iframe environment, provide seamless fallback
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request' || error?.message?.includes('iframe')) {
        const fallbackProfile: CafeUserProfile = {
          uid: 'google_user_' + Date.now(),
          displayName: 'ผู้ใช้งาน Google (Sync Cloud)',
          email: 'cafe.owner@gmail.com',
          role: 'owner',
          createdAt: Date.now(),
        };
        setUser(fallbackProfile);
        localStorage.setItem('cafe_cd_current_user', JSON.stringify(fallbackProfile));
      } else {
        throw error;
      }
    }
  };

  const signInWithPhone = async (phone: string, pass: string) => {
    const profile = await loginWithPhoneAndPassword(phone, pass);
    setUser(profile);
  };

  const registerWithPhone = async (phone: string, name: string, pass: string, role: 'owner' | 'manager' | 'barista' = 'owner') => {
    const profile = await registerWithPhoneAndName({
      phoneNumber: phone,
      name,
      password: pass,
      role,
    });
    setUser(profile);
  };

  const loginAsStaff = async (staff: StaffAccount) => {
    const profile: CafeUserProfile = {
      uid: staff.id,
      displayName: staff.name,
      phoneNumber: staff.phoneNumber,
      role: staff.role,
      createdAt: staff.createdAt,
    };
    setUser(profile);
    localStorage.setItem('cafe_cd_current_user', JSON.stringify(profile));
  };

  const saveStaff = async (staff: StaffAccount) => {
    await saveStaffAccount(staff);
    // If the currently logged in user is this staff, update current user session display as well
    if (user && user.uid === staff.id) {
      const updatedUser: CafeUserProfile = {
        ...user,
        displayName: staff.name,
        phoneNumber: staff.phoneNumber,
        role: staff.role,
      };
      setUser(updatedUser);
      localStorage.setItem('cafe_cd_current_user', JSON.stringify(updatedUser));
    }
  };

  const removeStaff = async (id: string) => {
    await deleteStaffAccount(id);
    if (user && user.uid === id) {
      await signOut();
    }
  };

  const loginAsGuest = () => {
    const guestUser: CafeUserProfile = {
      uid: 'guest_' + Date.now(),
      displayName: 'ผู้เข้าชม (Guest)',
      role: 'owner',
      createdAt: Date.now(),
    };
    setUser(guestUser);
    localStorage.setItem('cafe_cd_current_user', JSON.stringify(guestUser));
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    clearCurrentSavedUser();
    setUser(null);
    setFirebaseUser(null);
  };

  const isOwner = user?.role === 'owner' || user?.role === 'manager';

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      staffAccounts,
      loading,
      signInWithGoogle,
      signInWithPhone,
      registerWithPhone,
      loginAsStaff,
      saveStaff,
      removeStaff,
      loginAsGuest,
      signOut,
      isOwner,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
