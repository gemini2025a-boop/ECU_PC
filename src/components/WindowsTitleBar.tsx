import React, { useState } from 'react';
import { ProtocolType, SessionState } from '../types/protocol';
import { Minus, Square, Copy, X, Cpu } from 'lucide-react';

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

  const getSessionStateText = (state: SessionState) => {
    switch (state) {
      case 'APPLICATION':
        return '正常运行中';
      case 'BOOTLOADER':
        return '引导程序模式';
      case 'OPEN':
        return '串口已打开·待同步';
      case 'DISCONNECTED':
        return '未连接';
      case 'BUSY':
        return '设备繁忙';
      case 'FAULT':
        return '通信故障';
      default:
        return state;
    }
  };

  const getProtocolText = (p: ProtocolType) => {
    switch (p) {
      case 'ZH31':
        return 'ZH31标准协议 (8/31字节)';
      case 'ZH40':
        return 'ZH40扩展协议 (8/40字节)';
      case 'BH19':
        return 'BH19精简协议 (6/19字节)';
      case 'ADDRESS':
        return '地址标定协议 (6/84字节)';
      default:
        return p;
    }
  };

  return (
    <div className="h-8 bg-[#161a23] border-b border-slate-700/80 flex items-center justify-between px-2 select-none shrink-0 text-xs font-sans text-slate-200">
      {/* 左侧：Windows 应用程序图标与中文全称标题 */}
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="w-4 h-4 rounded bg-emerald-900/90 border border-emerald-500/70 flex items-center justify-center shrink-0 shadow-xs">
          <Cpu className="w-3 h-3 text-emerald-300" />
        </div>

        <div className="flex items-center gap-2 truncate text-[11px]">
          <span className="font-bold text-slate-100 tracking-wide">
            ECU340 发动机电子控制单元标定与测试上位机工作台
          </span>
          <span className="text-slate-500 font-mono">-</span>
          <span className="text-slate-300 font-mono">
            [串口通道: 物理串口3 · 波特率: 115200 8-N-1 · 协议: {getProtocolText(protocol)} · 状态: {getSessionStateText(sessionState)}]
          </span>
          <span className="text-slate-500 font-mono hidden xl:inline">
            (主控微控制器: 恩智浦 MC9S12XS128 · 物理总线: SCI1 RS422差分总线)
          </span>
        </div>
      </div>

      {/* 右侧：Windows 标准三键 (最小化、最大化/向下还原、关闭) */}
      <div className="flex items-center h-full -mr-2">
        <button
          className="h-full px-3 text-slate-300 hover:text-white hover:bg-slate-700/80 flex items-center justify-center transition-colors"
          title="最小化窗口"
          onClick={() => {}}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          className="h-full px-3 text-slate-300 hover:text-white hover:bg-slate-700/80 flex items-center justify-center transition-colors"
          title={isMaximized ? "向下还原" : "最大化窗口"}
          onClick={() => setIsMaximized(!isMaximized)}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3 rotate-180" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>
        <button
          className="h-full px-3 text-slate-300 hover:text-white hover:bg-[#e81123] flex items-center justify-center transition-colors"
          title="关闭系统 (Alt+F4)"
          onClick={() => {
            if (confirm('确认关闭并退出 ECU340 上位机系统？')) {
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
