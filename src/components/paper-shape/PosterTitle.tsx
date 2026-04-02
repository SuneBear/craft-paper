import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type PosterTitleAlign = 'left' | 'center';

export interface PosterTitleToken {
  text: string;
  highlight?: boolean;
  highlightStyle?: 'full' | 'lower';
  highlightColor?: string;
  textColor?: string;
  rotate?: number;
}

export interface PosterTitleLine {
  tokens: PosterTitleToken[];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  weight?: number;
  trackingEm?: number;
  gapBeforeEm?: number;
}

export type PosterTitleSymbolKind =
  | 'quote-open'
  | 'quote-close'
  | 'arrow'
  | 'heart'
  | 'star'
  | 'spark'
  | 'curve'
  | 'swirl'
  | 'dash';

export interface PosterTitleSymbol {
  kind: PosterTitleSymbolKind;
  x: number;
  y: number;
  color?: string;
  size?: number;
  rotate?: number;
  opacity?: number;
}

export interface PosterTitleEmoji {
  value: string;
  x: number;
  y: number;
  size?: number;
  rotate?: number;
}

export interface PosterTitleQuoteDecoration {
  openSymbol?: string;
  closeSymbol?: string;
  color?: string;
  size?: number;
  opacity?: number;
  openX?: number;
  openY?: number;
  closeX?: number;
  closeY?: number;
}

export interface PosterTitleProps {
  lines: PosterTitleLine[];
  className?: string;
  align?: PosterTitleAlign;
  kicker?: string;
  maxWidth?: number | string;
  handDrawn?: boolean;
  symbols?: PosterTitleSymbol[];
  emojis?: PosterTitleEmoji[];
  quote?: boolean | PosterTitleQuoteDecoration;
  adaptive?: boolean;
}

const sizeEmMap: Record<NonNullable<PosterTitleLine['size']>, number> = {
  sm: 0.88,
  md: 1.02,
  lg: 1.16,
  xl: 1.32,
};

const symbolTextMap: Record<PosterTitleSymbolKind, string> = {
  'quote-open': '“',
  'quote-close': '”',
  arrow: '→',
  heart: '♥',
  star: '★',
  spark: '✦',
  curve: '',
  swirl: '',
  dash: '',
};

