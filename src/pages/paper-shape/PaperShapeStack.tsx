import { PaperShape } from '@/components/paper-shape';
import { presetInfo, type PaperPreset, type PresetParams } from '@/components/paper-shape/geometry';
import { PAPER_COLORS } from '@/components/paper-shape/paperShapeUtils';
import { motion } from 'framer-motion';
import { useState } from 'react';

type StackMode = 'vertical-bottom' | 'vertical-top' | 'diagonal' | 'messy';

const stackModeOptions: Array<{ key: StackMode; label: string; desc: string }> = [
  { key: 'vertical-bottom', label: '底部纵向', desc: '像一叠纸压在底部，最有“纸堆”感' },
  { key: 'vertical-top', label: '顶部纵向', desc: '堆叠边缘露在顶部，参考 Vertical Top' },
  { key: 'diagonal', label: '对角堆叠', desc: '各层按同方向斜向位移，参考 Diagonal' },
  { key: 'messy', label: '杂乱堆叠', desc: '轻微左右交错与旋转，参考 Disorganized' },
];

function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function resolvePaperColor(value: string): string {
  return PAPER_COLORS[value] || value;
}

function mixTowardTopColor(baseColor: string, topColor: string, amount: number): string {
  const t = Math.max(0, Math.min(1, amount));
  if (t <= 0.001) return baseColor;
  const topWeight = Math.round(t * 100);
  const baseWeight = 100 - topWeight;
  return `color-mix(in hsl, ${baseColor} ${baseWeight}%, ${topColor} ${topWeight}%)`;
}

const stackExamples: Array<{
  title: string;
  desc: string;
  items: Array<{
    preset: PaperPreset;
    color: string;
    rotate: number;
    offsetX: number;
    offsetY: number;
    seed: number;
    presetParams?: PresetParams;
  }>;
}> = [
  {
    title: '📄 直角纸张堆叠',
    desc: '四角保持直角，边缘带轻微纸张扭曲的层叠效果',
    items: [
      {
        preset: 'basic-paper',
        color: 'cloud',
        rotate: -0.55,
        offsetX: -10,
        offsetY: 10,
        seed: 11,
        presetParams: { cornerRadius: 0, edgeWobble: 0.95, edgeWobbleBottom: 1.25 },
      },
      {
        preset: 'basic-paper',
        color: 'cream',
        rotate: 0.05,
        offsetX: -1,
        offsetY: 4,
        seed: 22,
        presetParams: { cornerRadius: 0, edgeWobble: 1.05, edgeWobbleRight: 1.3 },
      },
      {
        preset: 'basic-paper',
        color: 'pink',
        rotate: 0.7,
        offsetX: 7,
        offsetY: -1,
        seed: 33,
        presetParams: { cornerRadius: 0, edgeWobble: 0.9, edgeWobbleTop: 1.15 },
      },
    ],
  },
  {
    title: '🎫 票据收藏',
    desc: '不同类型票据的拼贴组合',
    items: [
      { preset: 'ticket', color: 'mint', rotate: -0.6, offsetX: -14, offsetY: 9, seed: 44 },
      { preset: 'coupon', color: 'lavender', rotate: 0.2, offsetX: -3, offsetY: 2, seed: 55 },
      { preset: 'receipt', color: 'cloud', rotate: 0.8, offsetX: 8, offsetY: -4, seed: 66 },
    ],
  },
  {
    title: '🏷️ 吊牌集合',
    desc: '各色吊牌标签的悬挂展示',
    items: [
      { preset: 'tag', color: 'peach', rotate: -0.8, offsetX: -16, offsetY: 8, seed: 77 },
      { preset: 'tag', color: 'sky', rotate: 0.1, offsetX: -2, offsetY: 2, seed: 88 },
      { preset: 'tag', color: 'mint', rotate: 0.7, offsetX: 10, offsetY: -4, seed: 99 },
    ],
  },
  {
    title: '📒 手帐拼贴',
    desc: '混合形状的手帐风拼贴效果',
    items: [
      { preset: 'torn', color: 'cream', rotate: -0.9, offsetX: -14, offsetY: 12, seed: 110 },
      { preset: 'scalloped-edge', color: 'pink', rotate: -0.1, offsetX: -5, offsetY: 6, seed: 120 },
      { preset: 'stitched', color: 'sky', rotate: 0.5, offsetX: 4, offsetY: 0, seed: 130 },
      { preset: 'folded', color: 'apricot', rotate: 1, offsetX: 13, offsetY: -5, seed: 140 },
    ],
  },
];

