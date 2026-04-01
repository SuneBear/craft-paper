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

export type PosterTitleSymbolKind = 'quote-open' | 'quote-close' | 'arrow' | 'heart' | 'star' | 'spark';

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
};

function renderSymbol(symbol: PosterTitleSymbol, i: number) {
  const glyph = symbolTextMap[symbol.kind];
  return (
    <span
      key={`${symbol.kind}-${i}`}
      className="absolute pointer-events-none select-none leading-none"
      style={{
        left: `${symbol.x}%`,
        top: `${symbol.y}%`,
        transform: `translate(-50%, -50%) rotate(${symbol.rotate ?? 0}deg)`,
        color: symbol.color ?? 'hsl(24 36% 35% / 0.78)',
        fontSize: `${symbol.size ?? 24}px`,
        opacity: symbol.opacity ?? 1,
      }}
      aria-hidden
    >
      {glyph}
    </span>
  );
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
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentScale, setContentScale] = useState(1);
  const [rootSize, setRootSize] = useState({ width: 0, height: 0 });

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
    const resolvedTextAlign: PosterTitleAlign = compact ? 'center' : align;
    // Keep copy left-aligned when needed, but center the whole text block in adaptive mode.
    const resolvedBlockAlign: PosterTitleAlign =
      adaptive && align === 'left'
        ? 'center'
        : resolvedTextAlign;
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
        {quoteConfig && (
          <>
            <span
              className="absolute pointer-events-none select-none leading-none"
              style={{
                left: `${quoteConfig.openX ?? 8}%`,
                top: `${quoteConfig.openY ?? 14}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${quoteConfig.size ?? 46}px`,
                color: quoteConfig.color ?? 'hsl(24 36% 35% / 0.5)',
                opacity: quoteConfig.opacity ?? 0.85,
              }}
              aria-hidden
            >
              {quoteConfig.openSymbol ?? '“'}
            </span>
            <span
              className="absolute pointer-events-none select-none leading-none"
              style={{
                left: `${quoteConfig.closeX ?? 94}%`,
                top: `${quoteConfig.closeY ?? 84}%`,
                transform: 'translate(-50%, -50%)',
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

        <div className="relative z-[1]" style={{ display: 'grid', rowGap: `${adaptiveMetrics.lineGapEm}em` }}>
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

        {symbols.map((symbol, i) => renderSymbol(symbol, i))}

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
