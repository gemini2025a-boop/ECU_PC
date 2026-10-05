import React, { useState, useRef, useEffect } from 'react';
import { TelemetryData } from '../../types/protocol';
import { Pause, Play, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface OscilloscopeProps {
  currentTelemetry: TelemetryData;
  paused: boolean;
  onTogglePause: () => void;
}

interface DataPoint {
  time: number;
  rpm: number;
  tps: number;
  fuel_pw: number;
  cht1: number;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  currentTelemetry,
  paused,
  onTogglePause,
}) => {
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [timeWindowSec, setTimeWindowSec] = useState<number>(10);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const [visibleChannels, setVisibleChannels] = useState({
    rpm: true,
    tps: true,
    fuel_pw: true,
    cht1: true,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Buffer incoming telemetry
  useEffect(() => {
    if (paused) return;

    setHistory((prev) => {
      const now = Date.now();
      const updated = [
        ...prev,
        {
          time: now,
          rpm: currentTelemetry.rpm,
          tps: currentTelemetry.tps,
          fuel_pw: currentTelemetry.fuel_pulse_width,
          cht1: currentTelemetry.cht1,
        },
      ];

      // Keep only points within time window + buffer (max 400 points)
      const cutoff = now - timeWindowSec * 1000;
      return updated.filter((p) => p.time >= cutoff);
    });
  }, [currentTelemetry, paused, timeWindowSec]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#070b12';
    ctx.fillRect(0, 0, width, height);

    // Draw horizontal grid lines
    ctx.strokeStyle = '#162032';
    ctx.lineWidth = 1;
    const gridYSteps = 5;
    for (let i = 0; i <= gridYSteps; i++) {
      const y = (height / gridYSteps) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw vertical time grid lines
    const gridXSteps = 8;
    for (let i = 0; i <= gridXSteps; i++) {
      const x = (width / gridXSteps) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    if (history.length < 2) return;

    const now = Date.now();
    const timeStart = now - timeWindowSec * 1000;

    // Helper to map (time, val) to canvas (x, y)
    const getX = (t: number) => {
      return ((t - timeStart) / (timeWindowSec * 1000)) * width;
    };

    // Draw channel curves
    const channels = [
      { key: 'rpm', max: 8000, color: '#10b981', enabled: visibleChannels.rpm },
      { key: 'tps', max: 100, color: '#f59e0b', enabled: visibleChannels.tps },
      { key: 'fuel_pw', max: 6000, color: '#06b6d4', enabled: visibleChannels.fuel_pw },
      { key: 'cht1', max: 250, color: '#f43f5e', enabled: visibleChannels.cht1 },
    ];

    channels.forEach((ch) => {
      if (!ch.enabled) return;

      ctx.beginPath();
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';

      let started = false;
      for (const pt of history) {
        const x = getX(pt.time);
        const rawVal = pt[ch.key as keyof DataPoint] as number;
        const normalized = Math.min(Math.max(rawVal / ch.max, 0), 1);
        const y = height - normalized * (height - 20) - 10;

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });

    // Draw cursor line if hovering
    if (hoverX !== null) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [history, visibleChannels, timeWindowSec, hoverX]);

  return (
    <div className="flex flex-col bg-slate-900/80 border border-slate-800 rounded overflow-hidden">
      {/* Scope Toolbar */}
      <div className="h-9 px-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-300 tracking-wider uppercase text-[11px]">
            实时遥测多通道示波器
          </span>

          {/* Channel Legend & Toggles */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setVisibleChannels(p => ({ ...p, rpm: !p.rpm }))}
              className={`flex items-center gap-1.5 transition-opacity ${visibleChannels.rpm ? 'opacity-100' : 'opacity-40'}`}
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="font-mono text-[11px] text-slate-300">RPM (0-8000)</span>
            </button>

            <button
              onClick={() => setVisibleChannels(p => ({ ...p, tps: !p.tps }))}
              className={`flex items-center gap-1.5 transition-opacity ${visibleChannels.tps ? 'opacity-100' : 'opacity-40'}`}
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span className="font-mono text-[11px] text-slate-300">TPS (0-100%)</span>
            </button>

            <button
              onClick={() => setVisibleChannels(p => ({ ...p, fuel_pw: !p.fuel_pw }))}
              className={`flex items-center gap-1.5 transition-opacity ${visibleChannels.fuel_pw ? 'opacity-100' : 'opacity-40'}`}
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
              <span className="font-mono text-[11px] text-slate-300">Fuel PW (µs)</span>
            </button>

            <button
              onClick={() => setVisibleChannels(p => ({ ...p, cht1: !p.cht1 }))}
              className={`flex items-center gap-1.5 transition-opacity ${visibleChannels.cht1 ? 'opacity-100' : 'opacity-40'}`}
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span className="font-mono text-[11px] text-slate-300">CHT1 (℃)</span>
            </button>
          </div>
        </div>

        {/* Scope Controls */}
        <div className="flex items-center gap-2">
          {/* Time window selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[11px]">
            {[5, 10, 30].map((sec) => (
              <button
                key={sec}
                onClick={() => setTimeWindowSec(sec)}
                className={`px-1.5 py-0.5 rounded font-mono ${
                  timeWindowSec === sec ? 'bg-slate-700 text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Pause / Resume */}
          <button
            onClick={onTogglePause}
            className={`p-1 rounded text-slate-300 hover:bg-slate-800 ${
              paused ? 'bg-amber-950 text-amber-300 border border-amber-700/60' : ''
            }`}
            title={paused ? '继续示波' : '冻结示波'}
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Buffer */}
          <button
            onClick={() => setHistory([])}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            title="清空波形缓存"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full h-48 bg-[#070b12]">
        <canvas
          ref={canvasRef}
          width={800}
          height={192}
          className="w-full h-full block cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setHoverX(e.clientX - rect.left);
          }}
          onMouseLeave={() => setHoverX(null)}
        />

        {/* Tabular Readout Overlay on Right */}
        <div className="absolute top-2 right-2 bg-slate-950/85 border border-slate-800/80 px-2 py-1.5 rounded text-[10px] font-mono flex flex-col gap-0.5 pointer-events-none">
          <div className="text-slate-400 text-[9px] uppercase tracking-wider mb-0.5">实时点测量</div>
          <div className="text-emerald-400 tabular-nums">RPM: {currentTelemetry.rpm}</div>
          <div className="text-amber-400 tabular-nums">TPS: {currentTelemetry.tps.toFixed(1)}%</div>
          <div className="text-cyan-400 tabular-nums">FPW: {currentTelemetry.fuel_pulse_width}µs</div>
          <div className="text-rose-400 tabular-nums">CHT1: {currentTelemetry.cht1}℃</div>
        </div>
      </div>
    </div>
  );
};
