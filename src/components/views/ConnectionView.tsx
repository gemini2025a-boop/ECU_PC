import React, { useState } from 'react';
import { ProtocolType, SessionState } from '../../types/protocol';
import { Plug, Unplug, Terminal } from 'lucide-react';

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
  const [selectedPort, setSelectedPort] = useState('COM3 (USB转RS422 工业差分通信通道)');
  const [availablePorts] = useState([
    'COM3 (USB转RS422 工业差分通信通道)',
    'COM7 (虚拟回环模拟测试通道)',
    'COM1 (主板集成标准通信串口)',
  ]);
  const [queryLog, setQueryLog] = useState<string[]>([
    '[初始化] 正在扫描物理通信串口设备...',
    '[发现设备] 识别到 RS422 差分接口设备: COM3 (工业级串口转接芯片)',
    '[参数锁定] 通信参数已强制锁定为: 115200 波特率 · 8位数据位 · 无校验 · 1位停止位',
    '[系统就绪] 等待操作员确认并建立双向通信会话。',
  ]);

  const isConnected = sessionState !== 'DISCONNECTED';

  const handleToggleConnect = () => {
    if (isConnected) {
      onDisconnect();
      setQueryLog(prev => [...prev, `[断开] 串口通信链路已断开: ${selectedPort}`]);
    } else {
      onConnect(selectedPort);
      setQueryLog(prev => [
        ...prev,
        `[打开通道] 打开物理串口 ${selectedPort} (115200 8-N-1)...`,
        `[协议协商] 发送受控同步帧... 当前生效协议: ${protocol}`,
        `[同步成功] 收到合法首帧，设备会话状态进入: 应用程序正常运行中`,
      ]);
    }
  };

  const handleQueryIdentity = () => {
    setQueryLog(prev => [
      ...prev,
      `[查询指令] 发送硬件版本与固件身份查询命令...`,
      `[硬件反馈] 核心芯片: 恩智浦 MC9S12XS128 (16位增强型微控制器)`,
      `[硬件规格] 部件型号: ECU340-V1.2 / 主程序闪存: 128KB / 数据闪存: 8KB`,
      `[协议状态] 当前激活协议: ${protocol} (8位累加和校验激活)`,
      `[分区规则] 当前引导区架构: 单物理分区运行 (单区约束)`,
    ]);
  };

  const getSessionStateText = (s: SessionState) => {
    switch (s) {
      case 'APPLICATION':
        return '正常运行中';
      case 'BOOTLOADER':
        return '引导程序模式';
      case 'OPEN':
        return '串口已开启·待同步';
      case 'DISCONNECTED':
        return '未连接';
      case 'BUSY':
        return '设备繁忙';
      case 'FAULT':
        return '通信链路故障';
      default:
        return s;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      {/* 标题与当前会话状态 */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            串口物理通信链路与设备会话管理
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            严格按照 ECU340 物理通道与通信协议规范，波特率强制锁定为 115200 8-N-1，支持启动时显式指定协议与掉电会话保护。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">会话状态:</span>
          <span
            className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
              sessionState === 'APPLICATION'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : sessionState === 'BOOTLOADER'
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {getSessionStateText(sessionState)}
          </span>
        </div>
      </div>

      {/* 主配置栅格 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧：通信链路配置与事件流 */}
        <div className="md:col-span-2 space-y-6">
          {/* 通道配置卡片 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              物理通信通道参数配置
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  串口端口选择 (物理通信串口)
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
                  波特率与数据帧格式规范
                </label>
                <input
                  type="text"
                  disabled
                  value="115200 波特率 (8位数据位 / 无奇偶校验 / 1位停止位)"
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded px-3 py-2 text-xs font-mono text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* 协议选择器 */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">
                应用层通信协议类型 (启动时显式指定，严禁单字节盲猜)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: 'ZH31', name: 'ZH31 协议 (8/31字节)', note: 'ECU340 标准默认协议' },
                    { id: 'ZH40', name: 'ZH40 协议 (8/40字节)', note: '含软件版本号与计数器' },
                    { id: 'BH19', name: 'BH19 协议 (6/19字节)', note: '机载精简遥测协议' },
                    { id: 'ADDRESS', name: '地址标定 (6/84字节)', note: '旧版工程兼容协议' },
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
                      <div className="text-xs font-semibold">{p.name}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{p.note}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 连接与查询按钮 */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <div className="text-xs text-slate-500">
                连接后后台工作线程将以独立无锁环形队列收发串口字节流
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
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded transition-colors ${
                    isConnected
                      ? 'bg-rose-700 hover:bg-rose-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isConnected ? (
                    <>
                      <Unplug className="w-3.5 h-3.5" />
                      <span>断开通信链路</span>
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

          {/* 会话事件日志终端 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded p-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-semibold uppercase font-sans">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                会话链路事件跟踪日志 (关联追踪)
              </span>
              <button
                onClick={() => setQueryLog([])}
                className="text-[10px] text-slate-400 hover:text-slate-200 font-sans"
              >
                清空终端
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

        {/* 右侧：硬件规范与安全约束 */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              ECU340 硬件目标约束规范
            </h3>
            <div className="text-xs space-y-2 text-slate-400">
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-500">主控芯片</span>
                <span className="font-mono text-slate-200">恩智浦 MC9S12XS128</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-500">物理通信总线</span>
                <span className="font-mono text-slate-200">SCI1 (RS422 差分全双工)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-500">帧校验规则</span>
                <span className="font-mono text-slate-200">8位累加和校验 (应用协议)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-500">参数通信协议</span>
                <span className="font-mono text-slate-200">M5-04 协议 0xEA 0x0A (CRC16)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-500">闪存分区模型</span>
                <span className="font-mono text-emerald-400">单物理分区运行 (单区约束)</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-500">写保护扇区</span>
                <span className="font-mono text-amber-400">FD闪存分页 / 0xF000 引导保留扇区</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              上位机离线仿真辅助
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              在未接入真实硬件控制器时，可启用内置高保真 ECU340 仿真核。它将模拟 20Hz 遥测数据流并响应油门、起动、停机锁电等命令。
            </p>
            <button
              onClick={onToggleSim}
              className={`w-full py-2 text-xs font-medium rounded transition-colors ${
                simulating
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {simulating ? '暂停内部 20Hz 仿真循环' : '启动内部 20Hz 仿真循环'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
