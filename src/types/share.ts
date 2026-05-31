export type ShareFilterMode = 'all' | 'categories';

export interface ActivityShare {
  id: string;
  baby_id: string;
  user_id: string;
  token: string;
  filter_mode: ShareFilterMode;
  activity_ids: string[];
  expires_at: string;
  created_at: string;
}

export interface SharedActivityEntry {
  id: string;
  title: string;
  detail: string;
  startedAt: string;
  type: string;
  activityId: string | null;
}

export interface SharedActivityPayload {
  babyName: string;
  babyAge: string;
  filterLabel: string;
  sharedAt: string;
  expiresAt: string;
  entryCount: number;
  entries: SharedActivityEntry[];
}
