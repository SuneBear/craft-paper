import React from 'react';
import type { PaperPreset } from './geometry';

interface PaperShapeSampleContentProps {
  mode: number;
  title: string;
  emoji: string;
  preset?: PaperPreset;
}

export function PaperShapeSampleContent({ mode, title, emoji, preset }: PaperShapeSampleContentProps) {
  const isCoupon = preset === 'coupon';

  if (mode === 1) {
    return (
      <div className="w-full h-full flex items-start overflow-hidden">
        <div className="w-full text-left pt-2 px-2.5 space-y-1 overflow-hidden">
          <p className="text-[10px] font-craft text-ink-stroke/70 truncate">03/27 Memo</p>
          <p className="text-xs font-craft font-semibold text-ink-stroke leading-tight truncate">
            {isCoupon ? '优惠信息' : title}
          </p>
          <p className="text-[10px] font-craft text-ink-stroke/70 leading-tight truncate">
            {isCoupon ? '满200减40 · 周末可用' : '适合放短文案和说明内容'}
          </p>
        </div>
      </div>
    );
  }

  if (mode === 2) {
    return (
      <div className="w-full h-full flex items-end">
        <div className="w-full px-2.5 pb-2 flex items-end justify-between text-ink-stroke">
          <div>
            <p className="text-[10px] font-craft opacity-70">No. 1024</p>
            <p className="text-xs font-craft font-semibold">ENTRY PASS</p>
          </div>
          <p className="text-lg leading-none">{emoji}</p>
        </div>
      </div>
    );
  }

  if (mode === 3) {
    if (isCoupon) {
      return (
        <div className="w-full h-full flex items-center overflow-hidden">
          <div className="w-full px-3 text-left font-craft text-ink-stroke space-y-1.5">
            <p className="font-semibold text-sm leading-none">优惠券</p>
            <p className="text-[10px] leading-tight">满 200 减 40</p>
            <p className="text-[10px] leading-tight">有效期 03.27 - 04.30</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center overflow-hidden">
        <div className="w-full px-3 text-left text-[10px] font-craft text-ink-stroke/85 leading-tight space-y-1 overflow-hidden">
          <p className="font-semibold text-xs text-ink-stroke truncate">{title}</p>
          <p className="truncate">• 点 1：重点摘要</p>
          <p className="truncate">• 点 2：次要信息</p>
        </div>
      </div>
    );
  }

  if (mode === 4) {
    if (isCoupon) {
      return (
        <div className="w-full h-full p-2.5 flex flex-col justify-between text-ink-stroke">
          <p className="text-[10px] font-craft opacity-70">LIMITED OFFER</p>
          <div className="space-y-1">
            <p className="text-sm font-craft font-semibold leading-none">优惠券</p>
            <p className="text-[10px] font-craft opacity-80 leading-tight">输入码 SAVE20</p>
            <p className="text-[10px] font-craft opacity-80 leading-tight">今日可用 · 立即核销</p>
          </div>
          <p className="text-right text-lg leading-none">{emoji}</p>
        </div>
      );
    }

    return (
      <div className="w-full h-full p-2.5 flex flex-col justify-between text-ink-stroke">
        <p className="text-[10px] font-craft opacity-70">Layout Case</p>
        <p className="text-xs font-craft font-semibold leading-tight">{title}</p>
        <p className="text-right text-lg leading-none">{emoji}</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <span className="text-2xl block">{emoji}</span>
      <span className="text-xs font-craft text-ink-stroke mt-1 block opacity-70">
        {title}
      </span>
    </div>
  );
}
