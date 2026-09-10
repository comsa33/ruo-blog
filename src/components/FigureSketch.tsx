import type { FigureKind } from '@/lib/posts';

/**
 * A 160×96 sketch of each explanatory engine, for the index preview. Not a
 * render of the post's figure — a glyph for its kind, so a reader learns
 * whether a post explains itself with a sequence, a structure or a series
 * before opening it. Strokes inherit `color`; the one accent is the token.
 */
export function FigureSketch({ kind }: { kind: FigureKind }) {
  const props = {
    width: 160,
    height: 96,
    viewBox: '0 0 160 96',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1,
    'aria-hidden': true,
  } as const;

  switch (kind) {
    case 'Sequence':
      return (
        <svg {...props}>
          <path d="M28 12v72M80 12v72M132 12v72" opacity=".5" />
          <path d="M28 30h50M78 27l3 3-3 3M80 48h50M128 45l3 3-3 3M132 66H30M33 63l-3 3 3 3" />
          <circle cx="80" cy="48" r="3" fill="var(--accent)" stroke="none" />
        </svg>
      );
    case 'Structure':
      return (
        <svg {...props}>
          <rect x="12" y="36" width="36" height="22" rx="3" />
          <rect x="62" y="36" width="36" height="22" rx="3" />
          <rect x="112" y="14" width="36" height="22" rx="3" />
          <rect x="112" y="60" width="36" height="22" rx="3" />
          <path d="M48 47h14M98 47l14-22M98 47l14 24" />
          <circle cx="80" cy="47" r="2.5" fill="var(--accent)" stroke="none" />
        </svg>
      );
    case 'Breakdown':
      return (
        <svg {...props}>
          <rect x="12" y="40" width="136" height="16" />
          <path d="M60 40v16M104 40v16M128 40v16" />
          <rect
            x="104"
            y="40"
            width="24"
            height="16"
            fill="var(--accent)"
            stroke="none"
            opacity=".85"
          />
          <path d="M12 70h30M60 70h30M104 70h20" opacity=".45" />
        </svg>
      );
    case 'Series':
      return (
        <svg {...props}>
          <path d="M12 80h136M12 12v68" opacity=".35" />
          <path d="M12 70 34 62 56 66 78 44 100 48 122 30 148 22" />
          <path d="M100 12v68" stroke="var(--accent)" strokeDasharray="2 3" />
        </svg>
      );
    case 'Transform':
      return (
        <svg {...props}>
          <rect x="12" y="37" width="34" height="22" rx="3" />
          <rect x="114" y="14" width="34" height="22" rx="3" />
          <rect x="114" y="60" width="34" height="22" rx="3" />
          <path d="M46 48h20l48-23M66 48l48 23" />
          <path d="M110 22l4 3-4 3M110 68l4 3-4 3" />
          <path d="M120 25h22" stroke="var(--accent)" />
        </svg>
      );
    case 'Threshold':
      return (
        <svg {...props}>
          <g opacity=".7">
            <circle cx="24" cy="52" r="2.5" />
            <circle cx="34" cy="40" r="2.5" />
            <circle cx="42" cy="58" r="2.5" />
            <circle cx="52" cy="46" r="2.5" />
            <circle cx="60" cy="36" r="2.5" />
            <circle cx="70" cy="54" r="2.5" />
          </g>
          <g fill="currentColor" opacity=".7">
            <circle cx="104" cy="44" r="2.5" />
            <circle cx="114" cy="58" r="2.5" />
            <circle cx="122" cy="38" r="2.5" />
            <circle cx="132" cy="50" r="2.5" />
            <circle cx="140" cy="62" r="2.5" />
          </g>
          <path d="M88 14v68" stroke="var(--accent)" />
          <path d="M84 24h8" stroke="var(--accent)" />
        </svg>
      );
    case 'Playground':
      return (
        <svg {...props}>
          <path d="M16 30h128" opacity=".45" />
          <circle cx="72" cy="30" r="5" fill="var(--accent)" stroke="none" />
          <path d="M16 56h52M16 68h84M16 80h36" />
        </svg>
      );
  }
}
