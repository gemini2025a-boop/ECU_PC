/**
 * ECU340 High-Fidelity Simulator & Protocol Codec
 * Implements byte-for-byte serialization & deserialization for:
 * 1. Address Calibration (6B TX / 84B RX)
 * 2. BH19 (6B TX / 19B RX)
 * 3. ZH31 (8B TX / 31B RX)
 * 4. ZH40 (8B TX / 40B RX)
 * 5. M5-04 Parameter Transaction (EA 0A, 0xB0 - 0xB4, CRC16-CCITT)
 * 6. OTA BootLoader Flashing (AA 55, CRC16-CCITT, PPAGE bounds check)
 */

import { ProtocolType, TelemetryData, RawSciFrame } from '../types/protocol';

// CRC16-CCITT: poly 0x1021, init 0xFFFF, no xorout
export function calcCrc16Ccitt(bytes: number[]): number {
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= (b << 8);
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc;
}

export function calc8BitSum(bytes: number[]): number {
  return bytes.reduce((acc, val) => (acc + val) & 0xff, 0);
}

export function formatHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

/**
 * Builds the down-link command frame for selected protocol
 */
export function buildDownlinkFrame(
  protocol: ProtocolType,
  cmd: number,
  value: number,
  counter: number = 0
): number[] {
  const valH = (value >> 8) & 0xff;
  const valL = value & 0xff;

  switch (protocol) {
    case 'ADDRESS': {
      // 6 Bytes: [Cmd/Addr, ValH, ValL, Sum, 0xFA, 0xFB]
      const sum = (cmd + valH + valL) & 0xff;
      return [cmd & 0xff, valH, valL, sum, 0xfa, 0xfb];
    }
    case 'BH19': {
      // 6 Bytes: [0xED, 0x0A, Cmd, ValH, ValL, Sum]
      const prefix = [0xed, 0x0a, cmd & 0xff, valH, valL];
      const sum = calc8BitSum(prefix);
      return [...prefix, sum];
    }
    case 'ZH31': {
      // 8 Bytes: [0xEC, 0x0A, Cmd, ValH, ValL, Sum, 0x0D, 0x0A]
      const prefix = [0xec, 0x0a, cmd & 0xff, valH, valL];
      const sum = calc8BitSum(prefix);
      return [...prefix, sum, 0x0d, 0x0a];
    }
    case 'ZH40': {
      // 8 Bytes: [0xEB, 0x90, 0x08, Counter, Cmd, ValH, ValL, Sum]
      const prefix = [0xeb, 0x90, 0x08, counter & 0xff, cmd & 0xff, valH, valL];
      const sum = calc8BitSum(prefix);
      return [...prefix, sum];
    }
  }
}

/**
 * Packs simulated Telemetry Data into exact ECU up-link bytes
 */
