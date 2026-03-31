import type { DecorationItem } from '@/components/paper-shape/decorations';
import type { PaperPreset, PresetParams } from '@/components/paper-shape/geometry';
import type { PaperPatternType, PatternParams } from '@/components/paper-shape/PaperShape';

export interface PaperShapeExportState {
  preset: PaperPreset;
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

export function toPaperShapeRecipe(state: PaperShapeExportState) {
  return {
    schemaVersion: 1,
    type: 'paper-shape-recipe',
    ...state,
  };
}

export function toPaperShapeJSX(state: PaperShapeExportState): string {
  const paramsStr = state.presetParams && Object.keys(state.presetParams).length > 0
    ? `\n  presetParams={${JSON.stringify(state.presetParams)}}`
    : '';
  const patternParamsStr = state.patternParams && Object.keys(state.patternParams).length > 0
    ? `\n  patternParams={${JSON.stringify(state.patternParams)}}`
    : '';
  const decoStr = state.decorations && state.decorations.length > 0
    ? `\n  decorations={${JSON.stringify(state.decorations, null, 2)}}`
    : '';
  const strokeColorStr = state.strokeColor ? `\n  strokeColor="${state.strokeColor}"` : '';

  return `<PaperShape
  preset="${state.preset}"
  width={${state.width}}
  height={${state.height}}
  seed={${state.seed}}
  roughness={${state.roughness.toFixed(2)}}
  paperColor="${state.paperColor}"${strokeColorStr}
  strokeWidth={${state.strokeWidth}}
  contentPadding={${state.contentPadding ?? 12}}
  patternType="${state.patternType}"
  showPattern={${state.patternType !== 'none'}}${patternParamsStr}${paramsStr}${decoStr}
/>`;
}

interface StandaloneComponentOptions {
  componentName?: string;
}

function escapeTemplateLiteral(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

function toSafeComponentName(raw: string): string {
  const words = raw
    .replace(/[^a-zA-Z0-9_$]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const pascal = words.map((w) => `${w[0].toUpperCase()}${w.slice(1)}`).join('');
  const base = pascal || 'PaperShapeAsset';
  return /^[A-Za-z_$]/.test(base) ? base : `PaperShape${base}`;
}

/**
 * Export a self-contained React component from rendered SVG text.
 * The output is paste-ready and does not depend on PaperShape internals.
 */
export function toPaperShapeStandaloneReactCode(
  svgText: string,
  options?: StandaloneComponentOptions
): string {
  const cleanSvg = svgText.replace(/^\s*<\?xml[^>]*\?>\s*/i, '').trim();
  const escapedSvg = escapeTemplateLiteral(cleanSvg);
  const componentName = toSafeComponentName(options?.componentName || 'PaperShapeAsset');
  const idPrefix = componentName.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'paper-shape';

  return `import { useId, useMemo } from 'react';

const rawSvgMarkup = String.raw\`${escapedSvg}\`;

function prefixSvgIds(markup: string, prefix: string): string {
  return markup
    .replace(/\\sid="([^"]+)"/g, (_m, id) => \` id="\${prefix}-\${id}"\`)
    .replace(/url\\(#([^)]+)\\)/g, (_m, id) => \`url(#\${prefix}-\${id})\`)
    .replace(/href="#([^"]+)"/g, (_m, id) => \`href="#\${prefix}-\${id}"\`)
    .replace(/xlink:href="#([^"]+)"/g, (_m, id) => \`xlink:href="#\${prefix}-\${id}"\`);
}

export default function ${componentName}({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const markup = useMemo(() => prefixSvgIds(rawSvgMarkup, '${idPrefix}-' + uid), [uid]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: markup }} />;
}
`;
}

export function serializeSvg(svgEl: SVGSVGElement): string {
  const cloned = svgEl.cloneNode(true) as SVGSVGElement;
  const w = Number(cloned.getAttribute('width')) || 0;
  const h = Number(cloned.getAttribute('height')) || 0;
  if (!cloned.getAttribute('xmlns')) cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!cloned.getAttribute('version')) cloned.setAttribute('version', '1.1');
  if (!cloned.getAttribute('viewBox') && w > 0 && h > 0) cloned.setAttribute('viewBox', `0 0 ${w} ${h}`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${cloned.outerHTML}`;
}

export function downloadText(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
