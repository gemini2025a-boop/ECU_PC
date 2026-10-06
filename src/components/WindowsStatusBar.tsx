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

  const getProtocolChinese = (p: ProtocolType) => {
    switch (p) {
      case 'ZH31':
        return 'ZH31 标准应用协议 (8/31字节)';
      case 'ZH40':
        return 'ZH40 扩展应用协议 (8/40字节)';
      case 'BH19':
        return 'BH19 精简遥测协议 (6/19字节)';
      case 'ADDRESS':
        return '地址标定兼容协议 (6/84字节)';
      default:
        return p;
    }
  };

  return (
    <footer className="h-6 bg-[#121622] border-t border-slate-700/80 flex items-center px-1 select-none shrink-0 text-[11px] font-mono text-slate-300 divide-x divide-slate-700 shadow-inner">
      {/* 窗格 1：系统核心运行状态与当前通信链路 */}
      <div className="flex-1 px-2.5 flex items-center gap-2 truncate">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            sessionState === 'APPLICATION'
              ? 'bg-emerald-400 animate-pulse'
              : sessionState === 'BOOTLOADER'
              ? 'bg-amber-400'
              : 'bg-slate-600'
          }`}
        />
        <span className="text-slate-200 font-sans truncate">
          {sessionState === 'APPLICATION'
            ? `通信就绪: 正在以 20Hz 频率实时接收 ${getProtocolChinese(protocol)} | 通道: 物理串口3 (RS422 差分总线)`
            : sessionState === 'BOOTLOADER'
            ? '引导程序已接管: 等待 S19 固件镜像烧写指令'
            : '通信链路未连接: 请点击工具栏【打开串口】建立双向会话'}
        </span>
      </div>

      {/* 窗格 2：报文收发统计 */}
      <div className="px-3 shrink-0 hidden md:block">
        <span className="text-slate-400">下行发送: </span>
        <span className="text-slate-100 tabular-nums">{Math.round(frameCounter * 0.25)} 帧</span>
        <span className="text-slate-600 mx-1.5">|</span>
        <span className="text-slate-400">上行接收: </span>
        <span className="text-emerald-400 tabular-nums font-semibold">{frameCounter} 帧</span>
      </div>

      {/* 窗格 3：误码与重同步计数 */}
      <div className="px-3 shrink-0 hidden lg:block">
        <span className="text-slate-400">校验误码: </span>
        <span className="text-emerald-400 font-bold">0</span>
        <span className="text-slate-600 mx-1.5">|</span>
        <span className="text-slate-400">滑动重同步: </span>
        <span className="text-slate-200">0 次</span>
      </div>

      {/* 窗格 4：芯片硬件与分区规则 */}
      <div className="px-3 shrink-0 hidden sm:block">
        <span className="text-slate-400">目标硬件: </span>
        <span className="text-slate-100">恩智浦 MC9S12XS128</span>
        <span className="text-slate-400 ml-1">(单物理分区)</span>
      </div>

      {/* 窗格 5：键盘锁状态指示 */}
      <div className="px-2.5 shrink-0 hidden xl:flex gap-2 text-[10px] text-slate-400">
        <span className="text-emerald-400 font-sans">大写锁定</span>
        <span className="text-emerald-400 font-sans">数字键盘</span>
      </div>

      {/* 窗格 6：本地走时时钟 */}
      <div className="px-3 shrink-0 text-slate-200 tabular-nums font-semibold">
        {timeStr || '00:00:00'}
      </div>
    </footer>
  );
};
