import React, { useState, useEffect } from 'react';
import { ProtocolType, SessionState } from '../types/protocol';

interface WindowsStatusBarProps {
  protocol: ProtocolType;
  sessionState: SessionState;
  frameCounter: number;
}

export const WindowsStatusBar: React.FC<WindowsStatusBarProps> = ({
  protocol,
  sessionState,
  frameCounter,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="h-6 bg-[#0a0d14] border-t border-slate-800 flex items-center px-1 select-none shrink-0 text-[11px] font-mono text-slate-400 divide-x divide-slate-800">
      {/* Panel 1: Primary System Status (Flex-1) */}
      <div className="flex-1 px-2.5 flex items-center gap-2 truncate">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            sessionState === 'APPLICATION'
              ? 'bg-emerald-400 animate-pulse'
              : sessionState === 'BOOTLOADER'
              ? 'bg-amber-400'
              : 'bg-slate-600'
          }`}
        />
        <span className="text-slate-300 font-sans truncate">
          {sessionState === 'APPLICATION'
            ? `就绪: 正在以 20Hz 实时接收 ${protocol} 遥测帧 | 串口: COM3 已连接 (RS422)`
            : sessionState === 'BOOTLOADER'
            ? 'BootLoader 模式激活: 等待 S19 固件升级'
            : '串口未连接: 请点击【打开串口】建立通信会话'}
        </span>
      </div>

      {/* Panel 2: Frame Statistics */}
      <div className="px-3 shrink-0 hidden md:block">
        <span className="text-slate-500">Tx: </span>
        <span className="text-slate-200 tabular-nums">{Math.round(frameCounter * 0.25)}</span>
        <span className="text-slate-600 mx-1.5">|</span>
        <span className="text-slate-500">Rx: </span>
        <span className="text-emerald-400 tabular-nums">{frameCounter}</span>
      </div>

      {/* Panel 3: CRC / Parity Error Counter */}
      <div className="px-3 shrink-0 hidden lg:block">
        <span className="text-slate-500">校验误码: </span>
        <span className="text-emerald-400">0</span>
        <span className="text-slate-600 mx-1.5">|</span>
        <span className="text-slate-500">重同步: </span>
        <span className="text-slate-300">0</span>
      </div>

      {/* Panel 4: Hardware & Partition */}
      <div className="px-3 shrink-0 hidden sm:block">
        <span className="text-slate-500">目标: </span>
        <span className="text-slate-200">MC9S12XS128</span>
        <span className="text-slate-500 ml-1">(单区)</span>
      </div>

      {/* Panel 5: Key locks indicator */}
      <div className="px-2 shrink-0 hidden xl:flex gap-1.5 text-[10px] text-slate-500">
        <span className="text-slate-300">CAPS</span>
        <span className="text-slate-300">NUM</span>
      </div>

      {/* Panel 6: Local Clock */}
      <div className="px-3 shrink-0 text-slate-300 tabular-nums">
        {timeStr || '00:00:00'}
      </div>
    </footer>
  );
};
