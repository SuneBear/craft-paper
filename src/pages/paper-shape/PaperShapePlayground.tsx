import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PaperShape, type PaperPatternType, type PatternParams } from '@/components/paper-shape/PaperShape';
import { PaperShapeEditorPanel } from './support/PaperShapeEditorPanel';
import { DecorationEditorSection } from './support/DecorationEditorSection';
import { presetInfo, type PaperPreset, type PresetParams } from '@/components/paper-shape/geometry';
import {
  createDecoration,
  getWashiTapePlacementTransform,
  resizeDecorationsForCanvas,
  type DecorationItem,
  type DecorationTransform,
  type DecorationType,
  type WashiTapePlacement,
} from '@/components/paper-shape/decorations';
import {
  downloadText,
  serializeSvg,
  toPaperShapeJSX,
  toPaperShapeRecipe,
  toPaperShapeStandaloneReactCode,
} from '@/lib/paper-shape-export';
import { decodeShareState, encodeShareState } from '@/lib/paper-shape-share';
import { createRandomPresetParams } from '@/lib/paper-shape-random';

const allPresets: PaperPreset[] = [
  'stamp', 'coupon', 'ticket', 'tag',
  'folded', 'torn', 'stitched', 'scalloped-edge',
  'receipt', 'basic-paper',
];

const paperColors = ['cream', 'cloud', 'pink', 'apricot', 'peach', 'mint', 'sky', 'lavender'];
const randomPatternTypes: PaperPatternType[] = ['none', 'lines', 'grid', 'dots', 'diagonal', 'waves'];

