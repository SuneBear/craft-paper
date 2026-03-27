import React, { useMemo, useId, useRef, useCallback } from 'react';
import { generatePath, getTagHole, getFoldTriangles, getStitchPath, generateStitchDashes } from './geometry';
import type { PaperPreset, ShapeConfig, PresetParams } from './geometry';
import type { DecorationItem, DecorationTransform } from './decorations';
import { DraggableDecoration } from './DraggableDecoration';
import { cn } from '@/lib/utils';

export type PaperPatternType = 'lines' | 'grid' | 'dots' | 'diagonal' | 'waves' | 'none';

export interface PatternParams {
  patternColor?: string;
  patternOpacity?: number;
  lineWidth?: number;
  lineGap?: number;
  gridWidth?: number;
  gridGap?: number;
  dotSize?: number;
  dotGap?: number;
  diagonalWidth?: number;
  diagonalGap?: number;
  waveWidth?: number;
  waveGap?: number;
  waveAmplitude?: number;
}

export interface PaperShapeProps {
  preset?: PaperPreset;
  width?: number;
  height?: number;
  seed?: number;
  roughness?: number;
  paperColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  showPattern?: boolean;
  patternType?: PaperPatternType;
  patternParams?: PatternParams;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  presetParams?: PresetParams;
  decorations?: DecorationItem[];
  onDecorationChange?: (id: string, transform: DecorationTransform) => void;
  onDecorationRemove?: (id: string) => void;
  interactiveDecorations?: boolean;
}

const PAPER_COLORS: Record<string, string> = {
  cream: 'hsl(48, 88%, 89%)',
  cloud: 'hsl(52, 72%, 94%)',
  pink: 'hsl(342, 84%, 86%)',
  apricot: 'hsl(28, 90%, 84%)',
  peach: 'hsl(16, 92%, 82%)',
  mint: 'hsl(152, 64%, 84%)',
  sky: 'hsl(204, 86%, 86%)',
  lavender: 'hsl(268, 72%, 87%)',
};

const ACCENT_COLORS = [
  'hsl(12, 60%, 68%)',
  'hsl(160, 30%, 70%)',
  'hsl(210, 45%, 72%)',
  'hsl(270, 30%, 76%)',
  'hsl(30, 65%, 68%)',
];

