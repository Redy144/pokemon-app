import type { Detection } from "react-native-executorch";
import type { Bbox } from "@/components/camera/previewCoords";

export type ObjectTrackingPhase =
  | "idle"
  | "scanning"
  | "proposal"
  | "tracking"
  | "lost";

export type ProposalPreview = {
  uri: string;
  frameSize: { width: number; height: number };
  bbox: Bbox;
};

export type ProposalState = {
  detection: Detection | null;
  preview: ProposalPreview | null;
} | null;

export type TrackingSession = {
  phase: ObjectTrackingPhase;
  pendingTap: { x: number; y: number } | null;
  trackedBbox: Bbox | null;
  trackedLabel: string | null;
  missCount: number;
  pendingDetection: Detection | null;
  scanFrameCount: number;
  lastUiUpdate: number;
  previewLayout: { width: number; height: number };
  frameSize: { width: number; height: number };
};

export function createTrackingSession(): TrackingSession {
  return {
    phase: "idle",
    pendingTap: null,
    trackedBbox: null,
    trackedLabel: null,
    missCount: 0,
    pendingDetection: null,
    scanFrameCount: 0,
    lastUiUpdate: 0,
    previewLayout: { width: 0, height: 0 },
    frameSize: { width: 0, height: 0 },
  };
}
