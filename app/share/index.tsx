import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Share2 } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@components/Button';
import { Screen } from '@components/Screen';
import { ShareCategoryPicker } from '@components/ShareCategoryPicker';
import { ShareLinkCard } from '@components/ShareLinkCard';
import { Text } from '@components/Text';
import { buildShareUrl, createActivityShare } from '@lib/share';
import { assertCanCreateShare } from '@lib/freemium';
import { useAuthStore } from '@store/authStore';
import { useBabyStore } from '@store/babyStore';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { handleFreemiumError } from '@utils/freemiumError';
import { PLUS_MESSAGES, promptPlusUpgrade } from '@utils/plusUpgrade';
import type { ActivityShare } from '@app-types/share';
import {
  filterEntriesForShare,
  shareFilterLabel,
} from '@utils/share';

export default function ShareActivitiesScreen() {
  const router = useRouter();
  const subscriptionLoading = useSubscriptionStore((s) => s.loading);
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (subscriptionLoading) return;
    if (!isPremium()) {
      promptPlusUpgrade(PLUS_MESSAGES.share);
      router.back();
    }
  }, [subscriptionLoading, isPremium, router]);
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const entries = useBabyStore((s) => s.entries);

  const activeBaby = babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null;

  const [allSelected, setAllSelected] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [share, setShare] = useState<ActivityShare | null>(null);

  const filterMode = allSelected ? 'all' : 'categories';
  const previewEntries = useMemo(
    () => filterEntriesForShare(entries, filterMode, selectedIds),
    [entries, filterMode, selectedIds],
  );

  const filterLabel = shareFilterLabel(filterMode, selectedIds);

  const handleSelectAll = () => {
    setAllSelected(true);
    setSelectedIds([]);
  };

  const handleToggleCategory = (id: string) => {
    setAllSelected(false);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleCreate = async () => {
    if (!user || !activeBaby) {
      Alert.alert('No baby profile', 'Add your baby before sharing activities.');
      return;
    }
    if (!allSelected && selectedIds.length === 0) {
      Alert.alert('Pick categories', 'Select at least one activity type or choose All activities.');
      return;
    }
    if (previewEntries.length === 0) {
      Alert.alert('Nothing to share', 'There are no logged activities for this selection yet.');
      return;
    }

    setCreating(true);
    try {
      await assertCanCreateShare(
        user.id,
        useSubscriptionStore.getState().getFreemiumAccess(),
      );
      const created = await createActivityShare({
        babyId: activeBaby.id,
        userId: user.id,
        filterMode,
        activityIds: allSelected ? [] : selectedIds,
      });
      setShare(created);
    } catch (error) {
      if (handleFreemiumError(error)) return;
      Alert.alert('Could not create link', (error as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const shareUrl = share ? buildShareUrl(share.token) : '';
  const expiresLabel = share
    ? formatDistanceToNow(new Date(share.expires_at), { addSuffix: true })
    : '';

  return (
    <Screen scroll contentClassName="pb-10">
      <View className="mb-6 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-ink-50 dark:bg-ink-700"
        >
          <ChevronLeft size={22} color="#9CA3AF" />
        </Pressable>
        <View className="flex-1">
          <Text variant="subtitle" className="font-bold">
            Share activities
          </Text>
          <Text variant="caption" muted>
            {activeBaby ? `${activeBaby.name}'s log` : 'Select what to share'}
          </Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-pink-50 dark:bg-ink-600">
          <Share2 size={18} color="#FB7185" />
        </View>
      </View>

      {!share ? (
        <>
          <View className="mb-6 rounded-3xl border border-ink-100/60 bg-lavender-100/60 p-5 dark:border-ink-600 dark:bg-lavender-200/10">
            <Text variant="caption" className="leading-6 text-ink-700 dark:text-ink-100">
              Create a secure link or QR code so partners, family, or caregivers can view
              selected activities. Links expire after 7 days.
            </Text>
          </View>

          <ShareCategoryPicker
            allSelected={allSelected}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onToggleCategory={handleToggleCategory}
          />

          <View className="mt-8 gap-3">
            <Text variant="caption" muted className="text-center">
              {previewEntries.length}{' '}
              {previewEntries.length === 1 ? 'activity' : 'activities'} will be included
            </Text>
            <Button onPress={handleCreate} loading={creating} size="lg" fullWidth>
              Create share link
            </Button>
          </View>
        </>
      ) : (
        <View className="gap-4">
          <ShareLinkCard
            url={shareUrl}
            filterLabel={filterLabel}
            entryCount={previewEntries.length}
            expiresLabel={expiresLabel}
          />
          <Button variant="ghost" onPress={() => setShare(null)} fullWidth>
            Create another link
          </Button>
          <Button
            variant="secondary"
            onPress={() =>
              router.push({ pathname: '/share/[token]', params: { token: share.token } })
            }
            fullWidth
          >
            Preview shared view
          </Button>
        </View>
      )}
    </Screen>
  );
}
