export type PaperPatternType = 'lines' | 'grid' | 'dots' | 'diagonal' | 'waves' | 'none';

export type PaperContentPadding =
  | number
  | {
    all?: number;
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    x?: number;
    y?: number;
  };

export interface PatternParams {
  patternColor?: string;
  patternOpacity?: number;
  lineWidth?: number;
  lineGap?: number;
  gridWidth?: number;
  gridGap?: number;
  dotSize?: number;
  dotGap?: number;
  diagonalWidth?: number;
  diagonalGap?: number;
  waveWidth?: number;
  waveGap?: number;
  waveAmplitude?: number;
}
