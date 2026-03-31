/**
 * Decoration wrapper for SVG rendering.
 * Transform interactions are handled by react-moveable at the PaperShape level.
 */
import React, { useId, useMemo } from 'react';
import type { DecorationItem } from './decorations';
import { StapleSVG, WashiTapeSVG, StickerSVG } from './DecorationRenderer';

interface DraggableDecorationProps {
  item: DecorationItem;
  selected?: boolean;
  onSelect?: (id: string) => void;
  interactive?: boolean;
  registerTarget?: (id: string, node: SVGGElement | null) => void;
}

export const DraggableDecoration: React.FC<DraggableDecorationProps> = ({
  item,
  selected = false,
  onSelect,
  interactive = true,
  registerTarget,
}) => {
  const uid = useId().replace(/:/g, '');
  const { type, variant, transform } = item;

  const bounds = useMemo(() => {
    if (type === 'washi-tape') return { w: 80 * transform.scale, h: 22 * transform.scale };
    if (type === 'staple') return { w: 28 * transform.scale, h: 10 * transform.scale };
    return { w: 24 * transform.scale, h: 24 * transform.scale };
  }, [type, transform.scale]);

  const renderContent = () => {
    switch (type) {
      case 'staple':
        return <StapleSVG variant={variant} scale={transform.scale} />;
      case 'washi-tape':
        return <WashiTapeSVG variant={variant} scale={transform.scale} uid={uid} />;
      case 'sticker':
        return <StickerSVG variant={variant} scale={transform.scale} />;
    }
  };

  return (
    <g
      data-decoration-id={item.id}
      ref={(node) => registerTarget?.(item.id, node)}
      transform={`translate(${transform.x}, ${transform.y}) rotate(${transform.rotation}, ${bounds.w / 2}, ${bounds.h / 2})`}
      style={{ cursor: interactive ? 'move' : 'default', touchAction: 'none', outline: 'none' }}
      onPointerDownCapture={() => { if (interactive) onSelect?.(item.id); }}
      onFocus={() => { if (interactive) onSelect?.(item.id); }}
      onClick={(e) => { if (interactive) { e.stopPropagation(); onSelect?.(item.id); } }}
    >
      {renderContent()}
      {interactive && selected && (
        <rect
          x={-4}
          y={-4}
          width={bounds.w + 8}
          height={bounds.h + 8}
          fill="none"
          stroke="hsl(210, 80%, 60%)"
          strokeWidth={1}
          strokeDasharray="3 2"
          rx={3}
          opacity={0.55}
          pointerEvents="none"
        />
      )}
    </g>
  );
};
