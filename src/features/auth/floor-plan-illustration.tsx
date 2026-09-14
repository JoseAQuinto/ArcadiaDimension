import { cn } from '@/lib/cn'

const RACKS = [
  { x: 150, y: 40, fill: [1, 1, 1, 0.7, 1, 1, 0.8, 1] },
  { x: 150, y: 88, fill: [0.6, 0.4, 0.8, 0.5, 0.3, 0.7, 0.6, 0.2] },
  { x: 150, y: 136, fill: [0.2, 0, 0.3, 0.1, 0.4, 0, 0.2, 0.3] },
  { x: 150, y: 184, fill: [0.9, 0.8, 1, 0.6, 0.9, 0.7, 1, 0.8] },
]

const colorFor = (ratio: number) => {
  if (ratio === 0) return 'rgb(148 163 184 / 0.15)'
  if (ratio <= 0.5) return 'rgb(52 211 153 / 0.75)'
  if (ratio <= 0.8) return 'rgb(251 191 36 / 0.8)'
  return 'rgb(248 113 113 / 0.85)'
}

/** Decorative floor plan used on the authentication screens. */
export function FloorPlanIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 270" className={cn('drop-shadow-2xl', className)} aria-hidden="true">
      <rect x="1" y="1" width="478" height="268" rx="10" fill="rgb(255 255 255 / 0.035)" stroke="rgb(199 205 255 / 0.25)" />

      <rect x="20" y="22" width="104" height="96" rx="4" fill="rgb(96 165 250 / 0.12)" stroke="rgb(96 165 250 / 0.6)" strokeDasharray="4 3" />
      <text x="30" y="40" fill="rgb(191 219 254)" fontSize="10" fontWeight="600" fontFamily="Inter Variable, sans-serif">
        Recepción
      </text>
      <rect x="20" y="134" width="104" height="112" rx="4" fill="rgb(251 146 60 / 0.12)" stroke="rgb(251 146 60 / 0.6)" strokeDasharray="4 3" />
      <text x="30" y="152" fill="rgb(254 215 170)" fontSize="10" fontWeight="600" fontFamily="Inter Variable, sans-serif">
        Expediciones
      </text>

      {RACKS.map((rack, rackIndex) => (
        <g key={rack.y} className={rackIndex === 3 ? 'animate-pulse' : undefined}>
          {rack.fill.map((ratio, bay) => (
            <rect key={bay} x={rack.x + bay * 36} y={rack.y} width="34" height="22" rx="2" fill={colorFor(ratio)} />
          ))}
          <rect
            x={rack.x - 3}
            y={rack.y - 3}
            width={8 * 36 + 4}
            height="28"
            rx="4"
            fill="none"
            stroke={rackIndex === 3 ? 'rgb(124 134 251)' : 'rgb(199 205 255 / 0.3)'}
            strokeWidth={rackIndex === 3 ? 2 : 1}
          />
        </g>
      ))}

      {[0, 1, 2, 3].map((dock) => (
        <rect key={dock} x={170 + dock * 70} y="246" width="48" height="16" rx="2" fill="rgb(251 191 36 / 0.25)" stroke="rgb(251 191 36 / 0.6)" />
      ))}
      {[150, 300, 450].map((x) => (
        <rect key={x} x={x - 4} y="226" width="8" height="8" fill="rgb(148 163 184 / 0.6)" />
      ))}
    </svg>
  )
}
