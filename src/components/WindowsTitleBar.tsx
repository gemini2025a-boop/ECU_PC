import React, { useState } from 'react';
import { ProtocolType, SessionState } from '../types/protocol';
import { Minus, Square, X, Cpu } from 'lucide-react';

interface WindowsTitleBarProps {
  protocol: ProtocolType;
  sessionState: SessionState;
  frameCounter: number;
}

export const WindowsTitleBar: React.FC<WindowsTitleBarProps> = ({
  protocol,
  sessionState,
  frameCounter,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <div className="h-8 bg-[#0a0d14] border-b border-slate-800 flex items-center justify-between px-2 select-none shrink-0 text-xs font-sans text-slate-300">
      {/* Left: Window Icon + Title */}
      <div className="flex items-center gap-2 overflow-hidden">
        {/* ECU / Chip Mini Icon */}
        <div className="w-4 h-4 rounded bg-emerald-950 border border-emerald-700/80 flex items-center justify-center shrink-0">
          <Cpu className="w-3 h-3 text-emerald-400" />
        </div>

        {/* Windows Standard Title Text */}
        <div className="flex items-center gap-1.5 truncate text-[11px]">
          <span className="font-semibold text-slate-100">ECU340 Calibration & Test Suite</span>
          <span className="text-slate-500 font-mono">-</span>
          <span className="text-slate-400 font-mono">
            [COM3: 115200 8-N-1 · {protocol} · {sessionState === 'APPLICATION' ? 'APP运行中' : sessionState}]
          </span>
          <span className="text-slate-600 font-mono hidden md:inline">
            (MC9S12XS128 · SCI1 RS422)
          </span>
        </div>
      </div>

      {/* Right: Windows Standard Window Control Buttons */}
      <div className="flex items-center h-full -mr-2">
        <button
          className="h-full px-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 flex items-center justify-center transition-colors"
          title="最小化"
          onClick={() => {}}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          className="h-full px-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 flex items-center justify-center transition-colors"
          title={isMaximized ? "向下还原" : "最大化"}
          onClick={() => setIsMaximized(!isMaximized)}
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          className="h-full px-3 text-slate-400 hover:text-white hover:bg-rose-600 flex items-center justify-center transition-colors"
          title="关闭"
          onClick={() => {
            if (confirm('确认关闭 ECU340 上位机程序？')) {
              window.location.reload();
            }
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
