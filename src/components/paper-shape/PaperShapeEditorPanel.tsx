import { useEffect, useRef, useState, type ReactNode } from 'react';
import { presetInfo, presetParamsDefs, type PaperPreset, type PresetParams } from './geometry';
import type { PaperPatternType, PatternParams } from './PaperShape';
import { cn } from '@/lib/utils';

const paperColors = [
  { key: 'cream', label: '奶油' },
  { key: 'cloud', label: '云朵白' },
  { key: 'pink', label: '浅粉' },
  { key: 'apricot', label: '杏灰' },
  { key: 'peach', label: '蜜桃' },
  { key: 'mint', label: '薄荷' },
  { key: 'sky', label: '天空蓝' },
  { key: 'lavender', label: '薰衣草' },
];

const paperColorHexMap: Record<string, string> = {
  cream: '#f9ec8f',
  cloud: '#f6f2df',
  pink: '#f8c0cf',
  apricot: '#f7c28f',
  peach: '#f7a78f',
  mint: '#beeecd',
  sky: '#b7dbff',
  lavender: '#d8bff3',
};

const strokeColorSwatches = ['#7a553f', '#3f4b68', '#5c6f4f', '#7a4c66', '#5a5a5a', '#202020'];
const shadowColorSwatches = ['#6f5a46', '#5f6a7d', '#5d735d', '#6d5878', '#4f4f4f', '#252525'];
const stitchColorSwatches = ['#7a553f', '#6a6a6a', '#5c6f4f', '#3f4b68', '#7a4c66', '#222222'];
const foldColorSwatches = ['#7a553f', '#8a6a57', '#5f4f44', '#6e5a8a', '#4f6a7a', '#6a6a6a'];
const stitchStyleOptions = [
  { value: 0, label: '虚线' },
  { value: 1, label: '点状' },
  { value: 2, label: '实线' },
  { value: 3, label: '点划线' },
] as const;
const stampArcDirectionOptions = [
  { value: 0, label: '圆弧朝内' },
  { value: 1, label: '圆弧朝外' },
] as const;
const cornerShapeOptions = [
  { value: 0, label: 'Round' },
  { value: 1, label: 'Scoop' },
  { value: 2, label: 'Bevel' },
  { value: 3, label: 'Notch' },
  { value: 4, label: 'Squircle' },
  { value: 5, label: 'Superellipse' },
] as const;

function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{6})$/.test(value);
}

const patternOptions = [
  { key: 'none' as const, label: '无' },
  { key: 'lines' as const, label: '横线' },
  { key: 'grid' as const, label: '方格' },
  { key: 'dots' as const, label: '点阵' },
  { key: 'diagonal' as const, label: '斜线' },
  { key: 'waves' as const, label: '波纹' },
];

const foldCornerOptions = [
  { bit: 1, label: '左上' },
  { bit: 2, label: '右上' },
  { bit: 4, label: '右下' },
  { bit: 8, label: '左下' },
] as const;

const ticketStubSideOptions = [
  { value: 0, label: '右侧票根' },
  { value: 1, label: '左侧票根' },
  { value: 2, label: '上方票根' },
  { value: 3, label: '下方票根' },
] as const;

const cutoutEdgeOptions = [
  {
    bit: 1,
    edge: 'top',
    label: '上边',
    shapeKey: 'cutoutShapeTop',
    radiusKey: 'cutoutRadiusTop',
    depthKey: 'cutoutDepthTop',
    offsetKey: 'cutoutOffsetTop',
  },
  {
    bit: 2,
    edge: 'right',
    label: '右边',
    shapeKey: 'cutoutShapeRight',
    radiusKey: 'cutoutRadiusRight',
    depthKey: 'cutoutDepthRight',
    offsetKey: 'cutoutOffsetRight',
  },
  {
    bit: 4,
    edge: 'bottom',
    label: '下边',
    shapeKey: 'cutoutShapeBottom',
    radiusKey: 'cutoutRadiusBottom',
    depthKey: 'cutoutDepthBottom',
    offsetKey: 'cutoutOffsetBottom',
  },
  {
    bit: 8,
    edge: 'left',
    label: '左边',
    shapeKey: 'cutoutShapeLeft',
    radiusKey: 'cutoutRadiusLeft',
    depthKey: 'cutoutDepthLeft',
    offsetKey: 'cutoutOffsetLeft',
  },
] as const;

const cutoutShapeOptions = [
  { value: 0, label: '三角' },
  { value: 1, label: '圆弧' },
  { value: 2, label: '圆角矩形' },
] as const;
const perforationModeOptions = [
  { value: 0, label: '虚线' },
  { value: 1, label: '圆孔' },
] as const;

interface PaperShapeEditorPanelProps {
  preset: PaperPreset;
  width: number;
  height: number;
  seed: number;
  roughness: number;
  paperColor: string;
  strokeColor: string;
  strokeWidth: number;
  patternType: PaperPatternType;
  patternParams: PatternParams;
  presetParams: PresetParams;
  setWidth: (v: number) => void;
  setHeight: (v: number) => void;
  setSeed: (v: number) => void;
  setRoughness: (v: number) => void;
  setPaperColor: (v: string) => void;
  setStrokeColor: (v: string) => void;
  setStrokeWidth: (v: number) => void;
  setPatternType: (v: PaperPatternType) => void;
  setPatternParams: (fn: (prev: PatternParams) => PatternParams) => void;
  setPresetParams: (fn: (prev: PresetParams) => PresetParams) => void;
  onCopyJSX: () => void;
  onCopyFullCode?: () => void;
  onCopyRecipe: () => void;
  onCopySvg: () => void;
  onDownloadSvg: () => void;
  onCopyShareLink?: () => void;
  headerTitle?: string;
  headerRight?: ReactNode;
  extraSections?: ReactNode;
  internalScroll?: boolean;
  textContent?: {
    enabled: boolean;
    title: string;
    subtitle: string;
    emoji: string;
  };
  setTextContent?: (fn: (prev: {
    enabled: boolean;
    title: string;
    subtitle: string;
    emoji: string;
  }) => {
    enabled: boolean;
    title: string;
    subtitle: string;
    emoji: string;
  }) => void;
}

