import React, { useState } from 'react';
import { DtcCode, RawSciFrame } from '../../types/protocol';
import { HexViewer } from '../widgets/HexViewer';
import { ShieldAlert, Download, RefreshCw, Trash2 } from 'lucide-react';

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
      '序号,传输方向,时间戳,通信协议,十六进制报文,业务语义\n' +
      rawFrames
        .map(
          f =>
            `${f.id},${f.dir === 'TX' ? '下行发送' : '上行接收'},${f.timestamp},${f.protocol},"${f.rawHex}","${f.summary}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ECU340_串口通信报文流水_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryText = (cat: string) => {
    switch (cat) {
      case 'SENSOR':
        return '传感器输入回路';
      case 'SYSTEM':
        return '母线电气与供电';
      case 'ACTUATOR':
        return '执行器输出驱动';
      case 'FLASH_ECC':
        return '闪存校验与数据完整性';
      default:
        return cat;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-rose-400 bg-rose-950/60 border border-rose-800">现行故障</span>;
      case 'LATCHED':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800">硬性锁存</span>;
      case 'STICKY':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-300 bg-slate-800 border border-slate-700">历史间歇</span>;
      case 'SAFE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800">安全降级</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 font-sans">
      {/* 上方分栏：故障代码列表 + 冻结帧快照 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧：故障码表格 */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                机载故障诊断代码字典与实时判定状态
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onRefreshDtc}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                title="重新查询控制器机载故障诊断码"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>刷新故障码</span>
              </button>

              <button
                onClick={onClearDtc}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-rose-300 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 rounded transition-colors"
                title="向控制器发送指令清除历史与现行故障码"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清除故障码</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-sans">
                <tr>
                  <th className="py-2 px-3">故障编码</th>
                  <th className="py-2 px-3">故障定义与受控部件</th>
                  <th className="py-2 px-3">归属类别</th>
                  <th className="py-2 px-3">状态判定</th>
                  <th className="py-2 px-3">累计次数</th>
                  <th className="py-2 px-3">首次触发时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {dtcList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 italic font-sans">
                      系统健康状态优良，当前未检测到任何活动或历史故障码。
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
                      <td className="py-2.5 px-3 text-slate-200 font-sans">
                        {dtc.description}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans">
                        {getCategoryText(dtc.category)}
                      </td>
                      <td className="py-2.5 px-3">
                        {getStatusBadge(dtc.status)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 tabular-nums">
                        {dtc.count} 次
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] tabular-nums">
                        {dtc.timestamp}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 右侧：物理冻结帧快照 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-sans">
              故障物理参数冻结帧快照
            </span>
            <button
              onClick={handleExportLogs}
              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-sans"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出原始报文日志</span>
            </button>
          </div>

          {selectedDtc ? (
            <div className="space-y-2 text-slate-300 text-xs">
              <div className="text-amber-400 font-bold text-sm font-sans">
                [{selectedDtc.code}] {selectedDtc.description}
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1.5 text-[11px]">
                <div className="text-slate-400 font-sans">故障触发瞬间发动机运行工况:</div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">发动机瞬时转速:</span>
                  <span className="text-slate-100">2450 转/分</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">1缸缸头温度:</span>
                  <span className="text-rose-400">188 ℃</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">主喷油脉宽:</span>
                  <span className="text-slate-100">2400 微秒</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">主供电母线电压:</span>
                  <span className="text-slate-100">12.4 伏特</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">进气歧管绝对压力:</span>
                  <span className="text-slate-100">985 毫巴</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-sans leading-relaxed">
                判定说明: 故障状态包括现行激活、历史间歇、硬性锁存及安全降级保护。
              </div>
            </div>
          ) : (
            <div className="text-slate-500 py-8 text-center italic text-xs font-sans">
              在左侧列表中点击任一故障码，即可调取触发时刻的传感器物理参数冻结帧快照。
            </div>
          )}
        </div>
      </div>

      {/* 下方：完整串口原始报文监控台 */}
      <div className="h-80">
        <HexViewer frames={rawFrames} onClear={onClearFrames} />
      </div>
    </div>
  );
};
