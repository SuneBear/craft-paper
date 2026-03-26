import { Link } from 'react-router-dom';
import { PaperShape } from '@/components/paper-shape/PaperShape';
import { presetInfo, type PaperPreset } from '@/components/paper-shape/geometry';
import { motion } from 'framer-motion';

const firstBatch: PaperPreset[] = ['stamp', 'coupon', 'ticket', 'tag'];
const secondBatch: PaperPreset[] = ['folded', 'torn', 'stitched', 'scalloped-edge'];
const extraBatch: PaperPreset[] = ['receipt', 'basic-paper'];

const COLORS = ['cream', 'pink', 'mint', 'sky', 'lavender', 'apricot', 'peach', 'cloud', 'cream', 'cloud'];

export default function PaperShapeOverview() {
  const allPresets = [...firstBatch, ...secondBatch, ...extraBatch];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center py-8">
        <h2 className="text-3xl font-hand font-bold text-foreground mb-3">
          手工温度的纸张形状 ✂️
        </h2>
        <p className="text-muted-foreground font-craft max-w-lg mx-auto leading-relaxed">
          邮票齿边、优惠券打孔、门票撕线、吊牌挂孔、折角阴影、撕纸边缘、缝线装饰、花边边框……
          每一种纸张都有自己的故事。
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <Link
            to="/ui/paper-shape/examples"
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-craft text-sm font-medium shadow-sm hover:opacity-90 transition"
          >
            浏览示例库 →
          </Link>
          <Link
            to="/ui/paper-shape/playground"
            className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-craft text-sm font-medium hover:opacity-90 transition"
          >
            打开编辑器 🎮
          </Link>
        </div>
      </section>

      {/* Preset Grid */}
      <section>
        <h3 className="text-2xl font-hand font-semibold text-foreground mb-5">
          所有形状预设
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {allPresets.map((preset, i) => {
            const info = presetInfo[preset];
            return (
              <motion.div
                key={preset}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="flex flex-col items-center gap-2"
              >
                <PaperShape
                  preset={preset}
                  width={160}
                  height={120}
                  seed={i * 7 + 13}
                  paperColor={COLORS[i % COLORS.length]}
                  showPattern={i % 3 === 0}
                  patternType={i % 3 === 0 ? 'dots' : 'none'}
                >
                  <span className="text-3xl">{info.emoji}</span>
                </PaperShape>
                <div className="text-center">
                  <p className="font-craft font-medium text-sm text-foreground">
                    {info.emoji} {info.label}
                  </p>
                  <p className="text-xs text-muted-foreground font-craft">
                    {info.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6">
        {[
          { title: '🎨 丰富预设', desc: '10 种纸张语义形状，每种都有独特的几何特征和视觉识别度' },
          { title: '✏️ 手绘质感', desc: '轻微的线条抖动和纸张纹理，营造温暖的手工温度' },
          { title: '🔧 可定制', desc: '支持调整粗糙度、颜色、纹理、描边等参数，可导出 SVG' },
        ].map((f, i) => (
          <div key={i} className="p-5 rounded-xl bg-card border border-border">
            <h4 className="font-hand text-xl font-semibold mb-2">{f.title}</h4>
            <p className="text-sm text-muted-foreground font-craft leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
