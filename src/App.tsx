/**
 * ECU340 Rust 上位机界面设计与交互仿真套件
 * Windows 标准桌面软件风格：
 * - Windows 自定义深色标题栏 (TitleBar + 窗口控制按钮)
 * - 经典菜单栏 (文件 F / 通信 C / 标定 T / 工具 D / 视图 V / 帮助 H)
 * - 常用快捷工具条 (ToolBar / Ribbon)
 * - 主屏核心：实时监控仪表 + 示波器 + 实时指令控制台
 * - 经典多窗格底部状态栏 (StatusBar)
 */

import React, { useState, useEffect, useRef } from 'react';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { WindowsMenuBar } from './components/WindowsMenuBar';
import { WindowsToolBar } from './components/WindowsToolBar';
import { WindowsStatusBar } from './components/WindowsStatusBar';
import { AuxModalType } from './components/Header';
import { MainCockpitView } from './components/views/MainCockpitView';
import { ConnectionView } from './components/views/ConnectionView';
import { ParameterView } from './components/views/ParameterView';
import { OtaView } from './components/views/OtaView';
import { DiagnosticsView } from './components/views/DiagnosticsView';
import { BenchTestView } from './components/views/BenchTestView';
import { RustCodeGenView } from './components/views/RustCodeGenView';
import { HelpModal } from './components/modals/HelpModal';
import { AboutModal } from './components/modals/AboutModal';
import { AuxModalShell } from './components/modals/AuxModalShell';
import {
  ProtocolType,
  SessionState,
  TelemetryData,
  RawSciFrame,
  ParamTransactionState,
  OtaState,
  DtcCode,
  BenchTestCase,
  ParameterItem,
} from './types/protocol';
import {
  buildDownlinkFrame,
  packTelemetryFrame,
  buildParamFrame,
  buildOtaFrame,
  formatHex,
} from './services/ecuSimulator';

const INITIAL_TELEMETRY: TelemetryData = {
  rpm: 2150,
  tps: 18.5,
  battery: 13.8,
  baro: 992,
  oil_pressure: 340,
  iat: 24,
  cht1: 142,
  cht2: 138,
  cht3: 145,
  cht4: 140,
  heater_temp: 45,
  fuel_rate: 3.2,
  spark_angle: 16,
  fuel_pulse_width: 1850,
  start_angle: 5,
  third_fuel_pulse_width: 0,
  motor_feedback: 1200,
  engine_state: 'RUNNING',
  compat_counter: 1042,
  rtc_segment_active: false,
  rtc_segment_index: 0,
  rtc_values: [2026, 10, 5, 1, 10, 31, 48],
  timestamp: Date.now(),
};

const INITIAL_DTC: DtcCode[] = [
  {
    code: 'P0117',
    description: '进气温度传感器 (IAT) 低电平线路漂移',
    category: 'SENSOR',
    status: 'STICKY',
    timestamp: '2026-10-05 02:14:10',
    count: 2,
  },
  {
    code: 'P0562',
    description: '主供电母线电瓶电压瞬间低落 (<11.0V)',
    category: 'SYSTEM',
    status: 'ACTIVE',
    timestamp: '2026-10-05 03:02:18',
    count: 1,
  },
];

