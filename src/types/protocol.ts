/**
 * ECU340 / MC9S12XS128 SCI & Protocol Specifications
 * Strictly derived from:
 * - Docs/上位机SCI接口总结.md
 * - Docs/上位机-MCU通信协议-旧协议兼容设计.md
 * - Docs/ECU340上位机实施计划.md
 */

export type ProtocolType = 'ZH31' | 'ZH40' | 'BH19' | 'ADDRESS';

export type SessionState =
  | 'DISCONNECTED'
  | 'OPEN'
  | 'APPLICATION'
  | 'BOOTLOADER'
  | 'BUSY'
  | 'FAULT';

export interface TelemetryData {
  rpm: number;                  // 转速 (RPM, 0 - 9000)
  tps: number;                  // 油门开度 (%, 0 - 100)
  battery: number;              // 电瓶电压 (V, 0 - 24.0)
  baro: number;                 // 大气压 (mbar / hPa, 0 - 1200)
  oil_pressure: number;         // 机油压力 (kPa, 0 - 1000)
  iat: number;                  // 进气温度 (℃, -40 - 120)
  cht1: number;                 // 缸头温度1 (℃, 0 - 300)
  cht2: number;                 // 缸头温度2 (℃, 0 - 300)
  cht3: number;                 // 缸头温度3 (℃, 0 - 300)
  cht4: number;                 // 缸头温度4 (℃, 0 - 300)
  heater_temp: number;          // 加热器温度 (℃, 0 - 150)
  fuel_rate: number;            // 燃油消耗率 (g/s, 0 - 50)
  spark_angle: number;          // 点火提前角 (°BTDC, -10 - 50)
  fuel_pulse_width: number;     // 主喷油脉宽 (µs, 死区400)
  start_angle: number;          // 启动角 (°)
  third_fuel_pulse_width: number; // 第三喷油脉宽 (µs)
  motor_feedback: number;       // 混合电机反馈脉宽 (µs)
  engine_state: 'STOPPED' | 'CRANKING' | 'RUNNING' | 'OVERHEAT' | 'FAULT';
  compat_counter: number;       // 兼容计数器
  rtc_segment_active: boolean;  // RTC 0x98/0x99 分段上报中
  rtc_segment_index: number;    // 1..7 (年月日星期时分秒)
  rtc_values: [number, number, number, number, number, number, number]; // Y M D W H M S
  timestamp: number;
}

export interface CalibrationCommand {
  cmd: number;
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  enableCondition: string;
  description: string;
}

export interface ParameterItem {
  id: string;
  name: string;
  category: 'FUEL_MAP' | 'IGNITION_MAP' | 'IDLE_CONTROL' | 'SAFETY_LIMITS' | 'SENSOR_CALIB';
  offset: number;
  size: 2 | 4;
  value: number;
  draftValue: number;
  committedValue: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
}

export interface ParamTransactionState {
  status: 'IDLE' | 'SAFETY_LOCK' | 'BEGIN' | 'WRITING_CHUNKS' | 'COMMIT' | 'READBACK_VERIFY' | 'RESULT_QUERY' | 'TC_RESET' | 'COMPLETED' | 'ERROR';
  currentChunk: number;        // 0..44 (共45包: 44*168B + 152B = 7544B)
  totalChunks: 45;
  txid: string;               // 64-bit Hex
  generation: number;
  payloadCrc32: string;       // CRC32 hex
  verifiedBytes: number;
  errorMsg?: string;
  stopConfirmed: boolean;
  outputLocked: boolean;
}

export interface OtaState {
  status: 'IDLE' | 'PARSING_S19' | 'HANDSHAKE' | 'GET_INFO' | 'ERASE' | 'WRITING' | 'VERIFY' | 'SWITCH' | 'COMPLETED' | 'FAILED';
  filename: string;
  fileSize: number;
  recordCount: number;
  totalBytes: number;
  currentAddress: number;
  progressPercent: number;
  retryCount: number;
  errorReason?: string;
  activePartition: 'PART_A'; // MC9S12XS128 single partition rule
  bootloaderVersion: string;
  validS19Sections: {
    address: string;
    ppage: number;
    length: number;
    status: 'VALID' | 'REJECTED_BOOTLOADER' | 'REJECTED_FD_PAGE';
  }[];
}

export interface RawSciFrame {
  id: number;
  dir: 'TX' | 'RX';
  timestamp: string;
  rawHex: string;
  bytes: number[];
  protocol: ProtocolType | 'PARAM_EA' | 'OTA_AA';
  summary: string;
  valid: boolean;
  error?: string;
}

export interface DtcCode {
  code: string;
  description: string;
  category: 'SYSTEM' | 'SENSOR' | 'ACTUATOR' | 'FLASH_ECC';
  status: 'ACTIVE' | 'STICKY' | 'LATCHED' | 'SAFE';
  timestamp: string;
  count: number;
}

export interface BenchTestCase {
  id: string;
  name: string;
  workConditionId: string;
  inputDescription: string;
  expectedCondition: string;
  actualTelemetry: string;
  tolerance: string;
  status: 'PENDING' | 'RUNNING' | 'PASS' | 'FAIL';
  executionTime?: string;
}
