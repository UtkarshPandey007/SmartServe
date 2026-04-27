// Authentication context — provides user state across the app
import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { createUserProfile, getUserProfile, addVolunteerFromSignup, getVolunteerByUserId, subscribeToVolunteerByUserId } from '../firebase/services';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track the volunteer profile unsubscribe function
  const [volUnsub, setVolUnsub] = useState(null);

  const loadProfiles = async (firebaseUser) => {
    // Clean up previous volunteer subscription
    if (volUnsub) { volUnsub(); setVolUnsub(null); }

    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid);
      setUserProfile(profile);
      // If volunteer, subscribe to real-time profile updates
      if (profile?.role === 'volunteer') {
        const unsub = subscribeToVolunteerByUserId(firebaseUser.uid, setVolunteerProfile);
        setVolUnsub(() => unsub);
      } else {
        setVolunteerProfile(null);
      }
    } else {
      setUserProfile(null);
      setVolunteerProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      await loadProfiles(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signup = async (email, password, displayName, role = 'coordinator', volunteerData = null) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });

    // Create user profile with chosen role
    await createUserProfile(result.user.uid, {
      email,
      displayName,
      role,
      photoURL: null,
    });

    // If volunteer, also create a volunteer document linked by uid
    if (role === 'volunteer' && volunteerData) {
      await addVolunteerFromSignup({
        uid: result.user.uid,
        id: `V-${Date.now().toString(36).toUpperCase()}`,
        name: displayName,
        avatar: displayName.split(' ').map(n => n[0]).join('').slice(0, 2),
        email,
        phone: volunteerData.phone || '',
        skills: volunteerData.skills || [],
        preferredCategories: volunteerData.categories || [],
        location: {
          city: volunteerData.city || '',
          state: volunteerData.state || '',
          lat: 20.5937 + (Math.random() - 0.5) * 10,
          lng: 78.9629 + (Math.random() - 0.5) * 10,
        },
        availability: 'available',
        availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        radius: 25,
        rating: 0,
        tasksCompleted: 0,
        hoursContributed: 0,
        certifications: [],
        joinedAt: new Date().toISOString(),
      });
    }

    // Reload profiles so role is immediately available
    await loadProfiles(result.user);

    return result.user;
  };

  const loginWithGoogle = async (role = 'coordinator') => {
    const result = await signInWithPopup(auth, googleProvider);
    const existing = await getUserProfile(result.user.uid);
    if (!existing) {
      await createUserProfile(result.user.uid, {
        email: result.user.email,
        displayName: result.user.displayName,
        role,
        photoURL: result.user.photoURL,
      });
    }
    // Reload profiles so role is immediately available
    await loadProfiles(result.user);
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Password reset — sends a Firebase password reset email
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Resend email verification to current user
  const resendVerification = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  // Convenience getters
  const isCoordinator = userProfile?.role === 'coordinator';
  const isVolunteer = userProfile?.role === 'volunteer';

  // Check if email is verified (Google users are always verified)
  const isEmailVerified = user?.emailVerified || user?.providerData?.[0]?.providerId === 'google.com';

  const value = {
    user,
    userProfile,
    volunteerProfile,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    resetPassword,
    resendVerification,
    isCoordinator,
    isVolunteer,
    isEmailVerified,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
