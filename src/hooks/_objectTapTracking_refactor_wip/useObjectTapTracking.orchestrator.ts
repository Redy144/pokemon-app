import { useCallback } from "react";
import type { Detection } from "react-native-executorch";
import type { Frame } from "react-native-vision-camera";
import { useObjectFrameProcessor } from "./useObjectFrameProcessor";
import { useTrackingSession } from "./useTrackingSession";

type RunOnFrameFn = (
  frame: Frame,
  isFrontCamera: boolean,
  options?: { detectionThreshold?: number },
) => Detection[];

type Options = {
  runOnFrame: RunOnFrameFn | null | undefined;
  isModelReady: boolean;
};

export function useObjectTapTracking({ runOnFrame, isModelReady }: Options) {
  const {
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
  } = useTrackingSession();

  const { frameOutput, hasDetector } = useObjectFrameProcessor({
    runOnFrame,
    sessionRef,
    phaseSV,
    frameCounter,
    frameStride,
    openProposal,
    clearTracking,
    setTrackedBbox,
    setLostLabel,
    setPhaseState,
  });

  const handleTap = useCallback(
    (locationX: number, locationY: number) => {
      if (
        !isModelReady ||
        !hasDetector ||
        previewLayout.width === 0 ||
        previewLayout.height === 0
      ) {
        return;
      }

      const currentPhase = sessionRef.current.phase;

      if (currentPhase !== "idle" && currentPhase !== "tracking") {
        return;
      }

      startScan(locationX, locationY);
    },
    [
      hasDetector,
      isModelReady,
      previewLayout.height,
      previewLayout.width,
      sessionRef,
      startScan,
    ],
  );

  return {
    frameOutput,
    handlePreviewLayout,
    handleTap,
    bboxRect,
    getTrackedViewRect,
    previewLayout,
    phase,
    proposal,
    lostLabel,
    confirmTracking,
    dismissProposal,
    dismissLost,
    pauseFrameProcessing,
    resumeFrameProcessing,
  };
}
