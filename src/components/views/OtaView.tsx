import React, { useState } from 'react';
import { OtaState } from '../../types/protocol';
import { UploadCloud, FileCode2, ShieldAlert, XCircle, AlertTriangle } from 'lucide-react';

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
  const [selectedFile, setSelectedFile] = useState<string>('ECU340_V3.41_发布版固件.s19');

  const isFlashing =
    otaState.status !== 'IDLE' &&
    otaState.status !== 'COMPLETED' &&
    otaState.status !== 'FAILED';

  const getStatusText = (status: string) => {
    switch (status) {
      case 'IDLE':
        return '空闲待命';
      case 'HANDSHAKE':
        return '握手校验引导程序版本中';
      case 'ERASE':
        return '正在擦除目标闪存扇区';
      case 'WRITING':
        return '正在分片烧写固件数据';
      case 'VERIFY':
        return '正在逐字节实读回比对校验';
      case 'SWITCH':
        return '正在生效重启新固件';
      case 'COMPLETED':
        return '固件升级成功';
      case 'FAILED':
        return '升级中止或校验失败';
      default:
        return status;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* 标题与单分区说明 */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>MC9S12XS128 引导加载程序固件升级向导</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              单物理分区运行 (单区约束)
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            升级报文采用 AA 55 帧头与 CRC16 循环冗余校验。严格执行物理闪存分页地址门禁，禁止越界侵入 FD 扇区与 0xF000..0xFFFF 引导程序保留扇区。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">当前升级状态:</span>
          <span
            className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
              otaState.status === 'COMPLETED'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : otaState.status === 'FAILED'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : isFlashing
                ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {getStatusText(otaState.status)}
          </span>
        </div>
      </div>

      {/* 固件文件与地址门禁栅格 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧：固件源文件选择与执行时序 */}
        <div className="md:col-span-2 space-y-6">
          {/* 文件选择 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded p-5 space-y-4">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              S19 格式固件镜像源文件
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                disabled={isFlashing}
                onClick={() => {
                  setSelectedFile('ECU340_V3.41_发布版固件.s19');
                  onSelectSampleS19('ECU340_V3.41_发布版固件.s19', false);
                }}
                className={`flex-1 p-3 text-left rounded border transition-colors ${
                  selectedFile === 'ECU340_V3.41_发布版固件.s19'
                    ? 'bg-slate-800 border-emerald-500/80 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-mono font-semibold">ECU340_V3.41_发布版固件.s19</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  官方发布镜像 (闪存分页 0x38..0x3E, 114,688 字节, 地址门禁合规)
                </div>
              </button>

              <button
                disabled={isFlashing}
                onClick={() => {
                  setSelectedFile('越界侵入测试样本_试图覆盖引导区.s19');
                  onSelectSampleS19('越界侵入测试样本_试图覆盖引导区.s19', true);
                }}
                className={`flex-1 p-3 text-left rounded border transition-colors ${
                  selectedFile === '越界侵入测试样本_试图覆盖引导区.s19'
                    ? 'bg-rose-950/60 border-rose-600/80 text-rose-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-mono font-semibold flex items-center gap-1 text-rose-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>越界样本: 试图覆盖引导程序扇区</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  包含 0x3EF200 地址 (触发安全门禁拦截拒绝，测试系统防护机制)
                </div>
              </button>
            </div>

            {/* 固件元数据概要 */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">代码有效净载荷</span>
                <span className="text-slate-200 tabular-nums">
                  {otaState.totalBytes.toLocaleString()} 字节
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">S19 有效记录行数</span>
                <span className="text-slate-200 tabular-nums">{otaState.recordCount} 行</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">固件完整性校验指纹</span>
                <span className="text-slate-300 truncate block text-[10px]">
                  E3B0C44298FC1C149AFB... (审计追溯)
                </span>
              </div>
            </div>

            {/* 错误拦截提示 */}
            {otaState.errorReason && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded flex items-center gap-2 text-xs text-rose-300">
                <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{otaState.errorReason}</span>
              </div>
            )}

            {/* 升级进度条 */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-sans">
                  {isFlashing ? `执行状态: ${getStatusText(otaState.status)}` : '等待操作指令'}
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

            {/* 触发与中止按钮 */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 font-sans">
              <span className="text-[11px] text-slate-400">
                固件分片写入完成后，将自动执行 100% 逐字节实读回比对校验
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
                    <span>执行安全烧写 (擦除并分片写入)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 升级管线步骤指示器 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded p-4 font-mono text-xs space-y-3 font-sans">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
              引导程序握手与固件升级时序链
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
              <div className={`p-2 rounded border ${otaState.status === 'HANDSHAKE' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                1. 握手与身份查询
              </div>
              <div className={`p-2 rounded border ${otaState.status === 'ERASE' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                2. 目标闪存页擦除
              </div>
              <div className={`p-2 rounded border ${otaState.status === 'WRITING' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                3. 固件分片写入
              </div>
              <div className={`p-2 rounded border ${otaState.status === 'VERIFY' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                4. 逐字节实读回比对
              </div>
              <div className={`p-2 rounded border ${otaState.status === 'SWITCH' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                5. 切换运行新固件
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：PPAGE 地址地图与安全门禁 */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              MC9S12XS128 闪存地址地图门禁
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
                    <span className="text-[10px] text-slate-400 font-sans">
                      闪存物理分页 0x{sec.ppage.toString(16).toUpperCase()} · {sec.length} 字节
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold font-sans ${
                      sec.status === 'VALID' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {sec.status === 'VALID' ? '校验通过' : '门禁拦截'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded p-4 space-y-2 text-xs text-slate-400">
            <div className="font-semibold text-slate-300">防呆规则与设计标准说明</div>
            <p className="leading-relaxed text-[11px]">
              依据设计规范，当前引导程序采用严格的单物理分区规则。升级前必须通过闪存分页精确校验，禁止跨区写入或篡改引导向量表，确保擦写断电时仍可通过引导模式恢复。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
