import type { DecorationItem } from '@/components/paper-shape/decorations';
import type { PaperPreset, PresetParams } from '@/components/paper-shape/geometry';
import type { PaperPatternType, PatternParams } from '@/components/paper-shape';

export interface PaperShapeShareState {
  preset: PaperPreset;
  layoutMode?: 'fixed' | 'content' | 'fill';
  width: number;
  height: number;
  seed: number;
  roughness: number;
  paperColor: string;
  strokeColor?: string;
  strokeWidth: number;
  contentPadding?: number;
  patternType: PaperPatternType;
  patternParams?: PatternParams;
  presetParams?: PresetParams;
  decorations?: DecorationItem[];
}

function toBase64Url(input: string): string {
  const b64 = btoa(unescape(encodeURIComponent(input)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  return decodeURIComponent(escape(atob(`${b64}${pad}`)));
}

export function encodeShareState(state: PaperShapeShareState): string {
  return toBase64Url(JSON.stringify(state));
}

export function decodeShareState(encoded: string | null): Partial<PaperShapeShareState> | null {
  if (!encoded) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(encoded));
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Partial<PaperShapeShareState>;
  } catch (_e) {
    return null;
  }
}
