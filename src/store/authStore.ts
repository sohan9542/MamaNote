import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  loading: boolean;
  /** Email awaiting OTP verification after sign-up */
  pendingVerificationEmail: string | null;
  /** Email awaiting recovery OTP before setting a new password */
  pendingPasswordResetEmail: string | null;
  setSession: (session: Session | null) => void;
  setPendingVerificationEmail: (email: string | null) => void;
  setPendingPasswordResetEmail: (email: string | null) => void;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,
  loading: false,
  pendingVerificationEmail: null,
  pendingPasswordResetEmail: null,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setPendingVerificationEmail: (email) => set({ pendingVerificationEmail: email }),
  setPendingPasswordResetEmail: (email) => set({ pendingPasswordResetEmail: email }),
  hydrate: async () => {
    set({ loading: true });
    const { data } = await supabase.auth.getSession();
    set({
      session: data.session,
      user: data.session?.user ?? null,
      initialized: true,
      loading: false,
    });

    supabase.auth.onAuthStateChange((event, session) => {
      set({ session, user: session?.user ?? null });
      // Keep pending email through sign-out after sign-up (until OTP verified)
      if (event === 'SIGNED_OUT') {
        return;
      }
      if (session?.user?.email_confirmed_at) {
        set({ pendingVerificationEmail: null });
      }
    });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, pendingVerificationEmail: null, pendingPasswordResetEmail: null });
  },
}));
