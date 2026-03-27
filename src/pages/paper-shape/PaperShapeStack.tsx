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
          将不同形状的纸张组合在一起，创造手帐风拼贴效果
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {stackExamples.map((stack, si) => (
          <motion.div
            key={si}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.1 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h3 className="font-hand text-xl font-semibold mb-1">{stack.title}</h3>
            <p className="text-xs text-muted-foreground font-craft mb-5">{stack.desc}</p>

            <motion.div
              className="relative flex items-center justify-center min-h-[240px]"
              initial="rest"
              animate="rest"
              whileHover="hover"
            >
              {stack.items.map((item, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  variants={{
                    rest: {
                      x: item.offsetX,
                      y: item.offsetY,
                      rotate: item.rotate,
                      scale: 1,
                    },
                    hover: {
                      x: item.offsetX + (i - (stack.items.length - 1) / 2) * 2,
                      y: item.offsetY - (2 + i * 1.5),
                      rotate: item.rotate + (item.rotate >= 0 ? 1.8 : -1.8),
                      scale: 1.03 + i * 0.01,
                    },
                  }}
                  style={{ zIndex: i }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <PaperShape
                    preset={item.preset}
                    width={180}
                    height={130}
                    seed={item.seed}
                    paperColor={item.color}
                    showPattern={i === stack.items.length - 1}
                    patternType="dots"
                  >
                    <span className="text-2xl">{presetInfo[item.preset].emoji}</span>
                  </PaperShape>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
