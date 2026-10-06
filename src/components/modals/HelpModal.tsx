import React from 'react';
import { Terminal, ShieldAlert, Cpu, BookOpen } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* 顶部标题栏 */}
        <div className="h-12 px-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              ECU340 / MC9S12XS128 上位机通信接口与协议速查手册
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans text-slate-300">
          {/* 第1节: 物理层与帧格式 */}
          <div className="space-y-2">
            <div className="text-emerald-400 font-bold text-xs uppercase flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              <span>1. 物理层总线与四种应用协议帧格式</span>
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] leading-relaxed">
              <div>物理通道: SCI1 / RS422 工业差分通信总线，固定波特率 115200，8-N-1 (8位数据/无校验/1停止位)。</div>
              <div>校验规则: 8 位累加和（与 OTA 固件升级的 CRC16 相互独立，互不通用）。</div>
              <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 space-y-1 font-mono">
                <div>• <span className="text-amber-400 font-bold font-sans">ZH31 协议</span> (标准默认): 下行 8字节 <code className="text-slate-200">EC 0A CMD DataH DataL Sum 0D 0A</code> / 上行 31字节</div>
                <div>• <span className="text-cyan-400 font-bold font-sans">ZH40 协议</span>: 下行 8字节 <code className="text-slate-200">EB 90 08 Cnt CMD DataH DataL Sum</code> / 上行 40字节 (含固件版本号)</div>
                <div>• <span className="text-purple-400 font-bold font-sans">BH19 协议</span>: 下行 6字节 <code className="text-slate-200">ED 0A CMD DataH DataL Sum</code> / 上行 19字节 (精简机载遥测)</div>
                <div>• <span className="text-rose-400 font-bold font-sans">地址标定协议</span>: 下行 6字节 <code className="text-slate-200">Addr DataH DataL Sum FA FB</code> / 上行 84字节 (14项工程兼容)</div>
              </div>
            </div>
          </div>

          {/* 第2节: 指令字与语义 */}
          <div className="space-y-2">
            <div className="text-amber-400 font-bold text-xs uppercase flex items-center gap-1.5">
              <Terminal className="w-4 h-4" />
              <span>2. 核心控制指令编码与底层执行语义</span>
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] leading-relaxed space-y-1">
              <div>• <span className="text-emerald-400 font-bold font-mono">命令 42 (起动请求)</span>: 置位起动吸合标志位，吸合起动机拖动点火。</div>
              <div>• <span className="text-amber-400 font-bold font-mono">命令 64 (节气门开度)</span>: 参数 0..1000 对应 0..100.0% 油门节气门开度。</div>
              <div>• <span className="text-rose-400 font-bold font-mono">命令 65 (停机锁电)</span>: 联锁紧急停机，立即停止喷油并锁定混合动力电机脉宽为 800微秒 安全值。</div>
              <div>• <span className="text-cyan-400 font-bold font-mono">命令 161 (喷油脉宽)</span>: 喷油死区门限 400微秒，输入 &lt; 400微秒 直接丢弃；仅上位机标定使能生效。</div>
              <div>• <span className="text-purple-400 font-bold font-mono">命令 160 (点火提前角)</span>: 点火角在线微调，仅上位机标定源使能生效。</div>
              <div>• <span className="text-slate-300 font-bold font-mono">命令 166 / 167 (减油 / 加油)</span>: 互斥写入（写入加油量 167 时底层自动清空减油量 166）。</div>
              <div>• <span className="text-blue-400 font-bold font-mono">命令 0x98 (时钟上报)</span>: 触发机载实时时钟连续七段上报（年月日星期时分秒）。</div>
            </div>
          </div>

          {/* 第3节: M5 参数事务 */}
          <div className="space-y-2">
            <div className="text-cyan-400 font-bold text-xs uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>3. M5-04 整集标定参数事务 (7544字节) 规程约束</span>
            </div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] leading-relaxed">
              <div>帧头结构: <code className="text-slate-200 font-mono">EA 0A CMD LEN_H LEN_L DATA CRC_H CRC_L</code> (采用 CRC16-CCITT 多项式)。</div>
              <div>载荷规格: 净载荷 7544 字节 = 44 × 168字节 + 152字节，严格按 45 包传输，每包 8 字节对齐。</div>
              <div>安全事务流水: 停机确认 → 锁存输出 800微秒 → 0xB0 启动事务 → 45包 0xB1 写入 → 0xB2 提交校验 → 45包 0xB3 逐字节实读回比对 → 0xB4 查询结果 → 发送完成确认软复位。</div>
            </div>
          </div>
        </div>

        {/* 底部关闭按钮 */}
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
