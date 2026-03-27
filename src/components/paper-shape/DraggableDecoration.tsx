/**
 * Draggable, rotatable, scalable decoration wrapper for use inside SVG or as HTML overlay.
 * Uses pointer events for drag, scroll/buttons for rotate & scale.
 */
import React, { useState, useCallback, useRef, useId } from 'react';
import type { DecorationItem, DecorationTransform } from './decorations';
import { StapleSVG, WashiTapeSVG, StickerSVG } from './DecorationRenderer';

interface DraggableDecorationProps {
  item: DecorationItem;
  onChange: (id: string, transform: DecorationTransform) => void;
  onRemove: (id: string) => void;
  interactive?: boolean; // false for static display
  containerRef?: React.RefObject<SVGSVGElement | null>;
}

export const DraggableDecoration: React.FC<DraggableDecorationProps> = ({
  item, onChange, onRemove, interactive = true, containerRef,
}) => {
  const uid = useId().replace(/:/g, '');
  const { type, variant, transform } = item;
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!interactive) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    setSelected(true);
    setDragging(false);

    // Get SVG coordinate transform
    const svg = containerRef?.current;
    let mx = e.clientX, my = e.clientY;
    if (svg) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM()?.inverse();
      if (ctm) {
        const svgPt = pt.matrixTransform(ctm);
        mx = svgPt.x;
        my = svgPt.y;
      }
    }

    dragStart.current = { mx, my, ox: transform.x, oy: transform.y };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }, [interactive, transform.x, transform.y, containerRef]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    e.stopPropagation();

    const svg = containerRef?.current;
    let mx = e.clientX, my = e.clientY;
    if (svg) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM()?.inverse();
      if (ctm) {
        const svgPt = pt.matrixTransform(ctm);
        mx = svgPt.x;
        my = svgPt.y;
      }
    }

    const dx = mx - dragStart.current.mx;
    const dy = my - dragStart.current.my;
    const moved = Math.hypot(dx, dy) > 1;
    if (!moved) return;
    if (!dragging) setDragging(true);

    onChange(item.id, {
      ...transform,
      x: dragStart.current.ox + dx,
      y: dragStart.current.oy + dy,
    });
  }, [dragging, item.id, transform, onChange, containerRef]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    if ((e.currentTarget as Element).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    }
    setDragging(false);
    dragStart.current = null;
  }, [interactive]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    if ((e.currentTarget as Element).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    }
    setDragging(false);
    dragStart.current = null;
  }, []);

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
    <g
      transform={`translate(${transform.x}, ${transform.y}) rotate(${transform.rotation})`}
    >
      <g
        style={{ cursor: interactive ? (dragging ? 'grabbing' : 'grab') : 'default' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={(e) => { if (interactive) { e.stopPropagation(); setSelected(true); } }}
      >
        {renderContent()}
      </g>

      {/* Selection controls */}
      {interactive && selected && !dragging && (
        <g className="decoration-controls">
          {/* Selection outline */}
          <rect
            x={-4} y={-4}
            width={type === 'washi-tape' ? 80 * transform.scale + 8 : (type === 'staple' ? 28 * transform.scale + 8 : 24 * transform.scale + 8)}
            height={type === 'washi-tape' ? 22 * transform.scale + 8 : (type === 'staple' ? 10 * transform.scale + 8 : 24 * transform.scale + 8)}
            fill="none" stroke="hsl(210, 80%, 60%)" strokeWidth={1} strokeDasharray="3 2" rx={3} opacity={0.7}
          />
          {/* Rotate button */}
          <g
            transform={`translate(${type === 'washi-tape' ? 80 * transform.scale + 8 : (type === 'staple' ? 28 * transform.scale + 8 : 24 * transform.scale + 8)}, -4)`}
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); rotate(15); }}
          >
            <circle r={7} fill="hsl(210, 80%, 60%)" opacity={0.9} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={9} fill="white">↻</text>
          </g>
          {/* Scale up button */}
          <g
            transform={`translate(${type === 'washi-tape' ? 80 * transform.scale + 8 : (type === 'staple' ? 28 * transform.scale + 8 : 24 * transform.scale + 8)}, 12)`}
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); scale(0.15); }}
          >
            <circle r={7} fill="hsl(160, 50%, 50%)" opacity={0.9} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={10} fill="white">+</text>
          </g>
          {/* Scale down button */}
          <g
            transform={`translate(${type === 'washi-tape' ? 80 * transform.scale + 8 : (type === 'staple' ? 28 * transform.scale + 8 : 24 * transform.scale + 8)}, 28)`}
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); scale(-0.15); }}
          >
            <circle r={7} fill="hsl(12, 60%, 58%)" opacity={0.9} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={10} fill="white">−</text>
          </g>
          {/* Delete button */}
          <g
            transform="translate(-4, -4)"
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
          >
            <circle r={7} fill="hsl(0, 70%, 55%)" opacity={0.9} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={9} fill="white">✕</text>
          </g>
        </g>
      )}
    </g>
  );
};
