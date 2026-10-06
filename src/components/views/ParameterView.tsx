import React, { useState } from 'react';
import { ParameterItem, ParamTransactionState } from '../../types/protocol';
import { Save, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ParameterViewProps {
  onStartTransaction: (updatedItems: ParameterItem[]) => void;
  txState: ParamTransactionState;
  onResetTx: () => void;
  onStepSimulateTx?: () => void;
}

const INITIAL_PARAMETERS: ParameterItem[] = [
  {
    id: 'PARAM_IDLE_RPM',
    name: '目标怠速闭环控制转速',
    category: 'IDLE_CONTROL',
    offset: 0x0000,
    size: 2,
    value: 1200,
    draftValue: 1200,
    committedValue: 1200,
    min: 800,
    max: 2500,
    step: 50,
    unit: '转/分',
    description: '发动机怠速运转时的闭环目标控制转速',
  },
  {
    id: 'PARAM_DEADBAND_US',
    name: '喷油器物理开启死区延迟时间',
    category: 'SAFETY_LIMITS',
    offset: 0x0008,
    size: 2,
    value: 400,
    draftValue: 400,
    committedValue: 400,
    min: 300,
    max: 800,
    step: 10,
    unit: '微秒',
    description: '喷油器电磁阀开启物理延迟死区，低于此门限值一律直接丢弃',
  },
  {
    id: 'PARAM_MAX_RPM_LIMIT',
    name: '超速切油断火保护门限转速',
    category: 'SAFETY_LIMITS',
    offset: 0x0010,
    size: 2,
    value: 7400,
    draftValue: 7400,
    committedValue: 7400,
    min: 5000,
    max: 8500,
    step: 100,
    unit: '转/分',
    description: '发动机超过该设定转速时立即触发断油安全保护',
  },
  {
    id: 'PARAM_BARO_REF_MBAR',
    name: '大气压力修正基准参考值',
    category: 'SENSOR_CALIB',
    offset: 0x0018,
    size: 2,
    value: 950,
    draftValue: 950,
    committedValue: 950,
    min: 800,
    max: 1050,
    step: 10,
    unit: '毫巴',
    description: '气压补偿标准计算点: (FPW-死区+加油-减油)*BARO/950',
  },
  {
    id: 'PARAM_BASE_IGN_DEG',
    name: '基础巡航工况点火提前角',
    category: 'IGNITION_MAP',
    offset: 0x0020,
    size: 2,
    value: 15,
    draftValue: 15,
    committedValue: 15,
    min: 0,
    max: 40,
    step: 1,
    unit: '度 (上止点前)',
    description: '巡航稳定工况下的基础基准点火提前角',
  },
  {
    id: 'PARAM_WARMUP_ENRICH',
    name: '冷启动暖机喷油加浓修正比例',
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
    description: '发动机冷却水温/缸温低于40℃时的喷油脉宽增益比例',
  },
  {
    id: 'PARAM_HYBRID_PULSE_STOP',
    name: '紧急停机时混合动力电机安全脉宽锁存值',
    category: 'SAFETY_LIMITS',
    offset: 0x0030,
    size: 2,
    value: 800,
    draftValue: 800,
    committedValue: 800,
    min: 800,
    max: 800,
    step: 0,
    unit: '微秒',
    description: '执行命令65停机时底层强制锁定的混合电机脉宽 (硬件锁定800微秒)',
  },
  {
    id: 'PARAM_CHT_OVERHEAT_LIMIT',
    name: '缸头过热保护停机警戒温度',
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
    description: '任一缸头温达到此门限值时自动切入过热降功率停机保护',
  },
];

export const ParameterView: React.FC<ParameterViewProps> = ({
  onStartTransaction,
  txState,
  onResetTx,
}) => {
  const [params, setParams] = useState<ParameterItem[]>(INITIAL_PARAMETERS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showSaveWizard, setShowSaveWizard] = useState<boolean>(false);

  // 安全检查勾选状态
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
      alert('安全互锁红线警告: 必须同时确认发动机已彻底停机且危险输出已安全锁存！');
      return;
    }
    onStartTransaction(params);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* 标题与保存向导触发 */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>M5-04 整集标定参数工程 (7544 字节安全事务)</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              44×168字节 + 152字节 = 45包 · 8字节严格对齐
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            采用三态管理模型（当前编辑草稿 / 设备当前运行态 / 数据闪存已提交态）。保存向导严格遵循停机确认、危险输出锁存、启动事务、45包逐字节实读回校验与安全复位规程。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setParams(prev => prev.map(p => ({ ...p, draftValue: p.committedValue })));
            }}
            disabled={!hasChanges}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded disabled:opacity-40"
          >
            放弃全部草稿修改
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
            <span>启动参数固化保存向导 {hasChanges ? '(存在未保存修改)' : ''}</span>
          </button>
        </div>
      </div>

      {/* 参数分类选项标签 */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        {[
          { id: 'ALL', name: '全部参数' },
          { id: 'FUEL_MAP', name: '燃油喷射脉宽标定表' },
          { id: 'IGNITION_MAP', name: '点火提前角基准表' },
          { id: 'IDLE_CONTROL', name: '怠速闭环控制参数' },
          { id: 'SAFETY_LIMITS', name: '安全保护与硬件死区' },
          { id: 'SENSOR_CALIB', name: '传感器物理量基准' },
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

      {/* 参数表格 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-sans">
              <tr>
                <th className="py-2.5 px-3">偏移地址</th>
                <th className="py-2.5 px-3">参数定义与名称</th>
                <th className="py-2.5 px-3">已固化值 (数据闪存)</th>
                <th className="py-2.5 px-3">当前草稿值 (待保存)</th>
                <th className="py-2.5 px-3">滑动微调</th>
                <th className="py-2.5 px-3">单位与量程范围</th>
                <th className="py-2.5 px-3">改动差异</th>
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
                    {/* 偏移 */}
                    <td className="py-3 px-3 text-slate-500">
                      0x{param.offset.toString(16).padStart(4, '0').toUpperCase()}
                    </td>

                    {/* 参数名称与说明 */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200 font-sans">{param.name}</div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                        {param.description}
                      </div>
                    </td>

                    {/* 已固化值 */}
                    <td className="py-3 px-3 text-slate-400 tabular-nums">
                      {param.committedValue} {param.unit}
                    </td>

                    {/* 草稿输入框 */}
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

                    {/* 滑块 */}
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

                    {/* 量程 */}
                    <td className="py-3 px-3 text-slate-400 text-[11px] font-sans">
                      [{param.min} .. {param.max}] {param.unit}
                    </td>

                    {/* 差异状态 */}
                    <td className="py-3 px-3 font-sans">
                      {isModified ? (
                        <span className="text-amber-400 font-bold">
                          {param.draftValue > param.committedValue ? '+' : ''}
                          {param.draftValue - param.committedValue}
                        </span>
                      ) : (
                        <span className="text-slate-500">一致</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 参数保存向导模态框 */}
      {showSaveWizard && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">
                  M5-04 整集标定参数保存向导 (45分包严格事务)
                </h3>
              </div>
              <button
                onClick={() => setShowSaveWizard(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            {/* 安全互锁确认框 */}
            <div className="bg-amber-950/40 border border-amber-800/80 rounded p-4 space-y-3">
              <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                停机与安全互锁门禁确认 (强制必检项)
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed font-sans">
                根据 MC9S12XS128 数据闪存烧写物理规程，执行 0xEA 0x0A 参数事务前，必须确保发动机已彻底停机并切断锁存所有喷油与点火输出，防止闪存擦写高压与中断关闭期间引发机械失控。
              </p>

              <div className="space-y-2 text-xs font-sans pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={confirmEngineStopped}
                    onChange={e => setConfirmEngineStopped(e.target.checked)}
                    className="rounded bg-slate-950 border-amber-600 text-emerald-500"
                  />
                  <span>1. 确认已发送命令 65，发动机实际转速为 0 转/分且已处于完全停机状态</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={confirmOutputLocked}
                    onChange={e => setConfirmOutputLocked(e.target.checked)}
                    className="rounded bg-slate-950 border-amber-600 text-emerald-500"
                  />
                  <span>2. 确认混合动力电机脉宽已锁存于 800微秒 安全待机值，喷油输出已物理切断</span>
                </label>
              </div>
            </div>

            {/* 事务执行流水与状态机进度 */}
            <div className="bg-slate-950 p-4 rounded border border-slate-800 text-xs font-mono space-y-2">
              <div className="text-slate-400 font-semibold uppercase text-[10px] font-sans">
                事务执行流水线状态
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-sans">
                <div className={`p-2 rounded border ${txState.status === 'BEGIN' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  阶段1: 启动事务 (0xB0)
                </div>
                <div className={`p-2 rounded border ${txState.status === 'WRITING_CHUNKS' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  阶段2: 传输45包数据 (0xB1)
                </div>
                <div className={`p-2 rounded border ${txState.status === 'COMMIT' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  阶段3: 提交载荷 (0xB2)
                </div>
                <div className={`p-2 rounded border ${txState.status === 'READBACK_VERIFY' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                  阶段4: 45包实读回 (0xB3)
                </div>
              </div>

              {/* 进度提示 */}
              {txState.status !== 'IDLE' && (
                <div className="pt-2 text-slate-300 space-y-1 font-sans">
                  <div className="flex justify-between text-[11px]">
                    <span>当前阶段: {txState.status === 'WRITING_CHUNKS' ? '正在写入数据分片' : txState.status === 'READBACK_VERIFY' ? '正在实读回逐字节比对' : txState.status}</span>
                    <span>分包进度: {txState.currentChunk} / 45 包</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-150"
                      style={{ width: `${(txState.currentChunk / 45) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between font-mono">
                    <span>事务标识码: {txState.txid}</span>
                    <span>固化代数: 第 {txState.generation} 代</span>
                    <span>总净载荷: 7544 字节</span>
                  </div>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="flex items-center justify-between pt-2 font-sans">
              <div className="text-[11px] text-slate-400">
                完成实读回 100% 比对一致后，MCU 将执行发送完成确认并安全软复位生效
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSaveWizard(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  取消退出
                </button>
                <button
                  onClick={handleStartSave}
                  disabled={!confirmEngineStopped || !confirmOutputLocked || txState.status === 'WRITING_CHUNKS'}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded transition-colors"
                >
                  {txState.status === 'IDLE' ? '确认并启动 45 包安全事务' : '事务处理执行中...'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
