import { useCallback, useEffect, useState, type MutableRefObject } from "react";
import type { SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import type { Detection } from "react-native-executorch";
import { useFrameOutput, type Frame } from "react-native-vision-camera";
import type { Bbox } from "@/components/camera/previewCoords";
import {
  FRAME_SIZE,
  PHASE_SV,
  type PhaseSV,
} from "./constants";
import { processScanFrame } from "./processScanFrame";
import { processTrackFrame } from "./processTrackFrame";
import type {
  ObjectTrackingPhase,
  ProposalPreview,
  TrackingSession,
} from "./types";

type RunOnFrameFn = (
  frame: Frame,
  isFrontCamera: boolean,
  options?: { detectionThreshold?: number },
) => Detection[];

type Options = {
  runOnFrame: RunOnFrameFn | null | undefined;
  sessionRef: MutableRefObject<TrackingSession>;
  phaseSV: SharedValue<PhaseSV>;
  frameCounter: SharedValue<number>;
  frameStride: SharedValue<number>;
  openProposal: (
    detection: Detection | null,
    preview?: ProposalPreview | null,
  ) => void;
  clearTracking: () => void;
  setTrackedBbox: (bbox: Bbox | null) => void;
  setLostLabel: (label: string | null) => void;
  setPhaseState: (phase: ObjectTrackingPhase) => void;
};

export function useObjectFrameProcessor({
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
}: Options) {
  const [frameDetector, setFrameDetector] = useState<{
    run: RunOnFrameFn | null;
  }>({ run: null });

  useEffect(() => {
    setFrameDetector({ run: (runOnFrame as RunOnFrameFn | null) ?? null });
  }, [runOnFrame]);

  const handleScanFrame = useCallback(
    (frame: Frame, detections: Detection[]) => {
      void processScanFrame(
        sessionRef.current,
        frame,
        detections,
        openProposal,
      );
    },
    [openProposal, sessionRef],
  );

  const handleTrackFrame = useCallback(
    (detections: Detection[], frameWidth: number, frameHeight: number) => {
      processTrackFrame(
        sessionRef.current,
        detections,
        frameWidth,
        frameHeight,
        {
          onBboxUiUpdate: setTrackedBbox,
          onLost: (label) => {
            clearTracking();
            setLostLabel(label);
            setPhaseState("lost");
          },
        },
      );
    },
    [
      clearTracking,
      sessionRef,
      setLostLabel,
      setPhaseState,
      setTrackedBbox,
    ],
  );

  const onFrame = useCallback(
    (frame: Frame) => {
      "worklet";

      if (!frameDetector.run || phaseSV.value === PHASE_SV.idle) {
        frame.dispose();
        return;
      }

      frameCounter.value += 1;

      if (frameCounter.value % frameStride.value !== 0) {
        frame.dispose();
        return;
      }

      try {
        const detections = frameDetector.run(frame, false, {
          detectionThreshold: 0.5,
        });

        if (phaseSV.value === PHASE_SV.scanning) {
          scheduleOnRN(handleScanFrame, frame, detections);
          return;
        }

        // Sensor frames are landscape-native; swap dimensions inline (worklets can't call RN functions).
        scheduleOnRN(
          handleTrackFrame,
          detections,
          frame.height,
          frame.width,
        );
        frame.dispose();
      } catch {
        frame.dispose();
      }
    },
    [
      frameCounter,
      frameDetector,
      frameStride,
      handleScanFrame,
      handleTrackFrame,
      phaseSV,
    ],
  );

  const frameOutput = useFrameOutput({
    pixelFormat: "rgb",
    enablePreviewSizedOutputBuffers: true,
    targetResolution: {
      width: FRAME_SIZE,
      height: FRAME_SIZE,
    },
    dropFramesWhileBusy: true,
    onFrame,
  });

  return {
    frameOutput,
    hasDetector: Boolean(frameDetector.run),
  };
}
