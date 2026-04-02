import { PaperShape } from '@/components/paper-shape/PaperShape';
import { presetInfo, type PaperPreset, type PresetParams } from '@/components/paper-shape/geometry';
import { resizeDecorationsForCanvas, type DecorationItem } from '@/components/paper-shape/decorations';
import { PaperShapeSampleContent } from './support/PaperShapeSampleContent';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { encodeShareState } from '@/lib/paper-shape-share';

const allPresets: PaperPreset[] = [
  'stamp', 'coupon', 'ticket', 'tag',
  'folded', 'torn', 'stitched', 'scalloped-edge',
  'receipt', 'basic-paper',
];
const PREVIEW_PRESET_WIDTH = 180;
const PREVIEW_PRESET_HEIGHT = 140;
const EDITOR_PRESET_WIDTH = 280;
const EDITOR_PRESET_HEIGHT = 200;

const paperColors = ['cream', 'cloud', 'pink', 'apricot', 'peach', 'mint', 'sky', 'lavender'];
const patternTypes: Array<'none' | 'lines' | 'grid' | 'dots'> = ['none', 'lines', 'grid', 'dots'];

interface ExampleItem {
  id: string;
  preset: PaperPreset;
  color: string;
  pattern: 'none' | 'lines' | 'grid' | 'dots';
  seed: number;
  title: string;
  contentMode: number;
  presetParams?: PresetParams;
  decorations?: DecorationItem[];
}

