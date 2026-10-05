import React, { useState } from 'react';
import { RawSciFrame } from '../../types/protocol';
import { ArrowDownLeft, ArrowUpRight, Copy, Check, Filter, Trash2 } from 'lucide-react';

interface HexViewerProps {
  frames: RawSciFrame[];
  onClear: () => void;
}

export const HexViewer: React.FC<HexViewerProps> = ({ frames, onClear }) => {
  const [filterDir, setFilterDir] = useState<'ALL' | 'TX' | 'RX'>('ALL');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<RawSciFrame | null>(null);

  const filtered = frames.filter((f) => {
    if (filterDir === 'TX') return f.dir === 'TX';
    if (filterDir === 'RX') return f.dir === 'RX';
    return true;
  });

  const handleCopy = (frame: RawSciFrame) => {
    navigator.clipboard.writeText(frame.rawHex);
    setCopiedId(frame.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border border-slate-800 rounded overflow-hidden">
      {/* Viewer Header */}
      <div className="h-9 px-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300 tracking-wider uppercase text-[11px]">
            SCI1 RS422 原始报文监控 ({filtered.length} 帧)
          </span>

          {/* Direction filters */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-0.5 text-[11px]">
            {(['ALL', 'TX', 'RX'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setFilterDir(dir)}
                className={`px-2 py-0.5 rounded font-mono ${
                  filterDir === dir
                    ? 'bg-slate-700 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800/60 transition-colors"
          title="清空报文缓冲区"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>清空</span>
        </button>
      </div>

      {/* Frame Table & Detail split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Frame List */}
        <div className="flex-1 overflow-y-auto font-mono text-xs divide-y divide-slate-800/40">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-500 italic">
              暂无 SCI 报文数据。开启仿真或发送命令以捕获报文。
            </div>
          ) : (
            filtered.map((f) => {
              const isSelected = selectedFrame?.id === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFrame(f)}
                  className={`px-3 py-1.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-800/90'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {/* Direction Badge */}
                    <span
                      className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[10px] font-bold ${
                        f.dir === 'TX'
                          ? 'text-cyan-400 bg-cyan-950/60'
                          : 'text-emerald-400 bg-emerald-950/60'
                      }`}
                    >
                      {f.dir === 'TX' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownLeft className="w-3 h-3" />
                      )}
                      {f.dir}
                    </span>

                    {/* Timestamp */}
                    <span className="text-slate-500 text-[11px] shrink-0 tabular-nums">
                      {f.timestamp}
                    </span>

                    {/* Protocol Tag */}
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                      [{f.protocol}]
                    </span>

                    {/* Raw Hex Stream */}
                    <span className="text-slate-300 truncate tracking-wide text-[11px]">
                      {f.rawHex}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-500 text-[10px] hidden sm:inline">
                      {f.summary}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(f);
                      }}
                      className="p-1 text-slate-500 hover:text-slate-200"
                      title="复制十六进制"
                    >
                      {copiedId === f.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Frame Detail Pane */}
        {selectedFrame && (
          <div className="w-72 bg-slate-950/90 border-l border-slate-800 p-3 text-xs font-mono overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300 uppercase text-[11px]">
                帧结构字段分析
              </span>
              <button
                onClick={() => setSelectedFrame(null)}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-slate-400">
              <div>
                <span className="text-slate-500 text-[10px] block">时间与方向</span>
                <span className="text-slate-200">
                  {selectedFrame.timestamp} · {selectedFrame.dir}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">协议类型与长度</span>
                <span className="text-slate-200">
                  {selectedFrame.protocol} ({selectedFrame.bytes.length} 字节)
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">语义摘要</span>
                <span className="text-emerald-400">{selectedFrame.summary}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block">十六进制分词</span>
                <div className="bg-slate-900 p-2 rounded border border-slate-800 break-all text-[11px] leading-relaxed text-slate-200">
                  {selectedFrame.bytes.map((b, idx) => (
                    <span
                      key={idx}
                      className={`inline-block mr-1.5 ${
                        idx < 2
                          ? 'text-cyan-400' // Header
                          : idx === selectedFrame.bytes.length - 1 || idx === selectedFrame.bytes.length - 2
                          ? 'text-amber-400' // Checksum / EOF
                          : 'text-slate-300'
                      }`}
                      title={`字节 #${idx}: 0x${b.toString(16).padStart(2, '0').toUpperCase()} (${b})`}
                    >
                      {b.toString(16).padStart(2, '0').toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 space-y-1">
                <div><span className="text-cyan-400">青色</span>: 帧头 / 命令字</div>
                <div><span className="text-slate-300">白色</span>: 载荷数据</div>
                <div><span className="text-amber-400">黄色</span>: 校验和 (8位累加和 / CRC16)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
