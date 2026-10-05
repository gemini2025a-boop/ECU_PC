import React, { useState } from 'react';
import { ProtocolType, SessionState } from '../../types/protocol';
import { Plug, Unplug, RefreshCw, Cpu, ShieldCheck, AlertCircle, CheckCircle2, Terminal } from 'lucide-react';

interface ConnectionViewProps {
  protocol: ProtocolType;
  onSetProtocol: (p: ProtocolType) => void;
  sessionState: SessionState;
  onConnect: (port: string) => void;
  onDisconnect: () => void;
  simulating: boolean;
  onToggleSim: () => void;
}

export const ConnectionView: React.FC<ConnectionViewProps> = ({
  protocol,
  onSetProtocol,
  sessionState,
  onConnect,
  onDisconnect,
  simulating,
  onToggleSim,
}) => {
  const [selectedPort, setSelectedPort] = useState('COM3 (FTDI RS422 SCI1)');
  const [availablePorts] = useState([
    'COM3 (FTDI RS422 SCI1)',
    'COM7 (Virtual Loopback)',
    'COM1 (Standard Serial)',
  ]);
  const [queryLog, setQueryLog] = useState<string[]>([
    '[INIT] 正在枚举 Windows 物理串口设备...',
    '[INIT] 发现 RS422 适配器: COM3 (FTDI FT232R USB-RS422)',
    '[RULE] 波特率已锁定为 115200 8-N-1 (不可变硬件接口)',
    '[READY] 等待用户确认并建立会话。',
  ]);

  const isConnected = sessionState !== 'DISCONNECTED';

  const handleToggleConnect = () => {
    if (isConnected) {
      onDisconnect();
      setQueryLog(prev => [...prev, `[LINK] 串口会话已主动关闭: ${selectedPort}`]);
    } else {
      onConnect(selectedPort);
      setQueryLog(prev => [
        ...prev,
        `[OPEN] 打开串口 ${selectedPort} (115200 8-N-1)...`,
        `[STATE] 发送受控侦听探测... 识别协议: ${protocol}`,
        `[SYNC] 接收到合法同步帧，会话转移至: APPLICATION`,
      ]);
    }
  };

  const handleQueryIdentity = () => {
    setQueryLog(prev => [
      ...prev,
      `[QUERY] 查询 MCU 固件与硬件签名...`,
      `[INFO] Target: MC9S12XS128 (16-Bit HCS12X)`,
      `[INFO] Part: ECU340-V1.2 / Flash: 128KB / D-Flash: 8KB`,
      `[INFO] Protocol Mode: ${protocol} (8-Bit Checksum Active)`,
      `[INFO] Active Partition: Single (PART_COUNT = 1)`,
    ]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Title & Status */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            SCI1 / RS422 通信链路与设备会话
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            严格按照 ECU340 物理通道与协议规范，锁定 115200 8-N-1，支持启动期显式协议协商与掉电会话保护。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">会话状态:</span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
              sessionState === 'APPLICATION'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : sessionState === 'BOOTLOADER'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {sessionState}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Link Configuration */}
        <div className="md:col-span-2 space-y-6">
          {/* Card: Port & Baud parameters */}
          <div className="bg-slate-900/80 border border-slate-800 rounded p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              物理通道配置
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  串口端口 (Serial Port)
                </label>
                <select
                  value={selectedPort}
                  disabled={isConnected}
                  onChange={(e) => setSelectedPort(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  {availablePorts.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  波特率 (Baud Rate)
                </label>
                <input
                  type="text"
                  disabled
                  value="115200 (8-N-1 规范锁定)"
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded px-3 py-2 text-xs font-mono text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Protocol Selector */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">
                应用层协议类型 (启动时显式指定，严禁单字节盲猜)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: 'ZH31', name: 'ZH31 (默认 8/31B)', note: 'ECU340 标准默认协议' },
                    { id: 'ZH40', name: 'ZH40 (8/40B)', note: '带计数器与版本字' },
                    { id: 'BH19', name: 'BH19 (6/19B)', note: '精简版机载遥测' },
                    { id: 'ADDRESS', name: '地址标定 (6/84B)', note: '旧 MAPSource_PC 兼容' },
                  ] as const
                ).map((p) => {
                  const active = protocol === p.id;
                  return (
                    <button
                      key={p.id}
                      disabled={isConnected}
                      onClick={() => onSetProtocol(p.id)}
                      className={`p-3 text-left rounded border transition-colors ${
                        active
                          ? 'bg-slate-800 border-emerald-500/80 text-emerald-300'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      } ${isConnected ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-xs font-mono font-semibold">{p.name}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{p.note}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Connect / Disconnect Buttons */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <div className="text-xs text-slate-500">
                连接后后台工作线程将以独立无锁队列收发字节流
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleQueryIdentity}
                  disabled={!isConnected}
                  className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded transition-colors"
                >
                  查询硬件签名
                </button>
                <button
                  onClick={handleToggleConnect}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded transition-colors ${
                    isConnected
                      ? 'bg-rose-700 hover:bg-rose-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isConnected ? (
                    <>
                      <Unplug className="w-3.5 h-3.5" />
                      <span>断开链路</span>
                    </>
                  ) : (
                    <>
                      <Plug className="w-3.5 h-3.5" />
                      <span>打开串口建立会话</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Session Activity Terminal */}
          <div className="bg-slate-900/80 border border-slate-800 rounded p-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-semibold uppercase">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                会话事件日志 (Correlation Tracing)
              </span>
              <button
                onClick={() => setQueryLog([])}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                清屏
              </button>
            </div>
            <div className="h-44 overflow-y-auto space-y-1 text-slate-300">
              {queryLog.map((line, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-slate-600 mr-2">{String(idx + 1).padStart(2, '0')}</span>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Hardware Specification & Safety Gates */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              ECU340 硬件目标约束
            </h3>
            <div className="text-xs space-y-2 text-slate-400">
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-500">主控芯片</span>
                <span className="font-mono text-slate-200">MC9S12XS128 (NXP)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-500">通信通道</span>
                <span className="font-mono text-slate-200">SCI1 (RS422 差分全双工)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-500">校验体系</span>
                <span className="font-mono text-slate-200">8位累加和 (应用帧)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-500">参数协议</span>
                <span className="font-mono text-slate-200">M5-04 0xEA 0x0A (CRC16)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-500">分区模型</span>
                <span className="font-mono text-emerald-400">单区 (PART_COUNT = 1)</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-500">保护扇区</span>
                <span className="font-mono text-amber-400">FD页 / 0xF000 Bootloader</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              开发与仿真辅助
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              在未接入真实 MC9S12XS128 实板时，可启用内置高保真 ECU340 仿真核。它将模拟 20Hz 遥测上报并完整响应 42、64、65 等命令。
            </p>
            <button
              onClick={onToggleSim}
              className={`w-full py-2 text-xs font-medium rounded transition-colors ${
                simulating
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {simulating ? '暂停 ECU 内部循环仿真' : '开启内置 ECU 循环仿真'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