export function PaperShapeEditorPanel({
  preset,
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
  setWidth,
  setHeight,
  setSeed,
  setRoughness,
  setPaperColor,
  setStrokeColor,
  setStrokeWidth,
  setPatternType,
  setPatternParams,
  setPresetParams,
  onCopyJSX,
  onCopyFullCode,
  onCopyRecipe,
  onCopySvg,
  onDownloadSvg,
  onCopyShareLink,
  headerTitle,
  headerRight,
  extraSections,
  internalScroll = false,
  textContent,
  setTextContent,
}: PaperShapeEditorPanelProps) {
  const currentParamDefs = presetParamsDefs[preset];
  const isPerforationPreset = preset === 'coupon' || preset === 'ticket';
  const [copiedKey, setCopiedKey] = useState<'jsx' | 'full' | 'recipe' | 'svg' | 'share' | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cornerSectionOpen, setCornerSectionOpen] = useState(false);
  const [cornerShapeOverrideOpen, setCornerShapeOverrideOpen] = useState(false);
  const [cutoutSectionOpen, setCutoutSectionOpen] = useState(false);
  const [cutoutOverrideOpen, setCutoutOverrideOpen] = useState(false);
  const [shadowSectionOpen, setShadowSectionOpen] = useState(false);
  const visibleParamDefs = currentParamDefs.filter(
    (d) => ![
      'cutoutEdges',
      'cutoutShape',
      'cutoutRadius',
      'cutoutDepth',
      'cutoutOffset',
      'cornerRadius',
      'cornerRadiusTL',
      'cornerRadiusTR',
      'cornerRadiusBR',
      'cornerRadiusBL',
      'stitchColor',
    ].includes(d.key as string)
      && !(preset === 'folded' && d.key === 'foldSize')
      && !(preset === 'stamp' && d.key === 'stampArcDirection')
      && !(isPerforationPreset && d.key === 'perforationMode')
  );
  const foldCornerMask = Math.round(presetParams.foldCorners ?? 2) || 2;
  const ticketStubSide = Math.round(presetParams.ticketStubSide ?? 0);
  const cutoutEdgeMask = Math.max(0, Math.round(presetParams.cutoutEdges ?? 0));
  const cutoutShape = Math.max(0, Math.min(2, Math.round(presetParams.cutoutShape ?? 0)));
  const cutoutRadius = presetParams.cutoutRadius ?? Math.min(width, height) * 0.07;
  const cutoutDepth = presetParams.cutoutDepth ?? Math.max(1.5, cutoutRadius * 0.85);
  const cutoutOffset = presetParams.cutoutOffset ?? 0;
  const cutoutOffsetRange = Math.max(width, height) / 2;
  const readOverrideNumber = (key: keyof PresetParams, fallback: number, min: number, max: number) => {
    const raw = presetParams[key];
    const n = typeof raw === 'number' ? raw : fallback;
    return Math.max(min, Math.min(max, n));
  };
  const readOverrideShape = (key: keyof PresetParams, fallback: number) => {
    const raw = presetParams[key];
    const n = typeof raw === 'number' ? raw : fallback;
    return Math.max(0, Math.min(2, Math.round(n)));
  };
  const hasCutoutOverrides = cutoutEdgeOptions.some((edge) =>
    typeof presetParams[edge.shapeKey] === 'number'
    || typeof presetParams[edge.radiusKey] === 'number'
    || typeof presetParams[edge.depthKey] === 'number'
    || typeof presetParams[edge.offsetKey] === 'number'
  );
  const cutoutDefaultBleed = cutoutShape === 0
    ? Math.max(0.8, strokeWidth * 0.85 + 0.35)
    : Math.max(0.5, strokeWidth * 0.55 + 0.18);
  const cutoutAABleed = Math.max(0, Math.min(4, presetParams.cutoutAABleed ?? cutoutDefaultBleed));
  const cornerDefault =
    preset === 'coupon' ? 14 :
    preset === 'ticket' ? 10 :
    preset === 'stitched' ? 12 :
    preset === 'basic-paper' ? 6 :
    0;
  const cornerMax = Math.max(8, Math.min(80, Math.floor(Math.min(width, height) * 0.5)));
  const cornerBase = presetParams.cornerRadius ?? cornerDefault;
  const cornerTL = presetParams.cornerRadiusTL ?? cornerBase;
  const cornerTR = presetParams.cornerRadiusTR ?? cornerBase;
  const cornerBR = presetParams.cornerRadiusBR ?? cornerBase;
  const cornerBL = presetParams.cornerRadiusBL ?? cornerBase;
  const cornerShape = Math.max(0, Math.min(5, Math.round(presetParams.cornerShape ?? 0)));
  const cornerShapeTL = typeof presetParams.cornerShapeTL === 'number'
    ? Math.max(0, Math.min(5, Math.round(presetParams.cornerShapeTL)))
    : null;
  const cornerShapeTR = typeof presetParams.cornerShapeTR === 'number'
    ? Math.max(0, Math.min(5, Math.round(presetParams.cornerShapeTR)))
    : null;
  const cornerShapeBR = typeof presetParams.cornerShapeBR === 'number'
    ? Math.max(0, Math.min(5, Math.round(presetParams.cornerShapeBR)))
    : null;
  const cornerShapeBL = typeof presetParams.cornerShapeBL === 'number'
    ? Math.max(0, Math.min(5, Math.round(presetParams.cornerShapeBL)))
    : null;
  const hasCornerShapeOverrides =
    cornerShapeTL !== null || cornerShapeTR !== null || cornerShapeBR !== null || cornerShapeBL !== null;
  const cornerNeedsSuperellipse =
    cornerShape === 5 || cornerShapeTL === 5 || cornerShapeTR === 5 || cornerShapeBR === 5 || cornerShapeBL === 5;
  const cornerSuperellipse = Math.max(-4, Math.min(4, presetParams.cornerSuperellipse ?? 1));
  const shadowEnabled = presetParams.shadowEnabled !== false;
  const shadowOffsetX = Math.max(-32, Math.min(32, presetParams.shadowOffsetX ?? 3));
  const shadowOffsetY = Math.max(-32, Math.min(32, presetParams.shadowOffsetY ?? 3));
  const shadowOpacity = Math.max(0, Math.min(1, presetParams.shadowOpacity ?? 0.2));
  const shadowColor = typeof presetParams.shadowColor === 'string' ? presetParams.shadowColor : '';
  const shadowColorPickerValue = isHexColor(shadowColor) ? shadowColor : '#6f5a46';
  const shadowAutoColor = shadowColor.trim().length === 0;
  const stitchColor = typeof presetParams.stitchColor === 'string' ? presetParams.stitchColor : strokeColor;
  const stitchStyle = Math.max(0, Math.min(3, Math.round(presetParams.stitchStyle ?? 0)));
  const perforationMode = Math.max(0, Math.min(1, Math.round(presetParams.perforationMode ?? 0)));
  const perforationRingWidth = Math.max(0.1, presetParams.perforationRingWidth ?? Math.max(0.35, strokeWidth * 0.42));
  const perforationRingColor = typeof presetParams.perforationRingColor === 'string'
    ? presetParams.perforationRingColor
    : strokeColor;
  const stampArcDirection = Math.max(0, Math.min(1, Math.round(presetParams.stampArcDirection ?? 1)));

  const getParamValue = (key: keyof PresetParams) => {
    if (presetParams[key] !== undefined) return presetParams[key] as number;
    const def = currentParamDefs.find(d => d.key === key);
    return def ? def.defaultVal(width, height) : 0;
  };
  const foldSize = getParamValue('foldSize');
  const foldColor = typeof presetParams.foldColor === 'string' ? presetParams.foldColor : strokeColor;
  const foldOpacity = Math.max(0, Math.min(1, presetParams.foldOpacity ?? 0.34));

  const setParamValue = (key: keyof PresetParams, val: number) => {
    setPresetParams((prev) => ({ ...prev, [key]: val }));
  };
  const paperColorPickerValue = isHexColor(paperColor) ? paperColor : (paperColorHexMap[paperColor] || '#f7e8bf');

  const runCopyAction = async (
    key: 'jsx' | 'full' | 'recipe' | 'svg' | 'share',
    action: () => void | Promise<void>
  ) => {
    await action();
    setCopiedKey(key);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopiedKey(null), 1500);
  };

  useEffect(() => () => {
    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current);
    }
  }, []);

  return (
    <div
      className={cn(
        'space-y-4 bg-card rounded-2xl border border-border p-5 self-stretch',
        internalScroll && 'lg:h-full lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto'
      )}
      style={internalScroll ? { scrollbarGutter: 'stable' } : undefined}
    >
      {(headerTitle || headerRight) && (
        <div className="flex items-center justify-between">
          {headerTitle ? <h3 className="font-hand text-xl font-semibold">{headerTitle}</h3> : <div />}
          {headerRight}
        </div>
      )}

      {textContent && setTextContent && (
        <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center justify-between">
            <label className="text-xs font-craft font-semibold text-foreground block">📝 文字内容</label>
            <button
              onClick={() => setTextContent((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`px-2 py-1 rounded-md text-[10px] font-craft transition ${
                textContent.enabled ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              {textContent.enabled ? '已启用' : '已关闭'}
            </button>
          </div>
          <div className="grid grid-cols-[56px_1fr] items-center gap-2">
            <label className="text-[10px] font-craft text-muted-foreground">Emoji</label>
            <input
              type="text"
              value={textContent.emoji}
              onChange={(e) => setTextContent((prev) => ({ ...prev, emoji: e.target.value }))}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs font-craft text-foreground"
              placeholder="🎟️"
            />
            <label className="text-[10px] font-craft text-muted-foreground">标题</label>
            <input
              type="text"
              value={textContent.title}
              onChange={(e) => setTextContent((prev) => ({ ...prev, title: e.target.value }))}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs font-craft text-foreground"
              placeholder="输入主标题"
            />
            <label className="text-[10px] font-craft text-muted-foreground">副标题</label>
            <input
              type="text"
              value={textContent.subtitle}
              onChange={(e) => setTextContent((prev) => ({ ...prev, subtitle: e.target.value }))}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs font-craft text-foreground"
              placeholder="输入副标题"
            />
          </div>
        </div>
      )}

      {visibleParamDefs.length > 0 && (
        <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border">
          <label className="text-xs font-craft font-semibold text-foreground block">
            ✨ {presetInfo[preset].label}专属参数
          </label>
          {visibleParamDefs.map((def) => {
            const val = getParamValue(def.key);
            return (
              <div key={def.key}>
                <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                  <span>{def.label}</span>
                  <span className="text-foreground">{typeof val === 'number' ? val.toFixed(1) : val}</span>
                </label>
                <input
                  type="range"
                  min={def.min}
                  max={def.max}
                  step={def.step}
                  value={val}
                  onChange={(e) => setParamValue(def.key, Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            );
          })}
          {isPerforationPreset && (
            <div>
              <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">中间打孔模式</label>
              <div className="grid grid-cols-2 gap-1.5">
                {perforationModeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPresetParams((prev) => ({ ...prev, perforationMode: opt.value }))}
                    className={`px-2 py-1.5 rounded-lg text-xs font-craft transition ${
                      perforationMode === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {preset === 'stamp' && (
            <div>
              <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">齿边方向</label>
              <div className="grid grid-cols-2 gap-1.5">
                {stampArcDirectionOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPresetParams((prev) => ({ ...prev, stampArcDirection: opt.value }))}
                    className={`px-2 py-1.5 rounded-lg text-xs font-craft transition ${
                      stampArcDirection === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {preset === 'stitched' && (
            <div className="space-y-2">
              <div>
                <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">缝线形状</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {stitchStyleOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPresetParams((prev) => ({ ...prev, stitchStyle: opt.value }))}
                      className={`px-2 py-1.5 rounded-lg text-xs font-craft transition ${
                        stitchStyle === opt.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">缝线颜色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={isHexColor(stitchColor) ? stitchColor : '#7a553f'}
                    onChange={(e) => setPresetParams((prev) => ({ ...prev, stitchColor: e.target.value }))}
                    className="h-8 w-10 p-0 border border-border rounded bg-transparent cursor-pointer"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {stitchColorSwatches.map((c) => (
                      <button
                        key={c}
                        onClick={() => setPresetParams((prev) => ({ ...prev, stitchColor: c }))}
                        className="h-5 w-5 rounded-full border border-border"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {isPerforationPreset && perforationMode === 1 && (
            <div className="space-y-2">
              <div>
                <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">中间打孔描边颜色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={isHexColor(perforationRingColor) ? perforationRingColor : '#7a553f'}
                    onChange={(e) => setPresetParams((prev) => ({ ...prev, perforationRingColor: e.target.value }))}
                    className="h-8 w-10 p-0 border border-border rounded bg-transparent cursor-pointer"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {strokeColorSwatches.map((c) => (
                      <button
                        key={c}
                        onClick={() => setPresetParams((prev) => ({ ...prev, perforationRingColor: c }))}
                        className="h-5 w-5 rounded-full border border-border"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                  <span>中间打孔描边粗细</span>
                  <span className="text-foreground">{perforationRingWidth.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={3}
                  step={0.05}
                  value={perforationRingWidth}
                  onChange={(e) => setPresetParams((prev) => ({ ...prev, perforationRingWidth: Number(e.target.value) }))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className={cn(
        'rounded-xl bg-muted/50 border border-border',
        cornerSectionOpen ? 'space-y-3 p-3' : 'p-2'
      )}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCornerSectionOpen((v) => !v)}
            className="flex-1 h-8 px-2 -mx-1 rounded-md text-left text-xs font-craft font-semibold text-foreground hover:bg-background/60 transition"
          >
            {cornerSectionOpen ? '▾' : '▸'} ◻️ 圆角
          </button>
          <button
            onClick={() => setPresetParams((prev) => ({
              ...prev,
              cornerRadius: 0,
              cornerRadiusTL: undefined,
              cornerRadiusTR: undefined,
              cornerRadiusBR: undefined,
              cornerRadiusBL: undefined,
              cornerShape: 0,
              cornerShapeTL: undefined,
              cornerShapeTR: undefined,
              cornerShapeBR: undefined,
              cornerShapeBL: undefined,
              cornerSuperellipse: undefined,
            }))}
            className="text-[10px] font-craft text-muted-foreground hover:text-foreground"
          >
            重置
          </button>
        </div>
        {cornerSectionOpen && (
          <>
            <div>
              <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                <span>基础圆角</span>
                <span className="text-foreground">{cornerBase.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={cornerMax}
                step={0.5}
                value={cornerBase}
                onChange={(e) => setPresetParams((prev) => ({ ...prev, cornerRadius: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['cornerRadiusTL', '左上', cornerTL],
                ['cornerRadiusTR', '右上', cornerTR],
                ['cornerRadiusBL', '左下', cornerBL],
                ['cornerRadiusBR', '右下', cornerBR],
              ].map(([key, label, val]) => (
                <div key={key}>
                  <label className="text-[10px] font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                    <span>{label}</span>
                    <span className="text-foreground">{Number(val).toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={cornerMax}
                    step={0.5}
                    value={Number(val)}
                    onChange={(e) => setPresetParams((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">全局角形状（corner-shape）</label>
              <div className="grid grid-cols-3 gap-1.5">
                {cornerShapeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPresetParams((prev) => ({ ...prev, cornerShape: opt.value }))}
                    className={`px-2 py-1.5 rounded-lg text-xs font-craft transition ${
                      cornerShape === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 rounded-lg border border-border/70 bg-background/45 p-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCornerShapeOverrideOpen((v) => !v)}
                  className="text-[11px] font-craft font-medium text-muted-foreground hover:text-foreground"
                >
                  {cornerShapeOverrideOpen ? '▾' : '▸'} 单角覆盖（未设置=跟随全局）
                </button>
                {hasCornerShapeOverrides && (
                  <button
                    onClick={() => setPresetParams((prev) => ({
                      ...prev,
                      cornerShapeTL: undefined,
                      cornerShapeTR: undefined,
                      cornerShapeBR: undefined,
                      cornerShapeBL: undefined,
                    }))}
                    className="text-[10px] font-craft text-muted-foreground hover:text-foreground"
                  >
                    清除覆盖
                  </button>
                )}
              </div>
              {cornerShapeOverrideOpen && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['cornerShapeTL', '左上', cornerShapeTL],
                    ['cornerShapeTR', '右上', cornerShapeTR],
                    ['cornerShapeBL', '左下', cornerShapeBL],
                    ['cornerShapeBR', '右下', cornerShapeBR],
                  ].map(([key, label, val]) => (
                    <label key={key} className="space-y-1">
                      <span className="text-[10px] font-craft text-muted-foreground block">{label}</span>
                      <select
                        value={val === null ? -1 : Number(val)}
                        onChange={(e) => {
                          const next = Number(e.target.value);
                          setPresetParams((prev) => ({
                            ...prev,
                            [key]: next < 0 ? undefined : next,
                          }));
                        }}
                        className="h-8 w-full rounded-md border border-border bg-background px-2 text-[11px] font-craft text-foreground"
                      >
                        <option value={-1}>跟随全局</option>
                        {cornerShapeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {cornerNeedsSuperellipse && (
              <div>
                <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                  <span>superellipse(k)</span>
                  <span className="text-foreground">{cornerSuperellipse.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min={-4}
                  max={4}
                  step={0.1}
                  value={cornerSuperellipse}
                  onChange={(e) => setPresetParams((prev) => ({ ...prev, cornerSuperellipse: Number(e.target.value) }))}
                  className="w-full accent-primary"
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className={cn(
        'rounded-xl bg-muted/50 border border-border',
        cutoutSectionOpen ? 'space-y-2 p-3' : 'p-2'
      )}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCutoutSectionOpen((v) => !v)}
            className="flex-1 h-8 px-2 -mx-1 rounded-md text-left text-xs font-craft font-semibold text-foreground hover:bg-background/60 transition"
          >
            {cutoutSectionOpen ? '▾' : '▸'} ✂️ 裁剪
          </button>
          <button
            onClick={() => setPresetParams((prev) => ({
              ...prev,
              cutoutEdges: 0,
              cutoutShapeTop: undefined,
              cutoutShapeRight: undefined,
              cutoutShapeBottom: undefined,
              cutoutShapeLeft: undefined,
              cutoutRadiusTop: undefined,
              cutoutRadiusRight: undefined,
              cutoutRadiusBottom: undefined,
              cutoutRadiusLeft: undefined,
              cutoutDepthTop: undefined,
              cutoutDepthRight: undefined,
              cutoutDepthBottom: undefined,
              cutoutDepthLeft: undefined,
              cutoutOffsetTop: undefined,
              cutoutOffsetRight: undefined,
              cutoutOffsetBottom: undefined,
              cutoutOffsetLeft: undefined,
            }))}
            className="text-[10px] font-craft text-muted-foreground hover:text-foreground"
          >
            清空
          </button>
        </div>
        {cutoutSectionOpen && (
          <>
            <div className="grid grid-cols-4 gap-1.5">
            {cutoutEdgeOptions.map((edge) => {
              const active = (cutoutEdgeMask & edge.bit) !== 0;
              return (
                <button
                  key={edge.bit}
                  onClick={() => {
                    setPresetParams((prev) => {
                      const current = Math.max(0, Math.round(prev.cutoutEdges ?? 0));
                      const next = current ^ edge.bit;
                      return { ...prev, cutoutEdges: next };
                    });
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-craft transition ${
                    active ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {edge.label}
                </button>
              );
            })}
            </div>

            <div>
              <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">裁剪形状</label>
              <div className="grid grid-cols-3 gap-1.5">
                {cutoutShapeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPresetParams((prev) => ({ ...prev, cutoutShape: opt.value }))}
                    className={`px-2 py-1.5 rounded-lg text-xs font-craft transition ${
                      cutoutShape === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                <span>裁剪宽度</span>
                <span className="text-foreground">{cutoutRadius.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min={3}
                max={Math.max(16, Math.min(width, height) * 0.3)}
                step={0.5}
                value={cutoutRadius}
                onChange={(e) => setPresetParams((prev) => ({ ...prev, cutoutRadius: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                <span>裁剪深度</span>
                <span className="text-foreground">{cutoutDepth.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min={1.5}
                max={Math.max(12, Math.min(width, height) * 0.25)}
                step={0.5}
                value={cutoutDepth}
                onChange={(e) => setPresetParams((prev) => ({ ...prev, cutoutDepth: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                <span>全局裁剪偏移</span>
                <span className="text-foreground">{cutoutOffset.toFixed(0)}</span>
              </label>
              <input
                type="range"
                min={-cutoutOffsetRange}
                max={cutoutOffsetRange}
                step={1}
                value={cutoutOffset}
                onChange={(e) => setPresetParams((prev) => ({ ...prev, cutoutOffset: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
            </div>
            <div className="space-y-2 rounded-lg border border-border/70 bg-background/45 p-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCutoutOverrideOpen((v) => !v)}
                  className="text-[11px] font-craft font-medium text-muted-foreground hover:text-foreground"
                >
                  {cutoutOverrideOpen ? '▾' : '▸'} 单边覆盖（未设置=跟随全局）
                </button>
                {hasCutoutOverrides && (
                  <button
                    onClick={() => setPresetParams((prev) => ({
                      ...prev,
                      cutoutShapeTop: undefined,
                      cutoutShapeRight: undefined,
                      cutoutShapeBottom: undefined,
                      cutoutShapeLeft: undefined,
                      cutoutRadiusTop: undefined,
                      cutoutRadiusRight: undefined,
                      cutoutRadiusBottom: undefined,
                      cutoutRadiusLeft: undefined,
                      cutoutDepthTop: undefined,
                      cutoutDepthRight: undefined,
                      cutoutDepthBottom: undefined,
                      cutoutDepthLeft: undefined,
                      cutoutOffsetTop: undefined,
                      cutoutOffsetRight: undefined,
                      cutoutOffsetBottom: undefined,
                      cutoutOffsetLeft: undefined,
                    }))}
                    className="text-[10px] font-craft text-muted-foreground hover:text-foreground"
                  >
                    清除覆盖
                  </button>
                )}
              </div>
              {cutoutOverrideOpen && (
                <div className="space-y-2">
                  {cutoutEdgeOptions.map((edge) => {
                    const edgeActive = (cutoutEdgeMask & edge.bit) !== 0;
                    const edgeShape = readOverrideShape(edge.shapeKey, cutoutShape);
                    const edgeRadius = readOverrideNumber(edge.radiusKey, cutoutRadius, 3, Math.max(16, Math.min(width, height) * 0.3));
                    const edgeDepth = readOverrideNumber(edge.depthKey, cutoutDepth, 1.5, Math.max(12, Math.min(width, height) * 0.25));
                    const edgeOffset = readOverrideNumber(edge.offsetKey, cutoutOffset, -cutoutOffsetRange, cutoutOffsetRange);
                    const hasLocal =
                      typeof presetParams[edge.shapeKey] === 'number'
                      || typeof presetParams[edge.radiusKey] === 'number'
                      || typeof presetParams[edge.depthKey] === 'number'
                      || typeof presetParams[edge.offsetKey] === 'number';
                    return (
                      <div key={edge.edge} className="space-y-2 rounded-lg border border-border/70 bg-background/50 p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-craft font-medium text-foreground">
                            {edge.label}{edgeActive ? '' : '（未启用）'}
                          </span>
                          <button
                            onClick={() => setPresetParams((prev) => ({
                              ...prev,
                              [edge.shapeKey]: undefined,
                              [edge.radiusKey]: undefined,
                              [edge.depthKey]: undefined,
                              [edge.offsetKey]: undefined,
                            }))}
                            className="text-[10px] font-craft text-muted-foreground hover:text-foreground"
                          >
                            {hasLocal ? '跟随全局' : '已跟随全局'}
                          </button>
                        </div>
                        <div>
                          <label className="text-[10px] font-craft font-medium text-muted-foreground mb-1 block">形状覆盖</label>
                          <div className="grid grid-cols-3 gap-1">
                            {cutoutShapeOptions.map((opt) => (
                              <button
                                key={`${edge.edge}-${opt.value}`}
                                onClick={() => setPresetParams((prev) => ({ ...prev, [edge.shapeKey]: opt.value }))}
                                className={`px-2 py-1 rounded-md text-[10px] font-craft transition ${
                                  edgeShape === opt.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                            <span>宽度</span>
                            <span className="text-foreground">{edgeRadius.toFixed(1)}</span>
                          </label>
                          <input
                            type="range"
                            min={3}
                            max={Math.max(16, Math.min(width, height) * 0.3)}
                            step={0.5}
                            value={edgeRadius}
                            onChange={(e) => setPresetParams((prev) => ({ ...prev, [edge.radiusKey]: Number(e.target.value) }))}
                            className="w-full accent-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                            <span>深度</span>
                            <span className="text-foreground">{edgeDepth.toFixed(1)}</span>
                          </label>
                          <input
                            type="range"
                            min={1.5}
                            max={Math.max(12, Math.min(width, height) * 0.25)}
                            step={0.5}
                            value={edgeDepth}
                            onChange={(e) => setPresetParams((prev) => ({ ...prev, [edge.depthKey]: Number(e.target.value) }))}
                            className="w-full accent-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                            <span>偏移</span>
                            <span className="text-foreground">{edgeOffset.toFixed(0)}</span>
                          </label>
                          <input
                            type="range"
                            min={-cutoutOffsetRange}
                            max={cutoutOffsetRange}
                            step={1}
                            value={edgeOffset}
                            onChange={(e) => setPresetParams((prev) => ({ ...prev, [edge.offsetKey]: Number(e.target.value) }))}
                            className="w-full accent-primary"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                <span>裁剪抗锯齿余量</span>
                <span className="text-foreground">{cutoutAABleed.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={4}
                step={0.05}
                value={cutoutAABleed}
                onChange={(e) => setPresetParams((prev) => ({ ...prev, cutoutAABleed: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
            </div>
          </>
        )}
      </div>

      <div className={cn(
        'rounded-xl bg-muted/50 border border-border',
        shadowSectionOpen ? 'space-y-3 p-3' : 'p-2'
      )}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShadowSectionOpen((v) => !v)}
            className="flex-1 h-8 px-2 -mx-1 rounded-md text-left text-xs font-craft font-semibold text-foreground hover:bg-background/60 transition"
          >
            {shadowSectionOpen ? '▾' : '▸'} 🕶️ 阴影
          </button>
          <button
            onClick={() => setPresetParams((prev) => ({
              ...prev,
              shadowEnabled: true,
              shadowOffsetX: undefined,
              shadowOffsetY: undefined,
              shadowOpacity: undefined,
              shadowColor: undefined,
            }))}
            className="text-[10px] font-craft text-muted-foreground hover:text-foreground"
          >
            重置
          </button>
        </div>
        {shadowSectionOpen && (
          <>
            <div>
              <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">显示阴影</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setPresetParams((prev) => ({ ...prev, shadowEnabled: true }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-craft transition ${
                    shadowEnabled
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  显示
                </button>
                <button
                  onClick={() => setPresetParams((prev) => ({ ...prev, shadowEnabled: false }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-craft transition ${
                    !shadowEnabled
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  隐藏
                </button>
              </div>
            </div>

            {shadowEnabled && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                      <span>偏移X</span>
                      <span className="text-foreground">{shadowOffsetX.toFixed(0)}</span>
                    </label>
                    <input
                      type="range"
                      min={-32}
                      max={32}
                      step={1}
                      value={shadowOffsetX}
                      onChange={(e) => setPresetParams((prev) => ({ ...prev, shadowOffsetX: Number(e.target.value) }))}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                      <span>偏移Y</span>
                      <span className="text-foreground">{shadowOffsetY.toFixed(0)}</span>
                    </label>
                    <input
                      type="range"
                      min={-32}
                      max={32}
                      step={1}
                      value={shadowOffsetY}
                      onChange={(e) => setPresetParams((prev) => ({ ...prev, shadowOffsetY: Number(e.target.value) }))}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
                    <span>透明度</span>
                    <span className="text-foreground">{shadowOpacity.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={shadowOpacity}
                    onChange={(e) => setPresetParams((prev) => ({ ...prev, shadowOpacity: Number(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-craft font-medium text-muted-foreground block">阴影颜色</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setPresetParams((prev) => ({ ...prev, shadowColor: undefined }))}
                      className={`px-2 py-1.5 rounded-lg text-xs font-craft transition ${
                        shadowAutoColor
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      自动跟随纸色
                    </button>
                    <button
                      onClick={() => {
                        const next = isHexColor(shadowColor) ? shadowColor : '#6f5a46';
                        setPresetParams((prev) => ({ ...prev, shadowColor: next }));
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-craft transition ${
                        !shadowAutoColor
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      手动颜色
                    </button>
                  </div>
                  {!shadowAutoColor && (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={shadowColorPickerValue}
                        onChange={(e) => setPresetParams((prev) => ({ ...prev, shadowColor: e.target.value }))}
                        className="h-8 w-10 p-0 border border-border rounded bg-transparent cursor-pointer"
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {shadowColorSwatches.map((c) => (
                          <button
                            key={c}
                            onClick={() => setPresetParams((prev) => ({ ...prev, shadowColor: c }))}
                            className="h-5 w-5 rounded-full border border-border"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {preset === 'folded' && (
        <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border">
          <label className="text-xs font-craft font-semibold text-foreground block">✨ 折角专属参数</label>
          <div>
            <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
              <span>折角大小</span>
              <span className="text-foreground">{typeof foldSize === 'number' ? foldSize.toFixed(1) : foldSize}</span>
            </label>
            <input
              type="range"
              min={10}
              max={80}
              step={1}
              value={Number(foldSize)}
              onChange={(e) => setPresetParams((prev) => ({ ...prev, foldSize: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">折角方向（可多选）</label>
            <div className="grid grid-cols-2 gap-1.5">
              {foldCornerOptions.map((corner) => {
                const active = (foldCornerMask & corner.bit) !== 0;
                return (
                  <button
                    key={corner.bit}
                    onClick={() => {
                      setPresetParams((prev) => {
                        const current = Math.round(prev.foldCorners ?? 2) || 2;
                        let next = current ^ corner.bit;
                        if (next === 0) next = corner.bit;
                        return { ...prev, foldCorners: next };
                      });
                    }}
                    className={`px-2 py-1.5 rounded-lg text-xs font-craft transition ${
                      active ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {corner.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">折角颜色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={isHexColor(foldColor) ? foldColor : '#7a553f'}
                onChange={(e) => setPresetParams((prev) => ({ ...prev, foldColor: e.target.value }))}
                className="h-8 w-10 p-0 border border-border rounded bg-transparent cursor-pointer"
              />
              <div className="flex gap-1.5 flex-wrap">
                {foldColorSwatches.map((c) => (
                  <button
                    key={c}
                    onClick={() => setPresetParams((prev) => ({ ...prev, foldColor: c }))}
                    className="h-5 w-5 rounded-full border border-border"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
              <span>折角透明度</span>
              <span className="text-foreground">{foldOpacity.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={foldOpacity}
              onChange={(e) => setPresetParams((prev) => ({ ...prev, foldOpacity: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      )}

      {preset === 'ticket' && (
        <div className="space-y-2 p-3 rounded-xl bg-muted/50 border border-border">
          <label className="text-xs font-craft font-semibold text-foreground block">🎫 票根方向</label>
          <div className="grid grid-cols-2 gap-1.5">
            {ticketStubSideOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPresetParams((prev) => ({ ...prev, ticketStubSide: opt.value }))}
                className={`px-2 py-1.5 rounded-lg text-xs font-craft transition ${
                  ticketStubSide === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {extraSections}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">宽 {width}</label>
          <input type="range" min={100} max={420} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full accent-primary" />
        </div>
        <div>
          <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">高 {height}</label>
          <input type="range" min={80} max={360} value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full accent-primary" />
        </div>
      </div>

      <div>
        <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">粗糙度 {roughness.toFixed(2)}</label>
        <input type="range" min={0} max={100} value={roughness * 100} onChange={(e) => setRoughness(Number(e.target.value) / 100)} className="w-full accent-primary" />
      </div>

      <div>
        <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">描边粗细 {strokeWidth.toFixed(1)}</label>
        <input type="range" min={0} max={40} value={strokeWidth * 10} onChange={(e) => setStrokeWidth(Number(e.target.value) / 10)} className="w-full accent-primary" />
      </div>

      <div>
        <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">种子 {seed}</label>
        <input type="range" min={1} max={9999} value={seed} onChange={(e) => setSeed(Number(e.target.value))} className="w-full accent-primary" />
      </div>

      <div>
        <label className="text-xs font-craft font-medium text-muted-foreground mb-2 block">纸张颜色</label>
        <div className="flex gap-1.5 flex-wrap">
          {paperColors.map((c) => (
            <button
              key={c.key}
              onClick={() => setPaperColor(c.key)}
              className={`px-2 py-1 rounded-md text-[10px] font-craft transition ${
                paperColor === c.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="color"
            value={paperColorPickerValue}
            onChange={(e) => setPaperColor(e.target.value)}
            className="h-8 w-10 p-0 border border-border rounded bg-transparent cursor-pointer"
            title="自定义颜色"
          />
          <input
            type="text"
            value={paperColor}
            onChange={(e) => setPaperColor(e.target.value)}
            className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs font-craft text-foreground"
            placeholder="输入 #RRGGBB / hsl(...) / rgb(...)"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-craft font-medium text-muted-foreground mb-2 block">边框颜色</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={isHexColor(strokeColor) ? strokeColor : '#7a553f'}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="h-8 w-10 p-0 border border-border rounded bg-transparent cursor-pointer"
          />
          <div className="flex gap-1.5 flex-wrap">
            {strokeColorSwatches.map((c) => (
              <button
                key={c}
                onClick={() => setStrokeColor(c)}
                className="h-5 w-5 rounded-full border border-border"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-craft font-medium text-muted-foreground mb-2 block">纹理</label>
        <div className="flex gap-1.5 flex-wrap">
          {patternOptions.map((p) => (
            <button
              key={p.key}
              onClick={() => setPatternType(p.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-craft transition ${
                patternType === p.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {patternType !== 'none' && (
        <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border">
          <label className="text-xs font-craft font-semibold text-foreground block">🎨 纹理颜色与透明度</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(patternParams.patternColor && patternParams.patternColor.startsWith('#')) ? patternParams.patternColor : '#a79c92'}
              onChange={(e) => setPatternParams((prev) => ({ ...prev, patternColor: e.target.value }))}
              className="h-8 w-10 p-0 border border-border rounded bg-transparent cursor-pointer"
            />
            <div className="flex gap-1.5">
              {['#a79c92', '#8fa6c4', '#b18abf', '#8cae97', '#c7a27d'].map((c) => (
                <button
                  key={c}
                  onClick={() => setPatternParams((prev) => ({ ...prev, patternColor: c }))}
                  className="h-5 w-5 rounded-full border border-border"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
              <span>纹理透明度</span>
              <span className="text-foreground">{(patternParams.patternOpacity ?? 0.42).toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0.08}
              max={1}
              step={0.01}
              value={patternParams.patternOpacity ?? 0.42}
              onChange={(e) => setPatternParams((prev) => ({ ...prev, patternOpacity: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      )}

      {patternType === 'lines' && (
        <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border">
          <label className="text-xs font-craft font-semibold text-foreground block">📏 横线设置</label>
          <div>
            <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
              <span>线条粗细</span>
              <span className="text-foreground">{(patternParams.lineWidth ?? 0.5).toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0.2}
              max={2.5}
              step={0.1}
              value={patternParams.lineWidth ?? 0.5}
              onChange={(e) => setPatternParams((prev) => ({ ...prev, lineWidth: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
              <span>线条间距</span>
              <span className="text-foreground">{(patternParams.lineGap ?? 20).toFixed(0)}</span>
            </label>
            <input
              type="range"
              min={8}
              max={48}
              step={1}
              value={patternParams.lineGap ?? 20}
              onChange={(e) => setPatternParams((prev) => ({ ...prev, lineGap: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      )}

      {patternType === 'dots' && (
        <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border">
          <label className="text-xs font-craft font-semibold text-foreground block">🔵 点阵设置</label>
          <div>
            <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
              <span>点大小</span>
              <span className="text-foreground">{(patternParams.dotSize ?? 1).toFixed(1)}</span>
            </label>
            <input
              type="range"
              min={0.4}
              max={4}
              step={0.1}
              value={patternParams.dotSize ?? 1}
              onChange={(e) => setPatternParams((prev) => ({ ...prev, dotSize: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="text-xs font-craft font-medium text-muted-foreground mb-1 flex justify-between">
              <span>点间距</span>
              <span className="text-foreground">{(patternParams.dotGap ?? 16).toFixed(0)}</span>
            </label>
            <input
              type="range"
              min={6}
              max={40}
              step={1}
              value={patternParams.dotGap ?? 16}
              onChange={(e) => setPatternParams((prev) => ({ ...prev, dotGap: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-craft font-medium text-muted-foreground block">导出</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { void runCopyAction('jsx', onCopyJSX); }}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-craft text-xs font-medium hover:opacity-90 transition"
          >
            {copiedKey === 'jsx' ? '✅ 已复制调用 JSX' : '📋 复制调用 JSX'}
          </button>
          <button
            onClick={() => { void runCopyAction('recipe', onCopyRecipe); }}
            className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground font-craft text-xs font-medium hover:opacity-90 transition"
          >
            {copiedKey === 'recipe' ? '✅ 已复制 Recipe' : '🧩 复制 Recipe'}
          </button>
          <button
            onClick={() => { void runCopyAction('svg', onCopySvg); }}
            className="px-3 py-2 rounded-lg bg-muted text-foreground font-craft text-xs font-medium hover:opacity-90 transition"
          >
            {copiedKey === 'svg' ? '✅ 已复制 SVG' : '🖼️ 复制 SVG'}
          </button>
          <button onClick={onDownloadSvg} className="px-3 py-2 rounded-lg bg-muted text-foreground font-craft text-xs font-medium hover:opacity-90 transition">
            ⬇️ 下载 SVG
          </button>
          {onCopyShareLink && (
            <button
              onClick={() => { void runCopyAction('share', onCopyShareLink); }}
              className="col-span-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground font-craft text-xs font-medium hover:opacity-90 transition"
            >
              {copiedKey === 'share' ? '✅ 已复制分享链接' : '🔗 复制分享链接'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
