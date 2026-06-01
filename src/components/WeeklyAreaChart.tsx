import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { Text } from './Text';
import { useTheme } from '@hooks/useTheme';
import { cn } from '@utils/cn';
import {
  trendUsesWeeklyBuckets,
  type StatsChartPeriod,
  type TrendChartPoint,
} from '@utils/scheduleChart';

const CHART_HEIGHT = 180;
const PAD_LEFT = 40;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;

const PERIODS: { id: StatsChartPeriod; label: string }[] = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'all', label: 'All time' },
];

function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  const hrs = Math.floor(h);
  const m = Math.round((h - hrs) * 60);
  if (m === 0) return `${hrs}h`;
  return `${hrs}h ${m}m`;
}

function buildAreaPath(points: { x: number; y: number }[], baseline: number): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${baseline}`;
  d += ` L ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  d += ` L ${points[points.length - 1].x} ${baseline} Z`;
  return d;
}

function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

interface Props {
  data: TrendChartPoint[];
  period: StatsChartPeriod;
  onPeriodChange: (period: StatsChartPeriod) => void;
  onDayPress?: (point: TrendChartPoint) => void;
}

export function WeeklyAreaChart({ data, period, onPeriodChange, onDayPress }: Props) {
  const { isDark } = useTheme();
  const [width, setWidth] = useState(0);

  const svgWidth = Math.max(width - 32, 1);
  const chartInnerW = Math.max(svgWidth - PAD_LEFT - PAD_RIGHT, 1);
  const totalHeight = CHART_HEIGHT + PAD_TOP + PAD_BOTTOM;

  const maxSleep = useMemo(
    () => Math.max(...data.map((d) => d.sleepHours), 1),
    [data],
  );

  const yMax = useMemo(() => {
    const rounded = Math.ceil(maxSleep);
    return Math.max(rounded, 4);
  }, [maxSleep]);

  const plot = useMemo(() => {
    const n = data.length;
    if (n === 0) return { points: [], coords: [], yTicks: [] as number[] };

    const coords = data.map((point, i) => {
      const x =
        n === 1 ? PAD_LEFT + chartInnerW / 2 : PAD_LEFT + (i / (n - 1)) * chartInnerW;
      const y =
        PAD_TOP + CHART_HEIGHT - (point.sleepHours / yMax) * CHART_HEIGHT;
      return { point, x, y };
    });

    const yTicks = [0, yMax / 2, yMax];

    return { points: data, coords, yTicks };
  }, [data, chartInnerW, yMax]);

  const baseline = PAD_TOP + CHART_HEIGHT;
  const lineCoords = plot.coords.map(({ x, y }) => ({ x, y }));
  const areaPath = buildAreaPath(lineCoords, baseline);
  const linePath = buildLinePath(lineCoords);

  const labelStep = useMemo(() => {
    const n = data.length;
    if (n <= 7) return 1;
    if (n <= 14) return 2;
    if (n <= 30) return 5;
    return Math.ceil(n / 6);
  }, [data.length]);

  const gridColor = isDark ? '#374151' : '#E5E7EB';
  const labelColor = isDark ? '#9CA3AF' : '#6B7280';
  const avgSleep =
    data.length > 0
      ? data.reduce((s, d) => s + d.sleepHours, 0) / data.length
      : 0;

  return (
    <View
      className="overflow-hidden rounded-3xl border border-ink-100/50 bg-white p-4 dark:border-ink-600 dark:bg-ink-700"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <View className="mb-3 flex-row items-center justify-between gap-2">
        <Text variant="subtitle" className="font-bold">
          Sleep overview
        </Text>
        <Text variant="caption" muted>
          Avg {formatHours(avgSleep)}/day
        </Text>
      </View>

      <View className="mb-4 flex-row gap-2">
        {PERIODS.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => onPeriodChange(p.id)}
            className={cn(
              'flex-1 items-center rounded-xl py-2',
              period === p.id
                ? 'bg-lavender-500 dark:bg-lavender-400'
                : 'bg-ink-50 dark:bg-ink-600',
            )}
          >
            <Text
              variant="caption"
              className={cn(
                'font-semibold',
                period === p.id ? 'text-white' : 'text-ink-600 dark:text-ink-200',
              )}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {onDayPress ? (
        <Text variant="caption" muted className="mb-2">
          Tap a point to view that day&apos;s logs
        </Text>
      ) : null}

      {width > 0 && data.length > 0 ? (
        <Svg width={svgWidth} height={totalHeight}>
          <Defs>
            <LinearGradient id="sleepArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#8B5CF6" stopOpacity="0.45" />
              <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0.05" />
            </LinearGradient>
          </Defs>

          {plot.yTicks.map((tick) => {
            const y = PAD_TOP + CHART_HEIGHT - (tick / yMax) * CHART_HEIGHT;
            return (
              <Path
                key={`grid-${tick}`}
                d={`M ${PAD_LEFT} ${y} H ${PAD_LEFT + chartInnerW}`}
                stroke={gridColor}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            );
          })}

          {plot.yTicks.map((tick) => (
            <SvgText
              key={`y-${tick}`}
              x={PAD_LEFT - 6}
              y={PAD_TOP + CHART_HEIGHT - (tick / yMax) * CHART_HEIGHT + 4}
              fontSize={10}
              fill={labelColor}
              textAnchor="end"
            >
              {tick === 0 ? '0' : formatHours(tick)}
            </SvgText>
          ))}

          {areaPath ? <Path d={areaPath} fill="url(#sleepArea)" /> : null}
          {linePath ? (
            <Path d={linePath} stroke="#7C3AED" strokeWidth={2.5} fill="none" />
          ) : null}

          {plot.coords.map(({ point, x, y }) => (
            <Circle
              key={point.dateKey}
              cx={x}
              cy={y}
              r={4}
              fill="#7C3AED"
              stroke="#fff"
              strokeWidth={2}
              onPress={onDayPress ? () => onDayPress(point) : undefined}
            />
          ))}

          {plot.coords.map(({ point, x }, i) => {
            if (i % labelStep !== 0 && i !== plot.coords.length - 1) return null;
            return (
              <SvgText
                key={`x-${point.dateKey}`}
                x={x}
                y={totalHeight - 6}
                fontSize={9}
                fill={labelColor}
                textAnchor="middle"
                onPress={onDayPress ? () => onDayPress(point) : undefined}
              >
                {point.label}
              </SvgText>
            );
          })}
        </Svg>
      ) : null}

      {data.length === 0 ? (
        <View className="items-center py-10">
          <Text muted variant="caption" className="px-4 text-center">
            Log sleep to see trends here.
          </Text>
        </View>
      ) : null}

      <View className="mt-2 flex-row items-center gap-2">
        <View className="h-3 w-3 rounded-sm bg-violet-500" />
        <Text variant="caption" muted>
          Total sleep per {trendUsesWeeklyBuckets(period, data) ? 'week' : 'day'}
        </Text>
      </View>
    </View>
  );
}
