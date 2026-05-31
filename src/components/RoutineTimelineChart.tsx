import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { Text } from './Text';
import type { RoutineBlock } from '@app-types/schedule';
import { routineToTimeline } from '@utils/routineTimeline';

const HOURS = [6, 9, 12, 15, 18, 21];
const CHART_HEIGHT = 200;
const PAD_LEFT = 32;
const PAD_TOP = 4;
const PAD_BOTTOM = 8;
const BAR_WIDTH = 56;

interface Props {
  blocks: RoutineBlock[];
}

export function RoutineTimelineChart({ blocks }: Props) {
  const [width, setWidth] = useState(0);
  const timeline = useMemo(() => routineToTimeline(blocks), [blocks]);
  const totalHeight = CHART_HEIGHT + PAD_TOP + PAD_BOTTOM;
  const barX = PAD_LEFT + Math.max((width - PAD_LEFT - BAR_WIDTH) / 2, 0);

  const hourLabels = useMemo(
    () =>
      HOURS.map((h) => {
        const label = h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;
        return { label, y: PAD_TOP + (h / 24) * CHART_HEIGHT };
      }),
    [],
  );

  return (
    <View
      className="overflow-hidden rounded-3xl bg-lavender-100/60 p-3 dark:bg-lavender-200/10"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && blocks.length > 0 && (
        <Svg width={width - 24} height={totalHeight}>
          {hourLabels.map(({ label, y }) => (
            <SvgText key={label} x={0} y={y + 4} fontSize={9} fill="#A78BFA">
              {label}
            </SvgText>
          ))}

          {timeline.map((block, i) => {
            const y = PAD_TOP + (block.startHour / 24) * CHART_HEIGHT;
            const h = Math.max((block.durationHours / 24) * CHART_HEIGHT, 8);
            return (
              <Rect
                key={`${block.label}-${i}`}
                x={barX}
                y={y}
                width={BAR_WIDTH}
                height={h}
                rx={6}
                fill={block.color}
                opacity={0.95}
              />
            );
          })}
        </Svg>
      )}
    </View>
  );
}
