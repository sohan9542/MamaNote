import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';

import { Text } from './Text';
import { FREE_BABY_LIMIT } from '@constants/freemium';
import { useBabyStore } from '@store/babyStore';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { cn } from '@utils/cn';
import { PLUS_MESSAGES, promptPlusUpgrade } from '@utils/plusUpgrade';
import type { Baby } from '@app-types/database';

interface Props {
  className?: string;
  showAddButton?: boolean;
}

export function BabySwitcher({ className, showAddButton = true }: Props) {
  const router = useRouter();
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const selectBaby = useBabyStore((s) => s.selectBaby);
  const isPremium = useSubscriptionStore((s) => s.isPremium);

  if (babies.length === 0) return null;

  const showChips = babies.length > 1;

  const handleAdd = () => {
    if (!isPremium() && babies.length >= FREE_BABY_LIMIT) {
      promptPlusUpgrade(PLUS_MESSAGES.addBaby);
      return;
    }
    router.push('/add-baby');
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn('mb-3', className)}
      contentContainerClassName="gap-2 pr-1"
    >
      {showChips
        ? babies.map((baby) => (
            <BabyChip
              key={baby.id}
              baby={baby}
              selected={baby.id === activeBabyId}
              onPress={() => selectBaby(baby.id)}
            />
          ))
        : null}
      {showAddButton ? (
        <Pressable
          onPress={handleAdd}
          className="flex-row items-center gap-1.5 rounded-full border border-dashed border-pink-300 bg-pink-50 px-4 py-2.5 dark:border-pink-500/40 dark:bg-pink-500/10"
        >
          <Plus size={16} color="#FB7185" />
          <Text variant="caption" className="font-semibold text-pink-500">
            Add baby
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function BabyChip({
  baby,
  selected,
  onPress,
}: {
  baby: Baby;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-full border px-4 py-2.5',
        selected
          ? 'border-pink-400 bg-pink-100 dark:border-pink-300 dark:bg-pink-500/20'
          : 'border-ink-100/60 bg-white dark:border-ink-600 dark:bg-ink-700',
      )}
    >
      <Text
        variant="caption"
        className={cn(
          'font-semibold',
          selected ? 'text-pink-600 dark:text-pink-200' : 'text-ink-700 dark:text-ink-100',
        )}
      >
        {baby.name}
      </Text>
    </Pressable>
  );
}
