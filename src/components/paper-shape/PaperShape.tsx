import React, { useMemo, useId, useRef } from 'react';
import { generatePath, getTagHole, getFoldTriangles, getStitchPath, generateStitchDashes } from './geometry';
import type { PaperPreset, ShapeConfig, PresetParams, ShapeCommonParams } from './geometry';
import type { DecorationItem, DecorationTransform } from './decorations';
import { type PaperShapeLayoutMode, usePaperAutoLayout } from './usePaperAutoLayout';
import { cn } from './cn';
import type { PaperContentPadding, PaperPatternType, PatternParams } from './paperShapeTypes';
import {
  resolveContentPadding,
  clampNum,
  derivePaperShadowColor,
  PAPER_COLORS,
  DEFAULT_CANVAS_PADDING,
} from './paperShapeUtils';
import {
  resolveCutoutMaskShapes,
  resolveCutoutStrokePaths,
  resolveDecorationPadding,
  resolvePatternConfig,
  resolvePerforationDots,
  resolvePerforationGuide,
  resolveContentSafeInsets,
} from './paperShapeModel';
import { usePaperDecorationSelection } from './usePaperDecorationSelection';
import { PaperShapeSvg } from './PaperShapeSvg';
import { PaperShapeDecorationMoveable } from './PaperShapeDecorationMoveable';
import { preloadPaperShapeMoveable } from './paperShapeMoveableLoader';

export type { PaperContentPadding, PaperPatternType, PatternParams } from './paperShapeTypes';

export interface PaperShapeProps {
  preset?: PaperPreset;
  width?: number;
  height?: number;
  /**
   * fixed: uses width/height directly.
   * content: size grows with content.
   * fill: width follows parent container, height grows with content.
   */
  layoutMode?: PaperShapeLayoutMode;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  /** Extra outer bleed around svg canvas. Default 0 keeps outer edge flush. */
  canvasPadding?: number;
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
  /**
   * Global/cross-preset visual params (corner/shadow/cutout/edgeWobble, etc).
   * Merged with `presetParams`; when both provide same key, `shapeParams` wins.
   */
  shapeParams?: ShapeCommonParams;
  /** Preset-specific params (legacy + compatibility: still accepts mixed params). */
  presetParams?: PresetParams;
  contentPadding?: PaperContentPadding;
  decorations?: DecorationItem[];
  onDecorationChange?: (id: string, transform: DecorationTransform) => void;
  onDecorationRemove?: (id: string) => void;
  interactiveDecorations?: boolean;
  contentInteractive?: boolean;
  /**
   * center: keep children centered (legacy behavior)
   * start: align content from top-left and stretch width
   */
  contentAlign?: 'center' | 'start';
  contentClassName?: string;
}

