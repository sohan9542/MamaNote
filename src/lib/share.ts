import * as Linking from 'expo-linking';

import { supabase } from '@lib/supabase';
import type { ActivityShare, SharedActivityPayload, ShareFilterMode } from '@app-types/share';

const DEFAULT_EXPIRY_DAYS = 7;

export function buildShareUrl(token: string): string {
  const base = process.env.EXPO_PUBLIC_SHARE_BASE_URL?.replace(/\/$/, '');
  if (base) return `${base}/${token}`;
  return Linking.createURL(`share/${token}`);
}

export async function createActivityShare(params: {
  babyId: string;
  userId: string;
  filterMode: ShareFilterMode;
  activityIds: string[];
  expiresInDays?: number;
}): Promise<ActivityShare> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (params.expiresInDays ?? DEFAULT_EXPIRY_DAYS));

  const { data, error } = await supabase
    .from('activity_shares')
    .insert({
      baby_id: params.babyId,
      user_id: params.userId,
      filter_mode: params.filterMode,
      activity_ids: params.activityIds,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ActivityShare;
}

export async function fetchSharedActivities(token: string): Promise<SharedActivityPayload> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Supabase is not configured');

  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const res = await fetch(
    `${supabaseUrl}/functions/v1/get-shared-activities?token=${encodeURIComponent(token)}`,
    {
      headers: anonKey
        ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
        : undefined,
    },
  );

  const body = (await res.json().catch(() => ({}))) as SharedActivityPayload & {
    error?: string;
  };

  if (!res.ok) {
    throw new Error(body.error ?? 'This share link is invalid or has expired');
  }

  return body;
}
