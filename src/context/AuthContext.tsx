import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword as fbUpdatePassword,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirebaseAuth, getDb } from '../firebase';
import { firestoreService, sanitizeDoc } from '../services/firestoreService';
import { StaffUser, UserProfile } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: StaffUser | null;
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  staffList: StaffUser[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isClientPortal: boolean;
  setCurrentUser: (user: StaffUser | null) => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<StaffUser> & { currentPassword?: string; newPassword?: string }) => Promise<{ success: boolean; error?: string }>;
  refreshStaff: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'maplex_current_user';

// Initial fallback staff mapping with complete Leadership Roles & Equal Full Access
const KNOWN_STAFF_MAP: Record<string, Partial<StaffUser>> = {
  'luke.cowan@maplexfinancial.com': {
    id: 'staff-luke',
    name: 'Luke',
    fullName: 'Luke Cowan',
    title: 'The King',
    portalTitle: 'The King',
    jobTitle: 'CEO / Owner',
    department: 'Executive Leadership',
    role: 'INTERNAL_STAFF_ADMIN',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    isCoreLeadership: true,
    phone: '(555) 345-6789',
    discordUsername: 'lukecowan',
    responsibilities: [
      'CEO',
      'Owner',
      'Overall company leadership',
      'Strategic decisions',
      'Business management',
      'Company growth',
      'Final oversight',
      'Lender relationships',
      'Client relationships',
      'Sales oversight',
      'Operations oversight',
      'Financial oversight',
      'Team leadership',
    ],
  },
  'dana.javier@maplexfinancial.com': {
    id: 'staff-dana',
    name: 'Dana',
    fullName: 'Dana Javier',
    title: 'Supreme Funding Commander',
    portalTitle: 'Supreme Funding Commander',
    jobTitle: 'Operations Director',
    department: 'Operations & Underwriting',
    role: 'INTERNAL_STAFF_ADMIN',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    isCoreLeadership: true,
    phone: '(555) 234-5678',
    discordUsername: 'dana_javier',
    responsibilities: [
      'Operations Director',
      'Underwriting',
      'Does mostly everything needed to get clients funded',
      'Talks to lenders',
      'Works directly with clients',
      'Reviews applications',
      'Reviews documents',
      'Handles underwriting',
      'Coordinates funding',
      'Works with lenders to get clients funded',
      'Handles funding conditions',
      'Helps move deals through the funding process',
      'Client verification/follow-up when necessary',
      'General company operations as needed',
    ],
  },
  'robert@maplexfinancial.com': {
    id: 'staff-robert',
    name: 'Robert',
    fullName: 'Robert Bennett',
    title: 'Hand of the King',
    portalTitle: 'Hand of the King',
    jobTitle: 'Operations / Automation / Technology / Growth',
    department: 'Operations & Technology',
    role: 'INTERNAL_STAFF_ADMIN',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    isCoreLeadership: true,
    phone: '(555) 567-8901',
    discordUsername: 'robert_maplex',
    responsibilities: [
      'Automations',
      'GoHighLevel',
      'Discord',
      'Dialer systems',
      'CRM systems',
      'Technology',
      'Website development',
      'Portal development',
      'Company systems',
      'Research',
      'Finding better tools',
      'Finding better processes',
      'Improving company efficiency',
      'Building systems that make everyone\'s jobs faster',
      'Creating systems needed by the company',
      'Business growth research',
      'Operations improvement',
      'Sales calls',
      'Client verification before sending clients to Dana',
      'Text blasts',
      'Marketing automation',
      'CRM automation',
      'Integration management',
      'Technical troubleshooting',
      'Website management',
      'Portal management',
      'Creating new technology/processes for the company',
    ],
  },
  'rtnmbennett.ambrosia@gmail.com': {
    id: 'staff-robert',
    name: 'Robert',
    fullName: 'Robert Bennett',
    title: 'Hand of the King',
    portalTitle: 'Hand of the King',
    jobTitle: 'Operations / Automation / Technology / Growth',
    department: 'Operations & Technology',
    role: 'INTERNAL_STAFF_ADMIN',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    isCoreLeadership: true,
    phone: '(555) 567-8901',
    discordUsername: 'robert_maplex',
    responsibilities: [
      'Automations',
      'GoHighLevel',
      'Discord',
      'Dialer systems',
      'CRM systems',
      'Technology',
      'Website development',
      'Portal development',
      'Company systems',
      'Research',
      'Finding better tools',
      'Finding better processes',
      'Improving company efficiency',
      'Building systems that make everyone\'s jobs faster',
      'Creating systems needed by the company',
      'Business growth research',
      'Operations improvement',
      'Sales calls',
      'Client verification before sending clients to Dana',
      'Text blasts',
      'Marketing automation',
      'CRM automation',
      'Integration management',
      'Technical troubleshooting',
      'Website management',
      'Portal management',
      'Creating new technology/processes for the company',
    ],
  },
  'rtnmbennett007@gmail.com': {
    id: 'staff-robert',
    name: 'Robert',
    fullName: 'Robert Bennett',
    title: 'Hand of the King',
    portalTitle: 'Hand of the King',
    jobTitle: 'Operations / Automation / Technology / Growth',
    department: 'Operations & Technology',
    role: 'INTERNAL_STAFF_ADMIN',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    isCoreLeadership: true,
    phone: '(555) 567-8901',
    discordUsername: 'robert_maplex',
  },
  'elev8deals@gmail.com': {
    id: 'staff-robert',
    name: 'Robert',
    fullName: 'Robert Bennett',
    title: 'Hand of the King',
    portalTitle: 'Hand of the King',
    jobTitle: 'Operations / Automation / Technology / Growth',
    department: 'Operations & Technology',
    role: 'INTERNAL_STAFF_ADMIN',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    isCoreLeadership: true,
    phone: '(555) 567-8901',
    discordUsername: 'robert_maplex',
  },
  'robert.tracy.bennett24@gmail.com': {
    id: 'staff-robert',
    name: 'Robert',
    fullName: 'Robert Bennett',
    title: 'Hand of the King',
    portalTitle: 'Hand of the King',
    jobTitle: 'Operations / Automation / Technology / Growth',
    department: 'Operations & Technology',
    role: 'INTERNAL_STAFF_ADMIN',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    isCoreLeadership: true,
    phone: '(555) 567-8901',
    discordUsername: 'robert_maplex',
    responsibilities: [
      'Automations',
      'GoHighLevel',
      'Discord',
      'Dialer systems',
      'CRM systems',
      'Technology',
      'Website development',
      'Portal development',
      'Company systems',
      'Research',
      'Finding better tools',
      'Finding better processes',
      'Improving company efficiency',
      'Building systems that make everyone\'s jobs faster',
      'Creating systems needed by the company',
      'Business growth research',
      'Operations improvement',
      'Sales calls',
      'Client verification before sending clients to Dana',
      'Text blasts',
      'Marketing automation',
      'CRM automation',
      'Integration management',
      'Technical troubleshooting',
      'Website management',
      'Portal management',
      'Creating new technology/processes for the company',
    ],
  },
  'steve@maplexfinancial.com': {
    id: 'staff-steve',
    name: 'Steve',
    fullName: 'Steve',
    title: 'Grand Sales Wizard',
    portalTitle: 'Grand Sales Wizard',
    jobTitle: 'Sales Director',
    department: 'Sales & Origination',
    role: 'INTERNAL_STAFF_ADMIN',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    isCoreLeadership: true,
    phone: '(555) 456-7890',
    discordUsername: 'steve_maplex',
    responsibilities: [
      'Sales leadership',
      'Sales management',
      'Sales training',
      'Training new setters / Squires',
      'Sales calls',
      'Lead management',
      'Sales process development',
      'Sales coaching',
      'Setter training',
      'Performance management',
      'Client verification before sending clients to Dana',
      'Sales strategy',
      'Helping improve conversion rates',
      'Helping develop the sales team',
    ],
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Subscribe to staff directory only when authenticated
  useEffect(() => {
    if (!firebaseUser && !currentUser) {
      setStaffList([]);
      return;
    }
    const unsub = firestoreService.subscribeStaff((staff) => {
      setStaffList(staff);
    });
    return () => unsub();
  }, [firebaseUser, currentUser]);

  // Sync Auth state (Firebase or Local Session)
  useEffect(() => {
    const auth = getFirebaseAuth();

    if (!auth) {
      // Local session restoration if Firebase Auth is not active
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        if (saved) {
          const user: StaffUser = JSON.parse(saved);
          setCurrentUser(user);
          setUserProfile({
            uid: user.id || 'staff-default',
            email: user.email || 'dana.javier@maplexfinancial.com',
            role: user.role || 'INTERNAL_STAFF_ADMIN',
            name: user.name || 'Dana Javier',
            staffId: user.id || 'staff-dana',
            active: user.active !== undefined ? user.active : true,
            jobTitle: user.jobTitle || 'Director of Operations & Funding',
            department: user.department || 'Operations',
            phone: user.phone || '(555) 234-5678',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Error parsing local auth session:', err);
      }
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const db = getDb();
          let profile: UserProfile | null = null;

          if (db) {
            const userDocRef = doc(db, 'users', fbUser.uid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
              profile = userSnap.data() as UserProfile;
            } else {
              const emailLower = (fbUser.email || '').toLowerCase();
              const knownStaff = KNOWN_STAFF_MAP[emailLower];
              const isClient = emailLower.includes('rostovamedtech.com') || emailLower.includes('client');

              profile = {
                uid: fbUser.uid,
                email: fbUser.email || '',
                role: isClient ? 'client' : 'INTERNAL_STAFF_ADMIN',
                name: knownStaff?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Staff Member',
                fullName: knownStaff?.fullName,
                title: knownStaff?.title,
                portalTitle: knownStaff?.portalTitle || knownStaff?.title,
                responsibilities: knownStaff?.responsibilities,
                permissionGroup: knownStaff?.permissionGroup || 'FULL ACCESS',
                staffId: knownStaff?.id || `staff-${fbUser.uid.substring(0, 6)}`,
                ...(isClient ? { clientId: 'client-2001' } : {}),
                active: true,
                jobTitle: knownStaff?.jobTitle || 'Operations Specialist',
                department: knownStaff?.department || 'Operations',
                discordUsername: knownStaff?.discordUsername,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              await setDoc(userDocRef, sanitizeDoc(profile), { merge: true });
            }
          } else {
            const emailLower = (fbUser.email || '').toLowerCase();
            const knownStaff = KNOWN_STAFF_MAP[emailLower];
            const isClient = emailLower.includes('rostovamedtech.com') || emailLower.includes('client');
            profile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              role: isClient ? 'client' : 'INTERNAL_STAFF_ADMIN',
              name: knownStaff?.name || fbUser.displayName || fbUser.email?.split('@')[0] || 'Staff Member',
              fullName: knownStaff?.fullName,
              title: knownStaff?.title,
              portalTitle: knownStaff?.portalTitle || knownStaff?.title,
              responsibilities: knownStaff?.responsibilities,
              permissionGroup: knownStaff?.permissionGroup || 'FULL ACCESS',
              staffId: knownStaff?.id || `staff-${fbUser.uid.substring(0, 6)}`,
              ...(isClient ? { clientId: 'client-2001' } : {}),
              active: true,
              jobTitle: knownStaff?.jobTitle || 'Operations Specialist',
              department: knownStaff?.department || 'Operations',
              discordUsername: knownStaff?.discordUsername,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }

          if (profile) {
            setUserProfile(profile);
            const emailKey = (fbUser.email || '').toLowerCase();
            const staffMeta = KNOWN_STAFF_MAP[emailKey];

            const staffObj: StaffUser = {
              id: profile.staffId || staffMeta?.id || `staff-${fbUser.uid}`,
              name: profile.name,
              fullName: profile.fullName || staffMeta?.fullName,
              email: profile.email,
              phone: profile.phone || staffMeta?.phone || '(555) 234-5678',
              title: profile.title || staffMeta?.title,
              portalTitle: profile.portalTitle || staffMeta?.portalTitle || staffMeta?.title,
              jobTitle: profile.jobTitle || staffMeta?.jobTitle || 'Operations Specialist',
              department: profile.department || staffMeta?.department || 'Operations',
              role: (profile.role as any) || 'INTERNAL_STAFF_ADMIN',
              responsibilities: profile.responsibilities || staffMeta?.responsibilities,
              permissionGroup: profile.permissionGroup || staffMeta?.permissionGroup || 'FULL ACCESS',
              status: 'ACTIVE',
              isCoreLeadership: staffMeta?.isCoreLeadership !== undefined ? staffMeta?.isCoreLeadership : true,
              avatar: profile.avatar || '',
              active: profile.active !== undefined ? profile.active : true,
              discordUsername: profile.discordUsername || staffMeta?.discordUsername,
            };

            setCurrentUser(staffObj);
            try {
              localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(staffObj));
            } catch {
              // ignore
            }
          }
        } catch (err) {
          console.warn('Error fetching Firestore user profile on auth change:', err);
        }
      } else {
        setUserProfile(null);
        setCurrentUser(null);
        try {
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        } catch {
          // ignore
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string = 'Admin2026!'): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const auth = getFirebaseAuth();

    if (!auth) {
      // Local/Standalone authentication for rapid portal access & demo mode
      const knownStaff = KNOWN_STAFF_MAP[cleanEmail];
      const isClient = cleanEmail.includes('rostovamedtech.com') || cleanEmail.includes('client');

      const staffObj: StaffUser = {
        id: knownStaff?.id || (isClient ? 'client-2001' : `staff-${Date.now()}`),
        name: knownStaff?.name || (cleanEmail.split('@')[0].toUpperCase()),
        fullName: knownStaff?.fullName,
        email: cleanEmail,
        phone: knownStaff?.phone || '(555) 234-5678',
        title: knownStaff?.title,
        portalTitle: knownStaff?.portalTitle || knownStaff?.title,
        jobTitle: knownStaff?.jobTitle || (isClient ? 'Managing Member / Applicant' : 'Operations Specialist'),
        department: knownStaff?.department || (isClient ? 'Executive' : 'Operations'),
        role: isClient ? ('client' as any) : (knownStaff?.role || 'INTERNAL_STAFF_ADMIN'),
        responsibilities: knownStaff?.responsibilities,
        permissionGroup: knownStaff?.permissionGroup || 'FULL ACCESS',
        status: 'ACTIVE',
        isCoreLeadership: knownStaff?.isCoreLeadership !== undefined ? knownStaff?.isCoreLeadership : true,
        discordUsername: knownStaff?.discordUsername,
        avatar: '',
        active: true,
      };

      const profile: UserProfile = {
        uid: staffObj.id,
        email: cleanEmail,
        role: isClient ? 'client' : 'INTERNAL_STAFF_ADMIN',
        name: staffObj.name,
        fullName: staffObj.fullName,
        title: staffObj.title,
        portalTitle: staffObj.portalTitle,
        responsibilities: staffObj.responsibilities,
        permissionGroup: staffObj.permissionGroup,
        staffId: staffObj.id,
        ...(isClient ? { clientId: 'client-2001' } : {}),
        jobTitle: staffObj.jobTitle,
        department: staffObj.department,
        discordUsername: staffObj.discordUsername,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(staffObj));
      } catch {
        // ignore
      }

      setCurrentUser(staffObj);
      setUserProfile(profile);
      setIsLoading(false);
      return { success: true };
    }

    try {
      // Sign in with Firebase Auth
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      } catch (signInErr: any) {
        // Auto-provision initial team credentials if user doesn't exist yet in project
        if (
          signInErr.code === 'auth/user-not-found' ||
          signInErr.code === 'auth/invalid-credential' ||
          signInErr.code === 'auth/invalid-login-credentials'
        ) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              return { success: false, error: 'Incorrect password. Default password is "Admin2026!".' };
            }
            throw signInErr;
          }
        } else {
          throw signInErr;
        }
      }

      if (userCredential && userCredential.user) {
        const fbUser = userCredential.user;
        const db = getDb();
        const knownStaff = KNOWN_STAFF_MAP[cleanEmail];
        const isClient = cleanEmail.includes('rostovamedtech.com') || cleanEmail.includes('client');

        const profile: UserProfile = {
          uid: fbUser.uid,
          email: cleanEmail,
          role: isClient ? 'client' : 'INTERNAL_STAFF_ADMIN',
          name: knownStaff?.name || cleanEmail.split('@')[0],
          fullName: knownStaff?.fullName,
          title: knownStaff?.title,
          portalTitle: knownStaff?.portalTitle || knownStaff?.title,
          responsibilities: knownStaff?.responsibilities,
          permissionGroup: knownStaff?.permissionGroup || 'FULL ACCESS',
          staffId: knownStaff?.id || `staff-${fbUser.uid.substring(0, 6)}`,
          ...(isClient ? { clientId: 'client-2001' } : {}),
          jobTitle: knownStaff?.jobTitle || 'Operations Specialist',
          department: knownStaff?.department || 'Operations',
          discordUsername: knownStaff?.discordUsername,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (db) {
          const userDocRef = doc(db, 'users', fbUser.uid);
          await setDoc(userDocRef, sanitizeDoc(profile), { merge: true });
        }

        setUserProfile(profile);

        const staffObj: StaffUser = {
          id: profile.staffId || `staff-${fbUser.uid}`,
          name: profile.name,
          fullName: profile.fullName || knownStaff?.fullName,
          email: profile.email,
          phone: knownStaff?.phone || '(555) 234-5678',
          title: profile.title || knownStaff?.title,
          portalTitle: profile.portalTitle || knownStaff?.portalTitle || knownStaff?.title,
          jobTitle: profile.jobTitle || 'Operations Specialist',
          department: profile.department || 'Operations',
          role: 'INTERNAL_STAFF_ADMIN',
          responsibilities: profile.responsibilities || knownStaff?.responsibilities,
          permissionGroup: profile.permissionGroup || knownStaff?.permissionGroup || 'FULL ACCESS',
          status: 'ACTIVE',
          isCoreLeadership: knownStaff?.isCoreLeadership !== undefined ? knownStaff?.isCoreLeadership : true,
          discordUsername: profile.discordUsername || knownStaff?.discordUsername,
          avatar: '',
          active: true,
        };

        try {
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(staffObj));
        } catch {
          // ignore
        }

        setCurrentUser(staffObj);
        return { success: true };
      }

      return { success: false, error: 'Authentication failed.' };
    } catch (err: any) {
      console.error('Firebase authentication error:', err);
      let msg = 'Authentication failed. Please verify your email and password.';
      if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      if (err.code === 'auth/wrong-password') msg = 'Incorrect password. Default password is Admin2026!.';
      if (err.code === 'auth/too-many-requests') msg = 'Too many failed attempts. Please try again in a few moments.';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (
    data: Partial<StaffUser> & { currentPassword?: string; newPassword?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    const auth = getFirebaseAuth();

    try {
      if (auth && auth.currentUser) {
        if (data.newPassword && data.newPassword.trim()) {
          await fbUpdatePassword(auth.currentUser, data.newPassword.trim());
        }

        const uid = auth.currentUser.uid;
        const db = getDb();
        const updatedProfile: Partial<UserProfile> = {
          name: data.name,
          phone: data.phone,
          jobTitle: data.jobTitle,
          department: data.department,
          updatedAt: new Date().toISOString(),
        };

        if (db) {
          await setDoc(doc(db, 'users', uid), sanitizeDoc(updatedProfile), { merge: true });
        }
      }

      if (currentUser) {
        const updatedStaff = { ...currentUser, ...data };
        setCurrentUser(updatedStaff);
        try {
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedStaff));
        } catch {
          // ignore
        }
        if (updatedStaff.id) {
          await firestoreService.updateStaffUser(updatedStaff.id, updatedStaff);
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update user profile' };
    }
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('Signout note:', err);
      }
    }
    try {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setUserProfile(null);
    setFirebaseUser(null);
  };

  const refreshStaff = async () => {
    // Handled by Firestore real-time listener
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        userProfile,
        staffList,
        isAuthenticated: !!currentUser || !!firebaseUser,
        isLoading,
        isClientPortal: userProfile?.role === 'client',
        setCurrentUser,
        login,
        logout,
        updateProfile,
        refreshStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