export default function PaperShapePlayground() {
  const [searchParams] = useSearchParams();
  const previewRef = useRef<HTMLDivElement>(null);
  const [preset, setPreset] = useState<PaperPreset>('basic-paper');
  const [width, setWidth] = useState(280);
  const [height, setHeight] = useState(200);
  const [seed, setSeed] = useState(42);
  const [roughness, setRoughness] = useState(0.3);
  const [paperColor, setPaperColor] = useState('cream');
  const [strokeColor, setStrokeColor] = useState('#7a553f');
  const [strokeWidth, setStrokeWidth] = useState(1.8);
  const [contentPadding, setContentPadding] = useState(12);
  const [patternType, setPatternType] = useState<PaperPatternType>('none');
  const [patternParams, setPatternParams] = useState<PatternParams>({});
  const [presetParams, setPresetParams] = useState<PresetParams>({});
  const [decorations, setDecorations] = useState<DecorationItem[]>([]);
  const [activeDecoTab, setActiveDecoTab] = useState<DecorationType>('washi-tape');
  const prevCanvasSizeRef = useRef({ width, height });

  useEffect(() => {
    const shared = decodeShareState(searchParams.get('s'));
    if (!shared) return;
    if (shared.preset && allPresets.includes(shared.preset)) setPreset(shared.preset);
    if (typeof shared.seed === 'number') setSeed(shared.seed);
    if (typeof shared.roughness === 'number') setRoughness(shared.roughness);
    if (typeof shared.paperColor === 'string') setPaperColor(shared.paperColor);
    if (typeof shared.strokeColor === 'string') setStrokeColor(shared.strokeColor);
    if (typeof shared.strokeWidth === 'number') setStrokeWidth(shared.strokeWidth);
    if (typeof shared.contentPadding === 'number') setContentPadding(shared.contentPadding);
    if (shared.patternType) setPatternType(shared.patternType);
    if (shared.patternParams) setPatternParams(shared.patternParams);
    if (shared.presetParams) setPresetParams(shared.presetParams);
    if (shared.decorations) setDecorations(shared.decorations);
  }, [searchParams]);

  useEffect(() => {
    const prevSize = prevCanvasSizeRef.current;
    if (prevSize.width === width && prevSize.height === height) return;

    prevCanvasSizeRef.current = { width, height };
    setDecorations((prev) => resizeDecorationsForCanvas(prev, prevSize.width, prevSize.height, width, height));
  }, [width, height]);

  const handlePresetChange = useCallback((p: PaperPreset) => {
    setPreset(p);
    setPresetParams({});
    setPatternParams({});
  }, []);

  const randomize = useCallback(() => {
    setSeed(Math.floor(Math.random() * 10000));
    setRoughness(Math.random() * 0.6 + 0.1);
    setPaperColor(paperColors[Math.floor(Math.random() * paperColors.length)]);
    setPatternType(randomPatternTypes[Math.floor(Math.random() * randomPatternTypes.length)]);
    setPresetParams(createRandomPresetParams(preset, width, height, presetParams));
    setPatternParams({});
  }, [preset, width, height, presetParams]);

  const addDecoration = useCallback((
    type: DecorationType,
    variant: string,
    options?: { washiPlacement?: WashiTapePlacement }
  ) => {
    let deco: DecorationItem;
    if (type === 'washi-tape') {
      const placement = options?.washiPlacement ?? 'top-center';
      const t = getWashiTapePlacementTransform(width, height, placement);
      const randomRotation = (Math.random() - 0.5) * 8;
      deco = createDecoration(type, variant, t.x, t.y, { rotation: t.rotation + randomRotation, scale: t.scale });
    } else if (type === 'staple') {
      const stapleW = 22;
      const stapleH = 20;
      const x = Math.max(6, Math.min(width - stapleW - 6, width / 2 - stapleW / 2 + (Math.random() - 0.5) * Math.min(32, width * 0.18)));
      const y = -stapleH * 0.48;
      const rotation = (Math.random() - 0.5) * 8;
      deco = createDecoration(type, variant, x, y, { rotation, scale: 1 });
    } else {
      const x = width * 0.3 + Math.random() * width * 0.4;
      const y = height * 0.3 + Math.random() * height * 0.4;
      deco = createDecoration(type, variant, x, y);
    }
    setDecorations(prev => [...prev, deco]);
  }, [width, height]);

  const handleDecorationChange = useCallback((id: string, transform: DecorationTransform) => {
    setDecorations(prev => prev.map(d => d.id === id ? { ...d, transform } : d));
  }, []);

  const handleDecorationRemove = useCallback((id: string) => {
    setDecorations(prev => prev.filter(d => d.id !== id));
  }, []);

  const clearDecorations = useCallback(() => {
    setDecorations([]);
  }, []);

  const getExportState = useCallback(() => ({
    preset,
    width,
    height,
    seed,
    roughness,
    paperColor,
    strokeColor,
    strokeWidth,
    contentPadding,
    patternType,
    patternParams,
    presetParams,
    decorations,
  }), [preset, width, height, seed, roughness, paperColor, strokeColor, strokeWidth, contentPadding, patternType, patternParams, presetParams, decorations]);

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_e) {
      // no-op
    }
  }, []);

  const handleCopyJSX = useCallback(() => {
    void copyText(toPaperShapeJSX(getExportState()));
  }, [copyText, getExportState]);

  const getSvgText = useCallback(() => {
    const svg = previewRef.current?.querySelector('svg');
    return svg ? serializeSvg(svg) : null;
  }, []);

  const handleCopyFullCode = useCallback(() => {
    const svgText = getSvgText();
    if (!svgText) return;
    void copyText(toPaperShapeStandaloneReactCode(svgText, { componentName: `${preset} paper shape asset` }));
  }, [copyText, getSvgText, preset]);

  const handleCopyRecipe = useCallback(() => {
    void copyText(JSON.stringify(toPaperShapeRecipe(getExportState()), null, 2));
  }, [copyText, getExportState]);

  const handleCopySvg = useCallback(() => {
    const svgText = getSvgText();
    if (!svgText) return;
    void copyText(svgText);
  }, [copyText, getSvgText]);

  const handleDownloadSvg = useCallback(() => {
    const svgText = getSvgText();
    if (!svgText) return;
    downloadText(`paper-shape-${preset}.svg`, svgText, 'image/svg+xml;charset=utf-8');
  }, [getSvgText, preset]);

  const handleCopyShareLink = useCallback(() => {
    const encoded = encodeShareState(getExportState());
    const url = new URL(window.location.href);
    url.searchParams.set('s', encoded);
    void copyText(url.toString());
  }, [copyText, getExportState]);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-8 lg:h-[calc(100vh-220px)] lg:overflow-hidden">
      <div ref={previewRef} className="relative flex flex-col items-center justify-center min-h-[400px] lg:min-h-0 lg:h-full bg-card rounded-2xl border border-border p-8">
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-1.5 overflow-x-auto pb-1 px-1 py-1">
          <span className="shrink-0 text-[11px] font-craft text-muted-foreground px-1">形状</span>
          {allPresets.map((p) => (
            <button
              key={p}
              onClick={() => handlePresetChange(p)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-craft transition ${
                preset === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {presetInfo[p].emoji} {presetInfo[p].label}
            </button>
          ))}
        </div>
        <PaperShape
          preset={preset}
          width={width}
          height={height}
          seed={seed}
          roughness={roughness}
          paperColor={paperColor}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          contentPadding={contentPadding}
          showPattern={patternType !== 'none'}
          patternType={patternType}
          patternParams={patternParams}
          presetParams={presetParams}
          decorations={decorations}
          onDecorationChange={handleDecorationChange}
          onDecorationRemove={handleDecorationRemove}
          interactiveDecorations={true}
        >
          <div className="text-center">
            <span className="text-4xl block mb-1">{presetInfo[preset].emoji}</span>
            <span className="font-hand text-lg text-foreground">{presetInfo[preset].label}</span>
          </div>
        </PaperShape>

        <p
          className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-craft transition-opacity duration-150 ${
            decorations.length > 0 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          💡 点击装饰可旋转/缩放/删除，拖拽可移动位置
        </p>

        <Link
          to="/ui/paper-shape/stack"
          className="absolute bottom-3 left-3 rounded-lg bg-background/90 px-2.5 py-1 text-[11px] font-craft text-foreground/80 border border-border hover:bg-background transition"
        >
          📚 看堆叠示例
        </Link>

        <Link
          to="/ui/paper-shape/containers"
          className="absolute bottom-3 right-3 rounded-lg bg-background/90 px-2.5 py-1 text-[11px] font-craft text-foreground/80 border border-border hover:bg-background transition"
        >
          🧩 看容器示例
        </Link>
      </div>

      <div className="self-stretch lg:min-h-0 lg:h-full flex flex-col gap-5">
        <div className="lg:min-h-0 lg:flex-1">
          <PaperShapeEditorPanel
            preset={preset}
            width={width}
            height={height}
            seed={seed}
            roughness={roughness}
            paperColor={paperColor}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            contentPadding={contentPadding}
            patternType={patternType}
            patternParams={patternParams}
            presetParams={presetParams}
            setWidth={setWidth}
            setHeight={setHeight}
            setSeed={setSeed}
            setRoughness={setRoughness}
            setPaperColor={setPaperColor}
            setStrokeColor={setStrokeColor}
            setStrokeWidth={setStrokeWidth}
            setContentPadding={setContentPadding}
            setPatternType={setPatternType}
            setPatternParams={setPatternParams}
            setPresetParams={setPresetParams}
            onCopyJSX={handleCopyJSX}
            onCopyFullCode={handleCopyFullCode}
            onCopyRecipe={handleCopyRecipe}
            onCopySvg={handleCopySvg}
            onDownloadSvg={handleDownloadSvg}
            onCopyShareLink={handleCopyShareLink}
            headerTitle="参数调节"
            internalScroll
            headerRight={(
              <button
                onClick={randomize}
                className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-craft font-medium hover:opacity-80 transition"
              >
                🎲 随机
              </button>
            )}
            extraSections={(
              <DecorationEditorSection
                activeType={activeDecoTab}
                onChangeType={setActiveDecoTab}
                onAdd={addDecoration}
                count={decorations.length}
                onClear={clearDecorations}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