function renderSymbol(symbol: PosterTitleSymbol, i: number) {
  const commonStyle: React.CSSProperties = {
    left: `${symbol.x}%`,
    top: `${symbol.y}%`,
    transform: `translate(-50%, -50%) rotate(${symbol.rotate ?? 0}deg)`,
    color: symbol.color ?? 'hsl(24 36% 35% / 0.78)',
    opacity: symbol.opacity ?? 1,
  };

  if (symbol.kind === 'curve' || symbol.kind === 'swirl' || symbol.kind === 'dash') {
    const size = symbol.size ?? 24;
    if (symbol.kind === 'curve') {
      return (
        <svg
          key={`${symbol.kind}-${i}`}
          className="absolute pointer-events-none"
          viewBox="0 0 100 44"
          width={size}
          height={size * 0.44}
          style={commonStyle}
          aria-hidden
        >
          <path
            d="M6 30 C24 6, 42 6, 58 30 S 84 42, 96 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
    if (symbol.kind === 'swirl') {
      return (
        <svg
          key={`${symbol.kind}-${i}`}
          className="absolute pointer-events-none"
          viewBox="0 0 100 100"
          width={size}
          height={size}
          style={commonStyle}
          aria-hidden
        >
          <path
            d="M8 10
               C26 14 41 25 50 41
               C59 57 56 71 44 77
               C31 83 18 74 18 60
               C18 45 35 42 50 49
               C65 56 77 72 88 96"
            fill="none"
            stroke="currentColor"
            strokeWidth="6.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 58
               C33 49 44 49 51 55"
            fill="none"
            stroke="currentColor"
            strokeWidth="5.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.92"
          />
        </svg>
      );
    }
    return (
      <svg
        key={`${symbol.kind}-${i}`}
        className="absolute pointer-events-none"
        viewBox="0 0 100 20"
        width={size}
        height={size * 0.2}
        style={commonStyle}
        aria-hidden
      >
        <path
          d="M8 12 H92"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const glyph = symbolTextMap[symbol.kind];
  return (
    <span
      key={`${symbol.kind}-${i}`}
      className="absolute pointer-events-none select-none leading-none"
      style={{
        ...commonStyle,
        fontSize: `${symbol.size ?? 24}px`,
      }}
      aria-hidden
    >
      {glyph}
    </span>
  );
}

function clampPercent(v: number, min = 4, max = 96): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function PosterTitle({
  lines,
  className,
  align = 'center',
  kicker,
  maxWidth,
  handDrawn = true,
  symbols = [],
  emojis = [],
  quote = true,
  adaptive = true,
}: PosterTitleProps) {
  const quoteConfig: PosterTitleQuoteDecoration | null = quote
    ? (typeof quote === 'object' ? quote : {})
    : null;
  const hasCustomOpenQuote = typeof quote === 'object' && (quote.openX !== undefined || quote.openY !== undefined);
  const hasCustomCloseQuote = typeof quote === 'object' && (quote.closeX !== undefined || quote.closeY !== undefined);
  const useAnchoredDefaultQuotes = !!quoteConfig && !hasCustomOpenQuote && !hasCustomCloseQuote;
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lineGroupRef = useRef<HTMLDivElement>(null);
  const [contentScale, setContentScale] = useState(1);
  const [rootSize, setRootSize] = useState({ width: 0, height: 0 });
  const [layoutMetrics, setLayoutMetrics] = useState<{
    contentW: number;
    contentH: number;
    textRect: { x: number; y: number; w: number; h: number } | null;
  }>({
    contentW: 0,
    contentH: 0,
    textRect: null,
  });

  const adaptiveMetrics = useMemo(() => {
    const width = rootSize.width || 200;
    const height = rootSize.height || 140;
    const shortSide = Math.min(width, height);
    const compact = adaptive && (width < 220 || height < 145);
    const spacious = adaptive && (width > 320 && height > 220);
    const fontScale = compact ? 0.9 : (spacious ? 1.06 : 1);
    const lineHeight = compact ? 1.22 : (spacious ? 1.15 : 1.18);
    const lineGapEm = compact ? 0.22 : (spacious ? 0.3 : 0.26);
    const tokenGapEm = compact ? 0.24 : (spacious ? 0.34 : 0.3);
    const padX = Math.max(6, Math.min(16, shortSide * 0.08));
    const padY = Math.max(4, Math.min(12, shortSide * 0.05));
    // Honor explicit left alignment even in adaptive/compact mode.
    const resolvedTextAlign: PosterTitleAlign =
      align === 'left'
        ? 'left'
        : (compact ? 'center' : align);
    const resolvedBlockAlign: PosterTitleAlign = resolvedTextAlign;
    return {
      fontScale,
      lineHeight,
      lineGapEm,
      tokenGapEm,
      padX,
      padY,
      textAlign: resolvedTextAlign,
      blockAlign: resolvedBlockAlign,
    };
  }, [adaptive, align, rootSize.height, rootSize.width]);

  const resolvedSymbols = useMemo(() => {
    const next = symbols.map((s) => ({ ...s }));
    const { contentW, contentH, textRect } = layoutMetrics;
    if (next.length === 0 || contentW <= 0 || contentH <= 0) return next;

    const getSymbolSizePercent = (symbol: PosterTitleSymbol) => {
      const sizePx = symbol.size ?? 24;
      const ratio = symbol.kind === 'curve' ? 0.44 : symbol.kind === 'swirl' ? 1 : symbol.kind === 'dash' ? 0.2 : 1;
      const w = (sizePx / contentW) * 100 + 1.5;
      const h = ((sizePx * ratio) / contentH) * 100 + 1.5;
      return { w, h };
    };

    const overlaps = (
      a: { x: number; y: number; w: number; h: number },
      b: { x: number; y: number; w: number; h: number }
    ) => (
      Math.abs(a.x - b.x) < (a.w + b.w) / 2
      && Math.abs(a.y - b.y) < (a.h + b.h) / 2
    );

    const nonQuote = (kind: PosterTitleSymbolKind) => kind !== 'quote-open' && kind !== 'quote-close';

    // First pass: keep doodles away from text area.
    for (let i = 0; i < next.length; i += 1) {
      const s = next[i];
      if (!nonQuote(s.kind)) continue;
      const sSize = getSymbolSizePercent(s);
      let box = { x: s.x, y: s.y, w: sSize.w, h: sSize.h };

      if (textRect) {
        const textBox = {
          x: textRect.x + textRect.w / 2,
          y: textRect.y + textRect.h / 2,
          w: textRect.w + 4,
          h: textRect.h + 4,
        };
        for (let attempt = 0; attempt < 5 && overlaps(box, textBox); attempt += 1) {
          const moveX = box.x < textBox.x ? -7 : 7;
          const moveY = box.y < textBox.y ? -6 : 6;
          s.x = clampPercent(s.x + moveX);
          s.y = clampPercent(s.y + moveY);
          box = { ...box, x: s.x, y: s.y };
        }
      }
    }

    // Second pass: avoid doodle-doodle overlap.
    for (let i = 0; i < next.length; i += 1) {
      if (!nonQuote(next[i].kind)) continue;
      for (let j = 0; j < i; j += 1) {
        if (!nonQuote(next[j].kind)) continue;
        const aSize = getSymbolSizePercent(next[i]);
        const bSize = getSymbolSizePercent(next[j]);
        const a = { x: next[i].x, y: next[i].y, w: aSize.w + 1, h: aSize.h + 1 };
        const b = { x: next[j].x, y: next[j].y, w: bSize.w + 1, h: bSize.h + 1 };
        if (!overlaps(a, b)) continue;

        const dx = a.x >= b.x ? 6 : -6;
        const dy = a.y >= b.y ? 4 : -4;
        next[i].x = clampPercent(next[i].x + dx);
        next[i].y = clampPercent(next[i].y + dy);
      }
    }

    return next;
  }, [layoutMetrics, symbols]);

  const resolvedQuoteLayout = useMemo(() => {
    if (!quoteConfig) return null;
    if (useAnchoredDefaultQuotes) {
      return {
        openX: quoteConfig.openX ?? 8,
        openY: quoteConfig.openY ?? 14,
        closeX: quoteConfig.closeX ?? 94,
        closeY: quoteConfig.closeY ?? 84,
        size: quoteConfig.size ?? 46,
      };
    }
    const quoteOverrides = typeof quote === 'object' ? quote : null;

    const base = {
      openX: quoteConfig.openX ?? 8,
      openY: quoteConfig.openY ?? 14,
      closeX: quoteConfig.closeX ?? 94,
      closeY: quoteConfig.closeY ?? 84,
      size: quoteConfig.size ?? 46,
    };

    const { contentW, contentH, textRect } = layoutMetrics;
    if (!textRect || contentW <= 0 || contentH <= 0) return base;

    const quoteW = Math.max(2.2, ((base.size * 0.72) / contentW) * 100 + 1.2);
    const quoteH = Math.max(2.2, (base.size / contentH) * 100 + 1.2);
    const halfW = quoteW / 2;
    const halfH = quoteH / 2;
    const clampX = (v: number) => clampPercent(v, 2 + halfW, 98 - halfW);
    const clampY = (v: number) => clampPercent(v, 2 + halfH, 98 - halfH);
    const textLeft = textRect.x;
    const textTop = textRect.y;
    const textRight = textRect.x + textRect.w;
    const textBottom = textRect.y + textRect.h;
    const sideGap = quoteW * 0.72 + 0.8;
    const verticalGap = quoteH * 0.72 + 0.8;
    const textBox = {
      x: textLeft + textRect.w / 2,
      y: textTop + textRect.h / 2,
      w: textRect.w + 4,
      h: textRect.h + 5,
    };
    const overlapText = (x: number, y: number) => (
      Math.abs(x - textBox.x) < (quoteW + textBox.w) / 2
      && Math.abs(y - textBox.y) < (quoteH + textBox.h) / 2
    );

    const hasCustomOpen = !!quoteOverrides && (quoteOverrides.openX !== undefined || quoteOverrides.openY !== undefined);
    const hasCustomClose = !!quoteOverrides && (quoteOverrides.closeX !== undefined || quoteOverrides.closeY !== undefined);

    // Default layout: open quote at top-left of text block.
    let openX = hasCustomOpen ? clampX(base.openX) : clampX(textLeft - sideGap);
    let openY = hasCustomOpen ? clampY(base.openY) : clampY(textTop - verticalGap);
    if (!hasCustomOpen) {
      openX = clampX(Math.min(openX, textLeft - quoteW * 0.2));
      openY = clampY(Math.min(openY, textTop - quoteH * 0.2));
    }
    if (overlapText(openX, openY)) {
      openX = clampX(lerp(openX, textLeft - sideGap, 0.9));
      openY = clampY(lerp(openY, textTop - verticalGap, 0.9));
    }

    // Default layout: close quote at bottom-right of text block.
    let closeX = hasCustomClose ? clampX(base.closeX) : clampX(textRight + sideGap);
    let closeY = hasCustomClose ? clampY(base.closeY) : clampY(textBottom + verticalGap);
    if (!hasCustomClose) {
      closeX = clampX(Math.max(closeX, textRight + quoteW * 0.2));
      closeY = clampY(Math.max(closeY, textBottom + quoteH * 0.2));
    }
    if (overlapText(closeX, closeY)) {
      closeX = clampX(lerp(closeX, textRight + sideGap, 0.9));
      closeY = clampY(lerp(closeY, textBottom + verticalGap, 0.9));
    }

    // Final safety nudge for very tight containers.
    for (let i = 0; i < 3 && (overlapText(openX, openY) || openY >= textTop); i += 1) {
      openX = clampX(openX - 2.5);
      openY = clampY(openY - 2.5);
    }
    for (let i = 0; i < 3 && (overlapText(closeX, closeY) || closeY <= textBottom); i += 1) {
      closeX = clampX(closeX + 2.5);
      closeY = clampY(closeY + 2.5);
    }

    return { ...base, openX, openY, closeX, closeY };
  }, [layoutMetrics, quote, quoteConfig, useAnchoredDefaultQuotes]);

  const fitContent = useCallback(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    if (!root || !content) return;

    const availableWidth = Math.max(1, root.clientWidth - 8);
    const availableHeight = Math.max(1, root.clientHeight - 8);
    const naturalWidth = Math.max(1, content.scrollWidth);
    const naturalHeight = Math.max(1, content.scrollHeight);

    const scaleX = availableWidth / naturalWidth;
    const scaleY = availableHeight / naturalHeight;
    const nextScale = Math.min(1, scaleX, scaleY);

    setContentScale((prev) => (Math.abs(prev - nextScale) > 0.01 ? nextScale : prev));
  }, []);

  useLayoutEffect(() => {
    fitContent();
    const observer = new ResizeObserver(() => fitContent());
    if (rootRef.current) observer.observe(rootRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [fitContent, lines, kicker, align, handDrawn, quote, symbols, emojis]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => {
      setRootSize((prev) => {
        const nextWidth = root.clientWidth;
        const nextHeight = root.clientHeight;
        if (Math.abs(prev.width - nextWidth) < 1 && Math.abs(prev.height - nextHeight) < 1) return prev;
        return { width: nextWidth, height: nextHeight };
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const content = contentRef.current;
    const linesNode = lineGroupRef.current;
    if (!content || !linesNode) return;

    const update = () => {
      const cRect = content.getBoundingClientRect();
      const lRect = linesNode.getBoundingClientRect();
      if (cRect.width <= 0 || cRect.height <= 0) return;

      const x = ((lRect.left - cRect.left) / cRect.width) * 100;
      const y = ((lRect.top - cRect.top) / cRect.height) * 100;
      const w = (lRect.width / cRect.width) * 100;
      const h = (lRect.height / cRect.height) * 100;

      setLayoutMetrics((prev) => {
        const next = {
          contentW: cRect.width,
          contentH: cRect.height,
          textRect: { x, y, w, h },
        };
        const same =
          Math.abs(prev.contentW - next.contentW) < 0.8
          && Math.abs(prev.contentH - next.contentH) < 0.8
          && prev.textRect
          && Math.abs(prev.textRect.x - next.textRect.x) < 0.8
          && Math.abs(prev.textRect.y - next.textRect.y) < 0.8
          && Math.abs(prev.textRect.w - next.textRect.w) < 0.8
          && Math.abs(prev.textRect.h - next.textRect.h) < 0.8;
        return same ? prev : next;
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(content);
    observer.observe(linesNode);
    return () => observer.disconnect();
  }, [lines, contentScale, adaptiveMetrics.fontScale, adaptiveMetrics.lineHeight]);

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative w-full h-full max-w-full flex flex-col justify-center overflow-hidden',
        adaptiveMetrics.blockAlign === 'left' ? 'items-start' : 'items-center',
        adaptiveMetrics.textAlign === 'left' ? 'text-left' : 'text-center',
        handDrawn ? 'font-hand' : 'font-craft',
        className,
      )}
      style={{ maxWidth, paddingLeft: adaptiveMetrics.padX, paddingRight: adaptiveMetrics.padX, paddingTop: adaptiveMetrics.padY, paddingBottom: adaptiveMetrics.padY }}
    >
      {kicker && (
        <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-ink-stroke/70 font-craft">{kicker}</p>
      )}

      <div
        ref={contentRef}
        className="relative max-w-[96%]"
        style={{
          width: 'fit-content',
          transform: `scale(${contentScale})`,
          transformOrigin: adaptiveMetrics.blockAlign === 'left' ? 'left center' : 'center center',
        }}
      >
        {quoteConfig && !useAnchoredDefaultQuotes && resolvedQuoteLayout && (
          <>
            <span
              className="absolute z-[2] pointer-events-none select-none leading-none"
              style={{
                left: `${resolvedQuoteLayout.openX}%`,
                top: `${resolvedQuoteLayout.openY}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${resolvedQuoteLayout.size}px`,
                color: quoteConfig.color ?? 'hsl(24 36% 35% / 0.5)',
                opacity: quoteConfig.opacity ?? 0.85,
              }}
              aria-hidden
            >
              {quoteConfig.openSymbol ?? '“'}
            </span>
            <span
              className="absolute z-[2] pointer-events-none select-none leading-none"
              style={{
                left: `${resolvedQuoteLayout.closeX}%`,
                top: `${resolvedQuoteLayout.closeY}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${resolvedQuoteLayout.size}px`,
                color: quoteConfig.color ?? 'hsl(24 36% 35% / 0.5)',
                opacity: quoteConfig.opacity ?? 0.85,
              }}
              aria-hidden
            >
              {quoteConfig.closeSymbol ?? '”'}
            </span>
          </>
        )}

        <div ref={lineGroupRef} className="relative z-[1]" style={{ display: 'grid', rowGap: `${adaptiveMetrics.lineGapEm}em` }}>
          {quoteConfig && useAnchoredDefaultQuotes && (
            <>
              <span
                className="absolute z-[2] pointer-events-none select-none leading-none"
                style={{
                  left: '0%',
                  top: '0%',
                  transform: 'translate(-62%, -78%)',
                  fontSize: `${quoteConfig.size ?? 46}px`,
                  color: quoteConfig.color ?? 'hsl(24 36% 35% / 0.5)',
                  opacity: quoteConfig.opacity ?? 0.85,
                }}
                aria-hidden
              >
                {quoteConfig.openSymbol ?? '“'}
              </span>
              <span
                className="absolute z-[2] pointer-events-none select-none leading-none"
                style={{
                  right: '0%',
                  bottom: '0%',
                  transform: 'translate(62%, 86%)',
                  fontSize: `${quoteConfig.size ?? 46}px`,
                  color: quoteConfig.color ?? 'hsl(24 36% 35% / 0.5)',
                  opacity: quoteConfig.opacity ?? 0.85,
                }}
                aria-hidden
              >
                {quoteConfig.closeSymbol ?? '”'}
              </span>
            </>
          )}
          {lines.map((line, lineIndex) => {
            const lineSizeEm = sizeEmMap[line.size ?? 'md'] * adaptiveMetrics.fontScale;
            return (
              <p
                key={`line-${lineIndex}`}
                className="text-ink-stroke"
                style={{
                  fontSize: `${lineSizeEm}em`,
                  fontWeight: line.weight ?? 650,
                  lineHeight: adaptiveMetrics.lineHeight,
                  letterSpacing: line.trackingEm ? `${line.trackingEm}em` : undefined,
                  marginTop: line.gapBeforeEm ? `${line.gapBeforeEm}em` : undefined,
                  whiteSpace: 'nowrap',
                  wordBreak: 'keep-all',
                }}
              >
                {line.tokens.map((token, tokenIndex) => {
                  const hasLeadSpace = /^\s+/.test(token.text);
                  const tokenUseInlineBlock = token.rotate !== undefined;
                  const trimmedTokenText = token.text.trim();
                  const isEmojiToken = /^[\p{Extended_Pictographic}\uFE0F\u200D]+$/u.test(trimmedTokenText);
                  const needsTokenGap = token.highlight || isEmojiToken;
                  const highlightStyle = token.highlightStyle ?? 'full';
                  const isLowerHighlight = token.highlight && highlightStyle === 'lower';
                  const highlightColor = token.highlightColor ?? 'hsl(52 98% 74% / 0.95)';
                  return (
                    <React.Fragment key={`token-${lineIndex}-${tokenIndex}`}>
                      {hasLeadSpace ? ' ' : null}
                      <span
                        className={cn(
                          tokenUseInlineBlock ? 'inline-block' : 'inline',
                          'whitespace-nowrap',
                          token.highlight && !isLowerHighlight && 'rounded-[0.34em] px-[0.18em] pb-[0.03em] shadow-[0_1.8px_0_rgba(0,0,0,0.13)] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]',
                        )}
                        style={{
                          color: token.textColor,
                          backgroundColor: token.highlight && !isLowerHighlight ? highlightColor : undefined,
                          backgroundImage: isLowerHighlight
                            ? `linear-gradient(to top, ${highlightColor} 0%, ${highlightColor} 35%, transparent 35%, transparent 100%)`
                            : undefined,
                          borderRadius: isLowerHighlight ? '0.2em' : undefined,
                          paddingLeft: isLowerHighlight ? '0.05em' : undefined,
                          paddingRight: isLowerHighlight ? '0.05em' : undefined,
                          transform: token.rotate ? `rotate(${token.rotate}deg)` : undefined,
                          marginLeft: needsTokenGap && tokenIndex > 0 ? `${adaptiveMetrics.tokenGapEm}em` : undefined,
                          marginRight: needsTokenGap && tokenIndex < line.tokens.length - 1 ? `${adaptiveMetrics.tokenGapEm}em` : undefined,
                        }}
                      >
                        {token.text.trimStart()}
                      </span>
                    </React.Fragment>
                  );
                })}
              </p>
            );
          })}
        </div>

        {resolvedSymbols.map((symbol, i) => renderSymbol(symbol, i))}

        {emojis.map((emoji, i) => (
          <span
            key={`${emoji.value}-${i}`}
            className="absolute pointer-events-none select-none leading-none"
            style={{
              left: `${emoji.x}%`,
              top: `${emoji.y}%`,
              transform: `translate(-50%, -50%) rotate(${emoji.rotate ?? 0}deg)`,
              fontSize: `${emoji.size ?? 22}px`,
            }}
            aria-hidden
          >
            {emoji.value}
          </span>
        ))}
      </div>
    </div>
  );
}

export default PosterTitle;
