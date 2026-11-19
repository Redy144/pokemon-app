import type { Detection } from "react-native-executorch";
import type { Frame } from "react-native-vision-camera";
import { saveFramePreviewAsync } from "@/components/camera/cameraUtils";
import { viewPointToImagePoint } from "@/components/camera/previewCoords";
import { pickTrackedDetection } from "@/components/camera/objectTracking";
import { SCAN_FRAME_LIMIT } from "./constants";
import type {
  ProposalPreview,
  TrackingSession,
} from "./types";

type OpenProposal = (
  detection: Detection | null,
  preview?: ProposalPreview | null,
) => void;

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

export async function processScanFrame(
  session: TrackingSession,
  frame: Frame,
  detections: Detection[],
  openProposal: OpenProposal,
): Promise<void> {
  if (session.phase !== "scanning") {
    frame.dispose();
    return;
  }

  const { width: frameWidth, height: frameHeight } = frame;
  syncFrameSize(session, frameWidth, frameHeight);

  const tap = session.pendingTap;
  const imagePoint = tap
    ? viewPointToImagePoint(tap.x, tap.y, session.previewLayout, {
        width: frameWidth,
        height: frameHeight,
      })
    : null;

  const selected = pickTrackedDetection(detections, imagePoint, null);

  if (selected) {
    session.pendingTap = null;

    let preview: ProposalPreview | null = null;

    try {
      const uri = await saveFramePreviewAsync(frame);
      preview = {
        uri,
        frameSize: { width: frameWidth, height: frameHeight },
        bbox: selected.bbox,
      };
    } catch {
      preview = null;
    }

    openProposal(selected, preview);
    return;
  }

  frame.dispose();
  session.scanFrameCount += 1;

  if (session.scanFrameCount >= SCAN_FRAME_LIMIT) {
    session.pendingTap = null;
    openProposal(null, null);
  }
}
