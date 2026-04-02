type ClassValue = string | undefined | null | false;

/**
 * Lightweight local className combiner for copy/paste portability.
 * Keeps paper-shape directory self-contained without depending on '@/lib/utils'.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}

