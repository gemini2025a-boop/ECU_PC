import React from 'react';
import { Info, Cpu, ShieldCheck, Terminal, Code2 } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-xl w-full shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="h-12 px-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              关于 ECU340 原生上位机系统
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-mono"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          <div>
            <div className="text-base font-bold text-slate-100">ECU340 Host Suite (Rust 工业上位机)</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Version 1.0.0 · Target: NXP/Freescale MC9S12XS128
            </div>
          </div>

          <p className="leading-relaxed text-slate-400 text-xs">
            本系统严格按照《上位机-MCU SCI 接口总结》与《ECU340 上位机实施计划》规范研发。主界面核心聚焦于高刷新率实时遥测与快捷指令控制台，扩展工具（M5 参数事务、S19 OTA 升级、DTC 诊断、M8-08 台架对拍及 Rust 代码生成）全部收纳至顶部状态栏，保证主控操作纯粹高效。
          </p>

          <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">GUI 框架:</span>
              <span className="text-slate-200">Rust eframe / egui 0.29 (Native 60FPS)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">串口驱动:</span>
              <span className="text-slate-200">serialport 4.5 (无锁 Crossbeam Worker 线程)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">内存占用:</span>
              <span className="text-emerald-400">~18 MB (冷启动 &lt; 50ms)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">分区模型:</span>
              <span className="text-amber-400">单区约束 (PART_COUNT = 1)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-11 px-5 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};
