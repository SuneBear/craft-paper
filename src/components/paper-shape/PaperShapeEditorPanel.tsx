import type { ReactNode } from 'react';
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
  { bit: 1, label: '上边' },
  { bit: 2, label: '右边' },
  { bit: 4, label: '下边' },
  { bit: 8, label: '左边' },
] as const;

const cutoutShapeOptions = [
  { value: 0, label: '三角' },
  { value: 1, label: '圆弧' },
  { value: 2, label: '圆角矩形' },
] as const;

interface PaperShapeEditorPanelProps {
  preset: PaperPreset;
  width: number;
  height: number;
  seed: number;
  roughness: number;
  paperColor: string;
  strokeWidth: number;
  patternType: PaperPatternType;
  patternParams: PatternParams;
  presetParams: PresetParams;
  setWidth: (v: number) => void;
  setHeight: (v: number) => void;
  setSeed: (v: number) => void;
  setRoughness: (v: number) => void;
  setPaperColor: (v: string) => void;
  setStrokeWidth: (v: number) => void;
  setPatternType: (v: PaperPatternType) => void;
  setPatternParams: (fn: (prev: PatternParams) => PatternParams) => void;
  setPresetParams: (fn: (prev: PresetParams) => PresetParams) => void;
  onCopyJSX: () => void;
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
  strokeWidth,
  patternType,
  patternParams,
  presetParams,
  setWidth,
  setHeight,
  setSeed,
  setRoughness,
  setPaperColor,
  setStrokeWidth,
  setPatternType,
  setPatternParams,
  setPresetParams,
  onCopyJSX,
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
    ].includes(d.key as string)
  );
  const foldCornerMask = Math.round(presetParams.foldCorners ?? 2) || 2;
  const ticketStubSide = Math.round(presetParams.ticketStubSide ?? 0);
  const cutoutEdgeMask = Math.max(0, Math.round(presetParams.cutoutEdges ?? 0));
  const cutoutShape = Math.max(0, Math.min(2, Math.round(presetParams.cutoutShape ?? 0)));
  const cutoutRadius = presetParams.cutoutRadius ?? Math.min(width, height) * 0.07;
  const cutoutDepth = presetParams.cutoutDepth ?? Math.max(1.5, cutoutRadius * 0.85);
  const cutoutOffset = presetParams.cutoutOffset ?? 0;
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

  const getParamValue = (key: keyof PresetParams) => {
    if (presetParams[key] !== undefined) return presetParams[key] as number;
    const def = currentParamDefs.find(d => d.key === key);
    return def ? def.defaultVal(width, height) : 0;
  };

  const setParamValue = (key: keyof PresetParams, val: number) => {
    setPresetParams((prev) => ({ ...prev, [key]: val }));
  };
  const paperColorPickerValue = isHexColor(paperColor) ? paperColor : (paperColorHexMap[paperColor] || '#f7e8bf');

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
        </div>
      )}

      <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center justify-between">
          <label className="text-xs font-craft font-semibold text-foreground block">◻️ 圆角（CSS风格）</label>
          <button
            onClick={() => setPresetParams((prev) => ({
              ...prev,
              cornerRadius: 0,
              cornerRadiusTL: undefined,
              cornerRadiusTR: undefined,
              cornerRadiusBR: undefined,
              cornerRadiusBL: undefined,
            }))}
            className="text-[10px] font-craft text-muted-foreground hover:text-foreground"
          >
            重置
          </button>
        </div>
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
      </div>

      <div className="space-y-2 p-3 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center justify-between">
          <label className="text-xs font-craft font-semibold text-foreground block">✂️ 裁剪边（多选）</label>
          <button
            onClick={() => setPresetParams((prev) => ({ ...prev, cutoutEdges: 0 }))}
            className="text-[10px] font-craft text-muted-foreground hover:text-foreground"
          >
            清空
          </button>
        </div>
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
              <span>裁剪偏移</span>
              <span className="text-foreground">{cutoutOffset.toFixed(0)}</span>
            </label>
            <input
              type="range"
              min={-Math.max(width, height) / 2}
              max={Math.max(width, height) / 2}
              step={1}
              value={cutoutOffset}
              onChange={(e) => setPresetParams((prev) => ({ ...prev, cutoutOffset: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
      </div>

      {preset === 'folded' && (
        <div className="space-y-2 p-3 rounded-xl bg-muted/50 border border-border">
          <label className="text-xs font-craft font-semibold text-foreground block">📐 折角方向（可多选）</label>
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
        <input type="range" min={5} max={40} value={strokeWidth * 10} onChange={(e) => setStrokeWidth(Number(e.target.value) / 10)} className="w-full accent-primary" />
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
          <button onClick={onCopyJSX} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-craft text-xs font-medium hover:opacity-90 transition">
            📋 复制 JSX
          </button>
          <button onClick={onCopyRecipe} className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground font-craft text-xs font-medium hover:opacity-90 transition">
            🧩 复制 Recipe
          </button>
          <button onClick={onCopySvg} className="px-3 py-2 rounded-lg bg-muted text-foreground font-craft text-xs font-medium hover:opacity-90 transition">
            🖼️ 复制 SVG
          </button>
          <button onClick={onDownloadSvg} className="px-3 py-2 rounded-lg bg-muted text-foreground font-craft text-xs font-medium hover:opacity-90 transition">
            ⬇️ 下载 SVG
          </button>
          {onCopyShareLink && (
            <button
              onClick={onCopyShareLink}
              className="col-span-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground font-craft text-xs font-medium hover:opacity-90 transition"
            >
              🔗 复制分享链接
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
