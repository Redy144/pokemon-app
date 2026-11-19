import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import type { Detection } from "react-native-executorch";
import { imageBboxToViewRect, type Bbox } from "@/components/camera/previewCoords";
import {
  PHASE_SV,
  SCAN_FRAME_STRIDE,
  TRACK_FRAME_STRIDE,
  phaseToSV,
  platformKey,
  type PhaseSV,
} from "./constants";
import {
  createTrackingSession,
  type ObjectTrackingPhase,
  type ProposalPreview,
  type ProposalState,
} from "./types";
import { usePreviewLayout } from "@/hooks/usePreviewLayout";

export function useTrackingSession() {
  const [trackedBbox, setTrackedBbox] = useState<Bbox | null>(null);
  const [phase, setPhase] = useState<ObjectTrackingPhase>("idle");
  const [proposal, setProposal] = useState<ProposalState>(null);
  const [lostLabel, setLostLabel] = useState<string | null>(null);
  const { previewLayout, handlePreviewLayout } = usePreviewLayout();

  const sessionRef = useRef(createTrackingSession());
  const phaseSV = useSharedValue<PhaseSV>(PHASE_SV.idle);
  const frameCounter = useSharedValue(0);
  const frameStride = useSharedValue(1);

  useEffect(() => {
    sessionRef.current.previewLayout = previewLayout;
  }, [previewLayout]);

  const setPhaseState = useCallback(
    (nextPhase: ObjectTrackingPhase) => {
      const session = sessionRef.current;
      session.phase = nextPhase;
      setPhase(nextPhase);
      phaseSV.value = phaseToSV(nextPhase);
      frameCounter.value = 0;

      if (nextPhase === "scanning") {
        frameStride.value = SCAN_FRAME_STRIDE[platformKey];
      } else if (nextPhase === "tracking") {
        frameStride.value = TRACK_FRAME_STRIDE[platformKey];
      }
    },
    [frameCounter, frameStride, phaseSV],
  );

  const clearTracking = useCallback(() => {
    const session = sessionRef.current;
    session.trackedBbox = null;
    session.trackedLabel = null;
    session.missCount = 0;
    setTrackedBbox(null);
    setLostLabel(null);
  }, []);

  const openProposal = useCallback(
    (detection: Detection | null, preview: ProposalPreview | null = null) => {
      sessionRef.current.pendingDetection = detection;
      setProposal({ detection, preview });
      setPhaseState("proposal");
    },
    [setPhaseState],
  );

  const pauseFrameProcessing = useCallback(() => {
    phaseSV.value = PHASE_SV.idle;
  }, [phaseSV]);

  const resumeFrameProcessing = useCallback(() => {
    phaseSV.value = phaseToSV(sessionRef.current.phase);
  }, [phaseSV]);

  const bboxRect = useMemo(() => {
    const { frameSize } = sessionRef.current;
    const hasFrameSize = frameSize.width > 0 && frameSize.height > 0;

    if (!trackedBbox || !hasFrameSize || phase !== "tracking") {
      return null;
    }

    return imageBboxToViewRect(trackedBbox, previewLayout, frameSize);
  }, [phase, previewLayout, trackedBbox]);

  const getTrackedViewRect = useCallback(() => {
    const session = sessionRef.current;

    if (session.phase !== "tracking" || !session.trackedBbox) {
      return null;
    }

    const { previewLayout: layout, frameSize } = session;
    const hasFrameSize = frameSize.width > 0 && frameSize.height > 0;

    if (!hasFrameSize || layout.width === 0 || layout.height === 0) {
      return null;
    }

    return imageBboxToViewRect(session.trackedBbox, layout, frameSize);
  }, []);

  const startScan = useCallback(
    (locationX: number, locationY: number) => {
      const session = sessionRef.current;
      clearTracking();
      session.pendingTap = { x: locationX, y: locationY };
      session.scanFrameCount = 0;
      session.pendingDetection = null;
      setProposal(null);
      setPhaseState("scanning");
    },
    [clearTracking, setPhaseState],
  );

  const confirmTracking = useCallback(() => {
    const session = sessionRef.current;
    const detection = session.pendingDetection;

    if (!detection) {
      return;
    }

    session.trackedBbox = detection.bbox;
    session.trackedLabel = String(detection.label);
    session.missCount = 0;
    session.pendingDetection = null;
    setTrackedBbox(detection.bbox);
    setProposal(null);
    setPhaseState("tracking");
  }, [setPhaseState]);

  const dismissProposal = useCallback(() => {
    const session = sessionRef.current;

    if (session.phase !== "proposal") {
      return;
    }

    clearTracking();
    session.pendingDetection = null;
    session.pendingTap = null;
    session.scanFrameCount = 0;
    setProposal(null);
    setPhaseState("idle");
  }, [clearTracking, setPhaseState]);

  const dismissLost = useCallback(() => {
    if (sessionRef.current.phase !== "lost") {
      return;
    }

    clearTracking();
    setPhaseState("idle");
  }, [clearTracking, setPhaseState]);

  return {
    sessionRef,
    phase,
    proposal,
    lostLabel,
    previewLayout,
    handlePreviewLayout,
    phaseSV,
    frameCounter,
    frameStride,
    setPhaseState,
    clearTracking,
    openProposal,
    setTrackedBbox,
    setLostLabel,
    startScan,
    confirmTracking,
    dismissProposal,
    dismissLost,
    pauseFrameProcessing,
    resumeFrameProcessing,
    bboxRect,
    getTrackedViewRect,
  };
}
