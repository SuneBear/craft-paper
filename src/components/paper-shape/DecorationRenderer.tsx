/**
 * SVG renderers for each decoration type.
 */
import React from 'react';
import { stapleVariants, washiTapeVariants, stickerVariants } from './decorations';

interface RendererProps {
  variant: string;
  scale?: number;
}

// ─── Staple ───
export const StapleSVG: React.FC<RendererProps> = ({ variant, scale = 1 }) => {
  const v = stapleVariants.find(s => s.key === variant) || stapleVariants[0];
  const w = 28 * scale;
  const h = 10 * scale;
  const legH = 6 * scale;
  const sw = 1.5 * scale;

  return (
    <g>
      {/* Shadow */}
      <rect x={1} y={legH + 1} width={w} height={h - legH} rx={1.5 * scale} fill="hsl(0,0%,0%)" opacity={0.08} />
      {/* Bridge (top part) */}
      <rect x={0} y={legH} width={w} height={h - legH} rx={1.5 * scale}
        fill={v.color} stroke={v.highlight} strokeWidth={sw * 0.4} />
      {/* Highlight */}
      <rect x={2 * scale} y={legH + 1 * scale} width={w - 4 * scale} height={1.5 * scale} rx={0.75 * scale}
        fill={v.highlight} opacity={0.6} />
      {/* Left leg */}
      <rect x={1.5 * scale} y={0} width={2 * scale} height={legH + 2 * scale} rx={0.5 * scale}
        fill={v.color} />
      {/* Right leg */}
      <rect x={w - 3.5 * scale} y={0} width={2 * scale} height={legH + 2 * scale} rx={0.5 * scale}
        fill={v.color} />
    </g>
  );
};

// ─── Washi Tape ───
export const WashiTapeSVG: React.FC<RendererProps & { uid: string }> = ({ variant, scale = 1, uid }) => {
  const v = washiTapeVariants.find(t => t.key === variant) || washiTapeVariants[0];
  const w = 80 * scale;
  const h = 22 * scale;
  const patId = `washi-pat-${uid}`;

  // Torn edges
  const tornTop = `M 0 ${1.5 * scale} ` + Array.from({ length: 20 }, (_, i) => {
    const x = (i + 1) * (w / 20);
    const y = (i % 2 === 0 ? 0.8 : 1.8) * scale;
    return `L ${x} ${y}`;
  }).join(' ');

  const tornBottom = Array.from({ length: 20 }, (_, i) => {
    const x = i * (w / 20);
    const y = h + (i % 2 === 0 ? -0.8 : 0.5) * scale;
    return `${i === 0 ? 'L' : 'L'} ${x} ${y}`;
  }).join(' ');

  const clipPath = `${tornTop} L ${w} ${h} ${tornBottom} Z`;

  return (
    <g opacity={0.85}>
      <defs>
        <clipPath id={`washi-clip-${uid}`}>
          <path d={clipPath} />
        </clipPath>
        {v.pattern === 'stripes' && (
          <pattern id={patId} width={6 * scale} height={h} patternUnits="userSpaceOnUse">
            <rect width={3 * scale} height={h} fill={v.accent} opacity={0.4} />
          </pattern>
        )}
        {v.pattern === 'dots' && (
          <pattern id={patId} width={8 * scale} height={8 * scale} patternUnits="userSpaceOnUse">
            <circle cx={4 * scale} cy={4 * scale} r={1.5 * scale} fill={v.accent} opacity={0.5} />
          </pattern>
        )}
        {v.pattern === 'check' && (
          <pattern id={patId} width={8 * scale} height={8 * scale} patternUnits="userSpaceOnUse">
            <rect width={4 * scale} height={4 * scale} fill={v.accent} opacity={0.25} />
            <rect x={4 * scale} y={4 * scale} width={4 * scale} height={4 * scale} fill={v.accent} opacity={0.25} />
          </pattern>
        )}
        {v.pattern === 'stars' && (
          <pattern id={patId} width={12 * scale} height={12 * scale} patternUnits="userSpaceOnUse">
            <text x={6 * scale} y={9 * scale} fontSize={7 * scale} textAnchor="middle" fill={v.accent} opacity={0.5}>★</text>
          </pattern>
        )}
      </defs>
      {/* Tape body */}
      <g clipPath={`url(#washi-clip-${uid})`}>
        <rect width={w} height={h} fill={v.bg} rx={0} />
        {v.pattern !== 'plain' && (
          <rect width={w} height={h} fill={`url(#${patId})`} />
        )}
      </g>
    </g>
  );
};

// ─── Sticker ───
export const StickerSVG: React.FC<RendererProps> = ({ variant, scale = 1 }) => {
  const v = stickerVariants.find(s => s.key === variant) || stickerVariants[0];
  const size = 24 * scale;

  return (
    <g>
      {/* Subtle shadow */}
      <circle cx={size / 2 + 1} cy={size / 2 + 1} r={size / 2} fill="hsl(0,0%,0%)" opacity={0.06} />
      {/* Background circle */}
      <circle cx={size / 2} cy={size / 2} r={size / 2} fill="hsl(40, 40%, 97%)" stroke="hsl(25, 18%, 78%)" strokeWidth={0.8 * scale} />
      {/* Emoji */}
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.55}
      >
        {v.emoji}
      </text>
    </g>
  );
};
