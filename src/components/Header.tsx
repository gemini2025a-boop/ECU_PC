import React, { useState, useRef, useEffect } from 'react';
import { ProtocolType, SessionState } from '../types/protocol';
import {
  Cpu,
  Power,
  ChevronDown,
  Sliders,
  UploadCloud,
  ShieldAlert,
  FileCheck,
  Code2,
  Settings,
  HelpCircle,
  Info,
  Plug,
  Terminal,
} from 'lucide-react';

export type AuxModalType =
  | null
  | 'connection'
  | 'parameters'
  | 'ota'
  | 'diagnostics'
  | 'bench'
  | 'rust_code'
  | 'help'
  | 'about';

interface HeaderProps {
  protocol: ProtocolType;
  sessionState: SessionState;
  simulating: boolean;
  onToggleSim: () => void;
  onEmergencyStop: () => void;
  frameCounter: number;
  onOpenModal: (type: AuxModalType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  protocol,
  sessionState,
  simulating,
  onToggleSim,
  onEmergencyStop,
  frameCounter,
  onOpenModal,
}) => {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-11 bg-[#080b11] border-b border-slate-800 flex items-center justify-between px-3 select-none shrink-0 z-40">
      {/* Zone 1: Single text element wordmark + subtle target chip */}
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-semibold tracking-wider text-slate-100 uppercase">
          ECU340 HOST SUITE
        </span>
        <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
          MC9S12XS128 · SCI1 RS422
        </span>
      </div>

      {/* Zone 2: Auxiliary Dropdown Menus & Quick Tools (Zero workspace occupation) */}
      <div className="flex items-center gap-1.5 text-xs">
        {/* Connection Port Settings button */}
        <button
          onClick={() => onOpenModal('connection')}
          className="flex items-center gap-1 px-2.5 py-1 text-slate-300 hover:text-slate-100 hover:bg-slate-800/70 rounded transition-colors"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>通信通道设置</span>
        </button>

        {/* Tools Menu Dropdown */}
        <div className="relative" ref={toolsRef}>
          <button
            onClick={() => setToolsOpen(!toolsOpen)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
              toolsOpen
                ? 'bg-slate-800 text-emerald-400'
                : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/70'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>系统扩展工具</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {toolsOpen && (
            <div className="absolute left-0 mt-1 w-56 bg-slate-900 border border-slate-800 rounded shadow-2xl py-1 z-50 text-xs font-sans divide-y divide-slate-800/50">
              <div className="py-1">
                <button
                  onClick={() => {
                    onOpenModal('parameters');
                    setToolsOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <div>
                    <div className="font-medium">M5-04 参数事务工程</div>
                    <div className="text-[10px] text-slate-500 font-mono">7544B 45分包实读回向导</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onOpenModal('ota');
                    setToolsOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <div className="font-medium">S19 BootLoader OTA 升级</div>
                    <div className="text-[10px] text-slate-500 font-mono">单区分片烧写与地址门禁</div>
                  </div>
                </button>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onOpenModal('diagnostics');
                    setToolsOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <div>
                    <div className="font-medium">DTC 故障诊断与快照</div>
                    <div className="text-[10px] text-slate-500 font-mono">故障码字典与原始报文</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onOpenModal('bench');
                    setToolsOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <div className="font-medium">M8-08 台架自动化对拍</div>
                    <div className="text-[10px] text-slate-500 font-mono">工况比对与签核报告</div>
                  </div>
                </button>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onOpenModal('rust_code');
                    setToolsOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-emerald-300 hover:bg-slate-800 flex items-center gap-2 font-mono"
                >
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <div className="font-medium">Rust 架构与源码生成</div>
                    <div className="text-[10px] text-slate-500 font-sans">eframe/egui 原生桌面工程</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help & Documentation Menu */}
        <div className="relative" ref={helpRef}>
          <button
            onClick={() => setHelpOpen(!helpOpen)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
              helpOpen
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>帮助与说明</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {helpOpen && (
            <div className="absolute left-0 mt-1 w-48 bg-slate-900 border border-slate-800 rounded shadow-2xl py-1 z-50 text-xs font-sans">
              <button
                onClick={() => {
                  onOpenModal('help');
                  setHelpOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>通信接口速查手册</span>
              </button>
              <button
                onClick={() => {
                  onOpenModal('about');
                  setHelpOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>关于 ECU340 上位机</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Zone 3: Actions & Real-Time Status Bar */}
      <div className="flex items-center gap-2.5">
        {/* Link Status Pill */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-900 border border-slate-800/80 px-2 py-0.5 rounded">
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
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">115200</span>
          <span className="text-slate-600">·</span>
          <span className="tabular-nums text-slate-400">#{frameCounter}</span>
        </div>

        {/* Simulator Toggle */}
        <button
          onClick={onToggleSim}
          title={simulating ? '暂停 ECU340 仿真数据流' : '开启 ECU340 仿真数据流'}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${
            simulating
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3 h-3" />
          <span>{simulating ? '仿真 20Hz' : '仿真暂停'}</span>
        </button>

        {/* Emergency Stop Button (Cmd 65, locks hybrid motor pulse to 800µs) */}
        <button
          onClick={onEmergencyStop}
          className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-600 rounded transition-colors whitespace-nowrap shadow-sm shadow-rose-950"
          title="紧急停机 (命令65): 立即停止喷油并锁定混合电机脉宽为 800µs"
        >
          <Power className="w-3.5 h-3.5" />
          <span>紧急停机 (65)</span>
        </button>
      </div>
    </header>
  );
};