const INITIAL_BENCH_CASES: BenchTestCase[] = [
  {
    id: 'M8-08-01',
    name: '怠速闭环稳定性 (Idle Stability)',
    workConditionId: 'M8-08-01',
    inputDescription: 'TPS=0%, 负载突变 200W',
    expectedCondition: 'RPM = 1200 ± 50, 波动 < 3%',
    actualTelemetry: '1205 RPM (波动 1.2%)',
    tolerance: '±50 RPM',
    status: 'PASS',
    executionTime: '2026-10-05 03:10',
  },
  {
    id: 'M8-08-02',
    name: '全开油门 (WOT) 瞬态加浓与超速切油',
    workConditionId: 'M8-08-02',
    inputDescription: 'TPS 0% -> 100% 阶跃, 目标转速 7500 RPM',
    expectedCondition: '7400 RPM 触发断油, 喷油脉宽归零',
    actualTelemetry: '7408 RPM 瞬态断油 (脉宽 0µs)',
    tolerance: '±20 RPM',
    status: 'PASS',
    executionTime: '2026-10-05 03:12',
  },
  {
    id: 'M8-08-03',
    name: '冷启动暖机喷油加浓比例验证',
    workConditionId: 'M8-08-03',
    inputDescription: 'CHT1 = 18℃, 起动信号 42 激活',
    expectedCondition: '喷油脉宽 = 基准 × 125%',
    actualTelemetry: 'FPW 2312µs (125.0%)',
    tolerance: '±2%',
    status: 'PASS',
    executionTime: '2026-10-05 03:15',
  },
  {
    id: 'M8-08-04',
    name: 'BARO 气压修正斜率对拍',
    workConditionId: 'M8-08-04',
    inputDescription: '模拟气压由 992 降至 850 mbar',
    expectedCondition: 'FPW 依 (FPW-400)*BARO/950 线性衰减',
    actualTelemetry: '衰减比例 89.4% (公式计算 89.47%)',
    tolerance: '±0.5%',
    status: 'PASS',
    executionTime: '2026-10-05 03:18',
  },
  {
    id: 'M8-08-05',
    name: '停机锁电 dwell 宽度与电机脉宽 800µs',
    workConditionId: 'M8-08-05',
    inputDescription: '下发命令 65 停机',
    expectedCondition: '电机反馈 = 800µs, DWELL = DWELL - 600',
    actualTelemetry: '电机脉宽 800µs 锁存, 转速归零',
    tolerance: '精确 800µs',
    status: 'PASS',
    executionTime: '2026-10-05 03:20',
  },
];