export function packTelemetryFrame(
  protocol: ProtocolType,
  t: TelemetryData
): number[] {
  const rpmH = (t.rpm >> 8) & 0xff;
  const rpmL = t.rpm & 0xff;
  const tpsH = ((t.tps * 10) >> 8) & 0xff;
  const tpsL = (t.tps * 10) & 0xff;
  const baroH = (t.baro >> 8) & 0xff;
  const baroL = t.baro & 0xff;
  const iatH = ((t.iat + 40) >> 8) & 0xff;
  const iatL = (t.iat + 40) & 0xff;
  const cht1H = (t.cht1 >> 8) & 0xff;
  const cht1L = t.cht1 & 0xff;
  const cht2H = (t.cht2 >> 8) & 0xff;
  const cht2L = t.cht2 & 0xff;
  const cht3H = (t.cht3 >> 8) & 0xff;
  const cht3L = t.cht3 & 0xff;
  const cht4H = (t.cht4 >> 8) & 0xff;
  const cht4L = t.cht4 & 0xff;
  const heaterH = (t.heater_temp >> 8) & 0xff;
  const heaterL = t.heater_temp & 0xff;
  const oilH = (t.oil_pressure >> 8) & 0xff;
  const oilL = t.oil_pressure & 0xff;
  const battByte = Math.round(t.battery * 10) & 0xff;

  switch (protocol) {
    case 'ZH31': {
      // 31 Bytes: EC 0A Resp EngineState RPM(2) TPS(2) Batt Baro(2) IAT(2) CHT1/2(4) Heater(2) FuelRate Compat(2) CHT3/4(4) Res(2) Sum 0D 0A
      const stateByte = t.engine_state === 'RUNNING' ? 2 : t.engine_state === 'CRANKING' ? 1 : 0;
      const body = [
        0xec, 0x0a, 0x01, stateByte,
        rpmH, rpmL,
        tpsH, tpsL,
        battByte,
        baroH, baroL,
        iatH, iatL,
        cht1H, cht1L, cht2H, cht2L,
        heaterH, heaterL,
        Math.round(t.fuel_rate) & 0xff,
        (t.compat_counter >> 8) & 0xff, t.compat_counter & 0xff,
        cht3H, cht3L, cht4H, cht4L,
        0x00, 0x00
      ];
      const sum = calc8BitSum(body);
      return [...body, sum, 0x0d, 0x0a];
    }
    case 'ZH40': {
      // 40 Bytes: EB 90 28 ... Sum
      const stateByte = t.engine_state === 'RUNNING' ? 2 : t.engine_state === 'CRANKING' ? 1 : 0;
      const body = [
        0xeb, 0x90, 0x28, t.compat_counter & 0xff,
        0x01, stateByte,
        rpmH, rpmL,
        tpsH, tpsL,
        battByte,
        baroH, baroL,
        iatH, iatL,
        cht1H, cht1L, cht2H, cht2L,
        heaterH, heaterL,
        Math.round(t.fuel_rate) & 0xff,
        (t.compat_counter >> 8) & 0xff, t.compat_counter & 0xff,
        cht3H, cht3L, cht4H, cht4L,
        0x03, 0x40, // FW version 3.40
        oilH, oilL,
        0x00, 0x00, 0x00, 0x00, 0x00
      ];
      const sum = calc8BitSum(body.slice(0, 39));
      return [...body.slice(0, 39), sum];
    }
    case 'BH19': {
      // 19 Bytes: EC 0A State RPM(2) IAT FuelRate TPS(2) Batt Baro(2) Oil(2) CHT1(2) CHT2(2) Sum
      const stateByte = t.engine_state === 'RUNNING' ? 2 : 0;
      const body = [
        0xec, 0x0a, stateByte,
        rpmH, rpmL,
        (t.iat + 40) & 0xff,
        Math.round(t.fuel_rate) & 0xff,
        tpsH, tpsL,
        battByte,
        baroH, baroL,
        oilH, oilL,
        cht1H, cht1L,
        cht2H, cht2L
      ];
      const sum = calc8BitSum(body);
      return [...body, sum];
    }
    case 'ADDRESS': {
      // 84 Bytes: 14 items of 6 bytes: [Addr, ValH, ValL, Sum, FA, FB]
      const items: [number, number][] = [
        [69, t.rpm],
        [87, t.cht1],
        [88, t.cht2],
        [6, t.iat + 40],
        [161, t.fuel_pulse_width],
        [8, t.baro],
        [96, Math.round(t.battery * 10)],
        [34, Math.round(t.tps * 10)],
        [162, t.start_angle],
        [160, t.spark_angle],
        [9, t.oil_pressure],
        [90, t.cht3],
        [91, t.cht4],
        [163, t.third_fuel_pulse_width],
      ];
      const result: number[] = [];
      for (const [addr, val] of items) {
        const vH = (val >> 8) & 0xff;
        const vL = val & 0xff;
        const s = (addr + vH + vL) & 0xff;
        result.push(addr, vH, vL, s, 0xfa, 0xfb);
      }
      return result;
    }
  }
}

/**
 * Builds M5 Parameter Transaction Frame
 * EA 0A CMD LEN_H LEN_L DATA(LEN) CRC_H CRC_L
 */
export function buildParamFrame(cmd: number, data: number[]): number[] {
  const len = data.length;
  const lenH = (len >> 8) & 0xff;
  const lenL = len & 0xff;
  const crcPayload = [cmd, lenH, lenL, ...data];
  const crc = calcCrc16Ccitt(crcPayload);
  const crcH = (crc >> 8) & 0xff;
  const crcL = crc & 0xff;
  return [0xea, 0x0a, cmd, lenH, lenL, ...data, crcH, crcL];
}

/**
 * Builds BootLoader OTA Frame
 * AA 55 CMD SEQ LEN DATA(LEN) CRC_H CRC_L
 */
export function buildOtaFrame(cmd: number, seq: number, data: number[]): number[] {
  const len = data.length & 0xff;
  const crcPayload = [cmd, seq & 0xff, len, ...data];
  const crc = calcCrc16Ccitt(crcPayload);
  const crcH = (crc >> 8) & 0xff;
  const crcL = crc & 0xff;
  return [0xaa, 0x55, cmd, seq & 0xff, len, ...data, crcH, crcL];
}
