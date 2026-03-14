import type { ResourceProbeResult } from "../resources";

export type RuntimeProbeMap = Record<string, ResourceProbeResult>;

export type Seed3RuntimeState = {
  frame: number;
  fps: number;
  lastInput: string;
  audioUnlocked: boolean;
  probes: RuntimeProbeMap;
  startedAt: number;
};

export function createSeed3RuntimeState(): Seed3RuntimeState {
  return {
    frame: 0,
    fps: 0,
    lastInput: "NONE",
    audioUnlocked: false,
    probes: {},
    startedAt: performance.now(),
  };
}
