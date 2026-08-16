import type { ReactNode } from 'react';

/**
 * Small inline-SVG icon set. All inherit `currentColor` and take an optional
 * size. Only the four the guest screens actually use are here — the DJ app
 * keeps the full set.
 */

interface IconProps {
  size?: number;
  className?: string;
}

function svg(path: ReactNode, size: number, className?: string) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {path}
    </svg>
  );
}

export function ChevronDown({ size = 14, className }: IconProps) {
  return svg(<polyline points="6 9 12 15 18 9" />, size, className);
}

export function ChevronUp({ size = 14, className }: IconProps) {
  return svg(<polyline points="6 15 12 9 18 15" />, size, className);
}

export function Close({ size = 16, className }: IconProps) {
  return svg(
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>,
    size,
    className,
  );
}

export function Search({ size = 14, className }: IconProps) {
  return svg(
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>,
    size,
    className,
  );
}
