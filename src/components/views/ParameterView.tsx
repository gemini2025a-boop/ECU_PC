import React, { useState } from 'react';
import { ParameterItem, ParamTransactionState } from '../../types/protocol';
import { Save, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert, Cpu, ArrowRight, Layers, FileCode } from 'lucide-react';

interface ParameterViewProps {
  onStartTransaction: (updatedItems: ParameterItem[]) => void;
  txState: ParamTransactionState;
  onResetTx: () => void;
  onStepSimulateTx?: () => void;
}

const INITIAL_PARAMETERS: ParameterItem[] = [
  {
    id: 'PARAM_IDLE_RPM',
    name: '目标怠速转速 (Target Idle RPM)',
    category: 'IDLE_CONTROL',
    offset: 0x0000,
    size: 2,
    value: 1200,
    draftValue: 1200,
    committedValue: 1200,
    min: 800,
    max: 2500,
    step: 50,
    unit: 'RPM',
    description: '发动机怠速运转时的闭环目标转速',
  },
  {
    id: 'PARAM_DEADBAND_US',
    name: '喷油器物理死区时间 (Deadband)',
    category: 'SAFETY_LIMITS',
    offset: 0x0008,
    size: 2,
    value: 400,
    draftValue: 400,
    committedValue: 400,
    min: 300,
    max: 800,
    step: 10,
    unit: 'µs',
    description: '喷油器电磁阀开启延迟死区，低于此门限一律丢弃',
  },
  {
    id: 'PARAM_MAX_RPM_LIMIT',
    name: '超速切油门限 (Rev Limiter)',
    category: 'SAFETY_LIMITS',
    offset: 0x0010,
    size: 2,
    value: 7400,
    draftValue: 7400,
    committedValue: 7400,
    min: 5000,
    max: 8500,
    step: 100,
    unit: 'RPM',
    description: '超过该转速将触发断油保护',
  },
  {
    id: 'PARAM_BARO_REF_MBAR',
    name: '基准大气压力 (BARO Base)',
    category: 'SENSOR_CALIB',
    offset: 0x0018,
    size: 2,
    value: 950,
    draftValue: 950,
    committedValue: 950,
    min: 800,
    max: 1050,
    step: 10,
    unit: 'mbar',
    description: '气压补偿参考点: (FPW-deadband+Add-Cut)*BARO/950',
  },
  {
    id: 'PARAM_BASE_IGN_DEG',
    name: '基础点火提前角 (Base Spark Angle)',
    category: 'IGNITION_MAP',
    offset: 0x0020,
    size: 2,
    value: 15,
    draftValue: 15,
    committedValue: 15,
    min: 0,
    max: 40,
    step: 1,
    unit: '°BTDC',
    description: '巡航工况下的基准点火角度',
  },
  {
    id: 'PARAM_WARMUP_ENRICH',
    name: '冷启动暖机加浓系数 (Warmup Factor)',
    category: 'FUEL_MAP',
    offset: 0x0028,
    size: 2,
    value: 125,
    draftValue: 125,
    committedValue: 125,
    min: 100,
    max: 200,
    step: 5,
    unit: '%',
    description: '冷却液温度 < 40℃ 时的喷油增益',
  },
  {
    id: 'PARAM_HYBRID_PULSE_STOP',
    name: '停机混合电机脉宽锁存值',
    category: 'SAFETY_LIMITS',
    offset: 0x0030,
    size: 2,
    value: 800,
    draftValue: 800,
    committedValue: 800,
    min: 800,
    max: 800,
    step: 0,
    unit: 'µs',
    description: '命令 65 停机时强制锁定的混合电机脉宽 (硬编码 800µs)',
  },
  {
    id: 'PARAM_CHT_OVERHEAT_LIMIT',
    name: '缸头过热停机警界 (CHT Overheat)',
    category: 'SAFETY_LIMITS',
    offset: 0x0038,
    size: 2,
    value: 235,
    draftValue: 235,
    committedValue: 235,
    min: 180,
    max: 260,
    step: 5,
    unit: '℃',
    description: '任一缸头温达到此值时进入过热降功率/停机',
  },
];

