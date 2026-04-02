import React from 'react';
import { DraggableDecoration } from './DraggableDecoration';
import type { DecorationItem } from './decorations';
import type { CutoutMaskShape, PerforationDot, PerforationGuide, ResolvedPatternConfig } from './paperShapeModel';
import type { PaperPatternType } from './paperShapeTypes';

interface PaperShapeSvgProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  svgW: number;
  svgH: number;
  padding: number;
  path: string;
  clipId: string;
  patternId: string;
  maskId: string;
  showPattern: boolean;
  patternType: PaperPatternType;
  pattern: ResolvedPatternConfig;
  hasCutoutMask: boolean;
  tagHole: { cx: number; cy: number; r: number } | null;
  perforationMaskDots: PerforationDot[];
  cutoutMaskShapes: CutoutMaskShape[];
  shadowEnabled: boolean;
  shadowOpacity: number;
  paperShadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  perforationGuide: PerforationGuide | null;
  shouldFillPerforation: boolean;
  perforationDots: PerforationDot[];
  perforationRingColor: string;
  foldTriangles: string[];
  foldTone: string;
  foldOpacity: number;
  cutoutStrokePaths: string[];
  shouldPunchPerforation: boolean;
  perforationRingWidth: number;
  stitchPath: string | null;
  stitchStroke: string;
  stitchStrokeWidth: number;
  stitchDasharray?: string;
  decorations: DecorationItem[];
  selectedDecorationId: string | null;
  setSelectedDecorationId: (id: string) => void;
  interactiveDecorations: boolean;
  registerDecorationTarget: (id: string, node: SVGGElement | null) => void;
}

function getPatternTileSize(patternType: PaperPatternType, pattern: ResolvedPatternConfig): number {
  if (patternType === 'dots') return pattern.dotGap;
  if (patternType === 'grid') return pattern.gridGap;
  if (patternType === 'diagonal') return pattern.diagonalGap;
  if (patternType === 'waves') return pattern.waveGap;
  return pattern.lineGap;
}

