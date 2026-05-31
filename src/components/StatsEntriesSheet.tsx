import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { LogEntryDetailSheet } from './LogEntryDetailSheet';
import { LogEntryRow } from './LogEntryRow';
import { Text } from './Text';
import type { LogEntry } from '@app-types/database';

interface Props {
  visible: boolean;
  title: string;
  entries: LogEntry[];
  onClose: () => void;
  onUpdated?: () => void;
}

export function StatsEntriesSheet({
  visible,
  title,
  entries,
  onClose,
  onUpdated,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <StatsEntriesSheetContent
      visible={visible}
      title={title}
      entries={entries}
      onClose={onClose}
      onUpdated={onUpdated}
      insets={insets}
    />
  );
}

function StatsEntriesSheetContent({
  visible,
  title,
  entries,
  onClose,
  onUpdated,
  insets,
}: Props & { insets: { bottom: number } }) {
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View className="flex-1 justify-end">
          <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
          <View
            className="max-h-[85%] rounded-t-[28px] bg-white pt-3 dark:bg-ink-800"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="mb-4 items-center px-5">
              <View className="mb-4 h-1 w-10 rounded-full bg-ink-200 dark:bg-ink-600" />
              <View className="w-full flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text variant="subtitle" className="font-bold">
                    {title}
                  </Text>
                  <Text variant="caption" muted className="mt-0.5">
                    {entries.length} {entries.length === 1 ? 'activity' : 'activities'}
                  </Text>
                </View>
                <Pressable
                  onPress={onClose}
                  className="h-10 w-10 items-center justify-center rounded-full bg-ink-50 dark:bg-ink-700"
                >
                  <X size={20} color="#9CA3AF" />
                </Pressable>
              </View>
            </View>

            <ScrollView className="px-5" contentContainerClassName="gap-3 pb-4">
              {entries.length === 0 ? (
                <View className="items-center rounded-3xl border border-dashed border-ink-200 py-12 dark:border-ink-600">
                  <Text muted variant="caption">
                    No activities for this selection.
                  </Text>
                </View>
              ) : (
                entries.map((entry) => (
                  <LogEntryRow
                    key={entry.id}
                    entry={entry}
                    onPress={() => setSelectedEntry(entry)}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <LogEntryDetailSheet
        entry={selectedEntry}
        visible={selectedEntry != null}
        onClose={() => setSelectedEntry(null)}
        onUpdated={() => onUpdated?.()}
      />
    </>
  );
}
