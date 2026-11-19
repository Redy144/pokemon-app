import { Platform } from "react-native";
import type { ObjectTrackingPhase } from "./types";

export const platformKey = Platform.OS === "android" ? "android" : "ios";

export const FRAME_SIZE = 320;
export const SCAN_FRAME_STRIDE = { ios: 1, android: 2 } as const;
export const TRACK_FRAME_STRIDE = { ios: 2, android: 4 } as const;
export const UI_UPDATE_INTERVAL_MS = { ios: 80, android: 120 } as const;
export const SCAN_FRAME_LIMIT = 15;

/** Worklet-readable phase: idle/proposal/lost = 0, scanning = 1, tracking = 2 */
export const PHASE_SV = {
  idle: 0,
  scanning: 1,
  tracking: 2,
} as const;

export type PhaseSV = (typeof PHASE_SV)[keyof typeof PHASE_SV];

export function phaseToSV(phase: ObjectTrackingPhase): PhaseSV {
  if (phase === "scanning") {
    return PHASE_SV.scanning;
  }

  if (phase === "tracking") {
    return PHASE_SV.tracking;
  }

  return PHASE_SV.idle;
}
