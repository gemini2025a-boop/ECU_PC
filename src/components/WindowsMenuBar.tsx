import React, { useState, useRef, useEffect } from 'react';
import { ProtocolType, SessionState } from '../types/protocol';
import { AuxModalType } from './Header';
import {
  FileText,
  Save,
  Download,
  Power,
  Settings,
  Plug,
  RefreshCw,
  Check,
  Cpu,
  Sliders,
  Clock,
  Square,
  UploadCloud,
  ShieldAlert,
  FileCheck,
  Code2,
  BookOpen,
  Info,
  Activity,
  Trash2,
} from 'lucide-react';

interface WindowsMenuBarProps {
  protocol: ProtocolType;
  onSetProtocol: (p: ProtocolType) => void;
  sessionState: SessionState;
  onToggleConnect: () => void;
  simulating: boolean;
  onToggleSim: () => void;
  onEmergencyStop: () => void;
  onTriggerRtc: () => void;
  onOpenModal: (type: AuxModalType) => void;
  pausedScope: boolean;
  onTogglePauseScope: () => void;
  onExportCsv: () => void;
}

export const WindowsMenuBar: React.FC<WindowsMenuBarProps> = ({
  protocol,
  onSetProtocol,
  sessionState,
  onToggleConnect,
  simulating,
  onToggleSim,
  onEmergencyStop,
  onTriggerRtc,
  onOpenModal,
  pausedScope,
  onTogglePauseScope,
  onExportCsv,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isConnected = sessionState !== 'DISCONNECTED';

  return (
    <div
      ref={barRef}
      className="h-6 bg-[#0f131d] border-b border-slate-800 flex items-center px-1 select-none shrink-0 text-xs font-sans text-slate-300 relative z-50"
    >
      {/* 1. 文件 (F) */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
          onMouseEnter={() => activeMenu && setActiveMenu('file')}
          className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
            activeMenu === 'file'
              ? 'bg-slate-700 text-white'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          文件<span className="underline">(F)</span>
        </button>

        {activeMenu === 'file' && (
          <div className="absolute left-0 top-full mt-0.5 w-60 bg-slate-900 border border-slate-700 rounded shadow-2xl py-1 z-50 text-[11px]">
            <button
              onClick={() => {
                onOpenModal('parameters');
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>导入标定参数工程...</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Ctrl+O</span>
            </button>

            <button
              onClick={() => {
                onOpenModal('parameters');
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Save className="w-3.5 h-3.5 text-slate-400" />
                <span>保存当前标定快照...</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Ctrl+S</span>
            </button>

            <div className="my-1 border-t border-slate-800" />

            <button
              onClick={() => {
                onExportCsv();
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>导出 SCI 报文日志 (CSV)...</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Ctrl+E</span>
            </button>

            <div className="my-1 border-t border-slate-800" />

            <button
              onClick={() => {
                if (confirm('确认退出 ECU340 上位机系统？')) {
                  window.location.reload();
                }
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-rose-300 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Power className="w-3.5 h-3.5 text-rose-400" />
                <span>退出 (Exit)</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Alt+F4</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. 通信与设备 (C) */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'comm' ? null : 'comm')}
          onMouseEnter={() => activeMenu && setActiveMenu('comm')}
          className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
            activeMenu === 'comm'
              ? 'bg-slate-700 text-white'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          通信<span className="underline">(C)</span>
        </button>

        {activeMenu === 'comm' && (
          <div className="absolute left-0 top-full mt-0.5 w-64 bg-slate-900 border border-slate-700 rounded shadow-2xl py-1 z-50 text-[11px]">
            <button
              onClick={() => {
                onOpenModal('connection');
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>串口通道与参数配置...</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Ctrl+P</span>
            </button>

            <button
              onClick={() => {
                onToggleConnect();
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Plug className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isConnected ? '断开串口连接' : '打开串口建立会话'}</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">F2</span>
            </button>

            <div className="my-1 border-t border-slate-800" />

            <div className="px-3 py-1 text-[10px] text-slate-500 font-semibold uppercase">
              应用层协议类型切换
            </div>

            {(
              [
                { id: 'ZH31', label: 'ZH31 (8/31B · ECU340默认)' },
                { id: 'ZH40', label: 'ZH40 (8/40B · 带版本与计数)' },
                { id: 'BH19', label: 'BH19 (6/19B · 机载精简)' },
                { id: 'ADDRESS', label: '地址标定 (6/84B · 旧工程兼容)' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSetProtocol(p.id);
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="w-3.5 text-center text-emerald-400 font-bold">
                    {protocol === p.id ? '✓' : ''}
                  </span>
                  <span>{p.label}</span>
                </div>
              </button>
            ))}

            <div className="my-1 border-t border-slate-800" />

            <button
              onClick={() => {
                onToggleSim();
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span>{simulating ? '暂停 ECU 20Hz 仿真循环' : '启动 ECU 20Hz 仿真循环'}</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">F5</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. 在线标定 (T) */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'calib' ? null : 'calib')}
          onMouseEnter={() => activeMenu && setActiveMenu('calib')}
          className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
            activeMenu === 'calib'
              ? 'bg-slate-700 text-white'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          标定<span className="underline">(T)</span>
        </button>

        {activeMenu === 'calib' && (
          <div className="absolute left-0 top-full mt-0.5 w-68 bg-slate-900 border border-slate-700 rounded shadow-2xl py-1 z-50 text-[11px]">
            <button
              onClick={() => {
                onOpenModal('parameters');
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>M5-04 整集参数事务向导 (7544B)...</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Ctrl+M</span>
            </button>

            <button
              onClick={() => {
                onTriggerRtc();
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>触发 RTC 0x98 七段上报</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">F8</span>
            </button>

            <div className="my-1 border-t border-slate-800" />

            <button
              onClick={() => {
                onEmergencyStop();
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-rose-300 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Square className="w-3.5 h-3.5 text-rose-500" />
                <span>紧急停机并锁定电机 800µs (65)</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Space</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. 工具与诊断 (D) */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
          onMouseEnter={() => activeMenu && setActiveMenu('tools')}
          className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
            activeMenu === 'tools'
              ? 'bg-slate-700 text-white'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          工具<span className="underline">(D)</span>
        </button>

        {activeMenu === 'tools' && (
          <div className="absolute left-0 top-full mt-0.5 w-64 bg-slate-900 border border-slate-700 rounded shadow-2xl py-1 z-50 text-[11px]">
            <button
              onClick={() => {
                onOpenModal('ota');
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                <span>S19 BootLoader OTA 固件升级...</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Ctrl+U</span>
            </button>

            <button
              onClick={() => {
                onOpenModal('diagnostics');
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>DTC 故障诊断与冻结帧...</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Ctrl+D</span>
            </button>

            <button
              onClick={() => {
                onOpenModal('bench');
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>M8-08 台架工况自动化对拍...</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Ctrl+B</span>
            </button>

            <div className="my-1 border-t border-slate-800" />

            <button
              onClick={() => {
                onOpenModal('rust_code');
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-emerald-300 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rust 原生上位机源码生成器...</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">Ctrl+R</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. 视图 (V) */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
          onMouseEnter={() => activeMenu && setActiveMenu('view')}
          className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
            activeMenu === 'view'
              ? 'bg-slate-700 text-white'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          视图<span className="underline">(V)</span>
        </button>

        {activeMenu === 'view' && (
          <div className="absolute left-0 top-full mt-0.5 w-56 bg-slate-900 border border-slate-700 rounded shadow-2xl py-1 z-50 text-[11px]">
            <button
              onClick={() => {
                onTogglePauseScope();
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span>{pausedScope ? '恢复示波器运行' : '冻结实时示波器波形'}</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">P</span>
            </button>

            <div className="my-1 border-t border-slate-800" />

            <button
              onClick={() => {
                onOpenModal('diagnostics');
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>打开完整 SCI 原始报文监视器</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 6. 帮助 (H) */}
      <div className="relative">
        <button
          onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
          onMouseEnter={() => activeMenu && setActiveMenu('help')}
          className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
            activeMenu === 'help'
              ? 'bg-slate-700 text-white'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          帮助<span className="underline">(H)</span>
        </button>

        {activeMenu === 'help' && (
          <div className="absolute left-0 top-full mt-0.5 w-56 bg-slate-900 border border-slate-700 rounded shadow-2xl py-1 z-50 text-[11px]">
            <button
              onClick={() => {
                onOpenModal('help');
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span>通信接口速查手册 (SCI/ApplyRx)...</span>
              </div>
              <span className="text-slate-500 font-mono text-[10px]">F1</span>
            </button>

            <div className="my-1 border-t border-slate-800" />

            <button
              onClick={() => {
                onOpenModal('about');
                setActiveMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>关于 ECU340 上位机 (About)...</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
