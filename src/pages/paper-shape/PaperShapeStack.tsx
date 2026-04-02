import { PaperShape } from '@/components/paper-shape/PaperShape';
import { presetInfo, type PaperPreset } from '@/components/paper-shape/geometry';
import { motion } from 'framer-motion';

const stackExamples: Array<{
  title: string;
  desc: string;
  items: Array<{ preset: PaperPreset; color: string; rotate: number; offsetX: number; offsetY: number; seed: number }>;
}> = [
  {
    title: '📬 邮件堆叠',
    desc: '多张邮票样式纸张的散落堆叠',
    items: [
      { preset: 'stamp', color: 'apricot', rotate: -6, offsetX: -10, offsetY: 8, seed: 11 },
      { preset: 'stamp', color: 'cream', rotate: 3, offsetX: 5, offsetY: -5, seed: 22 },
      { preset: 'stamp', color: 'pink', rotate: -1, offsetX: 0, offsetY: 0, seed: 33 },
    ],
  },
  {
    title: '🎫 票据收藏',
    desc: '不同类型票据的拼贴组合',
    items: [
      { preset: 'ticket', color: 'mint', rotate: -4, offsetX: -15, offsetY: 10, seed: 44 },
      { preset: 'coupon', color: 'lavender', rotate: 5, offsetX: 10, offsetY: -8, seed: 55 },
      { preset: 'receipt', color: 'cloud', rotate: -2, offsetX: 0, offsetY: 0, seed: 66 },
    ],
  },
  {
    title: '🏷️ 吊牌集合',
    desc: '各色吊牌标签的悬挂展示',
    items: [
      { preset: 'tag', color: 'peach', rotate: -8, offsetX: -20, offsetY: 5, seed: 77 },
      { preset: 'tag', color: 'sky', rotate: 3, offsetX: 15, offsetY: -3, seed: 88 },
      { preset: 'tag', color: 'mint', rotate: -1, offsetX: 0, offsetY: 0, seed: 99 },
    ],
  },
  {
    title: '📒 手帐拼贴',
    desc: '混合形状的手帐风拼贴效果',
    items: [
      { preset: 'torn', color: 'cream', rotate: -3, offsetX: -12, offsetY: 12, seed: 110 },
      { preset: 'scalloped-edge', color: 'pink', rotate: 4, offsetX: 8, offsetY: -6, seed: 120 },
      { preset: 'stitched', color: 'sky', rotate: -1, offsetX: 0, offsetY: 0, seed: 130 },
      { preset: 'folded', color: 'apricot', rotate: 6, offsetX: 14, offsetY: 4, seed: 140 },
    ],
  },
];

export default function PaperShapeStack() {
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-hand font-bold text-foreground mb-2">纸张堆叠与拼贴</h2>
        <p className="text-sm text-muted-foreground font-craft">
          参考卡牌堆叠视觉：底层更暗、更轻透，顶部更清晰，悬停时轻微扇形展开
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {stackExamples.map((stack, si) => (
          <motion.div
            key={si}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.1 }}
            className="relative overflow-hidden rounded-[28px] border border-border/70 bg-gradient-to-br from-card via-card to-muted/40 p-6 shadow-[0_24px_60px_-34px_rgba(30,24,17,0.5)]"
          >
            <div className="pointer-events-none absolute inset-x-10 top-3 h-16 rounded-full bg-white/40 blur-3xl opacity-60" />
            <div className="pointer-events-none absolute inset-x-12 bottom-5 h-12 rounded-full bg-black/35 blur-3xl opacity-55" />

            <h3 className="font-hand text-xl font-semibold mb-1">{stack.title}</h3>
            <p className="text-xs text-muted-foreground font-craft mb-5">{stack.desc}</p>

            <motion.div
              className="relative flex items-center justify-center min-h-[250px] [perspective:1100px]"
              initial="rest"
              animate="rest"
              whileHover="hover"
            >
              {stack.items.map((item, i) => {
                const topIndex = stack.items.length - 1;
                const depth = topIndex - i;
                const spreadIndex = i - topIndex / 2;
                const restX = item.offsetX - depth * 4;
                const restY = item.offsetY + depth * 10;
                const restRotate = item.rotate - depth * 0.6;
                const restScale = Math.max(0.84, 1 - depth * 0.04);
                const layerOpacity = Math.max(0.38, 1 - depth * 0.2);
                const brightness = Math.max(0.56, 1 - depth * 0.14);
                const saturation = Math.max(0.72, 1 - depth * 0.09);
                const shadowOpacity = Math.max(0.16, 0.34 - depth * 0.06);

                return (
                  <motion.div
                    key={i}
                    className="absolute h-[130px] w-[180px] origin-bottom"
                    variants={{
                      rest: {
                        x: restX,
                        y: restY,
                        rotate: restRotate,
                        scale: restScale,
                      },
                      hover: {
                        x: restX + spreadIndex * 14,
                        y: restY - (5 + depth * 1.8),
                        rotate: restRotate + spreadIndex * 2,
                        scale: restScale + 0.03,
                      },
                    }}
                    style={{
                      zIndex: i,
                      opacity: layerOpacity,
                      filter: `brightness(${brightness}) saturate(${saturation})`,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24, mass: 0.5 }}
                  >
                    <div
                      className="pointer-events-none absolute inset-x-5 bottom-[-12px] h-7 rounded-full bg-black blur-md"
                      style={{ opacity: shadowOpacity }}
                    />
                    <PaperShape
                      preset={item.preset}
                      width={180}
                      height={130}
                      seed={item.seed}
                      paperColor={item.color}
                      showPattern={i >= topIndex - 1}
                      patternType={i === topIndex ? 'dots' : 'lines'}
                    >
                      <span className="text-2xl">{presetInfo[item.preset].emoji}</span>
                    </PaperShape>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
