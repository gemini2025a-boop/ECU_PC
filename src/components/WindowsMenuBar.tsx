import React, { useState, useRef, useEffect } from 'react';
import { AuxModalType } from './Header';
import {
  FileText,
  Save,
  Download,
  Power,
  Sliders,
  UploadCloud,
  ShieldAlert,
  FileCheck,
  Code2,
  BookOpen,
  Info,
  RotateCcw,
} from 'lucide-react';

interface WindowsMenuBarProps {
  onOpenModal: (type: AuxModalType) => void;
  onExportCsv: () => void;
}

export const WindowsMenuBar: React.FC<WindowsMenuBarProps> = ({
  onOpenModal,
  onExportCsv,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div
      ref={barRef}
      className="h-7 bg-[#171b26] border-b border-slate-700/80 flex items-center justify-between px-1.5 select-none shrink-0 text-xs font-sans text-slate-200 relative z-50 shadow-xs"
    >
      {/* 左侧：精简规范的标准功能菜单栏 (职责唯一，绝无重复项) */}
      <div className="flex items-center gap-0.5">
        {/* 1. 文件 (F) */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
            onMouseEnter={() => activeMenu && setActiveMenu('file')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              activeMenu === 'file'
                ? 'bg-slate-700 text-white font-semibold'
                : 'hover:bg-slate-700/70 text-slate-300'
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
                  <span>导入标定参数工程文件...</span>
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
                  <span>保存当前标定数据快照...</span>
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
                  <span>导出串口通信报文日志 (CSV)...</span>
                </div>
                <span className="text-slate-500 font-mono text-[10px]">Ctrl+E</span>
              </button>

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={() => {
                  if (confirm('确认关闭并退出 ECU340 上位机系统？')) {
                    window.location.reload();
                  }
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left text-rose-300 hover:bg-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Power className="w-3.5 h-3.5 text-rose-400" />
                  <span>退出上位机系统</span>
                </div>
                <span className="text-slate-500 font-mono text-[10px]">Alt+F4</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. 编辑 (E) */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
            onMouseEnter={() => activeMenu && setActiveMenu('edit')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              activeMenu === 'edit'
                ? 'bg-slate-700 text-white font-semibold'
                : 'hover:bg-slate-700/70 text-slate-300'
            }`}
          >
            编辑<span className="underline">(E)</span>
          </button>

          {activeMenu === 'edit' && (
            <div className="absolute left-0 top-full mt-0.5 w-52 bg-slate-900 border border-slate-700 rounded shadow-2xl py-1 z-50 text-[11px]">
              <button
                onClick={() => {
                  onOpenModal('parameters');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>重置待保存标定草稿</span>
                </div>
                <span className="text-slate-500 font-mono text-[10px]">Ctrl+Z</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. 标定 (T) */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'calib' ? null : 'calib')}
            onMouseEnter={() => activeMenu && setActiveMenu('calib')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              activeMenu === 'calib'
                ? 'bg-slate-700 text-white font-semibold'
                : 'hover:bg-slate-700/70 text-slate-300'
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
                  <span>打开 M5-04 整集标定参数工程向导...</span>
                </div>
                <span className="text-slate-500 font-mono text-[10px]">Ctrl+M</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. 工具 (U) */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
            onMouseEnter={() => activeMenu && setActiveMenu('tools')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              activeMenu === 'tools'
                ? 'bg-slate-700 text-white font-semibold'
                : 'hover:bg-slate-700/70 text-slate-300'
            }`}
          >
            工具<span className="underline">(U)</span>
          </button>

          {activeMenu === 'tools' && (
            <div className="absolute left-0 top-full mt-0.5 w-68 bg-slate-900 border border-slate-700 rounded shadow-2xl py-1 z-50 text-[11px]">
              <button
                onClick={() => {
                  onOpenModal('ota');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                  <span>S19 引导程序固件升级向导...</span>
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
                  <span>机载故障诊断代码与冻结帧快照...</span>
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
                  <span>M8-08 台架自动化工况闭环对拍...</span>
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
                  <span>Rust 原生上位机架构与源码生成器...</span>
                </div>
                <span className="text-slate-500 font-mono text-[10px]">Ctrl+R</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. 帮助 (H) */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
            onMouseEnter={() => activeMenu && setActiveMenu('help')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
              activeMenu === 'help'
                ? 'bg-slate-700 text-white font-semibold'
                : 'hover:bg-slate-700/70 text-slate-300'
            }`}
          >
            帮助<span className="underline">(H)</span>
          </button>

          {activeMenu === 'help' && (
            <div className="absolute left-0 top-full mt-0.5 w-60 bg-slate-900 border border-slate-700 rounded shadow-2xl py-1 z-50 text-[11px]">
              <button
                onClick={() => {
                  onOpenModal('help');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>通信接口与协议速查手册...</span>
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
                  <span>关于 ECU340 原生上位机系统...</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 右侧：单行集成的工程向导快捷入口 (不占额外工具栏高度，无任何功能重复) */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onOpenModal('parameters')}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="M5-04 整集标定参数工程向导 (Ctrl+M)"
        >
          <Sliders className="w-3 h-3 text-cyan-400" />
          <span>参数工程</span>
        </button>

        <button
          onClick={() => onOpenModal('ota')}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="S19 引导程序固件升级 (Ctrl+U)"
        >
          <UploadCloud className="w-3 h-3 text-amber-400" />
          <span>固件升级</span>
        </button>

        <button
          onClick={() => onOpenModal('diagnostics')}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="机载故障诊断与原始报文监听 (Ctrl+D)"
        >
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          <span>故障诊断</span>
        </button>

        <button
          onClick={() => onOpenModal('bench')}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="M8-08 台架自动化工况闭环对拍 (Ctrl+B)"
        >
          <FileCheck className="w-3 h-3 text-emerald-400" />
          <span>台架对拍</span>
        </button>

        <button
          onClick={() => onOpenModal('rust_code')}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-emerald-300 hover:text-emerald-200 hover:bg-slate-800 transition-colors font-mono"
          title="Rust 原生上位机架构与源码生成器 (Ctrl+R)"
        >
          <Code2 className="w-3 h-3 text-emerald-400" />
          <span>Rust源码</span>
        </button>
      </div>
    </div>
  );
};
