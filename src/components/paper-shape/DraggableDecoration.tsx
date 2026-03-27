/**
 * Draggable, rotatable, scalable decoration wrapper for use inside SVG.
 * Uses dnd-kit for drag and pointer controls for rotate/scale/remove.
 */
import React, { useCallback, useId, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { DecorationItem, DecorationTransform } from './decorations';
import { StapleSVG, WashiTapeSVG, StickerSVG } from './DecorationRenderer';

interface DraggableDecorationProps {
  item: DecorationItem;
  onChange: (id: string, transform: DecorationTransform) => void;
  onRemove: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
  interactive?: boolean; // false for static display
}

export const DraggableDecoration: React.FC<DraggableDecorationProps> = ({
  item, onChange, onRemove, selected = false, onSelect, interactive = true,
}) => {
  const uid = useId().replace(/:/g, '');
  const { type, variant, transform } = item;
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: item.id,
    disabled: !interactive,
  });

  const bounds = useMemo(() => {
    if (type === 'washi-tape') return { w: 80 * transform.scale, h: 22 * transform.scale };
    if (type === 'staple') return { w: 28 * transform.scale, h: 10 * transform.scale };
    return { w: 24 * transform.scale, h: 24 * transform.scale };
  }, [type, transform.scale]);

  const rotate = useCallback((delta: number) => {
    onChange(item.id, { ...transform, rotation: transform.rotation + delta });
  }, [item.id, transform, onChange]);

  const scale = useCallback((delta: number) => {
    const newScale = Math.max(0.3, Math.min(3, transform.scale + delta));
    onChange(item.id, { ...transform, scale: newScale });
  }, [item.id, transform, onChange]);

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
    <g transform={`translate(${transform.x}, ${transform.y}) rotate(${transform.rotation}, ${bounds.w / 2}, ${bounds.h / 2})`}>
      <g
        data-decoration-id={item.id}
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={{ cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default', touchAction: 'none', outline: 'none' }}
        onPointerDownCapture={() => { if (interactive) onSelect?.(item.id); }}
        onFocus={() => { if (interactive) onSelect?.(item.id); }}
        onClick={(e) => { if (interactive) { e.stopPropagation(); onSelect?.(item.id); } }}
      >
        {renderContent()}
      </g>

      {interactive && selected && !isDragging && (
        <g className="decoration-controls" data-export-ignore="true" data-decoration-id={item.id}>
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
            opacity={0.7}
          />
          <g transform={`translate(${bounds.w + 8}, -4)`} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); rotate(15); }}>
            <circle r={7} fill="hsl(210, 80%, 60%)" opacity={0.9} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={9} fill="white">↻</text>
          </g>
          <g transform={`translate(${bounds.w + 8}, 12)`} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); scale(0.15); }}>
            <circle r={7} fill="hsl(160, 50%, 50%)" opacity={0.9} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={10} fill="white">+</text>
          </g>
          <g transform={`translate(${bounds.w + 8}, 28)`} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); scale(-0.15); }}>
            <circle r={7} fill="hsl(12, 60%, 58%)" opacity={0.9} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={10} fill="white">−</text>
          </g>
          <g transform="translate(-4, -4)" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}>
            <circle r={7} fill="hsl(0, 70%, 55%)" opacity={0.9} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={9} fill="white">✕</text>
          </g>
        </g>
      )}
    </g>
  );
};
