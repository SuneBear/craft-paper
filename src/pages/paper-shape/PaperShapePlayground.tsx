import { useState, useCallback, useMemo } from 'react';
import { PaperShape } from '@/components/paper-shape/PaperShape';
import { presetInfo, presetParamsDefs, type PaperPreset, type PresetParams, generatePath } from '@/components/paper-shape/geometry';

const allPresets: PaperPreset[] = [
  'stamp', 'coupon', 'ticket', 'tag',
  'folded', 'torn', 'stitched', 'scalloped-edge',
  'receipt', 'basic-paper',
];

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

const patternOptions = [
  { key: 'none' as const, label: '无' },
  { key: 'lines' as const, label: '横线' },
  { key: 'grid' as const, label: '方格' },
  { key: 'dots' as const, label: '点阵' },
];

export default function PaperShapePlayground() {
  const [preset, setPreset] = useState<PaperPreset>('stamp');
  const [width, setWidth] = useState(280);
  const [height, setHeight] = useState(200);
  const [seed, setSeed] = useState(42);
  const [roughness, setRoughness] = useState(0.3);
  const [paperColor, setPaperColor] = useState('cream');
  const [strokeWidth, setStrokeWidth] = useState(1.8);
  const [patternType, setPatternType] = useState<'none' | 'lines' | 'grid' | 'dots'>('none');
  const [presetParams, setPresetParams] = useState<PresetParams>({});

  // Get default values for current preset params
  const currentParamDefs = presetParamsDefs[preset];

  const getParamValue = useCallback((key: keyof PresetParams) => {
    if (presetParams[key] !== undefined) return presetParams[key] as number;
    const def = currentParamDefs.find(d => d.key === key);
    return def ? def.defaultVal(width, height) : 0;
  }, [presetParams, currentParamDefs, width, height]);

  const setParamValue = useCallback((key: keyof PresetParams, val: number) => {
    setPresetParams(prev => ({ ...prev, [key]: val }));
  }, []);

  // Reset preset params when preset changes
  const handlePresetChange = useCallback((p: PaperPreset) => {
    setPreset(p);
    setPresetParams({});
  }, []);

  const randomize = useCallback(() => {
    setSeed(Math.floor(Math.random() * 10000));
    setRoughness(Math.random() * 0.6 + 0.1);
    setPaperColor(paperColors[Math.floor(Math.random() * paperColors.length)].key);
    setPatternType(patternOptions[Math.floor(Math.random() * patternOptions.length)].key);
    setPresetParams({});
  }, []);

  const copyCode = () => {
    const paramsStr = Object.keys(presetParams).length > 0
      ? `\n  presetParams={${JSON.stringify(presetParams)}}`
      : '';
    const code = `<PaperShape\n  preset="${preset}"\n  width={${width}}\n  height={${height}}\n  seed={${seed}}\n  roughness={${roughness.toFixed(2)}}\n  paperColor="${paperColor}"\n  strokeWidth={${strokeWidth}}\n  patternType="${patternType}"\n  showPattern={${patternType !== 'none'}}${paramsStr}\n/>`;
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-8">
      {/* Preview */}
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-card rounded-2xl border border-border p-8">
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
          presetParams={presetParams}
        >
          <div className="text-center">
            <span className="text-4xl block mb-1">{presetInfo[preset].emoji}</span>
            <span className="font-hand text-lg text-foreground">{presetInfo[preset].label}</span>
          </div>
        </PaperShape>
      </div>

      {/* Controls */}
      <div className="space-y-5 bg-card rounded-2xl border border-border p-5 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-hand text-xl font-semibold">参数调节</h3>
          <button
            onClick={randomize}
            className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-craft font-medium hover:opacity-80 transition"
          >
            🎲 随机
          </button>
        </div>

        {/* Preset */}
        <div>
          <label className="text-xs font-craft font-medium text-muted-foreground mb-2 block">形状预设</label>
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

        {/* Per-preset params */}
        {currentParamDefs.length > 0 && (
          <div className="space-y-3 p-3 rounded-xl bg-muted/50 border border-border">
            <label className="text-xs font-craft font-semibold text-foreground block">
              ✨ {presetInfo[preset].label}专属参数
            </label>
            {currentParamDefs.map((def) => {
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

        {/* Size */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">
              宽 {width}
            </label>
            <input
              type="range"
              min={100}
              max={400}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">
              高 {height}
            </label>
            <input
              type="range"
              min={80}
              max={350}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        {/* Roughness */}
        <div>
          <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">
            粗糙度 {roughness.toFixed(2)}
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={roughness * 100}
            onChange={(e) => setRoughness(Number(e.target.value) / 100)}
            className="w-full accent-primary"
          />
        </div>

        {/* Stroke width */}
        <div>
          <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">
            描边粗细 {strokeWidth.toFixed(1)}
          </label>
          <input
            type="range"
            min={5}
            max={40}
            value={strokeWidth * 10}
            onChange={(e) => setStrokeWidth(Number(e.target.value) / 10)}
            className="w-full accent-primary"
          />
        </div>

        {/* Seed */}
        <div>
          <label className="text-xs font-craft font-medium text-muted-foreground mb-1 block">
            种子 {seed}
          </label>
          <input
            type="range"
            min={1}
            max={9999}
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-craft font-medium text-muted-foreground mb-2 block">纸张颜色</label>
          <div className="flex gap-1.5 flex-wrap">
            {paperColors.map((c) => (
              <button
                key={c.key}
                onClick={() => setPaperColor(c.key)}
                className={`px-2 py-1 rounded-md text-[10px] font-craft transition ${
                  paperColor === c.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pattern */}
        <div>
          <label className="text-xs font-craft font-medium text-muted-foreground mb-2 block">纹理</label>
          <div className="flex gap-1.5">
            {patternOptions.map((p) => (
              <button
                key={p.key}
                onClick={() => setPatternType(p.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-craft transition ${
                  patternType === p.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Export */}
        <button
          onClick={copyCode}
          className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-craft text-sm font-medium hover:opacity-90 transition"
        >
          📋 复制组件代码
        </button>
      </div>
    </div>
  );
}