export const ParameterView: React.FC<ParameterViewProps> = ({
  onStartTransaction,
  txState,
  onResetTx,
  onStepSimulateTx,
}) => {
  const [params, setParams] = useState<ParameterItem[]>(INITIAL_PARAMETERS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showSaveWizard, setShowSaveWizard] = useState<boolean>(false);

  // Safety checklist states
  const [confirmEngineStopped, setConfirmEngineStopped] = useState(false);
  const [confirmOutputLocked, setConfirmOutputLocked] = useState(false);

  const handleUpdateDraft = (id: string, newVal: number) => {
    setParams(prev =>
      prev.map(p => (p.id === id ? { ...p, draftValue: newVal } : p))
    );
  };

  const hasChanges = params.some(p => p.draftValue !== p.committedValue);

  const filtered = params.filter(p => {
    if (selectedCategory === 'ALL') return true;
    return p.category === selectedCategory;
  });

  const handleStartSave = () => {
    if (!confirmEngineStopped || !confirmOutputLocked) {
      alert('安全互锁红线: 必须同时确认发动机停机且危险输出已锁存！');
      return;
    }
    onStartTransaction(params);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>M5-04 整集标定参数工程 (7544 字节事务)</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              44×168B + 152B = 45 包 · 8B 对齐
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            采用三态模型（编辑草稿 / 当前设备态 / D-Flash已提交态）。保存遵循停机确认、危险输出锁存、BEGIN、45包实读回校验与 TC 复位。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              // Reset drafts to committed values
              setParams(prev => prev.map(p => ({ ...p, draftValue: p.committedValue })));
            }}
            disabled={!hasChanges}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded disabled:opacity-40"
          >
            撤销所有草稿修改
          </button>

          <button
            onClick={() => setShowSaveWizard(true)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded shadow-sm transition-colors ${
              hasChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>启动参数保存向导 {hasChanges ? '(有未提交修改)' : ''}</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        {[
          { id: 'ALL', name: '全部参数' },
          { id: 'FUEL_MAP', name: '供油脉宽 Map' },
          { id: 'IGNITION_MAP', name: '点火提前角 Map' },
          { id: 'IDLE_CONTROL', name: '怠速与闭环 PID' },
          { id: 'SAFETY_LIMITS', name: '安全门禁与死区' },
          { id: 'SENSOR_CALIB', name: '传感器基准标定' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              selectedCategory === cat.id
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Parameter Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-2.5 px-3">偏移地址</th>
                <th className="py-2.5 px-3">参数标识与定义</th>
                <th className="py-2.5 px-3">已持久化值 (D-Flash)</th>
                <th className="py-2.5 px-3">当前草稿值 (Draft)</th>
                <th className="py-2.5 px-3">调整步长与滑块</th>
                <th className="py-2.5 px-3">单位与量程</th>
                <th className="py-2.5 px-3">变动对比 (Diff)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map(param => {
                const isModified = param.draftValue !== param.committedValue;
                return (
                  <tr
                    key={param.id}
                    className={`transition-colors ${
                      isModified ? 'bg-amber-950/20' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Offset */}
                    <td className="py-3 px-3 text-slate-500">
                      0x{param.offset.toString(16).padStart(4, '0').toUpperCase()}
                    </td>

                    {/* Name & Desc */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{param.name}</div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                        {param.description}
                      </div>
                    </td>

                    {/* Committed */}
                    <td className="py-3 px-3 text-slate-400 tabular-nums">
                      {param.committedValue} {param.unit}
                    </td>

                    {/* Draft Input */}
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={param.draftValue}
                        onChange={e =>
                          handleUpdateDraft(param.id, parseFloat(e.target.value) || 0)
                        }
                        className={`w-24 bg-slate-950 border px-2 py-1 rounded text-right tabular-nums ${
                          isModified
                            ? 'border-amber-500 text-amber-300 font-bold'
                            : 'border-slate-800 text-slate-200'
                        }`}
                      />
                    </td>

                    {/* Slider */}
                    <td className="py-3 px-3">
                      <input
                        type="range"
                        min={param.min}
                        max={param.max}
                        step={param.step || 1}
                        value={param.draftValue}
                        onChange={e =>
                          handleUpdateDraft(param.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-32 accent-emerald-500"
                      />
                    </td>

                    {/* Range */}
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      [{param.min} .. {param.max}] {param.unit}
                    </td>

                    {/* Diff status */}
                    <td className="py-3 px-3">
                      {isModified ? (
                        <span className="text-amber-400 font-bold">
                          {param.draftValue > param.committedValue ? '+' : ''}
                          {param.draftValue - param.committedValue}
                        </span>
                      ) : (
                        <span className="text-slate-600">一致</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Wizard Modal */}
      {showSaveWizard && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">
                  M5-04 整集参数保存向导 (45 分包事务)
                </h3>
              </div>
              <button
                onClick={() => setShowSaveWizard(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Safety Interlock Checkbox */}
            <div className="bg-amber-950/40 border border-amber-800/80 rounded p-4 space-y-3">
              <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                停机与安全互锁门禁确认 (不可跳过)
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed font-sans">
                根据 MC9S12XS128 D-Flash 编程规程，执行 0xEA 0x0A 参数事务前，必须确保发动机已彻底停机并锁存所有喷油与点火输出，防止编程高压与中断关闭期间发生机械事故。
              </p>

              <div className="space-y-2 text-xs font-mono pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={confirmEngineStopped}
                    onChange={e => setConfirmEngineStopped(e.target.checked)}
                    className="rounded bg-slate-950 border-amber-600 text-emerald-500"
                  />
                  <span>1. 确认已发送命令 65，发动机转速为 0 RPM 且已处于 STOPPED 状态</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={confirmOutputLocked}
                    onChange={e => setConfirmOutputLocked(e.target.checked)}
                    className="rounded bg-slate-950 border-amber-600 text-emerald-500"
                  />
                  <span>2. 确认混合电机脉宽已锁存于 800µs 安全待机值，喷油输出已禁止</span>
                </label>
              </div>
            </div>

            {/* Transaction Protocol Breakdown */}
            <div className="bg-slate-950 p-4 rounded border border-slate-800 text-xs font-mono space-y-2">
              <div className="text-slate-400 font-semibold uppercase text-[10px]">
                事务执行管线与状态机
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                <div className={`p-2 rounded border ${txState.status === 'BEGIN' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  0xB0 BEGIN
                </div>
                <div className={`p-2 rounded border ${txState.status === 'WRITING_CHUNKS' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  0xB1 DATA (45包)
                </div>
                <div className={`p-2 rounded border ${txState.status === 'COMMIT' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  0xB2 COMMIT
                </div>
                <div className={`p-2 rounded border ${txState.status === 'READBACK_VERIFY' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  0xB3 实读回 (45包)
                </div>
              </div>

              {/* Progress info */}
              {txState.status !== 'IDLE' && (
                <div className="pt-2 text-slate-300 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span>事务阶段: {txState.status}</span>
                    <span>进度: {txState.currentChunk} / 45 包</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-150"
                      style={{ width: `${(txState.currentChunk / 45) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>TxID: {txState.txid}</span>
                    <span>Generation: #{txState.generation}</span>
                    <span>Payload: 7544 Bytes</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-500">
                完成实读回 100% 一致后，MCU 将执行 TC 确认并软复位
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSaveWizard(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  取消
                </button>
                <button
                  onClick={handleStartSave}
                  disabled={!confirmEngineStopped || !confirmOutputLocked || txState.status === 'WRITING_CHUNKS'}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded transition-colors"
                >
                  {txState.status === 'IDLE' ? '确认并启动 45 包事务' : '事务处理中...'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
