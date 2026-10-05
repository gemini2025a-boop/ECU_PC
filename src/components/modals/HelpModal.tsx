import React from 'react';
import { Terminal, ShieldAlert, Cpu, BookOpen, AlertTriangle } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="h-12 px-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              ECU340 / MC9S12XS128 上位机通信接口速查手册
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-mono"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono text-slate-300">
          {/* Section 1: Physical & Frame Types */}
          <div className="space-y-2">
            <div className="text-emerald-400 font-bold text-xs uppercase flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              <span>1. 物理层通道与旧协议下行/上行帧格式</span>
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] leading-relaxed">
              <div>物理通道: SCI1 / RS422，波特率 115200，8-N-1。</div>
              <div>校验规则: 8 位累加和（和 OTA 的 CRC16 分离，互不通用）。</div>
              <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 space-y-0.5">
                <div>• <span className="text-amber-400">ZH31</span> (ECU340默认): 下行 8B <code className="text-slate-200">EC 0A CMD DataH DataL Sum 0D 0A</code> / 上行 31B</div>
                <div>• <span className="text-cyan-400">ZH40</span>: 下行 8B <code className="text-slate-200">EB 90 08 Cnt CMD DataH DataL Sum</code> / 上行 40B</div>
                <div>• <span className="text-purple-400">BH19</span>: 下行 6B <code className="text-slate-200">ED 0A CMD DataH DataL Sum</code> / 上行 19B</div>
                <div>• <span className="text-rose-400">地址标定</span>: 下行 6B <code className="text-slate-200">Addr DataH DataL Sum FA FB</code> / 上行 84B</div>
              </div>
            </div>
          </div>

          {/* Section 2: Command Dictionary & Semantics */}
          <div className="space-y-2">
            <div className="text-amber-400 font-bold text-xs uppercase flex items-center gap-1.5">
              <Terminal className="w-4 h-4" />
              <span>2. 关键指令字与 ApplyRx 执行语义</span>
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] leading-relaxed space-y-1">
              <div>• <span className="text-emerald-400 font-bold">42 (起动)</span>: 置位 starter_request，电磁阀起动。</div>
              <div>• <span className="text-amber-400 font-bold">64 (油门)</span>: 0..1000 对应 0..100.0% 油门开度。</div>
              <div>• <span className="text-rose-400 font-bold">65 (停机)</span>: 联锁停机，强制设置混合电机脉宽为 800µs。</div>
              <div>• <span className="text-cyan-400 font-bold">161 (喷油)</span>: 喷油死区门限默认 400µs，输入 &lt; 400µs 直接丢弃；仅 map_source_pc=1 有效。</div>
              <div>• <span className="text-purple-400 font-bold">160 (点火)</span>: 点火角调节，仅 map_source_pc=1 有效。</div>
              <div>• <span className="text-slate-300 font-bold">166 / 167 (减油 / 加油)</span>: 互斥写入（写入 167 自动清除 166）。</div>
              <div>• <span className="text-blue-400 font-bold">0x98 (RTC)</span>: 分段上传触发，连续 7 帧上报年月日星期时分秒。</div>
            </div>
          </div>

          {/* Section 3: M5 Parameter Protocol Rules */}
          <div className="space-y-2">
            <div className="text-cyan-400 font-bold text-xs uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>3. M5-04 参数事务 (EA 0A, 7544B) 约束</span>
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] leading-relaxed">
              <div>帧头: <code className="text-slate-200">EA 0A CMD LEN_H LEN_L DATA CRC_H CRC_L</code> (CRC16-CCITT 0x1021)。</div>
              <div>载荷: 7544 字节 = 44 × 168B + 152B，共 45 包，8 字节对齐。</div>
              <div>保存规程: 停机确认 → 输出锁存 800µs → 0xB0 BEGIN → 45包 0xB1 DATA → 0xB2 COMMIT → 45包 0xB3 实读回校验 → 0xB4 RESULT → SCI TC 复位。</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-10 px-5 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
          >
            关闭手册
          </button>
        </div>
      </div>
    </div>
  );
};
