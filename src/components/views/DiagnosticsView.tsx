import React, { useState } from 'react';
import { DtcCode, RawSciFrame } from '../../types/protocol';
import { HexViewer } from '../widgets/HexViewer';
import { AlertCircle, CheckCircle, ShieldAlert, Download, RefreshCw, Trash2, Filter } from 'lucide-react';

interface DiagnosticsViewProps {
  dtcList: DtcCode[];
  onClearDtc: () => void;
  onRefreshDtc: () => void;
  rawFrames: RawSciFrame[];
  onClearFrames: () => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  dtcList,
  onClearDtc,
  onRefreshDtc,
  rawFrames,
  onClearFrames,
}) => {
  const [selectedDtc, setSelectedDtc] = useState<DtcCode | null>(null);

  const handleExportLogs = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Dir,Timestamp,Protocol,Hex,Summary\n' +
      rawFrames
        .map(
          f =>
            `${f.id},${f.dir},${f.timestamp},${f.protocol},"${f.rawHex}","${f.summary}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ECU340_SCI_LOG_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Top Split: DTC Tree & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: DTC Codes Table */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                机载故障码 (DTC) 诊断字典与状态
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onRefreshDtc}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>刷新 DTC</span>
              </button>

              <button
                onClick={onClearDtc}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-300 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清除故障码</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-2 px-3">DTC 编码</th>
                  <th className="py-2 px-3">描述与受控部件</th>
                  <th className="py-2 px-3">类别</th>
                  <th className="py-2 px-3">故障状态</th>
                  <th className="py-2 px-3">计数</th>
                  <th className="py-2 px-3">首次触发时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {dtcList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                      系统状态 NOMINAL，暂无活动故障码 (No Active DTCs)
                    </td>
                  </tr>
                ) : (
                  dtcList.map(dtc => (
                    <tr
                      key={dtc.code}
                      onClick={() => setSelectedDtc(dtc)}
                      className={`cursor-pointer transition-colors ${
                        selectedDtc?.code === dtc.code
                          ? 'bg-slate-800/90'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-amber-400">
                        {dtc.code}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">
                        {dtc.description}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {dtc.category}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            dtc.status === 'ACTIVE'
                              ? 'text-rose-400 bg-rose-950/60'
                              : dtc.status === 'LATCHED'
                              ? 'text-amber-400 bg-amber-950/60'
                              : 'text-slate-400 bg-slate-800'
                          }`}
                        >
                          {dtc.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 tabular-nums">
                        {dtc.count} 次
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] tabular-nums">
                        {dtc.timestamp}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Freeze Frame Details & Log Export */}
        <div className="bg-slate-900/80 border border-slate-800 rounded p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              冻结帧快照 (Freeze Frame)
            </span>
            <button
              onClick={handleExportLogs}
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出原始报文 (CSV)</span>
            </button>
          </div>

          {selectedDtc ? (
            <div className="space-y-2 text-slate-300 text-xs">
              <div className="text-amber-400 font-bold text-sm">
                [{selectedDtc.code}] {selectedDtc.description}
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1 text-[11px]">
                <div className="text-slate-500">快照触发点发动机状态:</div>
                <div className="flex justify-between">
                  <span className="text-slate-400">发动机转速:</span>
                  <span className="text-slate-200">2450 RPM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">冷却液/CHT1:</span>
                  <span className="text-rose-400">188 ℃</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">主喷油脉宽:</span>
                  <span className="text-slate-200">2400 µs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">母线电压:</span>
                  <span className="text-slate-200">12.4 V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">进气歧管气压:</span>
                  <span className="text-slate-200">985 mbar</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500">
                提示: 故障状态包含 ACTIVE(现行)、STICKY(历史)、LATCHED(硬性锁存)、SAFE(已降级)。
              </div>
            </div>
          ) : (
            <div className="text-slate-500 py-8 text-center italic text-xs">
              在左侧点击任一 DTC 故障码以查看触发时的发动机传感器物理冻结帧快照。
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Raw SCI Hex & Byte Stream Inspector */}
      <div className="h-80">
        <HexViewer frames={rawFrames} onClear={onClearFrames} />
      </div>
    </div>
  );
};
