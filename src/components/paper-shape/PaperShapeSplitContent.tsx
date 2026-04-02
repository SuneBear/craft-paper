import React from 'react';
import { cn } from '@/lib/utils';

type SplitAxis = 'vertical' | 'horizontal';
type SplitSide = 'start' | 'end';

function clampNum(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export interface PaperShapeSplitContentProps {
  axis: SplitAxis;
  splitRatio: number;
  secondarySide?: SplitSide;
  keepOutBand?: number;
  minSecondaryRatio?: number;
  maxSecondaryRatio?: number;
  minPrimaryRatio?: number;
  className?: string;
  bandClassName?: string;
  primary: React.ReactNode;
  secondary: React.ReactNode;
}

/**
 * Reusable split layout for perforation semantics (coupon/ticket):
 * two content regions + a central keep-out band.
 */
export function PaperShapeSplitContent({
  axis,
  splitRatio,
  secondarySide = 'end',
  keepOutBand = 10,
  minSecondaryRatio = 0.22,
  maxSecondaryRatio = 0.48,
  minPrimaryRatio = 0.38,
  className,
  bandClassName,
  primary,
  secondary,
}: PaperShapeSplitContentProps) {
  const clampedSplit = clampNum(splitRatio, 0.08, 0.92);
  const secondaryRaw = secondarySide === 'start' ? clampedSplit : (1 - clampedSplit);
  const secondaryRatio = clampNum(secondaryRaw, minSecondaryRatio, maxSecondaryRatio);
  const primaryRatio = Math.max(minPrimaryRatio, 1 - secondaryRatio);

  const style: React.CSSProperties = axis === 'vertical'
    ? {
      gridTemplateColumns: secondarySide === 'start'
        ? `${secondaryRatio}fr ${keepOutBand}px ${primaryRatio}fr`
        : `${primaryRatio}fr ${keepOutBand}px ${secondaryRatio}fr`,
    }
    : {
      gridTemplateRows: secondarySide === 'start'
        ? `${secondaryRatio}fr ${keepOutBand}px ${primaryRatio}fr`
        : `${primaryRatio}fr ${keepOutBand}px ${secondaryRatio}fr`,
    };

  const first = secondarySide === 'start' ? secondary : primary;
  const third = secondarySide === 'start' ? primary : secondary;

  return (
    <div className={cn('w-full h-full grid', className)} style={style}>
      {first}
      <div aria-hidden className={cn('pointer-events-none', bandClassName)} />
      {third}
    </div>
  );
}

