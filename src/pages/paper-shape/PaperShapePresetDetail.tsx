import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { PaperShape, type PaperPatternType, type PatternParams } from '@/components/paper-shape/PaperShape';
import { PaperShapeEditorPanel } from '@/components/paper-shape/PaperShapeEditorPanel';
import { PaperShapeSampleContent } from '@/components/paper-shape/PaperShapeSampleContent';
import { DecorationEditorSection } from '@/components/paper-shape/DecorationEditorSection';
import { presetInfo, type PaperPreset, type PresetParams } from '@/components/paper-shape/geometry';
import {
  createDecoration,
  getWashiTapePlacementTransform,
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

const allPresets = Object.keys(presetInfo) as PaperPreset[];
const paperColors = ['cream', 'cloud', 'pink', 'apricot', 'peach', 'mint', 'sky', 'lavender'];
const randomPatternTypes: PaperPatternType[] = ['none', 'lines', 'grid', 'dots', 'diagonal', 'waves'];

function isPaperPreset(v?: string): v is PaperPreset {
  return !!v && allPresets.includes(v as PaperPreset);
}

export default function PaperShapePresetDetail() {
  const { preset: routePreset } = useParams<{ preset: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);

  const preset = useMemo<PaperPreset | null>(
    () => (isPaperPreset(routePreset) ? routePreset : null),
    [routePreset]
  );

  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(210);
  const [seed, setSeed] = useState(42);
  const [roughness, setRoughness] = useState(0.3);
  const [paperColor, setPaperColor] = useState('cream');
  const [strokeColor, setStrokeColor] = useState('#7a553f');
  const [strokeWidth, setStrokeWidth] = useState(1.8);
  const [patternType, setPatternType] = useState<PaperPatternType>('none');
  const [patternParams, setPatternParams] = useState<PatternParams>({});
  const [presetParams, setPresetParams] = useState<PresetParams>({});
  const [decorations, setDecorations] = useState<DecorationItem[]>([]);
  const [activeDecoTab, setActiveDecoTab] = useState<DecorationType>('washi-tape');
  const [contentMode, setContentMode] = useState<number | null>(null);
  const [contentTitle, setContentTitle] = useState('');

  useEffect(() => {
    setPresetParams({});
    setPatternParams({});
    setDecorations([]);
    setContentMode(null);
    setContentTitle('');
  }, [preset]);

  useEffect(() => {
    const modeRaw = searchParams.get('cm');
    const parsedMode = modeRaw !== null ? Number(modeRaw) : NaN;
    setContentMode(Number.isFinite(parsedMode) ? Math.max(0, Math.floor(parsedMode)) : null);
    setContentTitle(searchParams.get('ct') || '');

    const shared = decodeShareState(searchParams.get('s'));
    if (!shared) return;
    if (typeof shared.width === 'number') setWidth(shared.width);
    if (typeof shared.height === 'number') setHeight(shared.height);
    if (typeof shared.seed === 'number') setSeed(shared.seed);
    if (typeof shared.roughness === 'number') setRoughness(shared.roughness);
    if (typeof shared.paperColor === 'string') setPaperColor(shared.paperColor);
    if (typeof shared.strokeColor === 'string') setStrokeColor(shared.strokeColor);
    if (typeof shared.strokeWidth === 'number') setStrokeWidth(shared.strokeWidth);
    if (shared.patternType) setPatternType(shared.patternType);
    if (shared.patternParams) setPatternParams(shared.patternParams);
    if (shared.presetParams) setPresetParams(shared.presetParams);
    if (shared.decorations) setDecorations(shared.decorations);
  }, [searchParams]);

  const resolvedPreset: PaperPreset = preset ?? 'stamp';
  const info = presetInfo[resolvedPreset];

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_e) {
      // no-op
    }
  }, []);

  const exportState = useMemo(() => ({
    preset: resolvedPreset,
    width,
    height,
    seed,
    roughness,
    paperColor,
    strokeColor,
    strokeWidth,
    patternType,
    patternParams,
    presetParams,
    decorations,
  }), [
    resolvedPreset,
    width,
    height,
    seed,
    roughness,
    paperColor,
    strokeColor,
    strokeWidth,
    patternType,
    patternParams,
    presetParams,
    decorations,
  ]);

  const getSvgText = useCallback(() => {
    const svg = previewRef.current?.querySelector('svg');
    return svg ? serializeSvg(svg) : null;
  }, []);

  const handleCopyFullCode = useCallback(() => {
    const svgText = getSvgText();
    if (!svgText) return;
    void copyText(toPaperShapeStandaloneReactCode(svgText, { componentName: `${resolvedPreset} paper shape asset` }));
  }, [copyText, getSvgText, resolvedPreset]);

  const randomize = useCallback(() => {
    setSeed(Math.floor(Math.random() * 10000));
    setRoughness(Math.random() * 0.6 + 0.1);
    setPaperColor(paperColors[Math.floor(Math.random() * paperColors.length)]);
    setPatternType(randomPatternTypes[Math.floor(Math.random() * randomPatternTypes.length)]);
    setPresetParams(createRandomPresetParams(resolvedPreset, width, height, presetParams));
    setPatternParams({});
  }, [resolvedPreset, width, height, presetParams]);

  const handleCopyShareLink = useCallback(() => {
    const encoded = encodeShareState(exportState);
    const url = new URL(window.location.href);
    url.searchParams.set('s', encoded);
    void copyText(url.toString());
  }, [copyText, exportState]);

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
    } else {
      const x = width * 0.3 + Math.random() * width * 0.4;
      const y = height * 0.3 + Math.random() * height * 0.4;
      deco = createDecoration(type, variant, x, y);
    }
    setDecorations((prev) => [...prev, deco]);
  }, [width, height]);

  const handleDecorationChange = useCallback((id: string, transform: DecorationTransform) => {
    setDecorations((prev) => prev.map((d) => (d.id === id ? { ...d, transform } : d)));
  }, []);

  const handleDecorationRemove = useCallback((id: string) => {
    setDecorations((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const clearDecorations = useCallback(() => {
    setDecorations([]);
  }, []);

  if (!preset) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-craft text-muted-foreground">未找到这个形状预设。</p>
        <Link
          to="/ui/paper-shape/examples"
          className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-craft"
        >
          返回示例库
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-8 lg:h-[calc(100vh-220px)] lg:overflow-hidden">
        <div ref={previewRef} className="relative flex flex-col items-center justify-center min-h-[420px] lg:min-h-0 bg-card rounded-2xl border border-border p-8">
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-1.5 overflow-x-auto pb-1 px-1 py-1">
            <span className="shrink-0 text-[11px] font-craft text-muted-foreground px-1">形状</span>
            {allPresets.map((p) => (
              <button
                key={p}
                onClick={() => navigate(`/ui/paper-shape/preset/${p}`)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-craft transition ${
                  p === resolvedPreset
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {presetInfo[p].emoji} {presetInfo[p].label}
              </button>
            ))}
          </div>

          <PaperShape
            preset={resolvedPreset}
            width={width}
            height={height}
            seed={seed}
            roughness={roughness}
            paperColor={paperColor}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
            showPattern={patternType !== 'none'}
            patternType={patternType}
            patternParams={patternParams}
            presetParams={presetParams}
            decorations={decorations}
            onDecorationChange={handleDecorationChange}
            onDecorationRemove={handleDecorationRemove}
            interactiveDecorations={true}
          >
            {contentMode !== null ? (
              <PaperShapeSampleContent
                mode={contentMode}
                title={contentTitle || info.label}
                emoji={info.emoji}
                preset={resolvedPreset}
              />
            ) : (
              <div className="text-center">
                <span className="text-4xl block mb-1">{info.emoji}</span>
                <span className="font-hand text-lg text-foreground">{info.label}</span>
              </div>
            )}
          </PaperShape>
          <p className="text-xs text-muted-foreground font-craft mt-4">{info.description}</p>
        </div>

        <div className="self-stretch lg:h-full">
          <PaperShapeEditorPanel
            preset={preset}
            width={width}
            height={height}
            seed={seed}
            roughness={roughness}
            paperColor={paperColor}
            strokeColor={strokeColor}
            strokeWidth={strokeWidth}
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
            setPatternType={setPatternType}
            setPatternParams={setPatternParams}
            setPresetParams={setPresetParams}
            onCopyJSX={() => { void copyText(toPaperShapeJSX(exportState)); }}
            onCopyFullCode={handleCopyFullCode}
            onCopyRecipe={() => { void copyText(JSON.stringify(toPaperShapeRecipe(exportState), null, 2)); }}
            onCopySvg={() => {
              const svg = getSvgText();
              if (!svg) return;
              void copyText(svg);
            }}
            onDownloadSvg={() => {
              const svg = getSvgText();
              if (!svg) return;
              downloadText(`paper-shape-${resolvedPreset}.svg`, svg, 'image/svg+xml;charset=utf-8');
            }}
            onCopyShareLink={handleCopyShareLink}
            headerTitle="形状详情参数"
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
