import type { Detection } from "react-native-executorch";
import type { Bbox } from "@/components/camera/previewCoords";
import {
  bboxesAreClose,
  pickTrackedDetection,
} from "@/components/camera/objectTracking";
import { TRACK_MISS_LIMIT } from "@/components/camera/cameraConstants";
import {
  UI_UPDATE_INTERVAL_MS,
  platformKey,
} from "./constants";
import type { TrackingSession } from "./types";

type TrackCallbacks = {
  onBboxUiUpdate: (bbox: Bbox) => void;
  onLost: (label: string | null) => void;
};

function syncFrameSize(
  session: TrackingSession,
  frameWidth: number,
  frameHeight: number,
) {
  if (
    session.frameSize.width !== frameWidth ||
    session.frameSize.height !== frameHeight
  ) {
    session.frameSize = { width: frameWidth, height: frameHeight };
  }
}

export function processTrackFrame(
  session: TrackingSession,
  detections: Detection[],
  frameWidth: number,
  frameHeight: number,
  { onBboxUiUpdate, onLost }: TrackCallbacks,
): void {
  syncFrameSize(session, frameWidth, frameHeight);

  if (session.phase !== "tracking") {
    return;
  }

  const selected = pickTrackedDetection(
    detections,
    null,
    session.trackedBbox,
    session.trackedLabel,
  );

  const now = Date.now();
  const uiInterval = UI_UPDATE_INTERVAL_MS[platformKey];

  if (selected) {
    session.missCount = 0;
    const previousBbox = session.trackedBbox;
    session.trackedBbox = selected.bbox;

    const shouldUpdateUi =
      !previousBbox ||
      !bboxesAreClose(previousBbox, selected.bbox) ||
      now - session.lastUiUpdate >= uiInterval;

    if (shouldUpdateUi) {
      session.lastUiUpdate = now;
      onBboxUiUpdate(selected.bbox);
    }

    return;
  }

  session.missCount += 1;

  if (session.missCount < TRACK_MISS_LIMIT) {
    return;
  }

  onLost(session.trackedLabel);
}