export default function PaperShapeStack() {
  const [stackMode, setStackMode] = useState<StackMode>('vertical-bottom');
  const [depthGap, setDepthGap] = useState(13);
  const [offsetStrength, setOffsetStrength] = useState(7);
  const [rotateStrength, setRotateStrength] = useState(1.1);
  const [randomRotateStrength, setRandomRotateStrength] = useState(0.8);
  const [hoverOrderStrength, setHoverOrderStrength] = useState(1);
  const [rearDepthStrength, setRearDepthStrength] = useState(1);
  const [rearColorCloseness, setRearColorCloseness] = useState(0.35);
  const [rearOpacityFloor, setRearOpacityFloor] = useState(0.45);

  const pullOrder = (base: number) => Math.min(1.25, Math.max(0, base * hoverOrderStrength));
  const randomizePanel = () => {
    const randomMode = stackModeOptions[Math.floor(Math.random() * stackModeOptions.length)].key;
    setStackMode(randomMode);
    setDepthGap(Math.round(8 + Math.random() * 12));
    setOffsetStrength(Math.round(2 + Math.random() * 12));
    setRotateStrength(Number((0.2 + Math.random() * 2).toFixed(1)));
    setRandomRotateStrength(Number((Math.random() * 2.5).toFixed(1)));
    setHoverOrderStrength(Number((Math.random() * 2.2).toFixed(2)));
    setRearDepthStrength(Number((Math.random() * 2).toFixed(2)));
    setRearColorCloseness(Number(Math.random().toFixed(2)));
    setRearOpacityFloor(Number((0.2 + Math.random() * 0.75).toFixed(2)));
  };

  const getStackMotion = (
    depth: number,
    spreadIndex: number,
    item: { offsetX: number; offsetY: number; rotate: number; seed: number }
  ) => {
    const depthSign = depth % 2 === 0 ? -1 : 1;
    const itemJitterX = item.offsetX * 0.15;
    const itemJitterY = item.offsetY * 0.2;
    const itemJitterRotate = item.rotate * 0.1;
    const rotateNoise = (seededNoise(item.seed + depth * 19) - 0.5) * 2 * randomRotateStrength;
    const verticalLift = 4 + depth * 1.05;

    if (stackMode === 'vertical-top') {
      const x = itemJitterX + depthSign * (offsetStrength * 0.22 + depth * 0.8);
      const y = itemJitterY - depth * depthGap * 0.8;
      const rotate = depthSign * rotateStrength * (0.22 + depth * 0.14) + itemJitterRotate + rotateNoise;
      const orderedX = itemJitterX * 0.1 + spreadIndex * 0.6;
      const orderedY = itemJitterY * 0.08 - depth * depthGap * 0.72;
      const orderedRotate = spreadIndex * rotateStrength * 0.08 + item.rotate * 0.04;
      return {
        x,
        y,
        rotate,
        hoverX: lerp(x, orderedX, pullOrder(0.78)),
        hoverY: lerp(y, orderedY, pullOrder(0.78)) + verticalLift * 0.28,
        hoverRotate: lerp(rotate, orderedRotate, pullOrder(0.82)),
      };
    }

    if (stackMode === 'diagonal') {
      const x = itemJitterX + depth * (offsetStrength * 0.95);
      const y = itemJitterY + depth * (depthGap * 0.9);
      const rotate = rotateStrength * 0.24 + depth * rotateStrength * 0.22 + itemJitterRotate + rotateNoise;
      const orderedX = depth * (offsetStrength * 0.64);
      const orderedY = depth * (depthGap * 0.78);
      const orderedRotate = rotateStrength * 0.12 + depth * rotateStrength * 0.1 + spreadIndex * rotateStrength * 0.05;
      return {
        x,
        y,
        rotate,
        hoverX: lerp(x, orderedX, pullOrder(0.75)),
        hoverY: lerp(y, orderedY, pullOrder(0.75)) - verticalLift * 0.58,
        hoverRotate: lerp(rotate, orderedRotate, pullOrder(0.8)),
      };
    }

    if (stackMode === 'messy') {
      const x = itemJitterX + depthSign * (offsetStrength * 0.45 + depth * (offsetStrength * 0.28));
      const y = itemJitterY + depth * (depthGap * 1.02);
      const rotate = depthSign * (rotateStrength * 0.55 + depth * rotateStrength * 0.38) + itemJitterRotate + rotateNoise;
      const orderedX = depthSign * (offsetStrength * 0.22 + depth * 0.45);
      const orderedY = depth * (depthGap * 0.94);
      const orderedRotate = depthSign * (rotateStrength * 0.22 + depth * rotateStrength * 0.12) + item.rotate * 0.05;
      return {
        x,
        y,
        rotate,
        hoverX: lerp(x, orderedX, pullOrder(0.72)),
        hoverY: lerp(y, orderedY, pullOrder(0.72)) - verticalLift * 0.72,
        hoverRotate: lerp(rotate, orderedRotate, pullOrder(0.8)),
      };
    }

    // vertical-bottom
    const x = itemJitterX + depthSign * (offsetStrength * 0.2 + depth * 0.9);
    const y = itemJitterY + depth * depthGap;
    const rotate = depthSign * (rotateStrength * 0.26 + depth * rotateStrength * 0.2) + itemJitterRotate + rotateNoise;
    const orderedX = itemJitterX * 0.1 + spreadIndex * 0.65;
    const orderedY = itemJitterY * 0.08 + depth * depthGap * 0.86;
    const orderedRotate = spreadIndex * rotateStrength * 0.08 + item.rotate * 0.04;
    return {
      x,
      y,
      rotate,
      hoverX: lerp(x, orderedX, pullOrder(0.8)),
      hoverY: lerp(y, orderedY, pullOrder(0.8)) - verticalLift * 0.78,
      hoverRotate: lerp(rotate, orderedRotate, pullOrder(0.84)),
    };
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-hand font-bold text-foreground mb-2">纸张堆叠与拼贴</h2>
        <p className="text-sm text-muted-foreground font-craft">支持多种纸张堆叠方式与参数调节，可在规整堆叠和随意散叠之间自由切换</p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {stackModeOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setStackMode(option.key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-craft transition ${
                  stackMode === option.key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background/75 text-foreground/80 hover:bg-background'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={randomizePanel}
            className="self-start rounded-lg border border-border bg-background/75 px-3 py-1.5 text-xs font-craft text-foreground/80 hover:bg-background transition"
          >
            🎲 随机
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground font-craft">
          {stackModeOptions.find((option) => option.key === stackMode)?.desc}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-craft text-muted-foreground">
              <span>层间深度</span>
              <span>{depthGap.toFixed(0)}</span>
            </div>
            <input
              type="range"
              min={8}
              max={20}
              step={1}
              value={depthGap}
              onChange={(e) => setDepthGap(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
          <label className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-craft text-muted-foreground">
              <span>水平错位</span>
              <span>{offsetStrength.toFixed(0)}</span>
            </div>
            <input
              type="range"
              min={2}
              max={14}
              step={1}
              value={offsetStrength}
              onChange={(e) => setOffsetStrength(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
          <label className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-craft text-muted-foreground">
              <span>旋转强度</span>
              <span>{rotateStrength.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={2.2}
              step={0.1}
              value={rotateStrength}
              onChange={(e) => setRotateStrength(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
          <label className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-craft text-muted-foreground">
              <span>随机旋转</span>
              <span>{randomRotateStrength.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={2.5}
              step={0.1}
              value={randomRotateStrength}
              onChange={(e) => setRandomRotateStrength(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
          <label className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-craft text-muted-foreground">
              <span>收拢强度</span>
              <span>{hoverOrderStrength.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={2.2}
              step={0.05}
              value={hoverOrderStrength}
              onChange={(e) => setHoverOrderStrength(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
          <label className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-craft text-muted-foreground">
              <span>后层深度感(明暗)</span>
              <span>{rearDepthStrength.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={rearDepthStrength}
              onChange={(e) => setRearDepthStrength(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
          <label className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-craft text-muted-foreground">
              <span>后层贴近前卡色彩</span>
              <span>{rearColorCloseness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={rearColorCloseness}
              onChange={(e) => setRearColorCloseness(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
          <label className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-craft text-muted-foreground">
              <span>后层最低透明度</span>
              <span>{rearOpacityFloor.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={0.95}
              step={0.01}
              value={rearOpacityFloor}
              onChange={(e) => setRearOpacityFloor(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
        </div>
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
              <div
                className="pointer-events-none absolute left-1/2 top-[68%] h-12 -translate-x-1/2 rounded-full bg-black/22 blur-xl"
                style={{ width: `${220 + offsetStrength * 8}px` }}
              />
              {stack.items.map((item, i) => {
                const topIndex = stack.items.length - 1;
                const depth = topIndex - i;
                const spreadIndex = i - topIndex / 2;
                const depthRatio = topIndex > 0 ? depth / topIndex : 0;
                const toneDrop = depthRatio * rearDepthStrength * (1 - rearColorCloseness * 0.8);
                const topPaperColor = resolvePaperColor(stack.items[topIndex]?.color ?? item.color);
                const ownPaperColor = resolvePaperColor(item.color);
                const colorMixAmount = depthRatio * rearColorCloseness;
                const mixedPaperColor = mixTowardTopColor(ownPaperColor, topPaperColor, colorMixAmount);
                const motionLayout = getStackMotion(depth, spreadIndex, item);
                const restScale = Math.max(0.86, 1 - depth * 0.03);
                const layerOpacity = Math.max(rearOpacityFloor, 1 - depthRatio * (0.62 * rearDepthStrength));
                const baseDim = depthRatio * 0.32;
                const depthTone = (rearDepthStrength - 1) * depthRatio * 0.55;
                const brightness = Math.max(0.42, Math.min(1.2, 1 - baseDim - depthTone));
                const saturation = Math.max(0.6, 1 - toneDrop * 0.3);
                const shadowOpacity = Math.max(0.14, 0.34 - depthRatio * (0.22 + rearDepthStrength * 0.06));

                return (
                  <motion.div
                    key={i}
                    className="absolute h-[130px] w-[180px] origin-bottom"
                    variants={{
                      rest: {
                        x: motionLayout.x,
                        y: motionLayout.y,
                        rotate: motionLayout.rotate,
                        scale: restScale,
                      },
                      hover: {
                        x: motionLayout.hoverX,
                        y: motionLayout.hoverY,
                        rotate: motionLayout.hoverRotate,
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
                      className="pointer-events-none absolute inset-x-5 bottom-[-14px] h-8 rounded-full bg-black blur-md"
                      style={{ opacity: shadowOpacity }}
                    />
                    <PaperShape
                      preset={item.preset}
                      width={180}
                      height={130}
                      seed={item.seed}
                      paperColor={mixedPaperColor}
                      showPattern={i >= topIndex - 1}
                      patternType={i === topIndex ? 'dots' : 'lines'}
                      presetParams={item.presetParams}
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
