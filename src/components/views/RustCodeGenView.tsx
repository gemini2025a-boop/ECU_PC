import React, { useState } from 'react';
import { RUST_CODE_MODULES } from '../../services/rustTemplates';
import { Code2, Copy, Check, Download, ShieldCheck, Terminal, Cpu } from 'lucide-react';

export const RustCodeGenView: React.FC = () => {
  const [selectedModuleIdx, setSelectedModuleIdx] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const activeModule = RUST_CODE_MODULES[selectedModuleIdx];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeModule.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const element = document.createElement('a');
    const file = new Blob([activeModule.code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = activeModule.filename.split('/').pop() || 'code.rs';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* 视图顶栏 */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <span>Rust 原生上位机工程架构与代码生成器</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Rust 2021 稳定版 · 原生桌面应用
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            按《ECU340 上位机实施计划》分层规范交付：通信线程无锁解耦、核心协议无运行时依赖、严格满足 45 包参数事务与 S19 门禁。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadFile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载当前文件</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors shadow-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '已复制到剪贴板！' : '复制代码内容'}</span>
          </button>
        </div>
      </div>

      {/* 架构亮点横幅 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded space-y-1">
          <div className="text-emerald-400 font-bold flex items-center gap-1.5 font-sans">
            <Cpu className="w-4 h-4" />
            <span>分层解耦架构 (Crates)</span>
          </div>
          <div className="text-slate-400 text-[11px] leading-relaxed font-sans">
            协议核心独立于 UI，可用黄金测试向量做纯内存单测，界面随时可从 egui 换为其他原生桌面渲染框架。
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded space-y-1">
          <div className="text-cyan-400 font-bold flex items-center gap-1.5 font-sans">
            <Terminal className="w-4 h-4" />
            <span>无锁通信通道 (Crossbeam)</span>
          </div>
          <div className="text-slate-400 text-[11px] leading-relaxed font-sans">
            物理串口在独立操作系统后台线程持续 20Hz 轮询，通过有界管道传递事件，彻底避免界面绘制卡顿导致串口丢失半帧。
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded space-y-1">
          <div className="text-amber-400 font-bold flex items-center gap-1.5 font-sans">
            <ShieldCheck className="w-4 h-4" />
            <span>内存安全与地址门禁</span>
          </div>
          <div className="text-slate-400 text-[11px] leading-relaxed font-sans">
            Rust 类型系统保障 8 字节对齐，S19 解析器编译期保证禁止向引导程序 [0xF000..0xFFFF] 及 FD 页写入数据。
          </div>
        </div>
      </div>

      {/* 代码文件浏览区 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 模块侧边栏 */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block px-1">
            Rust 工程源代码模块清单
          </span>

          <div className="space-y-1">
            {RUST_CODE_MODULES.map((mod, idx) => {
              const active = selectedModuleIdx === idx;
              return (
                <button
                  key={mod.filename}
                  onClick={() => setSelectedModuleIdx(idx)}
                  className={`w-full text-left p-2.5 rounded border transition-colors ${
                    active
                      ? 'bg-slate-800 border-emerald-500/80 text-emerald-300'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-mono font-semibold truncate">
                    {mod.filename.split('/').pop()}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {mod.crateName}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Windows 编译运行指南 */}
          <div className="mt-4 p-3 bg-slate-900/70 border border-slate-800 rounded text-xs space-y-2 font-mono">
            <div className="text-slate-200 font-bold text-[11px] uppercase font-sans">
              Windows 构建命令
            </div>
            <div className="bg-slate-950 p-2 rounded text-slate-200 text-[11px] select-all">
              cargo build --release
            </div>
            <div className="text-[10px] text-slate-400 leading-relaxed font-sans">
              生成单执行文件：<br />
              <code className="text-slate-300">target/release/ecu-pc.exe</code><br />
              内存占用约 18MB，冷启动时间 &lt; 50毫秒。
            </div>
          </div>
        </div>

        {/* 代码显示区 */}
        <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded overflow-hidden flex flex-col">
          {/* 文件顶条 */}
          <div className="h-10 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-semibold">{activeModule.filename}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 text-[11px] hidden sm:inline font-sans">
                {activeModule.description}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1 font-sans"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : '复制代码'}</span>
            </button>
          </div>

          {/* 代码正文 */}
          <div className="p-4 bg-[#070a0f] font-mono text-xs text-slate-300 overflow-x-auto overflow-y-auto max-h-[580px] leading-relaxed selection:bg-emerald-950 selection:text-emerald-200">
            <pre>
              <code>{activeModule.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
