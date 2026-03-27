import { PaperShape } from '@/components/paper-shape/PaperShape';
import { presetInfo, type PaperPreset } from '@/components/paper-shape/geometry';
import type { DecorationItem } from '@/components/paper-shape/decorations';
import { motion } from 'framer-motion';
import { useState } from 'react';

const allPresets: PaperPreset[] = [
  'stamp', 'coupon', 'ticket', 'tag',
  'folded', 'torn', 'stitched', 'scalloped-edge',
  'receipt', 'basic-paper',
];

const paperColors = ['cream', 'cloud', 'pink', 'apricot', 'peach', 'mint', 'sky', 'lavender'];
const patternTypes: Array<'none' | 'lines' | 'grid' | 'dots'> = ['none', 'lines', 'grid', 'dots'];

interface ExampleItem {
  id: string;
  preset: PaperPreset;
  color: string;
  pattern: 'none' | 'lines' | 'grid' | 'dots';
  seed: number;
  title: string;
  decorations?: DecorationItem[];
}

function generateExamples(): ExampleItem[] {
  const examples: ExampleItem[] = [];
  allPresets.forEach((preset, i) => {
    for (let v = 0; v < 2; v++) {
      const decos: DecorationItem[] = [];
      
      // Add decorations to some examples for showcase
      if (preset === 'basic-paper' && v === 0) {
        decos.push(
          { id: 'ex-staple-1', type: 'staple', variant: 'silver', transform: { x: 80, y: 4, rotation: 0, scale: 1 } },
          { id: 'ex-sticker-1', type: 'sticker', variant: 'star', transform: { x: 140, y: 100, rotation: 12, scale: 0.9 } },
        );
      }
      if (preset === 'folded' && v === 0) {
        decos.push(
          { id: 'ex-tape-1', type: 'washi-tape', variant: 'stripe-pink', transform: { x: 30, y: -8, rotation: -5, scale: 0.7 } },
        );
      }
      if (preset === 'torn' && v === 1) {
        decos.push(
          { id: 'ex-tape-2', type: 'washi-tape', variant: 'dots-mint', transform: { x: 20, y: 10, rotation: 2, scale: 0.65 } },
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
          { id: 'ex-staple-2', type: 'staple', variant: 'gold', transform: { x: 75, y: 5, rotation: 0, scale: 1.1 } },
        );
      }

      examples.push({
        id: `${preset}-${v}`,
        preset,
        color: paperColors[(i * 3 + v) % paperColors.length],
        pattern: patternTypes[(i + v) % patternTypes.length],
        seed: i * 13 + v * 7 + 42,
        title: `${presetInfo[preset].label} ${v > 0 ? `变体 ${v + 1}` : ''}`.trim(),
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
          return (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="transition-transform group-hover:scale-105 group-hover:-rotate-1">
                <PaperShape
                  preset={ex.preset}
                  width={180}
                  height={140}
                  seed={ex.seed}
                  paperColor={ex.color}
                  showPattern={ex.pattern !== 'none'}
                  patternType={ex.pattern}
                  decorations={ex.decorations}
                >
                  <div className="text-center">
                    <span className="text-2xl block">{info.emoji}</span>
                    <span className="text-xs font-craft text-ink-stroke mt-1 block opacity-70">
                      {ex.title}
                    </span>
                  </div>
                </PaperShape>
              </div>
              <div className="text-center">
                <p className="text-xs font-craft font-medium text-foreground">{ex.title}</p>
                <p className="text-[10px] text-muted-foreground font-craft">
                  {ex.color} · {ex.pattern === 'none' ? '无纹理' : ex.pattern}
                  {ex.decorations && ` · ${ex.decorations.length}个装饰`}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
