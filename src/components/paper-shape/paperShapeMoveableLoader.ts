import React from 'react';

type MoveableLikeComponent = React.ComponentType<Record<string, unknown>>;

let moveableResolved: MoveableLikeComponent | null | undefined;
let moveableLoadingPromise: Promise<MoveableLikeComponent | null> | null = null;

export function getResolvedPaperShapeMoveable(): MoveableLikeComponent | null | undefined {
  return moveableResolved;
}

export async function loadPaperShapeMoveable(): Promise<MoveableLikeComponent | null> {
  if (moveableResolved !== undefined) return Promise.resolve(moveableResolved);
  if (moveableLoadingPromise) return moveableLoadingPromise;

  moveableLoadingPromise = (async () => {
    try {
      const mod = await import('react-moveable');
      const resolved = (mod as { default?: MoveableLikeComponent }).default ?? null;
      moveableResolved = resolved;
      return resolved;
    } catch (err) {
      if (typeof window !== 'undefined') {
        console.warn('[PaperShape] react-moveable load failed, decoration handles disabled.', err);
      }
      moveableResolved = null;
      return null;
    }
  })();

  try {
    return await moveableLoadingPromise;
  } finally {
    moveableLoadingPromise = null;
  }
}

export function preloadPaperShapeMoveable(): void {
  void loadPaperShapeMoveable();
}

