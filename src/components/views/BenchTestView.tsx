import React, { useState } from 'react';
import { BenchTestCase } from '../../types/protocol';
import { Play, CheckCircle2, XCircle, Clock, FileCheck, Download, AlertTriangle } from 'lucide-react';

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
ECU340 台架工况对拍测试签核报告 (M8-08 规程)
测试时间: ${new Date().toISOString()}
被测硬件: MC9S12XS128 SCI1 RS422
协议配置: ZH31 / 115200 8-N-1
总项数: ${testCases.length} | 通过: ${passCount} | 失败: ${failCount}
=====================================================

` + testCases.map(tc => `[${tc.status}] ${tc.workConditionId}: ${tc.name}
  输入工况: ${tc.inputDescription}
  预期准则: ${tc.expectedCondition}
  实测遥测: ${tc.actualTelemetry}
  容差门限: ${tc.tolerance}
  执行时间: ${tc.executionTime || 'N/A'}
-----------------------------------------------------`).join('\n');

    const element = document.createElement('a');
    const file = new Blob([reportText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `ECU340_M8_08_BENCH_REPORT_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Title & Bench Stats */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <span>M8-08 自动化台架工况对拍矩阵</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              380201 台架规程
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            针对 ECU340 的怠速闭环、WOT 瞬态加浓、BARO 修正公式及停机锁电逻辑进行全自动闭环对拍验证。
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
            <span>{runningAll ? '矩阵运行中...' : '运行全量工况对拍'}</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
          <span className="text-slate-500 text-[10px] block uppercase">总测试用例</span>
          <span className="text-xl font-bold text-slate-100">{testCases.length}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
          <span className="text-slate-500 text-[10px] block uppercase">通过 (Pass)</span>
          <span className="text-xl font-bold text-emerald-400">{passCount}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
          <span className="text-slate-500 text-[10px] block uppercase">未通过 (Fail)</span>
          <span className="text-xl font-bold text-rose-400">{failCount}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded">
          <span className="text-slate-500 text-[10px] block uppercase">合规率</span>
          <span className="text-xl font-bold text-slate-200">
            {testCases.length > 0 ? ((passCount / testCases.length) * 100).toFixed(0) : 0}%
          </span>
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
            <tr>
              <th className="py-2.5 px-3">工况编号</th>
              <th className="py-2.5 px-3">测试用例与规程名称</th>
              <th className="py-2.5 px-3">台架模拟输入</th>
              <th className="py-2.5 px-3">预期遥测准则</th>
              <th className="py-2.5 px-3">实测响应</th>
              <th className="py-2.5 px-3">允许容差</th>
              <th className="py-2.5 px-3">结论</th>
              <th className="py-2.5 px-3 text-right">单项执行</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {testCases.map(tc => (
              <tr key={tc.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-3 text-slate-500 font-bold">{tc.workConditionId}</td>
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-200">{tc.name}</div>
                </td>
                <td className="py-3 px-3 text-slate-400">{tc.inputDescription}</td>
                <td className="py-3 px-3 text-cyan-300">{tc.expectedCondition}</td>
                <td className="py-3 px-3 text-slate-200">{tc.actualTelemetry}</td>
                <td className="py-3 px-3 text-slate-500 text-[11px]">{tc.tolerance}</td>
                <td className="py-3 px-3">
                  {tc.status === 'PASS' && (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      PASS
                    </span>
                  )}
                  {tc.status === 'FAIL' && (
                    <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                      <XCircle className="w-3.5 h-3.5" />
                      FAIL
                    </span>
                  )}
                  {tc.status === 'RUNNING' && (
                    <span className="text-amber-400 animate-pulse font-bold">
                      RUNNING...
                    </span>
                  )}
                  {tc.status === 'PENDING' && (
                    <span className="text-slate-500">PENDING</span>
                  )}
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => onRunTest(tc.id)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
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
