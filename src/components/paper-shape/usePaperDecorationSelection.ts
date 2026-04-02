import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { DecorationItem, DecorationTransform } from './decorations';

interface UsePaperDecorationSelectionOptions {
  decorations: DecorationItem[];
  interactiveDecorations: boolean;
  onDecorationChange?: (id: string, transform: DecorationTransform) => void;
  onDecorationRemove?: (id: string) => void;
}

export interface PaperDecorationSelectionState {
  selectedDecorationId: string | null;
  selectedDecoration: DecorationItem | null;
  selectedDecorationTarget: SVGGElement | null;
  decorationTargetRefs: React.MutableRefObject<Record<string, SVGGElement | null>>;
  moveableOriginRef: React.MutableRefObject<DecorationTransform | null>;
  setSelectedDecorationId: React.Dispatch<React.SetStateAction<string | null>>;
  registerDecorationTarget: (id: string, node: SVGGElement | null) => void;
  handleDecoChange: (id: string, transform: DecorationTransform) => void;
  handleCanvasPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
}

export function usePaperDecorationSelection({
  decorations,
  interactiveDecorations,
  onDecorationChange,
  onDecorationRemove,
}: UsePaperDecorationSelectionOptions): PaperDecorationSelectionState {
  const decorationTargetRefs = useRef<Record<string, SVGGElement | null>>({});
  const moveableOriginRef = useRef<DecorationTransform | null>(null);
  const [selectedDecorationId, setSelectedDecorationId] = useState<string | null>(null);
  const [selectedDecorationTarget, setSelectedDecorationTarget] = useState<SVGGElement | null>(null);

  const handleDecoChange = useCallback((id: string, transform: DecorationTransform) => {
    onDecorationChange?.(id, transform);
  }, [onDecorationChange]);

  const handleDecoRemove = useCallback((id: string) => {
    onDecorationRemove?.(id);
  }, [onDecorationRemove]);

  const registerDecorationTarget = useCallback((id: string, node: SVGGElement | null) => {
    decorationTargetRefs.current[id] = node;
    if (id === selectedDecorationId) {
      setSelectedDecorationTarget(node);
    }
  }, [selectedDecorationId]);

  useEffect(() => {
    if (!selectedDecorationId) return;
    if (!decorations.some((d) => d.id === selectedDecorationId)) {
      setSelectedDecorationId(null);
    }
  }, [decorations, selectedDecorationId]);

  useEffect(() => {
    if (!selectedDecorationId) {
      setSelectedDecorationTarget(null);
      return;
    }
    setSelectedDecorationTarget(decorationTargetRefs.current[selectedDecorationId] ?? null);
  }, [selectedDecorationId, decorations]);

  useEffect(() => {
    const activeIds = new Set(decorations.map((d) => d.id));
    Object.keys(decorationTargetRefs.current).forEach((id) => {
      if (!activeIds.has(id)) delete decorationTargetRefs.current[id];
    });
  }, [decorations]);

  useEffect(() => {
    if (!interactiveDecorations || !selectedDecorationId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement
        && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        handleDecoRemove(selectedDecorationId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDecoRemove, interactiveDecorations, selectedDecorationId]);

  const selectedDecoration = selectedDecorationId
    ? decorations.find((d) => d.id === selectedDecorationId) ?? null
    : null;

  const handleCanvasPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactiveDecorations) return;
    const target = event.target;
    if (
      target instanceof Element
      && (
        target.closest('[data-decoration-id]')
        || target.closest('.moveable-control-box')
      )
    ) {
      return;
    }
    setSelectedDecorationId(null);
  }, [interactiveDecorations]);

  return {
    selectedDecorationId,
    selectedDecoration,
    selectedDecorationTarget,
    decorationTargetRefs,
    moveableOriginRef,
    setSelectedDecorationId,
    registerDecorationTarget,
    handleDecoChange,
    handleCanvasPointerDown,
  };
}
