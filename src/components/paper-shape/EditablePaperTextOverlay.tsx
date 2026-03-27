import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type TextAlignMode = 'left' | 'center' | 'right';

export interface EditablePaperTextState {
  enabled: boolean;
  title: string;
  subtitle: string;
  emoji: string;
  x: number;
  y: number;
  titleSize: number;
  subtitleSize: number;
  fontWeight: number;
  align: TextAlignMode;
  color: string;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function createDefaultEditableTextState(title: string, emoji: string): EditablePaperTextState {
  return {
    enabled: true,
    title,
    subtitle: '',
    emoji,
    x: 0,
    y: 0,
    titleSize: 38,
    subtitleSize: 14,
    fontWeight: 600,
    align: 'center',
    color: 'hsl(24, 36%, 35%)',
  };
}

interface EditablePaperTextOverlayProps {
  value: EditablePaperTextState;
  onChange: (next: EditablePaperTextState) => void;
}

const alignCycle: TextAlignMode[] = ['left', 'center', 'right'];

export function EditablePaperTextOverlay({ value, onChange }: EditablePaperTextOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    if (value.enabled) return;
    setSelected(false);
  }, [value.enabled]);

  useEffect(() => {
    const onDocPointerDown = (event: PointerEvent) => {
      if (!selected) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!rootRef.current?.contains(target)) {
        setSelected(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [selected]);

  const setPartial = useCallback((patch: Partial<EditablePaperTextState>) => {
    onChange({ ...value, ...patch });
  }, [onChange, value]);

  useEffect(() => {
    if (!titleRef.current) return;
    if (document.activeElement === titleRef.current) return;
    if (titleRef.current.textContent !== value.title) {
      titleRef.current.textContent = value.title;
    }
  }, [value.title]);

  useEffect(() => {
    if (!subtitleRef.current) return;
    if (document.activeElement === subtitleRef.current) return;
    if (subtitleRef.current.textContent !== value.subtitle) {
      subtitleRef.current.textContent = value.subtitle;
    }
  }, [value.subtitle]);

  const handleDragStart = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setSelected(true);
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: value.x,
      originY: value.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [value.x, value.y]);

  const handleDragMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.active) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    setPartial({
      x: clamp(dragRef.current.originX + dx, -260, 260),
      y: clamp(dragRef.current.originY + dy, -180, 180),
    });
  }, [setPartial]);

  const handleDragEnd = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const nextAlign = useMemo(() => {
    const i = alignCycle.indexOf(value.align);
    return alignCycle[(i + 1) % alignCycle.length];
  }, [value.align]);
  const displayTitle = useMemo(() => {
    const raw = value.title || '';
    if (!value.emoji) return raw;
    if (!raw.startsWith(value.emoji)) return raw;
    return raw.slice(value.emoji.length).trimStart();
  }, [value.emoji, value.title]);

  if (!value.enabled) return null;

  return (
    <div ref={rootRef} className="absolute inset-0 pointer-events-none">
      <div
        ref={boxRef}
        className="absolute pointer-events-auto max-w-full"
        style={{
          left: `calc(50% + ${value.x}px)`,
          top: `calc(50% + ${value.y}px)`,
          transform: 'translate(-50%, -50%)',
          color: value.color,
          textAlign: value.align,
          width: 'min(86%, 320px)',
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          setSelected(true);
        }}
      >
        {selected && (
          <div className="absolute -top-9 left-0 flex items-center gap-1 px-1.5 py-1 rounded-md border border-border bg-background/95 shadow-sm whitespace-nowrap">
            <button
              type="button"
              className="h-6 min-w-8 px-2 rounded bg-muted text-[11px] font-craft leading-none whitespace-nowrap"
              title="拖拽移动"
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={handleDragEnd}
            >
              ↕
            </button>
            <button type="button" className="h-6 min-w-8 px-2 rounded bg-muted text-[11px] font-craft leading-none whitespace-nowrap" onClick={() => setPartial({ titleSize: Math.max(16, value.titleSize - 2) })}>A-</button>
            <button type="button" className="h-6 min-w-8 px-2 rounded bg-muted text-[11px] font-craft leading-none whitespace-nowrap" onClick={() => setPartial({ titleSize: Math.min(96, value.titleSize + 2) })}>A+</button>
            <button
              type="button"
              className="h-6 min-w-8 px-2 rounded bg-muted text-[11px] font-craft leading-none whitespace-nowrap"
              onClick={() => setPartial({ fontWeight: value.fontWeight >= 700 ? 500 : 700 })}
            >
              B
            </button>
            <button type="button" className="h-6 min-w-8 px-2 rounded bg-muted text-[11px] font-craft leading-none whitespace-nowrap" title={`对齐: ${value.align}`} onClick={() => setPartial({ align: nextAlign })}>
              ↔
            </button>
            <button type="button" className="h-6 min-w-8 px-2 rounded bg-muted text-[11px] font-craft leading-none whitespace-nowrap" onClick={() => setPartial({ enabled: false })}>
              ✕
            </button>
          </div>
        )}

        <div className={`rounded-md ${selected ? 'ring-1 ring-primary/45 bg-background/10' : ''} p-1`}>
          <div className="text-xl leading-none mb-0.5 select-none">{value.emoji}</div>
          <div
            ref={titleRef}
            contentEditable
            suppressContentEditableWarning
            className="outline-none whitespace-pre-wrap break-words"
            style={{
              fontSize: `${value.titleSize}px`,
              fontWeight: value.fontWeight,
              lineHeight: 1.1,
            }}
            onBlur={(e) => {
              const raw = (e.currentTarget.textContent || '').trim();
              const cleaned = value.emoji && raw.startsWith(value.emoji)
                ? raw.slice(value.emoji.length).trimStart()
                : raw;
              setPartial({ title: cleaned || value.title || '标题' });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
          >
            {displayTitle}
          </div>
          <div
            ref={subtitleRef}
            contentEditable
            suppressContentEditableWarning
            className="outline-none mt-1 whitespace-pre-wrap break-words opacity-85"
            style={{
              fontSize: `${value.subtitleSize}px`,
              lineHeight: 1.25,
            }}
            onBlur={(e) => {
              setPartial({ subtitle: (e.currentTarget.textContent || '').trim() });
            }}
          >
            {value.subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}
