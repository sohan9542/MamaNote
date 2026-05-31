import { supabase } from './supabase';

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function signInWithEmail(email: string, password: string) {
  const normalized = normalizeEmail(email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      const err = new Error('EMAIL_NOT_CONFIRMED') as Error & { email?: string };
      err.email = normalized;
      throw err;
    }
    throw error;
  }

  if (data.user && !data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    const err = new Error('EMAIL_NOT_CONFIRMED') as Error & { email?: string };
    err.email = data.user.email ?? normalizeEmail(email);
    throw err;
  }

  return data;
}

export type SignUpResult = {
  user: NonNullable<Awaited<ReturnType<typeof supabase.auth.signUp>>['data']['user']>;
  needsEmailVerification: boolean;
};

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string,
): Promise<SignUpResult> {
  const normalized = normalizeEmail(email);
  const { data, error } = await supabase.auth.signUp({
    email: normalized,
    password,
    options: {
      data: { full_name: fullName ?? '' },
    },
  });
  if (error) throw error;

  if (!data.user) {
    throw new Error('Sign up did not return a user. Try again or use a different email.');
  }

  const needsEmailVerification = !data.user.email_confirmed_at;

  // Clear session until OTP is verified (avoids root guard sending user to tabs)
  if (data.session) {
    await supabase.auth.signOut();
  }

  return { user: data.user, needsEmailVerification };
}

/** Verify the 6-digit code from the signup email (Supabase OTP). */
export async function verifySignupOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizeEmail(email),
    token: token.trim(),
    type: 'signup',
  });
  if (error) throw error;
  return data;
}

/** Resend the 6-digit signup code. */
export async function resendSignupOtp(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizeEmail(email),
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email));
  if (error) throw error;
}

/** Verify the 6-digit recovery code from the reset-password email. */
export async function verifyRecoveryOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizeEmail(email),
    token: token.trim(),
    type: 'recovery',
  });
  if (error) throw error;
  return data;
}

/** Resend the 6-digit password recovery code. */
export async function resendRecoveryOtp(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email));
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export function isEmailConfirmed(user: { email_confirmed_at?: string | null } | null) {
  return Boolean(user?.email_confirmed_at);
}
