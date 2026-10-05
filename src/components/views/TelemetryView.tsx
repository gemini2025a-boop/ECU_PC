import React, { useState } from 'react';
import { TelemetryData, ProtocolType } from '../../types/protocol';
import { DialGauge } from '../widgets/DialGauge';
import { Oscilloscope } from '../widgets/Oscilloscope';
import { Play, Square, Flame, Clock, Send, ShieldAlert, Zap, AlertTriangle } from 'lucide-react';

interface TelemetryViewProps {
  telemetry: TelemetryData;
  protocol: ProtocolType;
  onSendCommand: (cmd: number, value: number) => void;
  pausedScope: boolean;
  onTogglePauseScope: () => void;
  onTriggerRtc: () => void;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({
  telemetry,
  protocol,
  onSendCommand,
  pausedScope,
  onTogglePauseScope,
  onTriggerRtc,
}) => {
  // Local states for quick calibration inputs
  const [throttleInput, setThrottleInput] = useState<number>(15.0); // %
  const [fuelPwInput, setFuelPwInput] = useState<number>(1800); // µs
  const [sparkAngleInput, setSparkAngleInput] = useState<number>(12); // deg
  const [fuelAdjustInput, setFuelAdjustInput] = useState<number>(50); // fuel add/cut value
  const [mapSourcePc, setMapSourcePc] = useState<boolean>(true); // MAPSource_PC switch

  const handleSendThrottle = () => {
    // Cmd 64: sci_get (0..1000 corresponds to 0..100.0%)
    const rawVal = Math.round(throttleInput * 10);
    onSendCommand(64, rawVal);
  };

  const handleSendFuelPw = () => {
    // Cmd 161: deadband 400µs check
    if (fuelPwInput < 400) {
      alert('拒绝执行: 喷油脉宽小于死区门限 400µs，MCU 将直接丢弃！');
      return;
    }
    if (!mapSourcePc) {
      alert('拒绝执行: map_source_pc=0 时 MCU 拒绝修改主喷油脉宽！');
      return;
    }
    onSendCommand(161, fuelPwInput);
  };

  const handleSendSparkAngle = () => {
    if (!mapSourcePc) {
      alert('拒绝执行: map_source_pc=0 时 MCU 拒绝修改点火角！');
      return;
    }
    onSendCommand(160, sparkAngleInput);
  };

  const handleSendFuelAdd = () => {
    // Cmd 167: Fuel_Add (MCU clears Fuel_Cut automatically)
    onSendCommand(167, fuelAdjustInput);
  };

  const handleSendFuelCut = () => {
    // Cmd 166: Fuel_Cut (MCU clears Fuel_Add automatically)
    onSendCommand(166, fuelAdjustInput);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Top Gauges Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <DialGauge
          label="发动机转速 (RPM)"
          value={telemetry.rpm}
          min={0}
          max={8000}
          unit="RPM"
          color="#10b981"
          warningThreshold={6000}
          criticalThreshold={7200}
        />
        <DialGauge
          label="油门开度 (TPS)"
          value={telemetry.tps}
          min={0}
          max={100}
          decimals={1}
          unit="%"
          color="#f59e0b"
          warningThreshold={85}
        />
        <DialGauge
          label="主喷油脉宽"
          value={telemetry.fuel_pulse_width}
          min={0}
          max={6000}
          unit="µs"
          color="#06b6d4"
          warningThreshold={5000}
        />
        <DialGauge
          label="点火提前角"
          value={telemetry.spark_angle}
          min={-10}
          max={50}
          unit="°BTDC"
          color="#8b5cf6"
        />
        <DialGauge
          label="电瓶母线电压"
          value={telemetry.battery}
          min={0}
          max={24}
          decimals={1}
          unit="V"
          color="#10b981"
          warningThreshold={11.0}
        />
        <DialGauge
          label="环境大气压 (BARO)"
          value={telemetry.baro}
          min={600}
          max={1100}
          unit="mbar"
          color="#64748b"
        />
      </div>

      {/* Real-time Oscilloscope */}
      <Oscilloscope
        currentTelemetry={telemetry}
        paused={pausedScope}
        onTogglePause={onTogglePauseScope}
      />

      {/* Secondary Telemetry Strip + Calibration Command Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Secondary Telemetry Matrix & Temperatures */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              机载温度、压力与混合动力传感器
            </span>
            <span className="text-xs font-mono text-slate-500">
              当前应用协议: <span className="text-emerald-400">{protocol}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block uppercase">CHT 缸头温 1 / 2</span>
              <span className="text-base font-bold text-slate-200 tabular-nums">
                {telemetry.cht1} / {telemetry.cht2} <span className="text-xs font-normal text-slate-400">℃</span>
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block uppercase">CHT 缸头温 3 / 4</span>
              <span className="text-base font-bold text-slate-200 tabular-nums">
                {telemetry.cht3} / {telemetry.cht4} <span className="text-xs font-normal text-slate-400">℃</span>
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block uppercase">机油压力 (Oil Press)</span>
              <span className="text-base font-bold text-slate-200 tabular-nums">
                {telemetry.oil_pressure} <span className="text-xs font-normal text-slate-400">kPa</span>
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block uppercase">进气温度 (IAT)</span>
              <span className="text-base font-bold text-slate-200 tabular-nums">
                {telemetry.iat} <span className="text-xs font-normal text-slate-400">℃</span>
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block uppercase">加热器温度</span>
              <span className="text-base font-bold text-slate-200 tabular-nums">
                {telemetry.heater_temp} <span className="text-xs font-normal text-slate-400">℃</span>
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block uppercase">燃油消耗率</span>
              <span className="text-base font-bold text-slate-200 tabular-nums">
                {telemetry.fuel_rate.toFixed(1)} <span className="text-xs font-normal text-slate-400">g/s</span>
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block uppercase">电机反馈脉宽</span>
              <span className="text-base font-bold text-slate-200 tabular-nums">
                {telemetry.motor_feedback} <span className="text-xs font-normal text-slate-400">µs</span>
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <span className="text-[10px] text-slate-500 block uppercase">启动角</span>
              <span className="text-base font-bold text-slate-200 tabular-nums">
                {telemetry.start_angle} <span className="text-xs font-normal text-slate-400">°</span>
              </span>
            </div>
          </div>

          {/* RTC Segment Status (0x98 / 0x99) */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">RTC 实时时钟分段遥测 (0x98/0x99):</span>
              {telemetry.rtc_segment_active ? (
                <span className="text-amber-400 font-mono animate-pulse">
                  正在上传第 {telemetry.rtc_segment_index} / 7 帧 (年月日星期时分秒)
                </span>
              ) : (
                <span className="text-slate-300 font-mono">
                  {telemetry.rtc_values[0]}-{String(telemetry.rtc_values[1]).padStart(2, '0')}-{String(telemetry.rtc_values[2]).padStart(2, '0')} {String(telemetry.rtc_values[4]).padStart(2, '0')}:{String(telemetry.rtc_values[5]).padStart(2, '0')}:{String(telemetry.rtc_values[6]).padStart(2, '0')}
                </span>
              )}
            </div>

            <button
              onClick={onTriggerRtc}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-mono transition-colors"
            >
              触发 0x98 分段上报
            </button>
          </div>
        </div>

        {/* Right Col: Calibration & Actuator Commands */}
        <div className="bg-slate-900/80 border border-slate-800 rounded p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              标定与执行器在线指令 (ApplyRx)
            </span>
            <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={mapSourcePc}
                onChange={(e) => setMapSourcePc(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-emerald-500"
              />
              <span>map_source_pc</span>
            </label>
          </div>

          <div className="space-y-3 text-xs">
            {/* Throttle Request (Cmd 64) */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>油门目标 (Cmd 64)</span>
                <span className="font-mono text-slate-200">{throttleInput.toFixed(1)} %</span>
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
                  onClick={handleSendThrottle}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-[11px]"
                >
                  发送
                </button>
              </div>
            </div>

            {/* Main Injection Pulse Width (Cmd 161, deadband 400) */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>主喷油脉宽 (Cmd 161)</span>
                <span className="font-mono text-slate-200">{fuelPwInput} µs</span>
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
                  onClick={handleSendFuelPw}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-[11px]"
                >
                  发送
                </button>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                注: 脉宽小于死区门限 (400µs) 时丢弃，仅 map_source_pc=1 有效
              </div>
            </div>

            {/* Spark Angle (Cmd 160) */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>点火提前角 (Cmd 160)</span>
                <span className="font-mono text-slate-200">{sparkAngleInput} °BTDC</span>
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
                  onClick={handleSendSparkAngle}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono text-[11px]"
                >
                  发送
                </button>
              </div>
            </div>

            {/* Fast Action Buttons: Starter 42, Stop 65, Fuel Add/Cut 167/166 */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => onSendCommand(42, 1)}
                className="py-1.5 px-2 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/60 rounded text-xs font-mono font-semibold flex items-center justify-center gap-1"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>起动请求 (42)</span>
              </button>

              <button
                onClick={() => onSendCommand(65, 1)}
                className="py-1.5 px-2 bg-rose-900/60 hover:bg-rose-800 text-rose-300 border border-rose-700/60 rounded text-xs font-mono font-semibold flex items-center justify-center gap-1"
              >
                <Square className="w-3.5 h-3.5" />
                <span>停机锁电 (65)</span>
              </button>

              <button
                onClick={handleSendFuelAdd}
                className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono"
              >
                加油量 (167, +50µs)
              </button>

              <button
                onClick={handleSendFuelCut}
                className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono"
              >
                减油量 (166, -50µs)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
