import React from 'react';

interface DialGaugeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  decimals?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  color?: string;
  size?: number;
}

export const DialGauge: React.FC<DialGaugeProps> = ({
  label,
  value,
  min,
  max,
  unit,
  decimals = 0,
  warningThreshold,
  criticalThreshold,
  color = '#10b981', // emerald default
  size = 120,
}) => {
  const isCompact = size < 140;
  const clampedValue = Math.min(Math.max(value, min), max);
  const percentage = (clampedValue - min) / (max - min);

  // Angle from -135 deg to +135 deg (270 deg sweep)
  const startAngle = -135;
  const sweepAngle = 270;
  const currentAngle = startAngle + percentage * sweepAngle;

  const radius = size * 0.38;
  const cx = size / 2;
  const cy = size / 2 + (isCompact ? 4 : 6);

  // Arc path generator
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, start: number, end: number) => {
    const startPoint = polarToCartesian(x, y, r, end);
    const endPoint = polarToCartesian(x, y, r, start);
    const largeArcFlag = end - start <= 180 ? '0' : '1';
    return [
      'M', startPoint.x, startPoint.y,
      'A', r, r, 0, largeArcFlag, 0, endPoint.x, endPoint.y
    ].join(' ');
  };

  const bgArc = describeArc(cx, cy, radius, startAngle, startAngle + sweepAngle);
  const activeArc = describeArc(cx, cy, radius, startAngle, currentAngle);

  // Determine current color based on thresholds
  let activeColor = color;
  if (criticalThreshold !== undefined && clampedValue >= criticalThreshold) {
    activeColor = '#ef4444'; // Red
  } else if (warningThreshold !== undefined && clampedValue >= warningThreshold) {
    activeColor = '#f59e0b'; // Amber
  }

  // Generate tick marks
  const ticks = [];
  const numTicks = isCompact ? 7 : 9;
  for (let i = 0; i < numTicks; i++) {
    const tickPercent = i / (numTicks - 1);
    const tickAngle = startAngle + tickPercent * sweepAngle;
    const p1 = polarToCartesian(cx, cy, radius + (isCompact ? 2 : 4), tickAngle);
    const p2 = polarToCartesian(cx, cy, radius + (isCompact ? 7 : 11), tickAngle);
    const tickVal = Math.round(min + tickPercent * (max - min));
    ticks.push({ p1, p2, tickVal, tickAngle });
  }

  return (
    <div className={`flex flex-col items-center justify-center ${isCompact ? 'p-2' : 'p-3'} bg-slate-900/80 border border-slate-800 rounded shadow-xs`}>
      <div className={`${isCompact ? 'text-[10px]' : 'text-[11px]'} font-semibold tracking-wider text-slate-300 mb-0.5 font-sans`}>
        {label}
      </div>

      <div className="relative" style={{ width: size, height: size * 0.85 }}>
        <svg width={size} height={size * 0.85} className="overflow-visible">
          {/* Background track */}
          <path
            d={bgArc}
            fill="none"
            stroke="#1e293b"
            strokeWidth={isCompact ? '4' : '5'}
            strokeLinecap="round"
          />

          {/* Active progress arc */}
          {percentage > 0.005 && (
            <path
              d={activeArc}
              fill="none"
              stroke={activeColor}
              strokeWidth={isCompact ? '4' : '5'}
              strokeLinecap="round"
              className="transition-all duration-150"
            />
          )}

          {/* Ticks */}
          {ticks.map((t, idx) => (
            <line
              key={idx}
              x1={t.p1.x}
              y1={t.p1.y}
              x2={t.p2.x}
              y2={t.p2.y}
              stroke="#334155"
              strokeWidth={isCompact ? '1.2' : '1.5'}
            />
          ))}

          {/* Needle Center Pin */}
          <circle cx={cx} cy={cy} r={isCompact ? 3 : 4} fill="#64748b" />

          {/* Needle Line */}
          {(() => {
            const needleTip = polarToCartesian(cx, cy, radius - (isCompact ? 4 : 6), currentAngle);
            return (
              <line
                x1={cx}
                y1={cy}
                x2={needleTip.x}
                y2={needleTip.y}
                stroke={activeColor}
                strokeWidth={isCompact ? '1.8' : '2'}
                strokeLinecap="round"
                className="transition-all duration-150"
              />
            );
          })()}
        </svg>

        {/* Tabular Value readout */}
        <div className="absolute inset-x-0 bottom-0.5 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline justify-center">
            <span className={`${isCompact ? 'text-base' : 'text-xl'} font-mono font-bold tracking-tight text-slate-100 tabular-nums`}>
              {value.toFixed(decimals)}
            </span>
            <span className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} font-mono text-slate-400 ml-1`}>
              {unit}
            </span>
          </div>
        </div>
      </div>

      {/* Min/Max Range bounds */}
      <div className={`w-full flex justify-between px-1.5 ${isCompact ? 'text-[9px]' : 'text-[10px]'} font-mono text-slate-500`}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};