function generateExamples(): ExampleItem[] {
  const examples: ExampleItem[] = [];
  const variantCountByPreset: Partial<Record<PaperPreset, number>> = {
    coupon: 2,
    ticket: 2,
    folded: 4,
    'basic-paper': 8,
  };

  allPresets.forEach((preset, i) => {
    const variantCount = variantCountByPreset[preset] ?? 2;
    for (let v = 0; v < variantCount; v++) {
      const decos: DecorationItem[] = [];
      let presetParams: PresetParams | undefined;

      // Add decorations to some examples for showcase
      if (preset === 'basic-paper' && v === 0) {
        decos.push(
          { id: 'ex-staple-1', type: 'staple', variant: 'silver', transform: { x: 80, y: -9, rotation: 0, scale: 1 } },
          { id: 'ex-sticker-1', type: 'sticker', variant: 'star', transform: { x: 140, y: 100, rotation: 12, scale: 0.9 } },
        );
      }
      if (preset === 'folded') {
        if (v === 0) {
          presetParams = {
            foldSize: 26,
            foldCorners: 2, // 右上
            edgeWobble: 1.1,
            edgeWobbleBottom: 1.5,
          };
          decos.push(
            { id: 'ex-tape-1', type: 'washi-tape', variant: 'stripe-pink', transform: { x: 30, y: -8, rotation: -5, scale: 0.7 } },
          );
        }
        if (v === 1) {
          presetParams = {
            foldSize: 24,
            foldCorners: 1, // 左上
          };
        }
        if (v === 2) {
          presetParams = {
            foldSize: 22,
            foldCorners: 5, // 左上 + 右下
          };
        }
        if (v === 3) {
          presetParams = {
            foldSize: 18,
            foldCorners: 15, // 四角
          };
        }
      }
      if (preset === 'torn' && v === 1) {
        decos.push(
          { id: 'ex-tape-2', type: 'washi-tape', variant: 'dots-mint', transform: { x: 64, y: -9, rotation: -3, scale: 0.65 } },
          { id: 'ex-sticker-2', type: 'sticker', variant: 'cat', transform: { x: 130, y: 90, rotation: -8, scale: 1.1 } },
        );
      }
      if (preset === 'stitched' && v === 0) {
        decos.push(
          { id: 'ex-sticker-3', type: 'sticker', variant: 'heart', transform: { x: 145, y: 8, rotation: 15, scale: 0.85 } },
        );
      }
      if (preset === 'receipt' && v === 0) {
        decos.push(
          { id: 'ex-staple-2', type: 'staple', variant: 'gold', transform: { x: 75, y: -10, rotation: 0, scale: 1.1 } },
        );
      }
      if (preset === 'receipt' && v === 1) {
        presetParams = {
          zigzagHeight: 9,
          zigzagEdge: 2, // 左侧锯齿，展示多方向能力
          edgeWobble: 1.4,
          edgeWobbleTop: 1.1,
          edgeWobbleRight: 1.8,
        };
      }
      if (preset === 'scalloped-edge' && v === 1) {
        presetParams = {
          scallopRadius: 12,
          scallopEdge: 2, // 仅右侧花边（与其他单边案例错开）
          scallopGap: 24,
          scallopDepth: 10,
        };
      }

      if (preset === 'coupon') {
        if (v === 0) {
          presetParams = {
            holeRadius: 16,
            notchRadius: 10,
            perforationMode: 0,
            perforationOffset: 28,
          };
        }
        if (v === 1) {
          presetParams = {
            holeRadius: 13,
            notchRadius: 8,
            couponHoleCount: 3,
            couponHoleSpread: 0.76,
            perforationMode: 1,
            perforationGap: 11,
            perforationDotRadius: 1.9,
            perforationOffset: -24,
          };
        }
      }

      if (preset === 'ticket') {
        if (v === 0) {
          presetParams = {
            cutRadius: 16,
            ticketStubSide: 0,
            ticketStubWidth: 46,
            ticketCutCount: 1,
            perforationMode: 0,
            perforationOffset: -2,
          };
        }
        if (v === 1) {
          presetParams = {
            cutRadius: 12,
            ticketStubSide: 1,
            ticketStubWidth: 50,
            ticketCutCount: 3,
            ticketCutSpread: 0.78,
            perforationMode: 1,
            perforationGap: 10,
            perforationDotRadius: 2,
            perforationOffset: -40,
          };
        }
      }

      const basicPaperPosterTitles = [
        '春日手帐配色',
        '电影票根拼贴',
        '一页三段式排版',
        '胶带叠贴练习',
        '本周手帐主题',
        '旅行手帐速记',
        '读书页边注设计',
        '咖啡店拼贴实验',
      ];
      const isBasicPaper = preset === 'basic-paper';
      const titleText = isBasicPaper
        ? basicPaperPosterTitles[v % basicPaperPosterTitles.length]
        : `${presetInfo[preset].label} ${v > 0 ? `变体 ${v + 1}` : ''}`.trim();
      const contentMode = isBasicPaper ? 5 : (i + v) % 6;
      const pattern = isBasicPaper ? patternTypes[(v + 1) % patternTypes.length] : patternTypes[(i + v) % patternTypes.length];

      if (isBasicPaper) {
        const baseWobbleByVariant: Partial<PresetParams>[] = [
          { edgeWobble: 2.1, edgeWobbleTop: 1.8, edgeWobbleBottom: 2.4 },
          { edgeWobble: 2.25, edgeWobbleLeft: 2.0, edgeWobbleRight: 2.6 },
          { edgeWobble: 2.15, edgeWobbleTop: 1.95, edgeWobbleRight: 2.45 },
          { edgeWobble: 2.55, edgeWobbleTop: 2.2, edgeWobbleRight: 2.9 },
          { edgeWobble: 2.45, edgeWobbleBottom: 2.95, edgeWobbleLeft: 2.0 },
          { edgeWobble: 2.7, edgeWobbleTop: 2.25, edgeWobbleBottom: 2.6 },
          { edgeWobble: 2.3, edgeWobbleLeft: 2.05, edgeWobbleBottom: 2.5 },
          { edgeWobble: 2.35, edgeWobbleTop: 2.1, edgeWobbleRight: 2.65 },
        ];
        const baseWobble = baseWobbleByVariant[v];
        if (baseWobble) {
          presetParams = {
            ...(presetParams ?? {}),
            ...baseWobble,
          };
        }
      }

      if (isBasicPaper && v === 3) {
        presetParams = {
          ...(presetParams ?? {}),
          edgeWobble: 2.55,
          edgeWobbleTop: 2.2,
          edgeWobbleRight: 2.9,
        };
        decos.push(
          { id: 'ex-sticker-4', type: 'sticker', variant: 'heart', transform: { x: 145, y: 104, rotation: -9, scale: 0.86 } },
        );
      }
      if (isBasicPaper && v === 4) {
        presetParams = {
          ...(presetParams ?? {}),
          edgeWobble: 2.45,
          edgeWobbleBottom: 2.95,
          edgeWobbleLeft: 2.0,
        };
        decos.push(
          { id: 'ex-tape-3', type: 'washi-tape', variant: 'stripe-mint', transform: { x: 28, y: -8, rotation: -6, scale: 0.68 } },
        );
      }
      if (isBasicPaper && v === 5) {
        presetParams = {
          ...(presetParams ?? {}),
          edgeWobble: 2.7,
          edgeWobbleTop: 2.25,
          edgeWobbleBottom: 2.6,
        };
        decos.push(
          { id: 'ex-tape-4', type: 'washi-tape', variant: 'dots-mint', transform: { x: 142, y: -8, rotation: 5, scale: 0.66 } },
        );
      }
      if (isBasicPaper && v === 6) {
        decos.push(
          { id: 'ex-staple-3', type: 'staple', variant: 'gold', transform: { x: 80, y: -9, rotation: -1, scale: 1 } },
          { id: 'ex-sticker-5', type: 'sticker', variant: 'cat', transform: { x: 144, y: 96, rotation: -6, scale: 0.95 } },
        );
      }
      if (isBasicPaper && v === 7) {
        decos.push(
          { id: 'ex-sticker-6', type: 'sticker', variant: 'star', transform: { x: 34, y: 96, rotation: -12, scale: 0.92 } },
          { id: 'ex-sticker-7', type: 'sticker', variant: 'heart', transform: { x: 146, y: 24, rotation: 10, scale: 0.82 } },
        );
      }

      examples.push({
        id: `${preset}-${v}`,
        preset,
        color: paperColors[(i * 3 + v) % paperColors.length],
        pattern,
        seed: i * 13 + v * 7 + 42,
        title: titleText,
        contentMode,
        presetParams,
        decorations: decos.length > 0 ? decos : undefined,
      });
    }
  });
  return examples;
}

