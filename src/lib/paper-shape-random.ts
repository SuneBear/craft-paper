import { presetParamsDefs, type PaperPreset, type PresetParams } from '@/components/paper-shape/geometry';

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function stepDecimals(step: number): number {
  const s = String(step);
  const i = s.indexOf('.');
  return i === -1 ? 0 : (s.length - i - 1);
}

function randomByStep(min: number, max: number, step: number): number {
  const steps = Math.max(0, Math.round((max - min) / step));
  const n = randomInt(0, steps);
  const raw = min + n * step;
  const decimals = stepDecimals(step);
  return Number(raw.toFixed(decimals));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createRandomPresetParams(
  preset: PaperPreset,
  width: number,
  height: number,
  prev: PresetParams = {}
): PresetParams {
  const params: PresetParams = {};
  const defs = presetParamsDefs[preset] ?? [];
  const lockedKeys = new Set([
    'cornerRadius',
    'cornerRadiusTL',
    'cornerRadiusTR',
    'cornerRadiusBR',
    'cornerRadiusBL',
    'cornerShape',
    'cornerSuperellipse',
    'cutoutEdges',
    'cutoutShape',
    'cutoutRadius',
    'cutoutDepth',
    'cutoutOffset',
    'cutoutAABleed',
    'stitchInset',
    'stitchCornerRadius',
    'stitchWidth',
    'stitchColor',
    'perforationRingWidth',
    'perforationRingColor',
  ]);

  for (const def of defs) {
    if (lockedKeys.has(def.key as string)) continue;
    const prevVal = prev[def.key];
    const base = typeof prevVal === 'number'
      ? prevVal
      : def.defaultVal(width, height);
    const span = Math.max(0, def.max - def.min);
    const window = def.step >= 1
      ? Math.max(def.step, Math.round(span * 0.16))
      : Math.max(def.step * 3, span * 0.16);
    let min = Math.max(def.min, base - window);
    let max = Math.min(def.max, base + window);

    if (preset === 'folded' && def.key === 'foldSize') {
      const side = Math.min(width, height);
      min = Math.max(def.min, side * 0.12, base * 0.82);
      max = Math.min(def.max, side * 0.26, base * 1.18);
      if (max < min) {
        const clamped = Math.max(def.min, Math.min(def.max, base));
        min = clamped;
        max = clamped;
      }
    }

    if (preset === 'ticket' && def.key === 'ticketStubWidth') {
      const side = Math.min(width, height);
      min = Math.max(def.min, side * 0.16, base * 0.85);
      max = Math.min(def.max, side * 0.24, base * 1.15);
      if (max < min) {
        const clamped = Math.max(def.min, Math.min(def.max, base));
        min = clamped;
        max = clamped;
      }
    }

    if ((preset === 'coupon' || preset === 'ticket') && def.key === 'perforationOffset') {
      const side = Math.min(width, height);
      const drift = Math.max(12, side * 0.18);
      const localWindow = Math.max(4, drift * 0.35);
      min = Math.max(def.min, -drift, base - localWindow);
      max = Math.min(def.max, drift, base + localWindow);
    }

    if (max < min) {
      const clamped = clamp(base, def.min, def.max);
      min = clamped;
      max = clamped;
    }

    // Binary switches should usually stay near current state.
    if (def.step >= 1 && span <= 1.01) {
      const toggled = Math.round(clamp(base, def.min, def.max)) === Math.round(def.min)
        ? def.max
        : def.min;
      const shouldToggle = Math.random() < 0.2;
      const v = shouldToggle ? toggled : clamp(base, def.min, def.max);
      (params as Record<string, number>)[def.key] = Math.round(v);
      continue;
    }

    const v = randomByStep(min, max, def.step);
    (params as Record<string, number>)[def.key] = v;
  }

  if (preset === 'folded') {
    const options = [1, 2, 4, 8, 3, 5, 6, 9, 10, 12, 15];
    const current = typeof prev.foldCorners === 'number' ? Math.round(prev.foldCorners) : 2;
    const currentIdx = Math.max(0, options.indexOf(current));
    const from = Math.max(0, currentIdx - 2);
    const to = Math.min(options.length - 1, currentIdx + 2);
    params.foldCorners = options[randomInt(from, to)];
  }
  if (preset === 'ticket') {
    const current = typeof prev.ticketStubSide === 'number' ? Math.round(prev.ticketStubSide) : 0;
    params.ticketStubSide = clamp(current + randomInt(-1, 1), 0, 3);
  }
  if (preset === 'coupon') {
    const notchOffset = typeof params.couponNotchOffsetX === 'number'
      ? params.couponNotchOffsetX
      : (typeof prev.couponNotchOffsetX === 'number' ? prev.couponNotchOffsetX : 0);
    const nudge = randomInt(-4, 4);
    const aligned = clamp(notchOffset + nudge, -60, 60);
    params.perforationOffset = aligned;
  }

  // Keep corner/cutout/stitch settings stable when randomizing.
  params.cornerRadius = prev.cornerRadius;
  params.cornerRadiusTL = prev.cornerRadiusTL;
  params.cornerRadiusTR = prev.cornerRadiusTR;
  params.cornerRadiusBR = prev.cornerRadiusBR;
  params.cornerRadiusBL = prev.cornerRadiusBL;
  params.cornerShape = prev.cornerShape;
  params.cornerSuperellipse = prev.cornerSuperellipse;
  params.cutoutEdges = prev.cutoutEdges;
  params.cutoutShape = prev.cutoutShape;
  params.cutoutRadius = prev.cutoutRadius;
  params.cutoutDepth = prev.cutoutDepth;
  params.cutoutOffset = prev.cutoutOffset;
  params.cutoutAABleed = prev.cutoutAABleed;
  params.stitchInset = prev.stitchInset;
  params.stitchCornerRadius = prev.stitchCornerRadius;
  params.stitchWidth = prev.stitchWidth;
  params.stitchColor = prev.stitchColor;
  params.perforationRingWidth = prev.perforationRingWidth;
  params.perforationRingColor = prev.perforationRingColor;

  return params;
}
