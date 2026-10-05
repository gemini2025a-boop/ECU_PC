import React, { useState } from 'react';
import { OtaState } from '../../types/protocol';
import { UploadCloud, FileCode2, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Cpu, ArrowRight } from 'lucide-react';

interface OtaViewProps {
  otaState: OtaState;
  onSelectSampleS19: (filename: string, isMalicious?: boolean) => void;
  onStartFlashing: () => void;
  onCancelFlashing: () => void;
}

export const OtaView: React.FC<OtaViewProps> = ({
  otaState,
  onSelectSampleS19,
  onStartFlashing,
  onCancelFlashing,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('ECU340_V3.41_RELEASE.s19');

  const isFlashing =
    otaState.status !== 'IDLE' &&
    otaState.status !== 'COMPLETED' &&
    otaState.status !== 'FAILED';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Title & Partition Notice */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>MC9S12XS128 BootLoader OTA 固件升级</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              单区模型 (PART_COUNT = 1)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            采用 AA 55 + CRC16-CCITT 帧协议。严格执行 PPAGE 地址门禁，拒绝覆盖 FD 扇区与 0xF000..0xFFFF BootLoader 保护区。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">升级状态:</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
              otaState.status === 'COMPLETED'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : otaState.status === 'FAILED'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : isFlashing
                ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {otaState.status}
          </span>
        </div>
      </div>

      {/* Grid: Firmware Selection & Address Gate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: File & Flash Progress */}
        <div className="md:col-span-2 space-y-6">
          {/* File Picker & Sample Switcher */}
          <div className="bg-slate-900/80 border border-slate-800 rounded p-5 space-y-4">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              S-Record (S19) 固件镜像源
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                disabled={isFlashing}
                onClick={() => {
                  setSelectedFile('ECU340_V3.41_RELEASE.s19');
                  onSelectSampleS19('ECU340_V3.41_RELEASE.s19', false);
                }}
                className={`flex-1 p-3 text-left rounded border transition-colors ${
                  selectedFile === 'ECU340_V3.41_RELEASE.s19'
                    ? 'bg-slate-800 border-emerald-500/80 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-mono font-semibold">ECU340_V3.41_RELEASE.s19</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  合法官方固件 (PPAGE 0x38..0x3E, 114,688 字节, 合法)
                </div>
              </button>

              <button
                disabled={isFlashing}
                onClick={() => {
                  setSelectedFile('TEST_ILLEGAL_BOOT_OVERWRITE.s19');
                  onSelectSampleS19('TEST_ILLEGAL_BOOT_OVERWRITE.s19', true);
                }}
                className={`flex-1 p-3 text-left rounded border transition-colors ${
                  selectedFile === 'TEST_ILLEGAL_BOOT_OVERWRITE.s19'
                    ? 'bg-rose-950/60 border-rose-600/80 text-rose-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-mono font-semibold flex items-center gap-1 text-rose-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>越界样本: 越入 Bootloader 区</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  包含 0xF200 地址 (触发门禁拦截，测试防御)
                </div>
              </button>
            </div>

            {/* Firmware Metadata Overview */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">代码有效净载荷</span>
                <span className="text-slate-200 tabular-nums">
                  {otaState.totalBytes.toLocaleString()} 字节
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">S19 记录行数</span>
                <span className="text-slate-200 tabular-nums">{otaState.recordCount} 条</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">SHA-256 完整性指纹</span>
                <span className="text-slate-400 truncate block text-[10px]">
                  E3B0C44298FC1C149AFB... (仅作追溯)
                </span>
              </div>
            </div>

            {/* Error Reason Display if any */}
            {otaState.errorReason && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded flex items-center gap-2 text-xs text-rose-300">
                <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{otaState.errorReason}</span>
              </div>
            )}

            {/* Flashing Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">
                  {isFlashing ? `执行中: ${otaState.status}` : '等待操作'}
                </span>
                <span className="text-slate-200 font-bold tabular-nums">
                  {otaState.progressPercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-150 ${
                    otaState.status === 'COMPLETED'
                      ? 'bg-emerald-500'
                      : otaState.status === 'FAILED'
                      ? 'bg-rose-500'
                      : 'bg-cyan-500'
                  }`}
                  style={{ width: `${otaState.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Trigger / Cancel buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-500">
                写后自动执行 100% 实读回 (Readback Verify) 校验
              </span>
              <div className="flex items-center gap-3">
                {isFlashing ? (
                  <button
                    onClick={onCancelFlashing}
                    className="px-4 py-2 text-xs font-semibold bg-rose-700 hover:bg-rose-600 text-white rounded transition-colors"
                  >
                    紧急中止升级
                  </button>
                ) : (
                  <button
                    onClick={onStartFlashing}
                    disabled={Boolean(otaState.errorReason)}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded transition-colors"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>执行安全刷写 (Erase & Write)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Flash Pipeline Stages */}
          <div className="bg-slate-900/80 border border-slate-800 rounded p-4 font-mono text-xs space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              BootLoader 握手与升级时序链
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
              <div className={`p-2 rounded border ${otaState.status === 'HANDSHAKE' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                1. 握手与身份
              </div>
              <div className={`p-2 rounded border ${otaState.status === 'ERASE' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                2. 目标页擦除
              </div>
              <div className={`p-2 rounded border ${otaState.status === 'WRITING' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                3. 分片写入
              </div>
              <div className={`p-2 rounded border ${otaState.status === 'VERIFY' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                4. 实读回校验
              </div>
              <div className={`p-2 rounded border ${otaState.status === 'SWITCH' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                5. 切换运行
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: PPAGE Memory Map & Protection Rules */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              MC9S12XS128 地址地图门禁
            </h3>

            <div className="space-y-2 text-xs font-mono">
              {otaState.validS19Sections.map((sec, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded border flex items-center justify-between ${
                    sec.status === 'VALID'
                      ? 'bg-slate-950 border-slate-800 text-slate-300'
                      : 'bg-rose-950/40 border-rose-800 text-rose-300'
                  }`}
                >
                  <div>
                    <span className="font-semibold block">{sec.address}</span>
                    <span className="text-[10px] text-slate-500">
                      PPAGE 0x{sec.ppage.toString(16).toUpperCase()} · {sec.length} 字节
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold ${
                      sec.status === 'VALID' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {sec.status === 'VALID' ? '通过' : '门禁拒绝'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded p-4 space-y-2 text-xs text-slate-400">
            <div className="font-semibold text-slate-300">防呆与设计规范说明</div>
            <p className="leading-relaxed text-[11px]">
              依据设计规范，当前 BootLoader 的单区规则（PART_COUNT=1）生效，界面不展示虚拟 A/B 双区回滚功能。升级前必须通过 PPAGE 精确校验，禁止跨区或篡改向量表。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
