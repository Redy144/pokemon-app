# Object tap tracking refactor (WIP)

Snapshot of the split refactor before revert. Not wired into the app.

Original entry was \`src/hooks/useObjectTapTracking.ts\` (restored).

Files:
- types.ts, constants.ts
- processScanFrame.ts, processTrackFrame.ts
- useTrackingSession.ts, useObjectFrameProcessor.ts
- useObjectTapTracking.orchestrator.ts — thin public hook that wired the above

To re-enable: move this folder back to \`objectTapTracking/\`, restore the orchestrator as \`useObjectTapTracking.ts\`, and update consumer imports.