export const PaperShape: React.FC<PaperShapeProps> = ({
  preset = 'basic-paper',
  width: widthProp = 240,
  height: heightProp = 180,
  layoutMode = 'fixed',
  minWidth = 120,
  maxWidth = 1200,
  minHeight: minHeightProp,
  maxHeight = 1200,
  canvasPadding = DEFAULT_CANVAS_PADDING,
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
  shapeParams,
  presetParams: presetParamsRaw,
  contentPadding = 12,
  decorations = [],
  onDecorationChange,
  onDecorationRemove,
  interactiveDecorations = false,
  contentInteractive = false,
  contentAlign = 'center',
  contentClassName,
}) => {
  const presetParams = useMemo<PresetParams>(
    () => ({ ...(presetParamsRaw ?? {}), ...(shapeParams ?? {}) }),
    [presetParamsRaw, shapeParams]
  );

  const shadowEnabled = presetParams?.shadowEnabled !== false;
  const shadowOffsetX = clampNum(presetParams?.shadowOffsetX ?? 3, -32, 32);
  const shadowOffsetY = clampNum(presetParams?.shadowOffsetY ?? 3, -32, 32);
  const shadowOpacity = clampNum(presetParams?.shadowOpacity ?? 0.2, 0, 1);

  const strokeBleed = strokeWidth > 0 ? strokeWidth * 0.8 + 1 : 0;
  const shadowBleed = shadowEnabled && shadowOpacity > 0
    ? Math.max(Math.abs(shadowOffsetX), Math.abs(shadowOffsetY)) + Math.max(2, strokeWidth * 0.8 + 1)
    : 0;
  const receiptZigzagBleed = preset === 'receipt'
    ? Math.max(0, (presetParams?.zigzagHeight ?? 8) + 2)
    : 0;
  const resolvedCanvasPadding = Math.max(
    0,
    canvasPadding,
    Math.ceil(Math.max(strokeBleed, shadowBleed, receiptZigzagBleed))
  );

  const resolvedContentPadding = useMemo(
    () => resolveContentPadding(contentPadding),
    [contentPadding]
  );

  const resolvedMinHeight = typeof minHeightProp === 'number'
    ? minHeightProp
    : (layoutMode === 'fixed' ? 56 : 0);

  // TODO(paper-shape-container): Revisit container-mode implementation end-to-end:
  // unify auto-layout rules, safe-area/padding model, SSR first paint behavior,
  // nested fill constraints, and visual bleed handling (stroke/shadow/decorations).
  const { hostRef, contentRef, width, height } = usePaperAutoLayout({
    layoutMode,
    width: widthProp,
    height: heightProp,
    minWidth,
    maxWidth,
    minHeight: resolvedMinHeight,
    maxHeight,
    fillWidthCompensation: resolvedCanvasPadding * 2,
    widthPaddingCompensation: layoutMode === 'content'
      ? resolvedContentPadding.left + resolvedContentPadding.right
      : 0,
    heightPaddingCompensation: layoutMode === 'fixed'
      ? 0
      : resolvedContentPadding.top + resolvedContentPadding.bottom,
    observeDeps: [children, contentAlign],
  });

  const uid = useId().replace(/:/g, '');
  const clipId = `clip-${uid}`;
  const patternId = `pat-${uid}`;
  const maskId = `mask-${uid}`;
  const svgRef = useRef<SVGSVGElement>(null);

  const config: ShapeConfig = useMemo(() => ({
    width,
    height,
    preset,
    seed,
    roughness,
    params: presetParams,
  }), [width, height, preset, seed, roughness, presetParams]);

  const path = useMemo(() => generatePath(config), [config]);
  const fill = paperColor ? (PAPER_COLORS[paperColor] || paperColor) : PAPER_COLORS.cream;
  const stroke = strokeColor || 'hsl(24, 36%, 35%)';

  const manualShadowColor = typeof presetParams?.shadowColor === 'string'
    ? presetParams.shadowColor.trim()
    : '';
  const paperShadowColor = manualShadowColor || derivePaperShadowColor(fill, stroke);

  const foldTone = presetParams?.foldColor || stroke;
  const foldOpacity = Math.max(0, Math.min(1, presetParams?.foldOpacity ?? 0.34));
  const pattern = useMemo(() => resolvePatternConfig(patternParams), [patternParams]);

  const tagHole = preset === 'tag' ? getTagHole(width, height, presetParams) : null;
  const foldTriangles = preset === 'folded' ? getFoldTriangles(width, height, presetParams) : [];
  const stitchPath = preset === 'stitched' ? getStitchPath(width, height, presetParams) : null;

  const stitchStroke = presetParams?.stitchColor || stroke;
  const stitchStrokeWidth = Math.max(0.4, presetParams?.stitchWidth ?? 1.2);
  const stitchStyle = Math.max(0, Math.min(3, Math.round(presetParams?.stitchStyle ?? 0)));
  const stitchDasharray = stitchStyle === 2
    ? undefined
    : stitchStyle === 1
      ? `${Math.max(1, stitchStrokeWidth)} ${Math.max(3.2, stitchStrokeWidth * 2.8)}`
      : stitchStyle === 3
        ? `${Math.max(5, stitchStrokeWidth * 4)} ${Math.max(3, stitchStrokeWidth * 2)} ${Math.max(1.2, stitchStrokeWidth)} ${Math.max(3, stitchStrokeWidth * 2)}`
        : generateStitchDashes(0);

  const perforationGuide = useMemo(
    () => resolvePerforationGuide(preset, presetParams, width, height),
    [preset, presetParams, width, height]
  );
  const perforationDots = useMemo(
    () => resolvePerforationDots(perforationGuide),
    [perforationGuide]
  );

  const shouldPunchPerforation = !!perforationGuide && perforationGuide.mode === 1 && strokeWidth > 0.05;
  const shouldFillPerforation = !!perforationGuide && perforationGuide.mode === 1 && !shouldPunchPerforation;
  const perforationMaskDots = shouldPunchPerforation ? perforationDots : [];
  const perforationRingColor = presetParams?.perforationRingColor || stroke;
  const perforationRingWidth = Math.max(
    0.1,
    presetParams?.perforationRingWidth ?? Math.max(0.35, strokeWidth * 0.42)
  );

  const cutoutMaskShapes = useMemo(
    () => resolveCutoutMaskShapes(presetParams, strokeWidth, width, height),
    [presetParams, strokeWidth, width, height]
  );
  const cutoutStrokePaths = useMemo(
    () => resolveCutoutStrokePaths(presetParams, width, height),
    [presetParams, width, height]
  );
  const hasCutoutMask = !!tagHole || perforationMaskDots.length > 0 || cutoutMaskShapes.length > 0;

  const contentSafeInsets = useMemo(
    () => resolveContentSafeInsets(preset, presetParams, perforationGuide, width, height),
    [preset, presetParams, perforationGuide, width, height]
  );

  const padding = useMemo(
    () => resolveDecorationPadding(decorations, resolvedCanvasPadding, width, height),
    [decorations, resolvedCanvasPadding, width, height]
  );

  const svgW = width + padding * 2;
  const svgH = height + padding * 2;
  const svgPointerEvents: 'auto' | 'none' = (interactiveDecorations || typeof onClick === 'function') ? 'auto' : 'none';

  const {
    selectedDecoration,
    selectedDecorationId,
    selectedDecorationTarget,
    moveableOriginRef,
    handleSelectDecoration,
    registerDecorationTarget,
    handleDecoChange,
    handleCanvasPointerDown,
  } = usePaperDecorationSelection({
    decorations,
    interactiveDecorations,
    onDecorationChange,
    onDecorationRemove,
  });

  React.useEffect(() => {
    if (interactiveDecorations) preloadPaperShapeMoveable();
  }, [interactiveDecorations]);

  return (
    <div
      ref={hostRef}
      className={cn(layoutMode === 'fill' ? 'block w-full' : 'inline-block max-w-full', className)}
      style={style}
    >
      <div
        className={cn('relative', layoutMode === 'fill' ? 'block' : 'inline-block')}
        style={{ width: svgW, height: svgH }}
        onPointerDown={handleCanvasPointerDown}
        onClick={onClick}
      >
        <PaperShapeSvg
          svgRef={svgRef}
          svgW={svgW}
          svgH={svgH}
          padding={padding}
          path={path}
          clipId={clipId}
          patternId={patternId}
          maskId={maskId}
          showPattern={showPattern}
          patternType={patternType}
          pattern={pattern}
          hasCutoutMask={hasCutoutMask}
          tagHole={tagHole}
          perforationMaskDots={perforationMaskDots}
          cutoutMaskShapes={cutoutMaskShapes}
          shadowEnabled={shadowEnabled}
          shadowOpacity={shadowOpacity}
          paperShadowColor={paperShadowColor}
          shadowOffsetX={shadowOffsetX}
          shadowOffsetY={shadowOffsetY}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          perforationGuide={perforationGuide}
          shouldFillPerforation={shouldFillPerforation}
          perforationDots={perforationDots}
          perforationRingColor={perforationRingColor}
          foldTriangles={foldTriangles}
          foldTone={foldTone}
          foldOpacity={foldOpacity}
          cutoutStrokePaths={cutoutStrokePaths}
          shouldPunchPerforation={shouldPunchPerforation}
          perforationRingWidth={perforationRingWidth}
          stitchPath={stitchPath}
          stitchStroke={stitchStroke}
          stitchStrokeWidth={stitchStrokeWidth}
          stitchDasharray={stitchDasharray}
          decorations={decorations}
          selectedDecorationId={selectedDecorationId}
          onSelectDecoration={handleSelectDecoration}
          interactiveDecorations={interactiveDecorations}
          registerDecorationTarget={registerDecorationTarget}
          svgPointerEvents={svgPointerEvents}
        />

        {interactiveDecorations && selectedDecoration && selectedDecorationTarget && (
          <PaperShapeDecorationMoveable
            selectedDecoration={selectedDecoration}
            selectedDecorationTarget={selectedDecorationTarget}
            svgRef={svgRef}
            moveableOriginRef={moveableOriginRef}
            onChange={handleDecoChange}
          />
        )}

        {children && (
          <div
            className={cn(
              'absolute inset-0 flex',
              contentAlign === 'start' ? 'items-start justify-start' : 'items-center justify-center'
            )}
            style={{
              paddingTop: `${padding + resolvedContentPadding.top + contentSafeInsets.top}px`,
              paddingRight: `${padding + resolvedContentPadding.right + contentSafeInsets.right}px`,
              paddingBottom: `${padding + resolvedContentPadding.bottom + contentSafeInsets.bottom}px`,
              paddingLeft: `${padding + resolvedContentPadding.left + contentSafeInsets.left}px`,
              pointerEvents: contentInteractive ? 'auto' : (interactiveDecorations ? 'none' : 'auto'),
            }}
          >
            <div
              ref={contentRef}
              className={cn(
                layoutMode === 'fill' || contentAlign === 'start' ? 'w-full max-w-full' : 'inline-flex',
                contentAlign === 'start' ? 'min-h-0 flex flex-col items-stretch justify-start' : 'items-center justify-center',
                contentClassName
              )}
            >
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperShape;