export default function PaperShapeExamples() {
  const examples = generateExamples();
  const [filter, setFilter] = useState<PaperPreset | 'all'>('all');

  const filtered = filter === 'all' ? examples : examples.filter(e => e.preset === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-craft font-medium transition ${
            filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          全部
        </button>
        {allPresets.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-craft font-medium transition ${
              filter === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {presetInfo[p].emoji} {presetInfo[p].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {filtered.map((ex, i) => {
          const info = presetInfo[ex.preset];
          const scaledDecorations = ex.decorations
            ? resizeDecorationsForCanvas(
                ex.decorations,
                PREVIEW_PRESET_WIDTH,
                PREVIEW_PRESET_HEIGHT,
                EDITOR_PRESET_WIDTH,
                EDITOR_PRESET_HEIGHT
              )
            : undefined;
          const encodedState = encodeShareState({
            preset: ex.preset,
            width: EDITOR_PRESET_WIDTH,
            height: EDITOR_PRESET_HEIGHT,
            seed: ex.seed,
            roughness: 0.3,
            paperColor: ex.color,
            strokeWidth: 1.8,
            patternType: ex.pattern,
            patternParams: {},
            presetParams: ex.presetParams,
            decorations: scaledDecorations,
          });
          const detailLink = `/ui/paper-shape/preset/${ex.preset}?s=${encodeURIComponent(encodedState)}&cm=${ex.contentMode}&ct=${encodeURIComponent(ex.title)}`;
          return (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <Link to={detailLink} className="flex flex-col items-center gap-2">
                <div className="transition-transform group-hover:scale-105 group-hover:-rotate-1">
                  <PaperShape
                    preset={ex.preset}
                    width={PREVIEW_PRESET_WIDTH}
                    height={PREVIEW_PRESET_HEIGHT}
                    seed={ex.seed}
                    paperColor={ex.color}
                    showPattern={ex.pattern !== 'none'}
                    patternType={ex.pattern}
                    presetParams={ex.presetParams}
                    decorations={ex.decorations}
                  >
                    <PaperShapeSampleContent mode={ex.contentMode} title={ex.title} emoji={info.emoji} preset={ex.preset} />
                  </PaperShape>
                </div>
                <div className="text-center">
                  <p className="text-xs font-craft font-medium text-foreground">{ex.title}</p>
                  <p className="text-[10px] text-muted-foreground font-craft">
                    {ex.color} · {ex.pattern === 'none' ? '无纹理' : ex.pattern}
                    {ex.decorations && ` · ${ex.decorations.length}个装饰`}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
