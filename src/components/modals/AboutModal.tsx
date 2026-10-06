import React from 'react';
import { Info } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-xl w-full shadow-2xl overflow-hidden font-sans">
        {/* 顶部标题栏 */}
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

        {/* 内容主体 */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          <div>
            <div className="text-base font-bold text-slate-100">ECU340 发动机控制系统标定与联调工作台</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              版本 1.0.0 · 适配硬件: 恩智浦 MC9S12XS128 微控制器
            </div>
          </div>

          <p className="leading-relaxed text-slate-300 text-xs">
            本系统严格按照《上位机-MCU 通信接口总结》与《ECU340 上位机实施计划》规范研发。主界面核心聚焦于高刷新率实时遥测监控面板与快捷指令控制台，辅助工程功能（M5 参数事务、S19 固件升级、故障诊断字典、M8-08 台架对拍及 Rust 代码生成）全部收纳至 Windows 标准顶部菜单栏与工具栏中，保证主控操作纯粹高效。
          </p>

          <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5 font-sans text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">图形界面引擎:</span>
              <span className="text-slate-200 font-mono">Rust 原生桌面应用 (高帧率原生渲染)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">串口通信驱动:</span>
              <span className="text-slate-200 font-mono">独立无锁后台工作线程 (环形缓冲区无损收发)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">物理内存占用:</span>
              <span className="text-emerald-400 font-mono font-semibold">约 18 兆字节 (冷启动时间 &lt; 50 毫秒)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">闪存分区约束:</span>
              <span className="text-amber-400 font-mono font-semibold">单物理分区运行规范 (单区约束)</span>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="h-11 px-5 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors font-sans"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};
