import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PaperShape, type PaperPatternType, type PatternParams } from '@/components/paper-shape/PaperShape';
import { PaperShapeEditorPanel } from '@/components/paper-shape/PaperShapeEditorPanel';
import { presetInfo, type PaperPreset, type PresetParams } from '@/components/paper-shape/geometry';
import { downloadText, serializeSvg, toPaperShapeJSX, toPaperShapeRecipe } from '@/lib/paper-shape-export';

const allPresets = Object.keys(presetInfo) as PaperPreset[];

function isPaperPreset(v?: string): v is PaperPreset {
  return !!v && allPresets.includes(v as PaperPreset);
}

export default function PaperShapePresetDetail() {
  const { preset: routePreset } = useParams<{ preset: string }>();
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
  const [strokeWidth, setStrokeWidth] = useState(1.8);
  const [patternType, setPatternType] = useState<PaperPatternType>('none');
  const [patternParams, setPatternParams] = useState<PatternParams>({});
  const [presetParams, setPresetParams] = useState<PresetParams>({});

  useEffect(() => {
    setPresetParams({});
    setPatternParams({});
  }, [preset]);

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

  const info = presetInfo[preset];

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_e) {
      // no-op
    }
  }, []);

  const exportState = {
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
  };

  const getSvgText = () => {
    const svg = previewRef.current?.querySelector('svg');
    return svg ? serializeSvg(svg) : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {allPresets.map((p) => (
          <Link
            key={p}
            to={`/ui/paper-shape/preset/${p}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-craft transition ${
              p === preset ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {presetInfo[p].emoji} {presetInfo[p].label}
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8 lg:min-h-[calc(100vh-180px)]">
        <div ref={previewRef} className="flex flex-col items-center justify-center min-h-[420px] lg:min-h-full bg-card rounded-2xl border border-border p-8">
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
          >
            <div className="text-center">
              <span className="text-4xl block mb-1">{info.emoji}</span>
              <span className="font-hand text-lg text-foreground">{info.label}</span>
            </div>
          </PaperShape>
          <p className="text-xs text-muted-foreground font-craft mt-4">{info.description}</p>
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
          onCopyJSX={() => { void copyText(toPaperShapeJSX(exportState)); }}
          onCopyRecipe={() => { void copyText(JSON.stringify(toPaperShapeRecipe(exportState), null, 2)); }}
          onCopySvg={() => {
            const svg = getSvgText();
            if (!svg) return;
            void copyText(svg);
          }}
          onDownloadSvg={() => {
            const svg = getSvgText();
            if (!svg) return;
            downloadText(`paper-shape-${preset}.svg`, svg, 'image/svg+xml;charset=utf-8');
          }}
          headerTitle="形状详情参数"
          headerRight={(
            <Link to="/ui/paper-shape/playground" className="text-xs font-craft text-primary hover:underline">
              打开完整编辑器
            </Link>
          )}
        />
      </div>
    </div>
  );
}

