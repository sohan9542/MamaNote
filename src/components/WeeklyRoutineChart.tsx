import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { Text } from './Text';
import type { ChartBlock, DayChartData } from '@utils/scheduleChart';

const HOURS = [0, 3, 6, 9, 12, 15, 18, 21];
const CHART_HEIGHT = 220;
const PAD_LEFT = 36;
const PAD_TOP = 8;
const PAD_BOTTOM = 28;

interface Props {
  data: DayChartData[];
  title?: string;
  onBlockPress?: (block: ChartBlock, day: DayChartData) => void;
  onDayPress?: (day: DayChartData) => void;
}

export function WeeklyRoutineChart({
  data,
  title = '7 days',
  onBlockPress,
  onDayPress,
}: Props) {
  const [width, setWidth] = useState(0);

  const chartWidth = Math.max(width - PAD_LEFT - 8, 1);
  const dayWidth = chartWidth / Math.max(data.length, 1);
  const totalHeight = CHART_HEIGHT + PAD_TOP + PAD_BOTTOM;

  const hourLabels = useMemo(
    () =>
      HOURS.map((h) => {
        const label =
          h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`;
        const y = PAD_TOP + (h / 24) * CHART_HEIGHT;
        return { label, y };
      }),
    [],
  );

  const interactive = Boolean(onBlockPress || onDayPress);

  return (
    <View
      className="overflow-hidden rounded-3xl border border-ink-100/50 bg-white p-4 dark:border-ink-600 dark:bg-ink-700"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="subtitle" className="font-bold">
          Weekly overview
        </Text>
        <View className="rounded-full bg-lavender-100 px-3 py-1 dark:bg-lavender-200/15">
          <Text variant="caption" className="font-semibold text-lavender-700 dark:text-lavender-200">
            {title}
          </Text>
        </View>
      </View>

      {interactive ? (
        <Text variant="caption" muted className="mb-2">
          Tap a block to view that activity
        </Text>
      ) : null}

      {width > 0 && (
        <Svg width={width - 32} height={totalHeight}>
          {hourLabels.map(({ label, y }) => (
            <SvgText key={label} x={0} y={y + 4} fontSize={10} fill="#9CA3AF">
              {label}
            </SvgText>
          ))}

          {data.flatMap((day, dayIndex) => {
            const x = PAD_LEFT + dayIndex * dayWidth + 2;
            const barW = Math.max(dayWidth - 4, 6);

            const blocks = day.blocks.map((block, bi) => {
              const y = PAD_TOP + (block.startHour / 24) * CHART_HEIGHT;
              const h = Math.max((block.durationHours / 24) * CHART_HEIGHT, 3);
              return (
                <Rect
                  key={`${day.dateKey}-${bi}`}
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={3}
                  fill={block.color}
                  opacity={0.92}
                  onPress={
                    onBlockPress ? () => onBlockPress(block, day) : undefined
                  }
                />
              );
            });

            blocks.push(
              <SvgText
                key={`${day.dateKey}-label`}
                x={x + barW / 2}
                y={totalHeight - 6}
                fontSize={10}
                fill="#6B7280"
                textAnchor="middle"
                onPress={onDayPress ? () => onDayPress(day) : undefined}
              >
                {day.label}
              </SvgText>,
            );

            return blocks;
          })}
        </Svg>
      )}

      {data.every((d) => d.blocks.length === 0) && (
        <View className="items-center py-8">
          <Text muted variant="caption" className="px-4 text-center">
            Log sleep, feeds, and diapers to see your weekly rhythm here.
          </Text>
        </View>
      )}
    </View>
  );
}
