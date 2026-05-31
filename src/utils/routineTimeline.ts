import type { RoutineBlock } from '@app-types/schedule';
import { ACTIVITY_CHART_COLORS } from '@constants/logFields';

export interface TimelineBlock {
  startHour: number;
  durationHours: number;
  color: string;
  label: string;
  type: RoutineBlock['type'];
}

function parseTimeToHour(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) + (m ?? 0) / 60;
}

export function routineToTimeline(blocks: RoutineBlock[]): TimelineBlock[] {
  return blocks.map((block) => {
    const startHour = parseTimeToHour(block.startTime);
    let endHour = parseTimeToHour(block.endTime);
    if (endHour <= startHour) endHour += 24;
    const durationHours = Math.max(endHour - startHour, 0.25);

    return {
      startHour: startHour % 24,
      durationHours: Math.min(durationHours, 24 - (startHour % 24) || durationHours),
      color: ACTIVITY_CHART_COLORS[block.type],
      label: block.label,
      type: block.type,
    };
  });
}