export const PaperShapeSvg: React.FC<PaperShapeSvgProps> = ({
  svgRef,
  svgW,
  svgH,
  padding,
  path,
  clipId,
  patternId,
  maskId,
  showPattern,
  patternType,
  pattern,
  hasCutoutMask,
  tagHole,
  perforationMaskDots,
  cutoutMaskShapes,
  shadowEnabled,
  shadowOpacity,
  paperShadowColor,
  shadowOffsetX,
  shadowOffsetY,
  fill,
  stroke,
  strokeWidth,
  perforationGuide,
  shouldFillPerforation,
  perforationDots,
  perforationRingColor,
  foldTriangles,
  foldTone,
  foldOpacity,
  cutoutStrokePaths,
  shouldPunchPerforation,
  perforationRingWidth,
  stitchPath,
  stitchStroke,
  stitchStrokeWidth,
  stitchDasharray,
  decorations,
  selectedDecorationId,
  setSelectedDecorationId,
  interactiveDecorations,
  registerDecorationTarget,
}) => {
  const patternTileSize = getPatternTileSize(patternType, pattern);

  return (
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
            {perforationMaskDots.map((dot, i) => (
              <circle key={`mask-dot-${i}`} cx={dot.x} cy={dot.y} r={dot.r} fill="black" />
            ))}
            {cutoutMaskShapes.map((shape, i) => (
              shape.kind === 'polygon' ? (
                <polygon key={`mask-cut-${i}`} points={shape.points} fill="black" />
              ) : shape.kind === 'ellipse' ? (
                <ellipse key={`mask-cut-${i}`} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} fill="black" />
              ) : (
                <rect
                  key={`mask-cut-${i}`}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  rx={shape.rx}
                  ry={shape.ry}
                  fill="black"
                />
              )
            ))}
          </mask>
        )}

        {showPattern && patternType !== 'none' && (
          <pattern
            id={patternId}
            width={patternTileSize}
            height={patternTileSize}
            patternUnits="userSpaceOnUse"
          >
            {patternType === 'lines' && (
              <line
                x1="0"
                y1={pattern.lineGap}
                x2={pattern.lineGap}
                y2={pattern.lineGap}
                stroke={pattern.patternColor}
                strokeWidth={pattern.lineWidth}
                opacity={pattern.patternOpacity}
              />
            )}
            {patternType === 'grid' && (
              <>
                <line
                  x1="0"
                  y1={pattern.gridGap}
                  x2={pattern.gridGap}
                  y2={pattern.gridGap}
                  stroke={pattern.patternColor}
                  strokeWidth={pattern.gridWidth}
                  opacity={pattern.patternOpacity}
                />
                <line
                  x1={pattern.gridGap}
                  y1="0"
                  x2={pattern.gridGap}
                  y2={pattern.gridGap}
                  stroke={pattern.patternColor}
                  strokeWidth={pattern.gridWidth}
                  opacity={pattern.patternOpacity}
                />
              </>
            )}
            {patternType === 'dots' && (
              <circle
                cx={pattern.dotGap / 2}
                cy={pattern.dotGap / 2}
                r={pattern.dotSize}
                fill={pattern.patternColor}
                opacity={pattern.patternOpacity}
              />
            )}
            {patternType === 'diagonal' && (
              <line
                x1="0"
                y1={pattern.diagonalGap}
                x2={pattern.diagonalGap}
                y2="0"
                stroke={pattern.patternColor}
                strokeWidth={pattern.diagonalWidth}
                opacity={pattern.patternOpacity}
              />
            )}
            {patternType === 'waves' && (
              <path
                d={`M 0 ${pattern.waveGap / 2} Q ${pattern.waveGap / 4} ${pattern.waveGap / 2 - pattern.waveAmplitude} ${pattern.waveGap / 2} ${pattern.waveGap / 2} Q ${pattern.waveGap * 0.75} ${pattern.waveGap / 2 + pattern.waveAmplitude} ${pattern.waveGap} ${pattern.waveGap / 2}`}
                fill="none"
                stroke={pattern.patternColor}
                strokeWidth={pattern.waveWidth}
                opacity={pattern.patternOpacity}
              />
            )}
          </pattern>
        )}
      </defs>

      {shadowEnabled && shadowOpacity > 0 && (
        <path
          d={path}
          fill={paperShadowColor}
          opacity={shadowOpacity}
          transform={`translate(${shadowOffsetX}, ${shadowOffsetY})`}
          mask={hasCutoutMask ? `url(#${maskId})` : undefined}
        />
      )}

      <path
        d={path}
        fill={fill}
        mask={hasCutoutMask ? `url(#${maskId})` : undefined}
      />

      {showPattern && patternType !== 'none' && (
        <path
          d={path}
          fill={`url(#${patternId})`}
          clipPath={`url(#${clipId})`}
          mask={hasCutoutMask ? `url(#${maskId})` : undefined}
        />
      )}

      {perforationGuide && (
        perforationGuide.mode !== 1 ? (
          <line
            x1={perforationGuide.x1}
            y1={perforationGuide.y1}
            x2={perforationGuide.x2}
            y2={perforationGuide.y2}
            stroke={stroke}
            strokeWidth={strokeWidth > 0 ? Math.max(1, strokeWidth * 0.75) : 0}
            strokeDasharray={`2.5 ${Math.max(3, perforationGuide.gap)}`}
            strokeLinecap="round"
            opacity="0.5"
            clipPath={`url(#${clipId})`}
          />
        ) : shouldFillPerforation ? (
          <>
            {perforationDots.map((dot, i) => (
              <circle
                key={`perforation-fill-${i}`}
                cx={dot.x}
                cy={dot.y}
                r={dot.r}
                fill={perforationRingColor}
                opacity="0.34"
                clipPath={`url(#${clipId})`}
                mask={hasCutoutMask ? `url(#${maskId})` : undefined}
              />
            ))}
          </>
        ) : null
      )}

      {foldTriangles.length > 0 && (
        <>
          {foldTriangles.map((d, i) => (
            <g key={`fold-${i}`}>
              <path d={d} fill={foldTone} opacity={foldOpacity} />
              <path d={d} fill={fill} opacity={0.22 * (1 - foldOpacity)} />
              <path d={d} fill={foldTone} opacity={0.12 * (1 - foldOpacity)} />
              <path d={d} fill="none" stroke={foldTone} strokeWidth={strokeWidth * 0.7} opacity={0.35 + 0.3 * foldOpacity} />
            </g>
          ))}
        </>
      )}

      {cutoutStrokePaths.map((d, i) => (
        <path
          key={`cutout-stroke-${i}`}
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth > 0 ? strokeWidth + 0.15 : 0}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* TODO: Optimize cutout + outline into a single contour stroke to eliminate subpixel seams on heavily wobbled edges. */}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        mask={hasCutoutMask ? `url(#${maskId})` : undefined}
      />

      {shouldPunchPerforation && perforationDots.map((dot, i) => (
        <circle
          key={`perforation-ring-${i}`}
          cx={dot.x}
          cy={dot.y}
          r={dot.r}
          fill="none"
          stroke={perforationRingColor}
          strokeWidth={perforationRingWidth}
          opacity="0.48"
          clipPath={`url(#${clipId})`}
        />
      ))}

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

      {stitchPath && (
        <path
          d={stitchPath}
          fill="none"
          stroke={stitchStroke}
          strokeWidth={stitchStrokeWidth}
          strokeDasharray={stitchDasharray}
          opacity="0.5"
          strokeLinecap="round"
        />
      )}

      {decorations.map((deco) => (
        <DraggableDecoration
          key={deco.id}
          item={deco}
          selected={selectedDecorationId === deco.id}
          onSelect={setSelectedDecorationId}
          interactive={interactiveDecorations}
          registerTarget={registerDecorationTarget}
        />
      ))}
    </svg>
  );
};
