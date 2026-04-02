import { Link } from 'react-router-dom';
import { PaperShape } from '@/components/paper-shape';
import { presetInfo } from '@/components/paper-shape/geometry';
import { motion } from 'framer-motion';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8"
      >
        <h1 className="text-5xl font-hand font-bold text-foreground">
          ✂️ Craft Paper Shape
        </h1>
        <p className="text-lg text-muted-foreground font-craft max-w-md mx-auto">
          童趣可爱手绘风纸张形状组件系统
        </p>

        <div className="flex gap-6 justify-center flex-wrap">
          {(['stamp', 'coupon', 'folded', 'tag'] as const).map((preset, i) => (
            <motion.div
              key={preset}
              initial={{ opacity: 0, y: 20, rotate: -5 + i * 3 }}
              animate={{ opacity: 1, y: 0, rotate: -5 + i * 3 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ scale: 1.1, rotate: 0 }}
              style={{ marginTop: preset === 'stamp' ? 10 : 0 }}
            >
              <PaperShape
                preset={preset}
                width={140}
                height={100}
                seed={i * 17 + 5}
                paperColor={['cream', 'pink', 'mint', 'sky'][i]}
                showPattern={i % 2 === 0}
                patternType="dots"
              >
                <div className="text-center leading-tight">
                  <p className="text-xl">{presetInfo[preset].emoji}</p>
                  <p className="text-xs font-craft text-foreground/75">{presetInfo[preset].label}</p>
                </div>
              </PaperShape>
            </motion.div>
          ))}
        </div>

        <Link
          to="/ui/paper-shape"
          className="inline-block px-8 py-3 rounded-xl bg-primary text-primary-foreground font-craft font-medium text-lg shadow-md hover:opacity-90 transition"
        >
          查看详情 →
        </Link>
      </motion.div>
    </div>
  );
};

export default Index;