export default function App() {
  const [protocol, setProtocol] = useState<ProtocolType>('ZH31');
  const [sessionState, setSessionState] = useState<SessionState>('APPLICATION');
  const [simulating, setSimulating] = useState<boolean>(true);
  const [pausedScope, setPausedScope] = useState<boolean>(false);

  // Auxiliary Modal State (Connection, M5 Params, OTA, Diagnostics, Bench, Rust, Help, About)
  const [auxModal, setAuxModal] = useState<AuxModalType>(null);

  const [telemetry, setTelemetry] = useState<TelemetryData>(INITIAL_TELEMETRY);
  const [rawFrames, setRawFrames] = useState<RawSciFrame[]>([]);
  const [frameCounter, setFrameCounter] = useState<number>(1420);
  const [dtcList, setDtcList] = useState<DtcCode[]>(INITIAL_DTC);
  const [benchCases, setBenchCases] = useState<BenchTestCase[]>(INITIAL_BENCH_CASES);

  // M5 Parameter transaction state
  const [paramTxState, setParamTxState] = useState<ParamTransactionState>({
    status: 'IDLE',
    currentChunk: 0,
    totalChunks: 45,
    txid: '0x8F4C201A9B67DE11',
    generation: 14,
    payloadCrc32: '0x9E43BA21',
    verifiedBytes: 0,
    stopConfirmed: false,
    outputLocked: false,
  });

  // OTA state
  const [otaState, setOtaState] = useState<OtaState>({
    status: 'IDLE',
    filename: 'ECU340_V3.41_RELEASE.s19',
    fileSize: 114688,
    recordCount: 3584,
    totalBytes: 114688,
    currentAddress: 0x388000,
    progressPercent: 0,
    retryCount: 0,
    activePartition: 'PART_A',
    bootloaderVersion: 'BL-XS128-V2.1',
    validS19Sections: [
      { address: '0x388000 - 0x38BFFF', ppage: 0x38, length: 16384, status: 'VALID' },
      { address: '0x398000 - 0x39BFFF', ppage: 0x39, length: 16384, status: 'VALID' },
      { address: '0x3A8000 - 0x3ABFFF', ppage: 0x3A, length: 16384, status: 'VALID' },
      { address: '0x3E8000 - 0x3EBFFF', ppage: 0x3E, length: 16384, status: 'VALID' },
    ],
  });

  const nextFrameId = useRef<number>(1);

  // Log raw frames helper
  const logFrame = (
    dir: 'TX' | 'RX',
    proto: ProtocolType | 'PARAM_EA' | 'OTA_AA',
    bytes: number[],
    summary: string
  ) => {
    const now = new Date();
    const ts = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    const frame: RawSciFrame = {
      id: nextFrameId.current++,
      dir,
      timestamp: ts,
      rawHex: formatHex(bytes),
      bytes,
      protocol: proto,
      summary,
      valid: true,
    };

    setRawFrames(prev => [frame, ...prev.slice(0, 199)]);
  };

  // Export CSV Helper
  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Dir,Timestamp,Protocol,Hex,Summary\n' +
      rawFrames
        .map(
          f =>
            `${f.id},${f.dir},${f.timestamp},${f.protocol},"${f.rawHex}","${f.summary}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ECU340_SCI_LOG_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 20Hz Telemetry Simulation Loop
  useEffect(() => {
    if (!simulating || sessionState === 'DISCONNECTED') return;

    const timer = setInterval(() => {
      setFrameCounter(c => c + 1);

      setTelemetry(prev => {
        if (prev.engine_state === 'STOPPED') {
          return {
            ...prev,
            rpm: 0,
            fuel_pulse_width: 0,
            motor_feedback: 800,
            fuel_rate: 0,
            timestamp: Date.now(),
          };
        }

        const rpmNoise = Math.floor((Math.random() - 0.5) * 16);
        const targetRpm = Math.round(1200 + prev.tps * 55) + rpmNoise;
        const clampedRpm = Math.min(Math.max(targetRpm, 800), 7500);

        let rtcActive = prev.rtc_segment_active;
        let rtcIdx = prev.rtc_segment_index;
        if (rtcActive) {
          if (rtcIdx >= 7) {
            rtcActive = false;
            rtcIdx = 0;
          } else {
            rtcIdx += 1;
          }
        }

        const updated: TelemetryData = {
          ...prev,
          rpm: clampedRpm,
          fuel_pulse_width: Math.round(1400 + prev.tps * 35),
          battery: +(13.8 + (Math.random() - 0.5) * 0.1).toFixed(1),
          cht1: Math.round(140 + prev.tps * 0.4),
          cht2: Math.round(136 + prev.tps * 0.4),
          cht3: Math.round(143 + prev.tps * 0.4),
          cht4: Math.round(138 + prev.tps * 0.4),
          compat_counter: (prev.compat_counter + 1) & 0xffff,
          rtc_segment_active: rtcActive,
          rtc_segment_index: rtcIdx,
          timestamp: Date.now(),
        };

        if (nextFrameId.current % 4 === 0) {
          const rxBytes = packTelemetryFrame(protocol, updated);
          logFrame('RX', protocol, rxBytes, `遥测: RPM=${updated.rpm}, TPS=${updated.tps.toFixed(1)}%`);
        }

        return updated;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [simulating, sessionState, protocol]);

  // Handle Send Downlink Command
  const handleSendCommand = (cmd: number, value: number) => {
    const txBytes = buildDownlinkFrame(protocol, cmd, value, frameCounter & 0xff);
    let summary = `命令 ${cmd}, 值 ${value}`;

    if (cmd === 64) {
      const tpsVal = +(value / 10).toFixed(1);
      summary = `油门请求 (64): ${tpsVal}%`;
      setTelemetry(prev => ({
        ...prev,
        tps: tpsVal,
        engine_state: prev.engine_state === 'STOPPED' ? 'CRANKING' : prev.engine_state,
      }));
    } else if (cmd === 65) {
      summary = `停机命令 (65): 强制停机并锁定电机脉宽 800µs`;
      setTelemetry(prev => ({
        ...prev,
        engine_state: 'STOPPED',
        rpm: 0,
        fuel_pulse_width: 0,
        motor_feedback: 800,
        fuel_rate: 0,
      }));
    } else if (cmd === 42) {
      summary = `起动请求 (42): Starter Active`;
      setTelemetry(prev => ({
        ...prev,
        engine_state: 'CRANKING',
        rpm: 450,
      }));
    } else if (cmd === 161) {
      summary = `主喷油脉宽 (161): ${value}µs`;
      setTelemetry(prev => ({ ...prev, fuel_pulse_width: value }));
    } else if (cmd === 160) {
      summary = `点火提前角 (160): ${value}°BTDC`;
      setTelemetry(prev => ({ ...prev, spark_angle: value }));
    } else if (cmd === 167) {
      summary = `加油量 (167): +${value}µs (互斥清除减油量)`;
      setTelemetry(prev => ({
        ...prev,
        fuel_pulse_width: prev.fuel_pulse_width + value,
      }));
    } else if (cmd === 166) {
      summary = `减油量 (166): -${value}µs (互斥清除加油量)`;
      setTelemetry(prev => ({
        ...prev,
        fuel_pulse_width: Math.max(prev.fuel_pulse_width - value, 400),
      }));
    }

    logFrame('TX', protocol, txBytes, summary);
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes modal
      if (e.key === 'Escape') {
        if (auxModal) {
          setAuxModal(null);
        }
      } else if (e.key === 'F1') {
        e.preventDefault();
        setAuxModal('help');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setSessionState(s => (s === 'DISCONNECTED' ? 'APPLICATION' : 'DISCONNECTED'));
      } else if (e.key === 'F5') {
        e.preventDefault();
        setSimulating(s => !s);
      } else if (e.key === 'F8') {
        e.preventDefault();
        handleSendCommand(0x98, 1);
        setTelemetry(prev => ({ ...prev, rtc_segment_active: true, rtc_segment_index: 1 }));
      } else if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setAuxModal('connection');
      } else if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setAuxModal('parameters');
      } else if (e.ctrlKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        setAuxModal('ota');
      } else if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setAuxModal('diagnostics');
      } else if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setAuxModal('bench');
      } else if (e.ctrlKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setAuxModal('rust_code');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [auxModal]);

  // RTC Trigger
  const handleTriggerRtc = () => {
    handleSendCommand(0x98, 1);
    setTelemetry(prev => ({
      ...prev,
      rtc_segment_active: true,
      rtc_segment_index: 1,
    }));
  };

  // Handle M5 45-chunk Parameter Save Transaction
  const handleStartParamTx = (updatedItems: ParameterItem[]) => {
    setParamTxState({
      status: 'BEGIN',
      currentChunk: 0,
      totalChunks: 45,
      txid: `0x${Date.now().toString(16).toUpperCase()}`,
      generation: 15,
      payloadCrc32: '0xA7C1340F',
      verifiedBytes: 0,
      stopConfirmed: true,
      outputLocked: true,
    });

    const beginPayload = [0x12, 0x34, 0x56, 0x78, 0x00, 0x00, 0x00, 0x0F, 0xA7, 0xC1, 0x34, 0x0F];
    const beginBytes = buildParamFrame(0xb0, beginPayload);
    logFrame('TX', 'PARAM_EA', beginBytes, 'M5-04 BEGIN (0xB0): 发起 7544B 事务');

    let chunk = 0;
    const interval = setInterval(() => {
      chunk += 1;
      if (chunk <= 45) {
        setParamTxState(prev => ({
          ...prev,
          status: 'WRITING_CHUNKS',
          currentChunk: chunk,
        }));

        const offset = (chunk - 1) * 168;
        const length = chunk === 45 ? 152 : 168;
        const chunkData = new Array(length).fill(0xaa);
        const dataBytes = buildParamFrame(0xb1, [0x00, (offset >> 8) & 0xff, offset & 0xff, length, ...chunkData.slice(0, 16)]);
        logFrame('TX', 'PARAM_EA', dataBytes, `M5-04 DATA (0xB1): 包 #${chunk}/45 (偏移 ${offset}, 长度 ${length})`);
      } else {
        clearInterval(interval);
        setParamTxState(prev => ({ ...prev, status: 'COMMIT' }));
        const commitBytes = buildParamFrame(0xb2, [0xA7, 0xC1, 0x34, 0x0F]);
        logFrame('TX', 'PARAM_EA', commitBytes, 'M5-04 COMMIT (0xB2): 载荷 CRC32 确认');

        setTimeout(() => {
          setParamTxState(prev => ({ ...prev, status: 'READBACK_VERIFY', verifiedBytes: 7544 }));
          logFrame('TX', 'PARAM_EA', buildParamFrame(0xb3, [0x00, 0x00, 0x00, 0xa8]), 'M5-04 READBACK (0xB3): 45包实读回 100% 一致');

          setTimeout(() => {
            setParamTxState(prev => ({ ...prev, status: 'COMPLETED' }));
            logFrame('RX', 'PARAM_EA', buildParamFrame(0xb4, [0x00, 0x02, 0x00, 0x00, 0x00, 0x0F]), 'M5-04 RESULT (0xB4): 状态 OK, Source D-Flash, Gen #15');
            alert('M5 参数保存事务执行完成！45包实读回校验完全一致，已确认 D-Flash 持久化并复位。');
          }, 600);
        }, 600);
      }
    }, 70);
  };

  // Handle OTA Flashing Simulation
  const handleSelectSampleS19 = (filename: string, isMalicious: boolean = false) => {
    if (isMalicious) {
      setOtaState(prev => ({
        ...prev,
        filename,
        errorReason: 'Security Gate Rejection: S19 包含地址 0x3EF200，侵入 Bootloader 0xF000..0xFFFF 保护扇区！',
        validS19Sections: [
          { address: '0x388000 - 0x38BFFF', ppage: 0x38, length: 16384, status: 'VALID' },
          { address: '0x3EF000 - 0x3EFFFF', ppage: 0x3E, length: 4096, status: 'REJECTED_BOOTLOADER' },
        ],
      }));
    } else {
      setOtaState(prev => ({
        ...prev,
        filename,
        errorReason: undefined,
        validS19Sections: [
          { address: '0x388000 - 0x38BFFF', ppage: 0x38, length: 16384, status: 'VALID' },
          { address: '0x398000 - 0x39BFFF', ppage: 0x39, length: 16384, status: 'VALID' },
          { address: '0x3A8000 - 0x3ABFFF', ppage: 0x3A, length: 16384, status: 'VALID' },
          { address: '0x3E8000 - 0x3EBFFF', ppage: 0x3E, length: 16384, status: 'VALID' },
        ],
      }));
    }
  };

  const handleStartFlashing = () => {
    if (otaState.errorReason) return;

    setOtaState(prev => ({ ...prev, status: 'HANDSHAKE', progressPercent: 5 }));
    logFrame('TX', 'OTA_AA', buildOtaFrame(0x01, 1, [0x55, 0xAA]), 'OTA 握手: 查询 BootLoader 版本');

    setTimeout(() => {
      setOtaState(prev => ({ ...prev, status: 'ERASE', progressPercent: 20 }));
      logFrame('TX', 'OTA_AA', buildOtaFrame(0x03, 2, [0x38, 0x39, 0x3A, 0x3E]), 'OTA 扇区擦除: 擦除目标 PPAGE');

      setTimeout(() => {
        setOtaState(prev => ({ ...prev, status: 'WRITING', progressPercent: 30 }));

        let progress = 30;
        const writeInterval = setInterval(() => {
          progress += 10;
          setOtaState(prev => ({ ...prev, progressPercent: Math.min(progress, 85) }));
          logFrame('TX', 'OTA_AA', buildOtaFrame(0x04, (progress / 10) & 0xff, [0x00, 0x80]), `OTA 分片编程: 写入 128B 数据块 (已写入 ${progress}%)`);

          if (progress >= 85) {
            clearInterval(writeInterval);
            setOtaState(prev => ({ ...prev, status: 'VERIFY', progressPercent: 95 }));
            logFrame('TX', 'OTA_AA', buildOtaFrame(0x05, 12, [0x00]), 'OTA 实读回校验 (Readback Verify): CRC16 匹配通过');

            setTimeout(() => {
              setOtaState(prev => ({ ...prev, status: 'COMPLETED', progressPercent: 100 }));
              logFrame('TX', 'OTA_AA', buildOtaFrame(0x06, 13, [0x01]), 'OTA 分区切换: 跳转至新应用固件启动');
              alert('OTA 固件升级成功！已通过单区实读回校验并重新启动应用固件。');
            }, 600);
          }
        }, 200);
      }, 700);
    }, 600);
  };

  const handleCancelFlashing = () => {
    setOtaState(prev => ({ ...prev, status: 'FAILED', progressPercent: 0, errorReason: '用户手动中止升级' }));
  };

  // Run bench test case
  const handleRunBenchTest = (testId: string) => {
    setBenchCases(prev =>
      prev.map(tc => {
        if (tc.id === testId) {
          return {
            ...tc,
            status: 'PASS',
            executionTime: new Date().toLocaleTimeString(),
          };
        }
        return tc;
      })
    );
  };

  const toggleConnect = () => {
    setSessionState(s => (s === 'DISCONNECTED' ? 'APPLICATION' : 'DISCONNECTED'));
  };

  return (
    <div className="h-screen w-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-emerald-950 selection:text-emerald-300 overflow-hidden">
      {/* 1. Windows Custom TitleBar */}
      <WindowsTitleBar
        protocol={protocol}
        sessionState={sessionState}
        frameCounter={frameCounter}
      />

      {/* 2. Windows Classic MenuBar (文件 F / 通信 C / 标定 T / 工具 D / 视图 V / 帮助 H) */}
      <WindowsMenuBar
        protocol={protocol}
        onSetProtocol={setProtocol}
        sessionState={sessionState}
        onToggleConnect={toggleConnect}
        simulating={simulating}
        onToggleSim={() => setSimulating(p => !p)}
        onEmergencyStop={() => handleSendCommand(65, 1)}
        onTriggerRtc={handleTriggerRtc}
        onOpenModal={setAuxModal}
        pausedScope={pausedScope}
        onTogglePauseScope={() => setPausedScope(p => !p)}
        onExportCsv={handleExportCsv}
      />

      {/* 3. Windows Action ToolBar (快捷工具条 Ribbon) */}
      <WindowsToolBar
        protocol={protocol}
        sessionState={sessionState}
        onToggleConnect={toggleConnect}
        simulating={simulating}
        onToggleSim={() => setSimulating(p => !p)}
        onEmergencyStop={() => handleSendCommand(65, 1)}
        frameCounter={frameCounter}
        onOpenModal={setAuxModal}
      />

      {/* 4. Core Main Cockpit Workspace: Dominant Primary Viewport */}
      <main className="flex-1 overflow-y-auto">
        <MainCockpitView
          telemetry={telemetry}
          protocol={protocol}
          onSendCommand={handleSendCommand}
          pausedScope={pausedScope}
          onTogglePauseScope={() => setPausedScope(p => !p)}
          onTriggerRtc={handleTriggerRtc}
          rawFrames={rawFrames}
          onOpenDiagnostics={() => setAuxModal('diagnostics')}
        />
      </main>

      {/* 5. Windows Classic Multi-Panel StatusBar */}
      <WindowsStatusBar
        protocol={protocol}
        sessionState={sessionState}
        frameCounter={frameCounter}
      />

      {/* Auxiliary Modals / Windows: Non-blocking, clean focus */}
      {auxModal === 'connection' && (
        <AuxModalShell
          title="SCI1 / RS422 物理通信通道与协议设置"
          subtitle="115200 8-N-1 规范锁定"
          badge={sessionState}
          badgeColor={sessionState === 'APPLICATION' ? 'emerald' : 'amber'}
          onClose={() => setAuxModal(null)}
          maxWidth="max-w-5xl"
        >
          <ConnectionView
            protocol={protocol}
            onSetProtocol={setProtocol}
            sessionState={sessionState}
            onConnect={() => {
              setSessionState('APPLICATION');
              setAuxModal(null);
            }}
            onDisconnect={() => setSessionState('DISCONNECTED')}
            simulating={simulating}
            onToggleSim={() => setSimulating(p => !p)}
          />
        </AuxModalShell>
      )}

      {auxModal === 'parameters' && (
        <AuxModalShell
          title="M5-04 整集标定参数工程 (7544 字节事务向导)"
          subtitle="44×168B + 152B = 45 包 · 8B 对齐"
          badge="D-Flash"
          badgeColor="cyan"
          onClose={() => setAuxModal(null)}
          maxWidth="max-w-7xl"
        >
          <ParameterView
            onStartTransaction={handleStartParamTx}
            txState={paramTxState}
            onResetTx={() =>
              setParamTxState(prev => ({ ...prev, status: 'IDLE', currentChunk: 0 }))
            }
          />
        </AuxModalShell>
      )}

      {auxModal === 'ota' && (
        <AuxModalShell
          title="MC9S12XS128 BootLoader OTA 固件升级"
          subtitle="S19 Motorola 解析与 PPAGE 闪存地址门禁"
          badge="单区 PART_COUNT=1"
          badgeColor="amber"
          onClose={() => setAuxModal(null)}
          maxWidth="max-w-6xl"
        >
          <OtaView
            otaState={otaState}
            onSelectSampleS19={handleSelectSampleS19}
            onStartFlashing={handleStartFlashing}
            onCancelFlashing={handleCancelFlashing}
          />
        </AuxModalShell>
      )}

      {auxModal === 'diagnostics' && (
        <AuxModalShell
          title="机载 DTC 故障码诊断字典与 SCI1 原始报文监控"
          subtitle="双向 Hex 报文分词解析与冻结帧"
          badge={`${dtcList.length} 个故障码`}
          badgeColor={dtcList.length > 0 ? 'rose' : 'emerald'}
          onClose={() => setAuxModal(null)}
          maxWidth="max-w-7xl"
        >
          <DiagnosticsView
            dtcList={dtcList}
            onClearDtc={() => {
              if (confirm('确认清除所有活动与锁存 DTC 故障码？')) {
                setDtcList([]);
              }
            }}
            onRefreshDtc={() => setDtcList(INITIAL_DTC)}
            rawFrames={rawFrames}
            onClearFrames={() => setRawFrames([])}
          />
        </AuxModalShell>
      )}

      {auxModal === 'bench' && (
        <AuxModalShell
          title="M8-08 自动化台架工况对拍矩阵"
          subtitle="380201 台架规程与闭环公差校核"
          badge="5 项全闭环"
          badgeColor="emerald"
          onClose={() => setAuxModal(null)}
          maxWidth="max-w-6xl"
        >
          <BenchTestView
            testCases={benchCases}
            onRunTest={handleRunBenchTest}
          />
        </AuxModalShell>
      )}

      {auxModal === 'rust_code' && (
        <AuxModalShell
          title="Rust 原生上位机架构与源码生成器"
          subtitle="eframe / egui · stable 2021 · 无锁 Crossbeam Worker 架构"
          badge="Rust Cargo"
          badgeColor="emerald"
          onClose={() => setAuxModal(null)}
          maxWidth="max-w-7xl"
        >
          <RustCodeGenView />
        </AuxModalShell>
      )}

      {auxModal === 'help' && <HelpModal onClose={() => setAuxModal(null)} />}
      {auxModal === 'about' && <AboutModal onClose={() => setAuxModal(null)} />}
    </div>
  );
}
