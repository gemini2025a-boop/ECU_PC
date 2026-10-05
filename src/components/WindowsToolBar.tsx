import React from 'react';
import { ProtocolType, SessionState } from '../types/protocol';
import { AuxModalType } from './Header';
import {
  Plug,
  Unplug,
  Settings,
  Sliders,
  UploadCloud,
  ShieldAlert,
  FileCheck,
  Code2,
  Cpu,
  Power,
  Activity,
  Terminal,
} from 'lucide-react';

interface WindowsToolBarProps {
  protocol: ProtocolType;
  sessionState: SessionState;
  onToggleConnect: () => void;
  simulating: boolean;
  onToggleSim: () => void;
  onEmergencyStop: () => void;
  frameCounter: number;
  onOpenModal: (type: AuxModalType) => void;
}

export const WindowsToolBar: React.FC<WindowsToolBarProps> = ({
  protocol,
  sessionState,
  onToggleConnect,
  simulating,
  onToggleSim,
  onEmergencyStop,
  frameCounter,
  onOpenModal,
}) => {
  const isConnected = sessionState !== 'DISCONNECTED';

  return (
    <div className="h-9 bg-[#0b0e16] border-b border-slate-800 flex items-center justify-between px-2 select-none shrink-0 text-xs font-sans text-slate-300">
      {/* Left: Quick Action Tool Buttons */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {/* Connect Button */}
        <button
          onClick={onToggleConnect}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            isConnected
              ? 'bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
              : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60'
          }`}
          title={isConnected ? "断开当前串口链路 (F2)" : "打开串口建立会话 (F2)"}
        >
          {isConnected ? <Unplug className="w-3.5 h-3.5" /> : <Plug className="w-3.5 h-3.5" />}
          <span>{isConnected ? '断开串口' : '打开串口'}</span>
        </button>

        {/* Port Settings */}
        <button
          onClick={() => onOpenModal('connection')}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-slate-800 text-slate-300 transition-colors"
          title="串口端口与波特率设置 (Ctrl+P)"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">通道设置</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        {/* M5 Parameters */}
        <button
          onClick={() => onOpenModal('parameters')}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-slate-800 text-slate-300 transition-colors"
          title="M5-04 7544字节整集参数事务保存向导 (Ctrl+M)"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>参数工程</span>
        </button>

        {/* OTA Flasher */}
        <button
          onClick={() => onOpenModal('ota')}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-slate-800 text-slate-300 transition-colors"
          title="S19 BootLoader 单区 OTA 升级 (Ctrl+U)"
        >
          <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
          <span>OTA升级</span>
        </button>

        {/* DTC Diagnostics */}
        <button
          onClick={() => onOpenModal('diagnostics')}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-slate-800 text-slate-300 transition-colors"
          title="DTC 故障诊断与原始报文监听 (Ctrl+D)"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>故障诊断</span>
        </button>

        {/* Bench Testing */}
        <button
          onClick={() => onOpenModal('bench')}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-slate-800 text-slate-300 transition-colors"
          title="M8-08 台架工况自动化对拍 (Ctrl+B)"
        >
          <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>台架对拍</span>
        </button>

        {/* Rust Code Generator */}
        <button
          onClick={() => onOpenModal('rust_code')}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-slate-800 text-emerald-300 font-mono transition-colors"
          title="Rust 原生上位机架构与源码生成器 (Ctrl+R)"
        >
          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Rust代码</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        {/* Simulator Toggle */}
        <button
          onClick={onToggleSim}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition-colors ${
            simulating
              ? 'bg-slate-800 text-amber-300 border border-slate-700'
              : 'hover:bg-slate-800 text-slate-400'
          }`}
          title="ECU 内部 20Hz 遥测循环仿真 (F5)"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{simulating ? '仿真中 20Hz' : '仿真暂停'}</span>
        </button>

        {/* Emergency Stop 65 Button */}
        <button
          onClick={onEmergencyStop}
          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-rose-700 hover:bg-rose-600 rounded transition-colors shadow-xs ml-1"
          title="紧急停机 (命令65): 立即停止喷油并锁定混合电机脉宽为 800µs"
        >
          <Power className="w-3.5 h-3.5" />
          <span>停机锁电 (65)</span>
        </button>
      </div>

      {/* Right: Embedded Status Indicator in ToolBar */}
      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 shrink-0 ml-2">
        <div className="hidden xl:flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          <span
            className={`w-2 h-2 rounded-full ${
              sessionState === 'APPLICATION'
                ? 'bg-emerald-400 animate-pulse'
                : sessionState === 'BOOTLOADER'
                ? 'bg-amber-400'
                : 'bg-slate-600'
            }`}
          />
          <span className="text-slate-200 font-semibold">{protocol}</span>
          <span className="text-slate-600">|</span>
          <span>115200 8N1</span>
          <span className="text-slate-600">|</span>
          <span className="tabular-nums text-emerald-400">#{frameCounter}</span>
        </div>
      </div>
    </div>
  );
};
