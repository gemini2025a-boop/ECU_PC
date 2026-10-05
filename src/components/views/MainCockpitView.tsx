import React, { useState } from 'react';
import { TelemetryData, ProtocolType, RawSciFrame } from '../../types/protocol';
import { DialGauge } from '../widgets/DialGauge';
import { Oscilloscope } from '../widgets/Oscilloscope';
import { buildDownlinkFrame, formatHex } from '../../services/ecuSimulator';
import {
  Zap,
  Play,
  Square,
  Flame,
  Clock,
  Send,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Terminal,
  Activity,
  CheckCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface MainCockpitViewProps {
  telemetry: TelemetryData;
  protocol: ProtocolType;
  onSendCommand: (cmd: number, value: number) => void;
  pausedScope: boolean;
  onTogglePauseScope: () => void;
  onTriggerRtc: () => void;
  rawFrames: RawSciFrame[];
  onOpenDiagnostics: () => void;
}

export const MainCockpitView: React.FC<MainCockpitViewProps> = ({
  telemetry,
  protocol,
  onSendCommand,
  pausedScope,
  onTogglePauseScope,
  onTriggerRtc,
  rawFrames,
  onOpenDiagnostics,
}) => {
  // Calibration Control States
  const [throttleInput, setThrottleInput] = useState<number>(18.5);
  const [fuelPwInput, setFuelPwInput] = useState<number>(1850);
  const [sparkAngleInput, setSparkAngleInput] = useState<number>(16);
  const [mapSourcePc, setMapSourcePc] = useState<boolean>(true);

  // Custom Raw Command Injection
  const [customCmd, setCustomCmd] = useState<number>(64);
  const [customVal, setCustomVal] = useState<number>(185);

  const handleSendThrottle = (val?: number) => {
    const target = val !== undefined ? val : throttleInput;
    setThrottleInput(target);
    const rawVal = Math.round(target * 10);
    onSendCommand(64, rawVal);
  };

  const handleSendFuelPw = (val?: number) => {
    const target = val !== undefined ? val : fuelPwInput;
    setFuelPwInput(target);
    if (target < 400) {
      alert('【门禁拒绝】喷油脉宽小于死区门限 400µs，MCU 将直接丢弃！');
      return;
    }
    if (!mapSourcePc) {
      alert('【门禁拒绝】map_source_pc=0 时 MCU 拒绝修改主喷油脉宽！');
      return;
    }
    onSendCommand(161, target);
  };

  const handleSendSparkAngle = (val?: number) => {
    const target = val !== undefined ? val : sparkAngleInput;
    setSparkAngleInput(target);
    if (!mapSourcePc) {
      alert('【门禁拒绝】map_source_pc=0 时 MCU 拒绝修改点火角！');
      return;
    }
    onSendCommand(160, target);
  };

  const handleSendCustom = () => {
    onSendCommand(customCmd, customVal);
  };

  // Preview custom downlink frame bytes
  const previewBytes = buildDownlinkFrame(protocol, customCmd, customVal, 0);

  return (
    <div className="p-3 max-w-[1720px] mx-auto space-y-3">
      {/* 1. Top High-Priority Telemetry Dial Instruments */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <DialGauge
          label="发动机转速 (RPM)"
          value={telemetry.rpm}
          min={0}
          max={8000}
          unit="RPM"
          color="#10b981"
          warningThreshold={6000}
          criticalThreshold={7200}
          size={160}
        />
        <DialGauge
          label="节气门开度 (TPS)"
          value={telemetry.tps}
          min={0}
          max={100}
          decimals={1}
          unit="%"
          color="#f59e0b"
          warningThreshold={85}
          size={160}
        />
        <DialGauge
          label="主喷油脉宽 (FPW)"
          value={telemetry.fuel_pulse_width}
          min={0}
          max={6000}
          unit="µs"
          color="#06b6d4"
          warningThreshold={5000}
          size={160}
        />
        <DialGauge
          label="点火提前角"
          value={telemetry.spark_angle}
          min={-10}
          max={50}
          unit="°BTDC"
          color="#a855f7"
          size={160}
        />
        <DialGauge
          label="母线电瓶电压"
          value={telemetry.battery}
          min={0}
          max={24}
          decimals={1}
          unit="V"
          color="#10b981"
          warningThreshold={11.0}
          size={160}
        />
        <DialGauge
          label="环境大气压 (BARO)"
          value={telemetry.baro}
          min={600}
          max={1100}
          unit="mbar"
          color="#64748b"
          size={160}
        />
      </div>

      {/* 2. Main Stage: Left Telemetry & Waveform (60%) vs Right Command Console (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left Column (7 cols): Oscilloscope + Sensor Matrix */}
        <div className="lg:col-span-7 space-y-3">
          {/* Multi-Channel Waveform Oscilloscope */}
          <Oscilloscope
            currentTelemetry={telemetry}
            paused={pausedScope}
            onTogglePause={onTogglePauseScope}
          />

          {/* Secondary Sensors & Engine Telemetry Matrix */}
          <div className="bg-slate-900/80 border border-slate-800 rounded p-3 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                机载温压、燃油与混动传感器矩阵
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                运行状态:{' '}
                <span
                  className={`font-semibold ${
                    telemetry.engine_state === 'RUNNING'
                      ? 'text-emerald-400'
                      : telemetry.engine_state === 'CRANKING'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {telemetry.engine_state}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">CHT 缸头温 1 / 2</span>
                <span className="text-sm font-bold text-slate-200 tabular-nums">
                  {telemetry.cht1} / {telemetry.cht2}{' '}
                  <span className="text-xs font-normal text-slate-400">℃</span>
                </span>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">CHT 缸头温 3 / 4</span>
                <span className="text-sm font-bold text-slate-200 tabular-nums">
                  {telemetry.cht3} / {telemetry.cht4}{' '}
                  <span className="text-xs font-normal text-slate-400">℃</span>
                </span>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">机油压力</span>
                <span className="text-sm font-bold text-slate-200 tabular-nums">
                  {telemetry.oil_pressure}{' '}
                  <span className="text-xs font-normal text-slate-400">kPa</span>
                </span>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">进气温度 (IAT)</span>
                <span className="text-sm font-bold text-slate-200 tabular-nums">
                  {telemetry.iat}{' '}
                  <span className="text-xs font-normal text-slate-400">℃</span>
                </span>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">加热器温度</span>
                <span className="text-sm font-bold text-slate-200 tabular-nums">
                  {telemetry.heater_temp}{' '}
                  <span className="text-xs font-normal text-slate-400">℃</span>
                </span>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">燃油消耗率</span>
                <span className="text-sm font-bold text-slate-200 tabular-nums">
                  {telemetry.fuel_rate.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-slate-400">g/s</span>
                </span>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">混动电机反馈</span>
                <span className="text-sm font-bold text-slate-200 tabular-nums">
                  {telemetry.motor_feedback}{' '}
                  <span className="text-xs font-normal text-slate-400">µs</span>
                </span>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block uppercase">启动角</span>
                <span className="text-sm font-bold text-slate-200 tabular-nums">
                  {telemetry.start_angle}{' '}
                  <span className="text-xs font-normal text-slate-400">°</span>
                </span>
              </div>
            </div>

            {/* RTC Segment upload status (0x98/0x99) */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400 text-[11px]">RTC 实时时钟分段上报:</span>
                {telemetry.rtc_segment_active ? (
                  <span className="text-amber-400 font-mono animate-pulse text-[11px]">
                    ● 正在分段传输第 {telemetry.rtc_segment_index} / 7 帧
                  </span>
                ) : (
                  <span className="text-slate-300 font-mono text-[11px]">
                    {telemetry.rtc_values[0]}-{String(telemetry.rtc_values[1]).padStart(2, '0')}-{String(telemetry.rtc_values[2]).padStart(2, '0')} {String(telemetry.rtc_values[4]).padStart(2, '0')}:{String(telemetry.rtc_values[5]).padStart(2, '0')}:{String(telemetry.rtc_values[6]).padStart(2, '0')}
                  </span>
                )}
              </div>

              <button
                onClick={onTriggerRtc}
                className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-mono transition-colors"
              >
                触发 0x98 分段上报
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Integrated Command & Actuator Console (核心指令控制台) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded p-4 space-y-4">
            {/* Console Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  实时指令控制台 (ApplyRx 在线标定)
                </h2>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mapSourcePc}
                  onChange={(e) => setMapSourcePc(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500"
                />
                <span className="font-mono text-[11px]">map_source_pc (使能开关)</span>
              </label>
            </div>

            {/* Quick Actuator Action Buttons */}
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                执行器核心指令
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <button
                  onClick={() => onSendCommand(42, 1)}
                  className="py-2 px-3 bg-emerald-900/50 hover:bg-emerald-800/80 text-emerald-300 border border-emerald-700/60 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>起动请求 (42)</span>
                </button>

                <button
                  onClick={() => onSendCommand(65, 1)}
                  className="py-2 px-3 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>停机锁电 800µs (65)</span>
                </button>

                <button
                  onClick={() => onSendCommand(167, 50)}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <span>加油量 +50µs (167)</span>
                </button>

                <button
                  onClick={() => onSendCommand(166, 50)}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <span>减油量 -50µs (166)</span>
                </button>
              </div>
            </div>

            {/* Stepper 1: Throttle Request (Cmd 64) with Quick Presets */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/70">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">
                  油门开度目标 (Cmd 64)
                </span>
                <span className="font-mono text-amber-400 font-bold tabular-nums">
                  {throttleInput.toFixed(1)} %
                </span>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5">
                {[
                  { label: '怠速 0%', val: 0 },
                  { label: '小负荷 20%', val: 20 },
                  { label: '巡航 45%', val: 45 },
                  { label: '大负荷 75%', val: 75 },
                  { label: 'WOT 100%', val: 100 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    onClick={() => handleSendThrottle(preset.val)}
                    className="flex-1 py-1 text-[10px] font-mono bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={throttleInput}
                  onChange={(e) => setThrottleInput(parseFloat(e.target.value))}
                  className="flex-1 accent-amber-500"
                />
                <button
                  onClick={() => handleSendThrottle()}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded font-mono text-xs transition-colors"
                >
                  下发
                </button>
              </div>
            </div>

            {/* Stepper 2: Fuel Pulse Width (Cmd 161, with 400µs Deadband check) */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/70">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-300">
                    主喷油脉宽 (Cmd 161)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    (死区门限 400µs)
                  </span>
                </div>
                <span className="font-mono text-cyan-400 font-bold tabular-nums">
                  {fuelPwInput} µs
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="300"
                  max="5000"
                  step="50"
                  value={fuelPwInput}
                  onChange={(e) => setFuelPwInput(parseInt(e.target.value))}
                  className="flex-1 accent-cyan-500"
                />
                <button
                  onClick={() => handleSendFuelPw()}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded font-mono text-xs transition-colors"
                >
                  下发
                </button>
              </div>
              {fuelPwInput < 400 && (
                <div className="text-[10px] text-rose-400 font-mono flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>警告: 输入值低于死区 400µs，MCU 接收后将直接丢弃！</span>
                </div>
              )}
            </div>

            {/* Stepper 3: Spark Advance Angle (Cmd 160) */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800/70">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">
                  点火提前角 (Cmd 160)
                </span>
                <span className="font-mono text-purple-400 font-bold tabular-nums">
                  {sparkAngleInput} °BTDC
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-10"
                  max="45"
                  step="1"
                  value={sparkAngleInput}
                  onChange={(e) => setSparkAngleInput(parseInt(e.target.value))}
                  className="flex-1 accent-purple-500"
                />
                <button
                  onClick={() => handleSendSparkAngle()}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded font-mono text-xs transition-colors"
                >
                  下发
                </button>
              </div>
            </div>

            {/* Custom Arbitrary Command Injector */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                自由命令注入器 (任意命令字直发)
              </span>

              <div className="grid grid-cols-12 gap-2 text-xs font-mono">
                <div className="col-span-4">
                  <label className="text-[10px] text-slate-500 block mb-0.5">命令字 CMD</label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={customCmd}
                    onChange={(e) => setCustomCmd(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-right"
                  />
                </div>

                <div className="col-span-5">
                  <label className="text-[10px] text-slate-500 block mb-0.5">参数值 VAL</label>
                  <input
                    type="number"
                    min="0"
                    max="65535"
                    value={customVal}
                    onChange={(e) => setCustomVal(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-right"
                  />
                </div>

                <div className="col-span-3 flex items-end">
                  <button
                    onClick={handleSendCustom}
                    className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded border border-slate-700 transition-colors"
                  >
                    发送
                  </button>
                </div>
              </div>

              {/* Protocol Real-Time Preview */}
              <div className="bg-slate-950 p-2 rounded border border-slate-800/90 text-[10px] font-mono flex items-center justify-between text-slate-400">
                <span>下行预览: <span className="text-slate-200 font-bold">{formatHex(previewBytes)}</span></span>
                <span className="text-slate-500">[{protocol} 8位累加和]</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Live SCI Ticker Strip (紧凑型实时帧流滚动条，点击直达完整诊断) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded p-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            实时报文侦听:
          </span>

          {rawFrames.length > 0 ? (
            <div className="flex items-center gap-2 truncate text-slate-300">
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                  rawFrames[0].dir === 'TX'
                    ? 'text-cyan-400 bg-cyan-950/70'
                    : 'text-emerald-400 bg-emerald-950/70'
                }`}
              >
                {rawFrames[0].dir}
              </span>
              <span className="text-slate-500 text-[11px]">{rawFrames[0].timestamp}</span>
              <span className="text-slate-200 font-semibold tracking-wide">
                {rawFrames[0].rawHex}
              </span>
              <span className="text-slate-400 text-[10px] hidden md:inline">
                ({rawFrames[0].summary})
              </span>
            </div>
          ) : (
            <span className="text-slate-500 italic text-[11px]">等待 SCI1 报文到达...</span>
          )}
        </div>

        <button
          onClick={onOpenDiagnostics}
          className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium shrink-0 ml-3 transition-colors"
        >
          <span>完整报文与 DTC 诊断</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
