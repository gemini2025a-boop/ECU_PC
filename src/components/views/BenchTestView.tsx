import React, { useState } from 'react';
import { BenchTestCase } from '../../types/protocol';
import { Play, CheckCircle2, XCircle, Download } from 'lucide-react';

interface BenchTestViewProps {
  onRunTest: (testId: string) => void;
  testCases: BenchTestCase[];
}

export const BenchTestView: React.FC<BenchTestViewProps> = ({
  onRunTest,
  testCases,
}) => {
  const [runningAll, setRunningAll] = useState(false);

  const handleRunAll = () => {
    setRunningAll(true);
    let delay = 0;
    testCases.forEach((tc, idx) => {
      setTimeout(() => {
        onRunTest(tc.id);
        if (idx === testCases.length - 1) {
          setRunningAll(false);
        }
      }, delay);
      delay += 800;
    });
  };

  const passCount = testCases.filter(t => t.status === 'PASS').length;
  const failCount = testCases.filter(t => t.status === 'FAIL').length;

  const handleExportReport = () => {
    const reportText = `=====================================================
ECU340 台架自动化工况对拍测试签核报告 (M8-08 规程)
签核测试时间: ${new Date().toLocaleString()}
受测硬件: 恩智浦 MC9S12XS128 (SCI1 RS422)
通信协议配置: ZH31 协议 / 115200 波特率 8-N-1
总测试项数: ${testCases.length} 项 | 合格: ${passCount} 项 | 不合格: ${failCount} 项
=====================================================

` + testCases.map(tc => `[${tc.status === 'PASS' ? '通过' : tc.status === 'FAIL' ? '未通过' : '待测'}] ${tc.workConditionId}: ${tc.name}
  输入工况条件: ${tc.inputDescription}
  预期遥测准则: ${tc.expectedCondition}
  实测遥测响应: ${tc.actualTelemetry}
  允许工程容差: ${tc.tolerance}
  执行测试时间: ${tc.executionTime || '尚未执行'}
-----------------------------------------------------`).join('\n');

    const element = document.createElement('a');
    const file = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `ECU340_台架工况对拍测试签核报告_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* 标题与台架规程说明 */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>M8-08 自动化台架工况闭环对拍矩阵</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              380201 专用台架测试规程
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            针对 ECU340 的怠速闭环、全开油门瞬态加浓与超速保护、大气压修正公式及停机锁电逻辑进行自动化闭环对拍与容差校验。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出签核测试报告</span>
          </button>

          <button
            onClick={handleRunAll}
            disabled={runningAll}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded transition-colors shadow-sm"
          >
            <Play className="w-4 h-4" />
            <span>{runningAll ? '矩阵自动执行中...' : '运行全量工况对拍测试'}</span>
          </button>
        </div>
      </div>

      {/* 指标统计面板 */}
      <div className="grid grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
          <span className="text-slate-400 text-[10px] block uppercase font-sans">总测试用例数</span>
          <span className="text-xl font-bold text-slate-100">{testCases.length}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
          <span className="text-slate-400 text-[10px] block uppercase font-sans">合格用例 (通过)</span>
          <span className="text-xl font-bold text-emerald-400">{passCount}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
          <span className="text-slate-400 text-[10px] block uppercase font-sans">超差用例 (未通过)</span>
          <span className="text-xl font-bold text-rose-400">{failCount}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
          <span className="text-slate-400 text-[10px] block uppercase font-sans">规程符合率</span>
          <span className="text-xl font-bold text-slate-200">
            {testCases.length > 0 ? ((passCount / testCases.length) * 100).toFixed(0) : 0}%
          </span>
        </div>
      </div>

      {/* 工况用例表格 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-sans">
            <tr>
              <th className="py-2.5 px-3">工况编号</th>
              <th className="py-2.5 px-3">测试用例与规程名称</th>
              <th className="py-2.5 px-3">台架输入工况条件</th>
              <th className="py-2.5 px-3">预期遥测准则</th>
              <th className="py-2.5 px-3">实测物理响应</th>
              <th className="py-2.5 px-3">允许工程容差</th>
              <th className="py-2.5 px-3">判定结论</th>
              <th className="py-2.5 px-3 text-right">单项重测</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {testCases.map(tc => (
              <tr key={tc.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-3 text-slate-400 font-bold">{tc.workConditionId}</td>
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-200 font-sans">{tc.name}</div>
                </td>
                <td className="py-3 px-3 text-slate-300 font-sans">{tc.inputDescription}</td>
                <td className="py-3 px-3 text-cyan-300 font-sans">{tc.expectedCondition}</td>
                <td className="py-3 px-3 text-slate-200 font-sans">{tc.actualTelemetry}</td>
                <td className="py-3 px-3 text-slate-400 text-[11px] font-sans">{tc.tolerance}</td>
                <td className="py-3 px-3 font-sans">
                  {tc.status === 'PASS' && (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      合格
                    </span>
                  )}
                  {tc.status === 'FAIL' && (
                    <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                      <XCircle className="w-3.5 h-3.5" />
                      超差
                    </span>
                  )}
                  {tc.status === 'RUNNING' && (
                    <span className="text-amber-400 animate-pulse font-bold">
                      执行中...
                    </span>
                  )}
                  {tc.status === 'PENDING' && (
                    <span className="text-slate-400">待测</span>
                  )}
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => onRunTest(tc.id)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-sans"
                  >
                    重测
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
