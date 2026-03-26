import React, { useMemo, useId } from 'react';
import { generatePath, getTagHole, getFoldTriangle, getStitchPath, generateStitchDashes } from './geometry';
import type { PaperPreset, ShapeConfig, PresetParams } from './geometry';
import { cn } from '@/lib/utils';

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
  patternType?: 'lines' | 'grid' | 'dots' | 'none';
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  presetParams?: PresetParams;
}

const PAPER_COLORS: Record<string, string> = {
  cream: 'hsl(40, 40%, 96%)',
  cloud: 'hsl(40, 20%, 98%)',
  pink: 'hsl(15, 50%, 95%)',
  apricot: 'hsl(30, 30%, 93%)',
  peach: 'hsl(12, 60%, 92%)',
  mint: 'hsl(160, 30%, 93%)',
  sky: 'hsl(210, 45%, 94%)',
  lavender: 'hsl(270, 30%, 94%)',
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
  className,
  children,
  style,
  onClick,
  presetParams,
}) => {
  const uid = useId().replace(/:/g, '');
  const clipId = `clip-${uid}`;
  const patternId = `pat-${uid}`;
  const maskId = `mask-${uid}`;

  const config: ShapeConfig = useMemo(() => ({
    width, height, preset, seed, roughness, params: presetParams,
  }), [width, height, preset, seed, roughness, presetParams]);

  const path = useMemo(() => generatePath(config), [config]);

  const fill = paperColor 
    ? (PAPER_COLORS[paperColor] || paperColor) 
    : PAPER_COLORS.cream;
  
  const stroke = strokeColor || 'hsl(25, 18%, 42%)';

  const tagHole = preset === 'tag' ? getTagHole(width, height, presetParams) : null;
  const foldTriangle = preset === 'folded' ? getFoldTriangle(width, height, presetParams) : null;
  const stitchPath = preset === 'stitched' ? getStitchPath(width, height, presetParams) : null;

  const padding = 16;
  const svgW = width + padding * 2;
  const svgH = height + padding * 2;

  return (
    <div
      className={cn('relative inline-block', className)}
      style={{ width: svgW, height: svgH, ...style }}
      onClick={onClick}
    >
      <svg
        width={svgW}
        height={svgH}
        viewBox={`${-padding} ${-padding} ${svgW} ${svgH}`}
        className="absolute inset-0"
      >
        <defs>
          {/* Clip path for content */}
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>

          {/* Tag hole mask */}
          {tagHole && (
            <mask id={maskId}>
              <rect x={-padding} y={-padding} width={svgW} height={svgH} fill="white" />
              <circle cx={tagHole.cx} cy={tagHole.cy} r={tagHole.r} fill="black" />
            </mask>
          )}

          {/* Paper pattern */}
          {showPattern && patternType !== 'none' && (
            <pattern id={patternId} width={patternType === 'dots' ? 16 : 20} height={patternType === 'dots' ? 16 : 20} patternUnits="userSpaceOnUse">
              {patternType === 'lines' && (
                <line x1="0" y1="20" x2="20" y2="20" stroke="hsl(25, 12%, 62%)" strokeWidth="0.5" opacity="0.3" />
              )}
              {patternType === 'grid' && (
                <>
                  <line x1="0" y1="20" x2="20" y2="20" stroke="hsl(210, 45%, 72%)" strokeWidth="0.4" opacity="0.25" />
                  <line x1="20" y1="0" x2="20" y2="20" stroke="hsl(210, 45%, 72%)" strokeWidth="0.4" opacity="0.25" />
                </>
              )}
              {patternType === 'dots' && (
                <circle cx="8" cy="8" r="1" fill="hsl(25, 12%, 62%)" opacity="0.25" />
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
          mask={tagHole ? `url(#${maskId})` : undefined}
        />

        {/* Fill layer */}
        <path
          d={path}
          fill={fill}
          mask={tagHole ? `url(#${maskId})` : undefined}
        />

        {/* Pattern overlay */}
        {showPattern && patternType !== 'none' && (
          <path
            d={path}
            fill={`url(#${patternId})`}
            clipPath={`url(#${clipId})`}
          />
        )}

        {/* Fold triangle overlay */}
        {foldTriangle && (
          <>
            <path d={foldTriangle} fill="hsl(25, 15%, 30%)" opacity="0.08" />
            <path d={foldTriangle} fill="hsl(40, 35%, 90%)" />
            <path d={foldTriangle} fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.6} opacity="0.4" />
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
          mask={tagHole ? `url(#${maskId})` : undefined}
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
      </svg>

      {/* Content overlay */}
      {children && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            padding: `${padding + 12}px`,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default PaperShape;