export const PaperShape: React.FC<PaperShapeProps> = ({
  preset = 'basic-paper',
  width = 240,
  height = 180,
  seed = 42,
  roughness = 0.3,
  paperColor,
  strokeColor,
  strokeWidth = 1.8,
  showPattern = false,
  patternType = 'none',
  patternParams,
  className,
  children,
  style,
  onClick,
  presetParams,
  decorations = [],
  onDecorationChange,
  onDecorationRemove,
  interactiveDecorations = false,
}) => {
  const uid = useId().replace(/:/g, '');
  const clipId = `clip-${uid}`;
  const patternId = `pat-${uid}`;
  const maskId = `mask-${uid}`;
  const svgRef = useRef<SVGSVGElement>(null);

  const config: ShapeConfig = useMemo(() => ({
    width, height, preset, seed, roughness, params: presetParams,
  }), [width, height, preset, seed, roughness, presetParams]);

  const path = useMemo(() => generatePath(config), [config]);

  const fill = paperColor 
    ? (PAPER_COLORS[paperColor] || paperColor) 
    : PAPER_COLORS.cream;
  
  const stroke = strokeColor || 'hsl(24, 36%, 35%)';
  const patternColor = patternParams?.patternColor || 'hsl(25, 12%, 62%)';
  const patternOpacity = Math.max(0.08, Math.min(1, patternParams?.patternOpacity ?? 0.42));
  const lineWidth = Math.max(0.2, patternParams?.lineWidth ?? 0.5);
  const lineGap = Math.max(8, patternParams?.lineGap ?? 20);
  const gridWidth = Math.max(0.2, patternParams?.gridWidth ?? 0.4);
  const gridGap = Math.max(8, patternParams?.gridGap ?? 20);
  const dotSize = Math.max(0.4, patternParams?.dotSize ?? 1);
  const dotGap = Math.max(6, patternParams?.dotGap ?? 16);
  const diagonalWidth = Math.max(0.2, patternParams?.diagonalWidth ?? 0.5);
  const diagonalGap = Math.max(8, patternParams?.diagonalGap ?? 18);
  const waveWidth = Math.max(0.2, patternParams?.waveWidth ?? 0.5);
  const waveGap = Math.max(12, patternParams?.waveGap ?? 24);
  const waveAmplitude = Math.max(1, patternParams?.waveAmplitude ?? 3);

  const tagHole = preset === 'tag' ? getTagHole(width, height, presetParams) : null;
  const foldTriangles = preset === 'folded' ? getFoldTriangles(width, height, presetParams) : [];
  const stitchPath = preset === 'stitched' ? getStitchPath(width, height, presetParams) : null;
  const perforationGuide = useMemo(() => {
    const gap = Math.max(2, presetParams?.perforationGap ?? 10);
    const inset = Math.max(0, presetParams?.perforationInset ?? 7);
    const offset = presetParams?.perforationOffset ?? 0;
    const dotRadius = Math.max(0.5, presetParams?.perforationDotRadius ?? 1.6);
    const mode = Math.round(presetParams?.perforationMode ?? 0);

    if (preset === 'coupon') {
      const notchR = presetParams?.notchRadius ?? Math.min(width, height) * 0.06;
      const x = width / 2 + offset;
      const y1 = notchR + inset;
      const y2 = height - notchR - inset;
      if (y2 <= y1) return null;
      return {
        axis: 'vertical' as const,
        mode,
        gap,
        dotRadius,
        x1: x,
        y1,
        x2: x,
        y2,
      };
    }

    if (preset === 'ticket') {
      const cutR = presetParams?.cutRadius ?? Math.min(width, height) * 0.11;
      const side = presetParams?.ticketStubSide;
      const stubW = Math.max(8, presetParams?.ticketStubWidth ?? Math.min(width, height) * 0.28);

      // Backward-compatible default (legacy horizontal tear line)
      if (side === undefined) {
        const y = height / 2 + offset;
        const x1 = cutR + inset;
        const x2 = width - cutR - inset;
        if (x2 <= x1) return null;
        return {
          axis: 'horizontal' as const,
          mode,
          gap,
          dotRadius,
          x1,
          y1: y,
          x2,
          y2: y,
        };
      }

      if (side === 0) {
        const x = Math.max(cutR + inset + 2, Math.min(width - cutR - inset - 2, width - stubW + offset));
        const y1 = inset;
        const y2 = height - inset;
        if (y2 <= y1) return null;
        return { axis: 'vertical' as const, mode, gap, dotRadius, x1: x, y1, x2: x, y2 };
      }

      if (side === 1) {
        const x = Math.max(cutR + inset + 2, Math.min(width - cutR - inset - 2, stubW + offset));
        const y1 = inset;
        const y2 = height - inset;
        if (y2 <= y1) return null;
        return { axis: 'vertical' as const, mode, gap, dotRadius, x1: x, y1, x2: x, y2 };
      }

      if (side === 2) {
        const y = Math.max(cutR + inset + 2, Math.min(height - cutR - inset - 2, stubW + offset));
        const x1 = inset;
        const x2 = width - inset;
        if (x2 <= x1) return null;
        return { axis: 'horizontal' as const, mode, gap, dotRadius, x1, y1: y, x2, y2: y };
      }

      const y = Math.max(cutR + inset + 2, Math.min(height - cutR - inset - 2, height - stubW + offset));
      const x1 = inset;
      const x2 = width - inset;
      if (x2 <= x1) return null;
      return { axis: 'horizontal' as const, mode, gap, dotRadius, x1, y1: y, x2, y2: y };
    }

    return null;
  }, [
    preset,
    presetParams?.notchRadius,
    presetParams?.cutRadius,
    presetParams?.perforationGap,
    presetParams?.perforationInset,
    presetParams?.perforationOffset,
    presetParams?.perforationDotRadius,
    presetParams?.perforationMode,
    width,
    height,
  ]);
  const perforationDots = useMemo(() => {
    if (!perforationGuide || perforationGuide.mode !== 1) return [];
    const length = perforationGuide.axis === 'vertical'
      ? Math.abs(perforationGuide.y2 - perforationGuide.y1)
      : Math.abs(perforationGuide.x2 - perforationGuide.x1);
    const steps = Math.max(1, Math.floor(length / perforationGuide.gap));
    const points: Array<{ x: number; y: number; r: number }> = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push({
        x: perforationGuide.x1 + (perforationGuide.x2 - perforationGuide.x1) * t,
        y: perforationGuide.y1 + (perforationGuide.y2 - perforationGuide.y1) * t,
        r: perforationGuide.dotRadius,
      });
    }
    return points;
  }, [perforationGuide]);
  const hasCutoutMask = !!tagHole || perforationDots.length > 0;

  const padding = 16;
  const svgW = width + padding * 2;
  const svgH = height + padding * 2;

  const handleDecoChange = useCallback((id: string, t: DecorationTransform) => {
    onDecorationChange?.(id, t);
  }, [onDecorationChange]);

  const handleDecoRemove = useCallback((id: string) => {
    onDecorationRemove?.(id);
  }, [onDecorationRemove]);

  return (
    <div
      className={cn('relative inline-block', className)}
      style={{ width: svgW, height: svgH, ...style }}
      onClick={onClick}
    >
      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        viewBox={`${-padding} ${-padding} ${svgW} ${svgH}`}
        className="absolute inset-0"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>

          {hasCutoutMask && (
            <mask id={maskId}>
              <rect x={-padding} y={-padding} width={svgW} height={svgH} fill="white" />
              {tagHole && (
                <circle cx={tagHole.cx} cy={tagHole.cy} r={tagHole.r} fill="black" />
              )}
              {perforationDots.map((dot, i) => (
                <circle key={`mask-dot-${i}`} cx={dot.x} cy={dot.y} r={dot.r} fill="black" />
              ))}
            </mask>
          )}

          {showPattern && patternType !== 'none' && (
            <pattern
              id={patternId}
              width={patternType === 'dots' ? dotGap : patternType === 'grid' ? gridGap : patternType === 'diagonal' ? diagonalGap : patternType === 'waves' ? waveGap : lineGap}
              height={patternType === 'dots' ? dotGap : patternType === 'grid' ? gridGap : patternType === 'diagonal' ? diagonalGap : patternType === 'waves' ? waveGap : lineGap}
              patternUnits="userSpaceOnUse"
            >
              {patternType === 'lines' && (
                <line x1="0" y1={lineGap} x2={lineGap} y2={lineGap} stroke={patternColor} strokeWidth={lineWidth} opacity={patternOpacity} />
              )}
              {patternType === 'grid' && (
                <>
                  <line x1="0" y1={gridGap} x2={gridGap} y2={gridGap} stroke={patternColor} strokeWidth={gridWidth} opacity={patternOpacity} />
                  <line x1={gridGap} y1="0" x2={gridGap} y2={gridGap} stroke={patternColor} strokeWidth={gridWidth} opacity={patternOpacity} />
                </>
              )}
              {patternType === 'dots' && (
                <circle cx={dotGap / 2} cy={dotGap / 2} r={dotSize} fill={patternColor} opacity={patternOpacity} />
              )}
              {patternType === 'diagonal' && (
                <line x1="0" y1={diagonalGap} x2={diagonalGap} y2="0" stroke={patternColor} strokeWidth={diagonalWidth} opacity={patternOpacity} />
              )}
              {patternType === 'waves' && (
                <path
                  d={`M 0 ${waveGap / 2} Q ${waveGap / 4} ${waveGap / 2 - waveAmplitude} ${waveGap / 2} ${waveGap / 2} Q ${waveGap * 0.75} ${waveGap / 2 + waveAmplitude} ${waveGap} ${waveGap / 2}`}
                  fill="none"
                  stroke={patternColor}
                  strokeWidth={waveWidth}
                  opacity={patternOpacity}
                />
              )}
            </pattern>
          )}
        </defs>

        {/* Shadow layer */}
        <path
          d={path}
          fill="hsl(25, 15%, 30%)"
          opacity="0.06"
          transform="translate(2, 3)"
          mask={hasCutoutMask ? `url(#${maskId})` : undefined}
        />

        {/* Fill layer */}
        <path
          d={path}
          fill={fill}
          mask={hasCutoutMask ? `url(#${maskId})` : undefined}
        />

        {/* Pattern overlay */}
        {showPattern && patternType !== 'none' && (
          <path
            d={path}
            fill={`url(#${patternId})`}
            clipPath={`url(#${clipId})`}
            mask={hasCutoutMask ? `url(#${maskId})` : undefined}
          />
        )}

        {/* Perforation guide for tear/cut semantics */}
        {perforationGuide && (
          perforationGuide.mode !== 1 ? (
            <line
              x1={perforationGuide.x1}
              y1={perforationGuide.y1}
              x2={perforationGuide.x2}
              y2={perforationGuide.y2}
              stroke={stroke}
              strokeWidth={Math.max(1, strokeWidth * 0.75)}
              strokeDasharray={`2.5 ${Math.max(3, perforationGuide.gap)}`}
              strokeLinecap="round"
              opacity="0.5"
              clipPath={`url(#${clipId})`}
            />
          ) : null
        )}

        {/* Fold triangle overlay */}
        {foldTriangles.length > 0 && (
          <>
            {foldTriangles.map((d, i) => (
              <g key={`fold-${i}`}>
                <path d={d} fill={stroke} opacity="0.14" />
                <path d={d} fill={fill} />
                <path d={d} fill={stroke} opacity="0.12" />
                <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.6} opacity="0.4" />
              </g>
            ))}
          </>
        )}

        {/* Stroke layer */}
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          mask={hasCutoutMask ? `url(#${maskId})` : undefined}
        />

        {/* Tag hole ring */}
        {tagHole && (
          <circle
            cx={tagHole.cx}
            cy={tagHole.cy}
            r={tagHole.r}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth * 0.8}
          />
        )}

        {/* Stitch line */}
        {stitchPath && (
          <path
            d={stitchPath}
            fill="none"
            stroke={stroke}
            strokeWidth={1.2}
            strokeDasharray={generateStitchDashes(0)}
            opacity="0.5"
            strokeLinecap="round"
          />
        )}

        {/* Decorations layer */}
        {decorations.map((deco) => (
          <DraggableDecoration
            key={deco.id}
            item={deco}
            onChange={handleDecoChange}
            onRemove={handleDecoRemove}
            interactive={interactiveDecorations}
            containerRef={svgRef}
          />
        ))}
      </svg>

      {/* Content overlay */}
      {children && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            padding: `${padding + 12}px`,
            pointerEvents: interactiveDecorations ? 'none' : 'auto',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default PaperShape;
