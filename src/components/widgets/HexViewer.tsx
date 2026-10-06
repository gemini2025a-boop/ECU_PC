import React, { useState } from 'react';
import { RawSciFrame } from '../../types/protocol';
import { ArrowDownLeft, ArrowUpRight, Copy, Check, Trash2 } from 'lucide-react';

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

  const getProtocolChinese = (proto: string) => {
    switch (proto) {
      case 'PARAM_EA':
        return 'M5参数协议';
      case 'OTA_AA':
        return '固件升级协议';
      case 'ZH31':
        return 'ZH31标准协议';
      case 'ZH40':
        return 'ZH40协议';
      case 'BH19':
        return 'BH19协议';
      case 'ADDRESS':
        return '地址标定协议';
      default:
        return proto;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 border border-slate-800 rounded overflow-hidden">
      {/* 监视器顶部栏 */}
      <div className="h-9 px-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs font-sans">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200 tracking-wider text-[11px]">
            串口通信物理报文实时流水 ({filtered.length} 帧)
          </span>

          {/* 方向过滤器 */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-0.5 text-[11px]">
            {[
              { id: 'ALL', label: '全部报文' },
              { id: 'TX', label: '仅下行发送' },
              { id: 'RX', label: '仅上行接收' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilterDir(item.id as 'ALL' | 'TX' | 'RX')}
                className={`px-2 py-0.5 rounded font-sans ${
                  filterDir === item.id
                    ? 'bg-slate-700 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800/60 transition-colors font-sans"
          title="清空当前报文缓冲区"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>清空报文记录</span>
        </button>
      </div>

      {/* 报文列表与字段解析分栏 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 报文流列表 */}
        <div className="flex-1 overflow-y-auto font-mono text-xs divide-y divide-slate-800/40">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-500 italic font-sans">
              暂无串口通信报文数据。开启 20Hz 仿真或下发命令以捕获通信报文。
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
                    {/* 方向标签 */}
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold font-sans ${
                        f.dir === 'TX'
                          ? 'text-cyan-400 bg-cyan-950/60'
                          : 'text-emerald-400 bg-emerald-950/60'
                      }`}
                    >
                      {f.dir === 'TX' ? (
                        <>
                          <ArrowUpRight className="w-3 h-3" />
                          <span>下行</span>
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="w-3 h-3" />
                          <span>上行</span>
                        </>
                      )}
                    </span>

                    {/* 时间戳 */}
                    <span className="text-slate-500 text-[11px] shrink-0 tabular-nums">
                      {f.timestamp}
                    </span>

                    {/* 协议标识 */}
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0 font-sans">
                      [{getProtocolChinese(f.protocol)}]
                    </span>

                    {/* 十六进制字串 */}
                    <span className="text-slate-200 truncate tracking-wide text-[11px]">
                      {f.rawHex}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-400 text-[10px] hidden sm:inline font-sans">
                      {f.summary}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(f);
                      }}
                      className="p-1 text-slate-500 hover:text-slate-200"
                      title="复制十六进制报文"
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

        {/* 选中报文详细字段分解面板 */}
        {selectedFrame && (
          <div className="w-72 bg-slate-950/90 border-l border-slate-800 p-3 text-xs font-mono overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-200 uppercase text-[11px] font-sans">
                帧结构字段详细分析
              </span>
              <button
                onClick={() => setSelectedFrame(null)}
                className="text-slate-500 hover:text-slate-300 text-sm font-sans"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-slate-400">
              <div>
                <span className="text-slate-500 text-[10px] block font-sans">时间与传输方向</span>
                <span className="text-slate-200 font-sans">
                  {selectedFrame.timestamp} · {selectedFrame.dir === 'TX' ? '下行发送 (上位机→控制器)' : '上行接收 (控制器→上位机)'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block font-sans">协议类型与帧字节数</span>
                <span className="text-slate-200 font-sans">
                  {getProtocolChinese(selectedFrame.protocol)} ({selectedFrame.bytes.length} 字节)
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block font-sans">业务语义解析</span>
                <span className="text-emerald-400 font-sans">{selectedFrame.summary}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block font-sans">十六进制分词</span>
                <div className="bg-slate-900 p-2 rounded border border-slate-800 break-all text-[11px] leading-relaxed text-slate-200">
                  {selectedFrame.bytes.map((b, idx) => (
                    <span
                      key={idx}
                      className={`inline-block mr-1.5 ${
                        idx < 2
                          ? 'text-cyan-400'
                          : idx === selectedFrame.bytes.length - 1 || idx === selectedFrame.bytes.length - 2
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                      title={`字节序号 #${idx}: 0x${b.toString(16).padStart(2, '0').toUpperCase()} (十进制: ${b})`}
                    >
                      {b.toString(16).padStart(2, '0').toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1 font-sans">
                <div><span className="text-cyan-400 font-mono">青色字节</span>: 帧同步头 / 命令字</div>
                <div><span className="text-slate-300 font-mono">白色字节</span>: 载荷有效数据</div>
                <div><span className="text-amber-400 font-mono">黄色字节</span>: 校验和 (8位累加和 / CRC16循环冗余校验)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
