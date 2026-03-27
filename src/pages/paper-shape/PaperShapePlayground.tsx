import { useCallback, useRef, useState } from 'react';
import { PaperShape, type PaperPatternType, type PatternParams } from '@/components/paper-shape/PaperShape';
import { PaperShapeEditorPanel } from '@/components/paper-shape/PaperShapeEditorPanel';
import { presetInfo, type PaperPreset, type PresetParams } from '@/components/paper-shape/geometry';
import { decorationCatalog, createDecoration, type DecorationItem, type DecorationTransform, type DecorationType } from '@/components/paper-shape/decorations';
import { downloadText, serializeSvg, toPaperShapeJSX, toPaperShapeRecipe } from '@/lib/paper-shape-export';

const allPresets: PaperPreset[] = [
  'stamp', 'coupon', 'ticket', 'tag',
  'folded', 'torn', 'stitched', 'scalloped-edge',
  'receipt', 'basic-paper',
];

const paperColors = ['cream', 'cloud', 'pink', 'apricot', 'peach', 'mint', 'sky', 'lavender'];
const randomPatternTypes: PaperPatternType[] = ['none', 'lines', 'grid', 'dots', 'diagonal', 'waves'];

export default function PaperShapePlayground() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [preset, setPreset] = useState<PaperPreset>('stamp');
  const [width, setWidth] = useState(280);
  const [height, setHeight] = useState(200);
  const [seed, setSeed] = useState(42);
  const [roughness, setRoughness] = useState(0.3);
  const [paperColor, setPaperColor] = useState('cream');
  const [strokeWidth, setStrokeWidth] = useState(1.8);
  const [patternType, setPatternType] = useState<PaperPatternType>('none');
  const [patternParams, setPatternParams] = useState<PatternParams>({});
  const [presetParams, setPresetParams] = useState<PresetParams>({});
  const [decorations, setDecorations] = useState<DecorationItem[]>([]);
  const [activeDecoTab, setActiveDecoTab] = useState<DecorationType>('staple');

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
    setPresetParams({});
    setPatternParams({});
  }, []);

  const addDecoration = useCallback((type: DecorationType, variant: string) => {
    const x = width * 0.3 + Math.random() * width * 0.4;
    const y = height * 0.3 + Math.random() * height * 0.4;
    const deco = createDecoration(type, variant, x, y);
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
    strokeWidth,
    patternType,
    patternParams,
    presetParams,
    decorations,
  }), [preset, width, height, seed, roughness, paperColor, strokeWidth, patternType, patternParams, presetParams, decorations]);

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

  const handleCopyRecipe = useCallback(() => {
    void copyText(JSON.stringify(toPaperShapeRecipe(getExportState()), null, 2));
  }, [copyText, getExportState]);

  const getSvgText = useCallback(() => {
    const svg = previewRef.current?.querySelector('svg');
    return svg ? serializeSvg(svg) : null;
  }, []);

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

  const activeCategory = decorationCatalog.find(c => c.type === activeDecoTab)!;

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-8 lg:min-h-[calc(100vh-180px)]">
      <div ref={previewRef} className="flex flex-col items-center justify-center min-h-[400px] lg:min-h-full bg-card rounded-2xl border border-border p-8">
        <PaperShape
          preset={preset}
          width={width}
          height={height}
          seed={seed}
          roughness={roughness}
          paperColor={paperColor}
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
          <div className="text-center">
            <span className="text-4xl block mb-1">{presetInfo[preset].emoji}</span>
            <span className="font-hand text-lg text-foreground">{presetInfo[preset].label}</span>
          </div>
        </PaperShape>

        {decorations.length > 0 && (
          <p className="text-[10px] text-muted-foreground font-craft mt-3">
            💡 点击装饰可旋转/缩放/删除，拖拽可移动位置
          </p>
        )}
      </div>

      <div className="space-y-5 self-stretch">
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-craft font-medium text-muted-foreground">形状预设</label>
            <button
              onClick={randomize}
              className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-craft font-medium hover:opacity-80 transition"
            >
              🎲 随机
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {allPresets.map((p) => (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`px-2 py-1.5 rounded-lg text-xs font-craft transition ${
                  preset === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {presetInfo[p].emoji} {presetInfo[p].label}
              </button>
            ))}
          </div>
        </div>

        <PaperShapeEditorPanel
          preset={preset}
          width={width}
          height={height}
          seed={seed}
          roughness={roughness}
          paperColor={paperColor}
          strokeWidth={strokeWidth}
          patternType={patternType}
          patternParams={patternParams}
          presetParams={presetParams}
          setWidth={setWidth}
          setHeight={setHeight}
          setSeed={setSeed}
          setRoughness={setRoughness}
          setPaperColor={setPaperColor}
          setStrokeWidth={setStrokeWidth}
          setPatternType={setPatternType}
          setPatternParams={setPatternParams}
          setPresetParams={setPresetParams}
          onCopyJSX={handleCopyJSX}
          onCopyRecipe={handleCopyRecipe}
          onCopySvg={handleCopySvg}
          onDownloadSvg={handleDownloadSvg}
          headerTitle="参数调节"
          extraSections={(
            <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-craft font-semibold text-foreground block">🎨 装饰元素</label>
                {decorations.length > 0 && (
                  <button onClick={clearDecorations} className="text-[10px] font-craft text-destructive hover:underline">
                    清空全部
                  </button>
                )}
              </div>

              <div className="flex gap-1">
                {decorationCatalog.map((cat) => (
                  <button
                    key={cat.type}
                    onClick={() => setActiveDecoTab(cat.type)}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-craft transition ${
                      activeDecoTab === cat.type
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {activeCategory.variants.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => addDecoration(activeDecoTab, v.key)}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-craft bg-background text-foreground border border-border hover:border-primary hover:bg-primary/5 transition"
                    title={`添加 ${v.label}`}
                  >
                    + {v.label}
                  </button>
                ))}
              </div>

              {decorations.length > 0 && (
                <p className="text-[10px] text-muted-foreground font-craft">
                  已添加 {decorations.length} 个装饰
                </p>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
}

