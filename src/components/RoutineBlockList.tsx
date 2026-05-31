import { View } from 'react-native';

import { Text } from './Text';
import { ACTIVITY_CHART_COLORS } from '@constants/logFields';
import type { GeneratedRoutine, RoutineBlock } from '@app-types/schedule';
import type { LogEntryType } from '@app-types/database';

const TYPE_EMOJI: Record<LogEntryType, string> = {
  sleep: '🌙',
  feeding: '🍼',
  diaper: '👶',
  pump: '💧',
  medication: '💊',
  note: '📝',
};

function formatTimeShort(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const hour = h % 12 || 12;
  const ampm = h < 12 ? 'am' : 'pm';
  return m ? `${hour}:${String(m).padStart(2, '0')}${ampm}` : `${hour}${ampm}`;
}

interface Props {
  routine: GeneratedRoutine;
  /** Hide long summary — routine screen shows one-liner elsewhere */
  compact?: boolean;
}

export function RoutineBlockList({ routine, compact = false }: Props) {
  const tips = [
    ...routine.recommendations.slice(0, 2),
    ...routine.weeklyInsights.slice(0, 1),
  ].slice(0, 3);

  return (
    <View className="gap-5">
      {!compact && routine.summary ? (
        <Text variant="caption" className="text-center leading-5 text-ink-600 dark:text-ink-200">
          {firstSentence(routine.summary)}
        </Text>
      ) : null}

      <View className="gap-0">
        {routine.typicalDay.map((block, i) => (
          <TimelineRow
            key={`${block.startTime}-${i}`}
            block={block}
            isLast={i === routine.typicalDay.length - 1}
          />
        ))}
      </View>

      {tips.length > 0 ? (
        <View className="flex-row flex-wrap justify-center gap-2">
          {tips.map((tip, i) => (
            <View
              key={i}
              className="rounded-full bg-mint-100 px-3 py-2 dark:bg-mint-100/10"
            >
              <Text variant="caption" className="text-[12px] font-medium text-ink-700 dark:text-ink-100">
                💡 {shortTip(tip)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function TimelineRow({ block, isLast }: { block: RoutineBlock; isLast: boolean }) {
  const color = ACTIVITY_CHART_COLORS[block.type] ?? '#8B5CF6';
  const emoji = TYPE_EMOJI[block.type] ?? '✨';

  return (
    <View className="flex-row gap-3">
      <View className="items-center">
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${color}22` }}
        >
          <Text className="text-xl">{emoji}</Text>
        </View>
        {!isLast ? (
          <View className="my-1 w-0.5 flex-1 min-h-[16px] rounded-full bg-ink-100 dark:bg-ink-600" />
        ) : null}
      </View>

      <View className={`flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
        <View className="flex-row items-center justify-between">
          <Text variant="subtitle" className="text-[15px] font-bold">
            {block.label}
          </Text>
          <Text variant="caption" className="font-semibold text-ink-500">
            {formatTimeShort(block.startTime)}
            {block.endTime !== block.startTime
              ? ` – ${formatTimeShort(block.endTime)}`
              : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

function firstSentence(text: string): string {
  const cut = text.match(/^[^.!?]+[.!?]?/)?.[0]?.trim();
  return cut && cut.length < text.length ? cut : text.slice(0, 120);
}

function shortTip(text: string): string {
  if (text.length <= 48) return text;
  return `${text.slice(0, 45).trim()}…`;
}

/** Big playful "what's next" cards */
export function RoutineNextCards({
  feed,
  sleep,
}: {
  feed?: string;
  sleep?: string;
}) {
  if (!feed && !sleep) return null;

  return (
    <View className="flex-row gap-3">
      {feed ? (
        <View className="flex-1 items-center rounded-3xl bg-orange-100 px-3 py-4 dark:bg-orange-950/40">
          <Text className="text-3xl">🍼</Text>
          <Text variant="caption" muted className="mt-2">
            Next feed
          </Text>
          <Text variant="caption" className="mt-0.5 text-center font-bold text-orange-800 dark:text-orange-200">
            {shortTip(feed)}
          </Text>
        </View>
      ) : null}
      {sleep ? (
        <View className="flex-1 items-center rounded-3xl bg-violet-100 px-3 py-4 dark:bg-violet-950/40">
          <Text className="text-3xl">🌙</Text>
          <Text variant="caption" muted className="mt-2">
            Next nap
          </Text>
          <Text variant="caption" className="mt-0.5 text-center font-bold text-violet-800 dark:text-violet-200">
            {shortTip(sleep)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
