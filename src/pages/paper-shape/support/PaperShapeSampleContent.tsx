import React from 'react';
import type { PaperPreset, PresetParams } from '@/components/paper-shape/geometry';
import { edgeBiasedSplit } from '@/components/paper-shape/paperShapeUtils';
import {
  PosterTitle,
  type PosterTitleEmoji,
  type PosterTitleLine,
  type PosterTitleQuoteDecoration,
  type PosterTitleSymbol,
} from '@/components/paper-shape/PosterTitle';

interface PaperShapeSampleContentProps {
  mode: number;
  title: string;
  emoji: string;
  preset?: PaperPreset;
  presetParams?: PresetParams;
  shapeWidth?: number;
}

function hashIndex(input: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33 + input.charCodeAt(i)) >>> 0;
  }
  return modulo > 0 ? hash % modulo : 0;
}

function clampNum(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

type PosterVariantCommon = {
  lines: PosterTitleLine[];
  quote: PosterTitleQuoteDecoration;
  symbols: PosterTitleSymbol[];
  emojis: PosterTitleEmoji[];
};

export function PaperShapeSampleContent({
  mode,
  title,
  emoji,
  preset,
  presetParams,
  shapeWidth,
}: PaperShapeSampleContentProps) {
  const isCoupon = preset === 'coupon';
  const isTicket = preset === 'ticket';

  if (isCoupon) {
    const couponVariants = [
      {
        kicker: '限时优惠',
        headline: '满 200 减 40',
        subline: '文具/贴纸通用',
        action: '今日可核销',
        code: 'SAVE40',
      },
      {
        kicker: '夜场专享',
        headline: '第 2 件 5 折',
        subline: '18:00 后生效',
        action: '支持叠加会员',
        code: 'NIGHT50',
      },
      {
        kicker: '周末补货',
        headline: '买三送一',
        subline: '同品类可混搭',
        action: '库存限量',
        code: 'MIX3GET1',
      },
    ];
    const selected = couponVariants[hashIndex(`${title}-${mode}`, couponVariants.length)];
    const serial = `NO.${String(1200 + hashIndex(`${title}-${mode}-serial`, 7800)).padStart(4, '0')}`;
    const splitOffset = presetParams?.perforationOffset
      ?? presetParams?.couponPosition
      ?? presetParams?.couponNotchOffsetX
      ?? 0;
    const widthForSplit = typeof shapeWidth === 'number' && shapeWidth > 0 ? shapeWidth : 240;
    const ultraCompact = widthForSplit < 200;
    const compact = widthForSplit < 220;
    const splitRatio = clampNum(edgeBiasedSplit(widthForSplit, splitOffset, 0.4) / widthForSplit, 0.14, 0.86);
    const sideOnLeft = splitRatio < 0.5;
    const rawSideRatio = sideOnLeft ? splitRatio : (1 - splitRatio);
    const sideRatio = compact
      ? clampNum(rawSideRatio, 0.38, 0.45)
      : clampNum(rawSideRatio, 0.28, 0.42);
    const mainRatio = Math.max(0.44, 1 - sideRatio);
    const keepOutBand = compact ? 12 : 8;
    const mainTitle = ultraCompact
      ? (selected.headline === '买三送一'
        ? '买3送1'
        : selected.headline === '满 200 减 40'
          ? '减40'
          : '2件5折')
      : selected.headline;
    const mainSubline = compact ? selected.action : selected.subline;
    const mainFooter = compact ? '有效期 04.30' : '有效期 03.27 - 04.30';
    const serialShort = serial.replace('NO.', '#');
    const sideCode = ultraCompact
      ? (selected.code === 'MIX3GET1'
        ? 'MIX3'
        : selected.code === 'NIGHT50'
          ? 'N50'
          : 'S40')
      : selected.code;
    const gridTemplateColumns = sideOnLeft
      ? `${sideRatio}fr ${keepOutBand}px ${mainRatio}fr`
      : `${mainRatio}fr ${keepOutBand}px ${sideRatio}fr`;

    const sidePanel = compact ? (
      <div className={`min-w-0 h-full py-2 flex flex-col justify-center gap-1.5 ${sideOnLeft ? 'pl-2 pr-2 text-left' : 'pl-3 pr-2 text-right'}`}>
        <p className="text-[11px] font-craft font-semibold leading-none whitespace-nowrap break-keep truncate">{sideCode}</p>
        <p className="text-[10px] font-craft leading-tight opacity-70 whitespace-nowrap break-keep truncate">{serialShort}</p>
      </div>
    ) : (
      <div className={`min-w-0 h-full py-2 flex flex-col justify-center gap-1.5 ${sideOnLeft ? 'pl-2.5 pr-3.5 text-left' : 'pl-3.5 pr-2.5 text-right'}`}>
        <p className="text-[10px] font-craft tracking-[0.08em] opacity-70 whitespace-nowrap break-keep truncate">副券</p>
        <p className="text-[11px] font-craft font-semibold leading-none whitespace-nowrap break-keep truncate">{sideCode}</p>
        <p className="text-[10px] font-craft leading-tight opacity-70 whitespace-nowrap break-keep truncate">{serial}</p>
      </div>
    );
    const mainPanel = (
      <div className={`min-w-0 h-full py-2 flex flex-col justify-center gap-1 ${sideOnLeft ? 'pl-3 pr-2.5 text-right' : 'pl-2.5 pr-1 text-left'}`}>
        {!compact && <p className="text-[10px] opacity-70 tracking-[0.06em] whitespace-nowrap break-keep truncate">{selected.kicker}</p>}
        <p className="text-base font-semibold leading-none whitespace-nowrap break-keep truncate">{mainTitle}</p>
        <p className="text-[11px] leading-tight opacity-80 whitespace-nowrap break-keep truncate">{mainSubline}</p>
        {!compact && <p className="text-[11px] leading-tight whitespace-nowrap break-keep truncate">{selected.action}</p>}
        <p className="text-[10px] opacity-65 whitespace-nowrap break-keep truncate">{mainFooter}</p>
      </div>
    );

    return (
      <div className="w-full h-full overflow-hidden text-ink-stroke font-craft px-1 py-0.5">
        <div className="w-full h-full grid" style={{ gridTemplateColumns }}>
          {sideOnLeft ? sidePanel : mainPanel}
          <div aria-hidden className="pointer-events-none" />
          {sideOnLeft ? mainPanel : sidePanel}
        </div>
      </div>
    );
  }

  if (isTicket) {
    const ticketVariants = [
      {
        topLabel: 'ENTRY PASS',
        title: 'Live House 夜场',
        time: '04/18 19:30',
        place: 'A 区入场',
      },
      {
        topLabel: 'ADMIT ONE',
        title: '电影首映专场',
        time: '04/06 20:10',
        place: '5 号厅',
      },
      {
        topLabel: 'GALLERY PASS',
        title: '周末展览通票',
        time: '04/12 14:00',
        place: '西馆入口',
      },
    ];
    const selected = ticketVariants[hashIndex(`${title}-${mode}`, ticketVariants.length)];
    const seat = `${String.fromCharCode(65 + hashIndex(`${title}-${mode}-row`, 6))}${10 + hashIndex(`${title}-${mode}-seat`, 70)}`;
    const serial = `T-${String(10000 + hashIndex(`${title}-${mode}-ticket`, 90000)).slice(1)}`;
    const eventLine = `${selected.time} · ${selected.place}`;

    return (
      <div className="w-full h-full overflow-hidden text-ink-stroke font-craft grid grid-rows-[minmax(0,1fr)_14px_minmax(44px,0.72fr)]">
        <div className="min-h-0 px-3.5 pt-2.5 pb-1.5 text-left flex flex-col justify-start gap-2">
          <p className="text-[11px] opacity-70 tracking-[0.1em]">{selected.topLabel}</p>
          <p className="text-lg font-semibold leading-tight truncate">{selected.title}</p>
        </div>
        <div aria-hidden className="pointer-events-none" />
        <div className="h-full px-3.5 py-1.5 rounded-t-md bg-ink-stroke/[0.05] flex items-center justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <p className="text-[10px] leading-tight opacity-80 truncate">{eventLine}</p>
            <p className="text-[10px] font-semibold leading-tight truncate">座位 {seat} · {serial}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] opacity-70 leading-none">检票章</p>
            <p className="text-base leading-none">{emoji}</p>
          </div>
        </div>
      </div>
    );
  }

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

  if (mode === 5) {
    const topic = title.replace(/\s+/g, '').slice(0, 9) || '今天就试试';

    if (isCoupon) {
      const couponVariants: Array<PosterVariantCommon & { kicker: string }> = [
        {
          kicker: '限时提醒',
          lines: [
            {
              size: 'sm' as const,
              tokens: [{ text: '文具补货日', highlight: true, highlightColor: 'hsl(197 96% 79% / 0.95)' }],
            },
            {
              size: 'xl' as const,
              tokens: [
                { text: '和纸胶带', highlight: true, highlightColor: 'hsl(53 98% 76% / 0.95)' },
                { text: '买三送一', rotate: -1.4 },
              ],
            },
            {
              size: 'md' as const,
              tokens: [{ text: '今晚拼贴就开工', rotate: 1 }],
            },
          ],
          quote: { size: 34, opacity: 0.16 },
          symbols: [
            { kind: 'curve' as const, x: 84, y: 18, size: 22, rotate: 8, opacity: 0.34 },
          ],
          emojis: [
            { value: '🛒', x: 86, y: 26, size: 16, rotate: 8 },
          ],
        },
        {
          kicker: '今晚可用',
          lines: [
            {
              size: 'sm' as const,
              tokens: [{ text: '先囤贴纸', rotate: -1 }],
            },
            {
              size: 'xl' as const,
              tokens: [
                { text: '再买', highlight: true, highlightColor: 'hsl(52 98% 76% / 0.95)' },
                { text: '同色系笔', rotate: 1.2 },
              ],
            },
            {
              size: 'sm' as const,
              tokens: [{ text: '预算也要可爱', highlight: true, highlightColor: 'hsl(200 95% 82% / 0.95)' }],
            },
          ],
          quote: { size: 30, opacity: 0.14 },
          symbols: [
            { kind: 'swirl' as const, x: 14, y: 84, size: 20, rotate: -8, opacity: 0.3 },
          ],
          emojis: [
            { value: '🧾', x: 86, y: 74, size: 15, rotate: 6 },
          ],
        },
      ];
      const selected = couponVariants[hashIndex(`${preset}-${title}`, couponVariants.length)];
      return (
        <div className="w-full h-full overflow-hidden">
          <PosterTitle
            align="center"
            kicker={selected.kicker}
            lines={selected.lines}
            quote={selected.quote}
            symbols={selected.symbols}
            emojis={selected.emojis}
          />
        </div>
      );
    }

    const normalVariants: Array<PosterVariantCommon & { align: 'left'; handDrawn: boolean }> = [
      {
        align: 'left' as const,
        handDrawn: false,
        lines: [
          { size: 'md' as const, tokens: [{ text: '本周手帐' }] },
          {
            size: 'xl' as const,
            tokens: [
              { text: '配色', highlight: true, highlightStyle: 'lower', highlightColor: 'hsl(345 88% 80% / 0.95)' },
              { text: '灵感来了' },
            ],
          },
          { size: 'lg' as const, tokens: [{ text: '奶油黄+雾霾蓝' }] },
        ],
        quote: { size: 32, opacity: 0.14, openX: 6, openY: 10, closeX: 93, closeY: 84 },
        symbols: [
          { kind: 'curve' as const, x: 88, y: 18, size: 24, rotate: 8, opacity: 0.34 },
          { kind: 'swirl' as const, x: 14, y: 86, size: 22, rotate: -8, opacity: 0.3 },
        ],
        emojis: [],
      },
      {
        align: 'left' as const,
        handDrawn: true,
        lines: [
          { size: 'lg' as const, tokens: [{ text: '今天试了' }, { text: '票根拼贴', highlight: true, highlightColor: 'hsl(56 96% 70% / 0.95)' }] },
          {
            size: 'lg' as const,
            tokens: [{ text: '边角料也能出片' }],
          },
          { size: 'xl' as const, tokens: [{ text: '故事感拉满！' }] },
        ],
        quote: { size: 38, opacity: 0.24, openX: 7, openY: 11, closeSymbol: '' },
        symbols: [
          { kind: 'curve' as const, x: 86, y: 20, size: 22, rotate: 12, opacity: 0.32 },
          { kind: 'swirl' as const, x: 14, y: 86, size: 20, rotate: -10, opacity: 0.28 },
        ],
        emojis: [],
      },
      {
        align: 'left' as const,
        handDrawn: false,
        lines: [
          { size: 'xl' as const, tokens: [{ text: '手帐排版' }, { text: '✍️', textColor: 'hsl(357 76% 58%)' }] },
          { size: 'xl' as const, tokens: [{ text: '留白一点' }] },
          {
            size: 'lg' as const,
            tokens: [
              { text: '画面', highlight: true, highlightStyle: 'lower', highlightColor: 'hsl(50 98% 76% / 0.95)' },
              { text: '更透气' },
            ],
          },
          { size: 'sm' as const, gapBeforeEm: 0.42, tokens: [{ text: topic, textColor: 'hsl(24 30% 36% / 0.7)' }] },
        ],
        quote: { size: 30, opacity: 0.12, openX: 7, openY: 11, closeSymbol: '' },
        symbols: [
          { kind: 'curve' as const, x: 86, y: 18, size: 22, rotate: 9, opacity: 0.3 },
          { kind: 'swirl' as const, x: 14, y: 86, size: 21, rotate: -10, opacity: 0.28 },
        ],
        emojis: [],
      },
    ];
    const selected = normalVariants[hashIndex(`${preset}-${title}`, normalVariants.length)];

    return (
      <div className="w-full h-full overflow-hidden">
        <PosterTitle
          align={selected.align}
          handDrawn={selected.handDrawn}
          lines={selected.lines}
          quote={selected.quote}
          symbols={selected.symbols}
          emojis={selected.emojis}
          className="pl-2.5 pr-1.5 py-2"
        />
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
