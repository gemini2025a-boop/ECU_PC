import React, { useState } from 'react';
import { TelemetryData, ProtocolType, SessionState, RawSciFrame } from '../../types/protocol';
import { DialGauge } from '../widgets/DialGauge';
import { Oscilloscope } from '../widgets/Oscilloscope';
import { buildDownlinkFrame, formatHex } from '../../services/ecuSimulator';
import {
  Zap,
  Square,
  Flame,
  Clock,
  AlertTriangle,
  Terminal,
  Activity,
  ChevronRight,
  Plug,
  Unplug,
  Cpu,
  Radio,
} from 'lucide-react';

interface MainCockpitViewProps {
  telemetry: TelemetryData;
  protocol: ProtocolType;
  onSetProtocol: (p: ProtocolType) => void;
  sessionState: SessionState;
  onToggleConnect: () => void;
  simulating: boolean;
  onToggleSim: () => void;
  onSendCommand: (cmd: number, value: number) => void;
  pausedScope: boolean;
  onTogglePauseScope: () => void;
  onTriggerRtc: () => void;
  rawFrames: RawSciFrame[];
  onOpenDiagnostics: () => void;
  onOpenConnectionModal?: () => void;
}

export const MainCockpitView: React.FC<MainCockpitViewProps> = ({
  telemetry,
  protocol,
  onSetProtocol,
  sessionState,
  onToggleConnect,
  simulating,
  onToggleSim,
  onSendCommand,
  pausedScope,
  onTogglePauseScope,
  onTriggerRtc,
  rawFrames,
  onOpenDiagnostics,
}) => {
  // 标定调节输入状态
  const [throttleInput, setThrottleInput] = useState<number>(18.5);
  const [fuelPwInput, setFuelPwInput] = useState<number>(1850);
  const [sparkAngleInput, setSparkAngleInput] = useState<number>(16);
  const [mapSourcePc, setMapSourcePc] = useState<boolean>(true);

  // COM 端口选择状态
  const [selectedComPort, setSelectedComPort] = useState<string>('COM3 (USB转RS422 物理串口)');

  // 自定义命令注入器输入
  const [customCmd, setCustomCmd] = useState<number>(64);
  const [customVal, setCustomVal] = useState<number>(185);

  const isConnected = sessionState !== 'DISCONNECTED';

  // 节气门开度实时变动处理 (取消独立下发按键，滑动或点击预设即刻实时下发)
  const handleRealtimeThrottle = (target: number) => {
    setThrottleInput(target);
    const rawVal = Math.round(target * 10);
    onSendCommand(64, rawVal);
  };

  // 主喷油脉宽实时变动处理 (取消独立下发按键，滑动即刻实时下发)
  const handleRealtimeFuelPw = (target: number) => {
    setFuelPwInput(target);
    if (!mapSourcePc) {
      return;
    }
    if (target >= 400) {
      onSendCommand(161, target);
    }
  };

  // 点火提前角实时变动处理 (取消独立下发按键，滑动即刻实时下发)
  const handleRealtimeSparkAngle = (target: number) => {
    setSparkAngleInput(target);
    if (!mapSourcePc) {
      return;
    }
    onSendCommand(160, target);
  };

  const handleSendCustom = () => {
    onSendCommand(customCmd, customVal);
  };

  const getEngineStateText = (state: string) => {
    switch (state) {
      case 'RUNNING':
        return '正常点火运转中';
      case 'CRANKING':
        return '起动机拖动点火中';
      case 'STOPPED':
        return '发动机已安全停机';
      case 'OVERHEAT':
        return '高温过热降功率保护';
      case 'FAULT':
        return '系统电气故障模式';
      default:
        return state;
    }
  };

  // 生成下行报文预览
  const previewBytes = buildDownlinkFrame(protocol, customCmd, customVal, 0);

  return (
    <div className="p-3 max-w-[1880px] mx-auto space-y-3 font-sans">
      {/* 核心双列栅格：控制台向上延长至顶部整个高度 (右侧整列) vs 左侧遥测监测区 (左侧整列) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
        {/* 左侧区域：顶部三个较小精致仪表 + 示波器 + 传感器实时监测矩阵 */}
        <div className="xl:col-span-7 2xl:col-span-8 space-y-3">
          {/* 1. 三个较小的精致核心仪表盘 (发动机转速、节气门开度、主喷油脉宽) */}
          <div className="grid grid-cols-3 gap-2.5">
            <DialGauge
              label="发动机转速"
              value={telemetry.rpm}
              min={0}
              max={8000}
              unit="转/分"
              color="#10b981"
              warningThreshold={6000}
              criticalThreshold={7200}
              size={120}
            />
            <DialGauge
              label="节气门开度"
              value={telemetry.tps}
              min={0}
              max={100}
              decimals={1}
              unit="%"
              color="#f59e0b"
              warningThreshold={85}
              size={120}
            />
            <DialGauge
              label="主喷油脉宽"
              value={telemetry.fuel_pulse_width}
              min={0}
              max={6000}
              unit="微秒"
              color="#06b6d4"
              warningThreshold={5000}
              size={120}
            />
          </div>

          {/* 2. 实时遥测多通道数字示波器 */}
          <Oscilloscope
            currentTelemetry={telemetry}
            paused={pausedScope}
            onTogglePause={onTogglePauseScope}
          />

          {/* 3. 机载温度、压力、燃油与混动传感器实时监测 (包含点火提前角/电瓶电压/环境大气压数值卡片) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded p-3 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-semibold text-slate-200 tracking-wider flex items-center gap-1.5 font-sans">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                机载温度、压力、燃油与混动传感器实时监测
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                运转状态:{' '}
                <span
                  className={`font-semibold ${
                    telemetry.engine_state === 'RUNNING'
                      ? 'text-emerald-400'
                      : telemetry.engine_state === 'CRANKING'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {getEngineStateText(telemetry.engine_state)}
                </span>
              </span>
            </div>

            {/* 数值卡片栅格 (包含移入的点火提前角、母线电瓶电压、环境大气压) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-mono">
              {/* 1. 点火提前角数值卡片 */}
              <div className="bg-slate-950 p-2 rounded border border-purple-900/50 hover:border-purple-600/60 transition-colors">
                <span className="text-[10px] text-purple-300 font-sans block flex items-center justify-between">
                  <span>点火提前角</span>
                  <span className="text-[9px] text-slate-500">上止点前</span>
                </span>
                <span className="text-sm font-bold text-purple-300 tabular-nums">
                  {telemetry.spark_angle}{' '}
                  <span className="text-xs font-normal text-slate-400">度 (°)</span>
                </span>
              </div>

              {/* 2. 母线电瓶电压数值卡片 */}
              <div className="bg-slate-950 p-2 rounded border border-emerald-900/50 hover:border-emerald-600/60 transition-colors">
                <span className="text-[10px] text-emerald-300 font-sans block flex items-center justify-between">
                  <span>母线电瓶电压</span>
                  <span className="text-[9px] text-slate-500">供电母线</span>
                </span>
                <span className="text-sm font-bold text-emerald-300 tabular-nums">
                  {telemetry.battery.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400">伏特 (V)</span>
                </span>
              </div>

              {/* 3. 环境大气压数值卡片 */}
              <div className="bg-slate-950 p-2 rounded border border-cyan-900/50 hover:border-cyan-600/60 transition-colors">
                <span className="text-[10px] text-cyan-300 font-sans block flex items-center justify-between">
                  <span>环境大气压</span>
                  <span className="text-[9px] text-slate-500">基准950</span>
                </span>
                <span className="text-sm font-bold text-cyan-300 tabular-nums">
                  {telemetry.baro}{' '}
                  <span className="text-xs font-normal text-slate-400">毫巴 (mbar)</span>
                </span>
              </div>

              {/* 4. 发动机机油压力 */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800/80 hover:border-slate-700 transition-colors">
                <span className="text-[10px] text-slate-400 font-sans block">发动机机油压力</span>
                <span className="text-sm font-bold text-slate-100 tabular-nums">
                  {telemetry.oil_pressure}{' '}
                  <span className="text-xs font-normal text-slate-400">千帕 (kPa)</span>
                </span>
              </div>

              {/* 5. 1 / 2 缸缸头温度 */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800/80 hover:border-slate-700 transition-colors">
                <span className="text-[10px] text-slate-400 font-sans block">1 / 2 缸缸头温度</span>
                <span className="text-sm font-bold text-slate-100 tabular-nums">
                  {telemetry.cht1} / {telemetry.cht2}{' '}
                  <span className="text-xs font-normal text-slate-400">℃</span>
                </span>
              </div>

              {/* 6. 3 / 4 缸缸头温度 */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800/80 hover:border-slate-700 transition-colors">
                <span className="text-[10px] text-slate-400 font-sans block">3 / 4 缸缸头温度</span>
                <span className="text-sm font-bold text-slate-100 tabular-nums">
                  {telemetry.cht3} / {telemetry.cht4}{' '}
                  <span className="text-xs font-normal text-slate-400">℃</span>
                </span>
              </div>

              {/* 7. 进气歧管温度 */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800/80 hover:border-slate-700 transition-colors">
                <span className="text-[10px] text-slate-400 font-sans block">进气歧管温度 (IAT)</span>
                <span className="text-sm font-bold text-slate-100 tabular-nums">
                  {telemetry.iat}{' '}
                  <span className="text-xs font-normal text-slate-400">℃</span>
                </span>
              </div>

              {/* 8. 预热加热器温度 */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800/80 hover:border-slate-700 transition-colors">
                <span className="text-[10px] text-slate-400 font-sans block">预热加热器温度</span>
                <span className="text-sm font-bold text-slate-100 tabular-nums">
                  {telemetry.heater_temp}{' '}
                  <span className="text-xs font-normal text-slate-400">℃</span>
                </span>
              </div>

              {/* 9. 燃油消耗速率 */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800/80 hover:border-slate-700 transition-colors">
                <span className="text-[10px] text-slate-400 font-sans block">燃油消耗速率</span>
                <span className="text-sm font-bold text-slate-100 tabular-nums">
                  {telemetry.fuel_rate.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400">克/秒</span>
                </span>
              </div>

              {/* 10. 混动电机反馈脉宽 */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800/80 hover:border-slate-700 transition-colors">
                <span className="text-[10px] text-slate-400 font-sans block">混动电机反馈脉宽</span>
                <span className="text-sm font-bold text-slate-100 tabular-nums">
                  {telemetry.motor_feedback}{' '}
                  <span className="text-xs font-normal text-slate-400">微秒</span>
                </span>
              </div>

              {/* 11. 发动机起动角度 */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800/80 hover:border-slate-700 transition-colors">
                <span className="text-[10px] text-slate-400 font-sans block">发动机起动角度</span>
                <span className="text-sm font-bold text-slate-100 tabular-nums">
                  {telemetry.start_angle}{' '}
                  <span className="text-xs font-normal text-slate-400">度 (°)</span>
                </span>
              </div>

              {/* 12. 帧循环计数器 */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800/80 hover:border-slate-700 transition-colors">
                <span className="text-[10px] text-slate-400 font-sans block">帧循环计数器</span>
                <span className="text-sm font-bold text-slate-300 tabular-nums">
                  #{telemetry.compat_counter}
                </span>
              </div>
            </div>

            {/* 机载时钟分段状态 (0x98) */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400 text-[11px] font-sans">机载实时时钟分段遥测:</span>
                {telemetry.rtc_segment_active ? (
                  <span className="text-amber-400 font-mono animate-pulse text-[11px]">
                    ● 正在分段上报第 {telemetry.rtc_segment_index} / 7 帧 (年月日星期时分秒)
                  </span>
                ) : (
                  <span className="text-slate-200 font-mono text-[11px]">
                    {telemetry.rtc_values[0]}年{String(telemetry.rtc_values[1]).padStart(2, '0')}月{String(telemetry.rtc_values[2]).padStart(2, '0')}日 {String(telemetry.rtc_values[4]).padStart(2, '0')}:{String(telemetry.rtc_values[5]).padStart(2, '0')}:{String(telemetry.rtc_values[6]).padStart(2, '0')}
                  </span>
                )}
              </div>

              <button
                onClick={onTriggerRtc}
                className="px-2.5 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-sans transition-colors"
                title="向控制器发送命令 0x98 触发时钟连续七段上报"
              >
                触发时钟分段上报 (命令0x98)
              </button>
            </div>
          </div>
        </div>

        {/* 右侧区域：向上延长至整个高度的 COM 串口通信控制台 + 实时指令控制台 */}
        <div className="xl:col-span-5 2xl:col-span-4 space-y-3 flex flex-col h-full">
          {/* A. COM 串口通信控制台 (位于顶部，与左侧仪表盘顶线平齐) */}
          <div className="bg-slate-900/95 border border-slate-700 rounded p-3.5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-sans">
                  COM 串口通信控制台
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span className="text-[11px] font-mono text-slate-300">
                  {isConnected ? '串口通信就绪' : '未连接'}
                </span>
              </div>
            </div>

            {/* COM 端口与协议快速配置 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-sans">物理通信端口 (COM)</label>
                <select
                  value={selectedComPort}
                  disabled={isConnected}
                  onChange={(e) => setSelectedComPort(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60 cursor-pointer"
                >
                  <option value="COM3 (USB转RS422 物理串口)">COM3 (USB转RS422 物理串口)</option>
                  <option value="COM7 (虚拟回环测试端口)">COM7 (虚拟回环测试端口)</option>
                  <option value="COM1 (主板集成标准串口)">COM1 (主板集成标准串口)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-sans">应用层通信协议</label>
                <select
                  value={protocol}
                  disabled={isConnected}
                  onChange={(e) => onSetProtocol(e.target.value as ProtocolType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60 cursor-pointer"
                >
                  <option value="ZH31">ZH31 协议 (8/31字节 · 标准)</option>
                  <option value="ZH40">ZH40 协议 (8/40字节 · 含版本)</option>
                  <option value="BH19">BH19 协议 (6/19字节 · 精简)</option>
                  <option value="ADDRESS">地址标定协议 (6/84字节 · 兼容)</option>
                </select>
              </div>
            </div>

            {/* 波特率与动作按钮 */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <span className="text-slate-500">波特率:</span>
                <span className="text-slate-200 font-semibold">115200 8-N-1</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleSim}
                  className={`px-2.5 py-1 rounded text-[11px] font-sans border transition-colors ${
                    simulating
                      ? 'bg-slate-800 text-amber-300 border-slate-700'
                      : 'hover:bg-slate-800 text-slate-400 border-transparent'
                  }`}
                  title="启动/暂停内部 20Hz 遥测循环时钟 (F5)"
                >
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    <span>{simulating ? '仿真时钟运行中' : '仿真已暂停'}</span>
                  </span>
                </button>

                <button
                  onClick={onToggleConnect}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded shadow-xs transition-colors ${
                    isConnected
                      ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700'
                      : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-700'
                  }`}
                >
                  {isConnected ? <Unplug className="w-3.5 h-3.5" /> : <Plug className="w-3.5 h-3.5" />}
                  <span>{isConnected ? '切断串口' : '打开串口'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* B. 实时指令控制台 (执行器在线标定下发 · 实时发送无需下发按键) */}
          <div className="bg-slate-900/95 border border-slate-700 rounded p-4 space-y-4 shadow-xl flex-1">
            {/* 控制台顶栏 */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-sans">
                    实时指令控制台 (执行器在线标定)
                  </h2>
                  <span className="text-[10px] text-emerald-400 font-sans block">
                    ● 实时发送模式激活：滑动或点击即刻下发生效，无需手动点击下发键
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer font-sans shrink-0">
                <input
                  type="checkbox"
                  checked={mapSourcePc}
                  onChange={(e) => setMapSourcePc(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500"
                />
                <span className="text-[11px]">上位机标定源使能</span>
              </label>
            </div>

            {/* 核心执行器快速动作按钮 (即点即发) */}
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 font-sans">
                执行器核心动作 (点击即时生效)
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <button
                  onClick={() => onSendCommand(42, 1)}
                  className="py-2 px-3 bg-emerald-900/50 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-700/60 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors font-sans shadow-xs"
                  title="发送命令42：吸合起动机电磁阀拖动点火"
                >
                  <Flame className="w-3.5 h-3.5 text-emerald-400" />
                  <span>起动请求 (命令42)</span>
                </button>

                <button
                  onClick={() => onSendCommand(65, 1)}
                  className="py-2 px-3 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/80 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors font-sans shadow-xs"
                  title="发送命令65：紧急切断燃油并锁定电机为800微秒安全值"
                >
                  <Square className="w-3.5 h-3.5 text-rose-400" />
                  <span>停机锁电 800微秒 (命令65)</span>
                </button>

                <button
                  onClick={() => onSendCommand(167, 50)}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors flex items-center justify-center gap-1 font-sans border border-slate-700"
                  title="发送命令167：单次加油量50微秒（自动清空减油量）"
                >
                  <span>加油量 +50微秒 (命令167)</span>
                </button>

                <button
                  onClick={() => onSendCommand(166, 50)}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors flex items-center justify-center gap-1 font-sans border border-slate-700"
                  title="发送命令166：单次减油量50微秒（自动清空加油量）"
                >
                  <span>减油量 -50微秒 (命令166)</span>
                </button>
              </div>
            </div>

            {/* 1. 节气门开度设定 (命令64 - 实时滑动发送，无下发按键) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200 font-sans">
                    节气门开度设定 (命令64)
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-sans">
                    [实时下发]
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-amber-400 font-bold tabular-nums text-sm">
                    {throttleInput.toFixed(1)} %
                  </span>
                </div>
              </div>

              {/* 常用工况一键预设 (点击即时生效) */}
              <div className="flex items-center gap-1.5">
                {[
                  { label: '怠速 0%', val: 0 },
                  { label: '小负荷 20%', val: 20 },
                  { label: '巡航 45%', val: 45 },
                  { label: '大负荷 75%', val: 75 },
                  { label: '全开油门 100%', val: 100 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    onClick={() => handleRealtimeThrottle(preset.val)}
                    className={`flex-1 py-1 text-[10px] font-sans rounded transition-colors border ${
                      Math.abs(throttleInput - preset.val) < 0.5
                        ? 'bg-amber-950 text-amber-200 border-amber-600 font-bold'
                        : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={throttleInput}
                  onChange={(e) => handleRealtimeThrottle(parseFloat(e.target.value))}
                  className="flex-1 accent-amber-500 cursor-pointer h-2"
                />
              </div>
            </div>

            {/* 2. 主喷油脉宽设定 (命令161 - 实时滑动发送，无下发按键) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-200 font-sans">
                    主喷油脉宽设定 (命令161)
                  </span>
                  <span className="text-[10px] text-cyan-400/90 font-sans">
                    [实时下发 · 400微秒死区]
                  </span>
                </div>
                <span className="font-mono text-cyan-400 font-bold tabular-nums text-sm">
                  {fuelPwInput} 微秒
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="range"
                  min="300"
                  max="5000"
                  step="50"
                  value={fuelPwInput}
                  onChange={(e) => handleRealtimeFuelPw(parseInt(e.target.value))}
                  className="flex-1 accent-cyan-500 cursor-pointer h-2"
                />
              </div>
              {fuelPwInput < 400 && (
                <div className="text-[10px] text-rose-400 font-sans flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>安全门禁: 设定值低于喷油器死区 400微秒，底层将直接忽略！</span>
                </div>
              )}
            </div>

            {/* 3. 点火提前角设定 (命令160 - 实时滑动发送，无下发按键) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-200 font-sans">
                    点火提前角设定 (命令160)
                  </span>
                  <span className="text-[10px] text-purple-400/90 font-sans">
                    [实时下发]
                  </span>
                </div>
                <span className="font-mono text-purple-400 font-bold tabular-nums text-sm">
                  {sparkAngleInput} 度 (上止点前)
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="range"
                  min="-10"
                  max="45"
                  step="1"
                  value={sparkAngleInput}
                  onChange={(e) => handleRealtimeSparkAngle(parseInt(e.target.value))}
                  className="flex-1 accent-purple-500 cursor-pointer h-2"
                />
              </div>
            </div>

            {/* 4. 自由指令直发注入器 */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-sans">
                自由指令直发注入器 (支持任意指令编码及数值下发)
              </span>

              <div className="grid grid-cols-12 gap-2 text-xs font-mono">
                <div className="col-span-4">
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-sans">指令编码 (CMD)</label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={customCmd}
                    onChange={(e) => setCustomCmd(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 text-right"
                  />
                </div>

                <div className="col-span-5">
                  <label className="text-[10px] text-slate-400 block mb-0.5 font-sans">指令数值 (VAL)</label>
                  <input
                    type="number"
                    min="0"
                    max="65535"
                    value={customVal}
                    onChange={(e) => setCustomVal(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 text-right"
                  />
                </div>

                <div className="col-span-3 flex items-end">
                  <button
                    onClick={handleSendCustom}
                    className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded border border-slate-700 transition-colors font-sans"
                  >
                    发送指令
                  </button>
                </div>
              </div>

              {/* 下行报文实时十六进制预览 */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800/90 text-[10px] font-mono flex items-center justify-between text-slate-400">
                <span>下行帧十六进制预览: <span className="text-slate-200 font-bold">{formatHex(previewBytes)}</span></span>
                <span className="text-slate-500 font-sans">[{protocol} 协议 · 8位累加和]</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部 SCI 串口实时报文监听条 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded p-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 font-sans">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            串口实时报文监听:
          </span>

          {rawFrames.length > 0 ? (
            <div className="flex items-center gap-2 truncate text-slate-300">
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold font-sans ${
                  rawFrames[0].dir === 'TX'
                    ? 'text-cyan-300 bg-cyan-950/80 border border-cyan-800'
                    : 'text-emerald-300 bg-emerald-950/80 border border-emerald-800'
                }`}
              >
                {rawFrames[0].dir === 'TX' ? '下行发送' : '上行接收'}
              </span>
              <span className="text-slate-400 text-[11px]">{rawFrames[0].timestamp}</span>
              <span className="text-slate-200 font-semibold tracking-wide">
                {rawFrames[0].rawHex}
              </span>
              <span className="text-slate-400 text-[10px] hidden md:inline font-sans">
                ({rawFrames[0].summary})
              </span>
            </div>
          ) : (
            <span className="text-slate-500 italic text-[11px] font-sans">等待串口报文到达...</span>
          )}
        </div>

        <button
          onClick={onOpenDiagnostics}
          className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium shrink-0 ml-3 transition-colors font-sans"
        >
          <span>查看完整报文与故障诊断</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
