"use client";

import { startTransition, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import {
  SEED3_CANVAS_HEIGHT,
  SEED3_CANVAS_WIDTH,
  createSeed3RuntimeState,
  seed3Logger,
} from "../core";
import { createSeed3AudioController } from "../audio";
import { attachSeed3Keyboard } from "../input";
import { Seed3CanvasPresenter } from "../render";
import { SEED3_SAMPLE_RESOURCES, seed3ResourceStore, type ResourceProbeResult } from "../resources";
import { describeSeed3StorageBackend } from "../storage";

function formatProbeStatus(result?: ResourceProbeResult): string {
  if (!result) {
    return "loading";
  }

  return result.ok ? "ready" : "error";
}

export function Seed3RuntimeHost() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef(createSeed3RuntimeState());
  const presenterRef = useRef(new Seed3CanvasPresenter());
  const audioController = useMemo(() => createSeed3AudioController(), []);

  const [frame, setFrame] = useState(0);
  const [fps, setFps] = useState(0);
  const [lastInput, setLastInput] = useState("NONE");
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [probes, setProbes] = useState<Record<string, ResourceProbeResult>>({});

  const drawFrame = useEffectEvent((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const runtime = runtimeRef.current;
    runtime.frame += 1;

    const elapsedSeconds = (timestamp - runtime.startedAt) / 1000;
    runtime.fps = elapsedSeconds > 0 ? runtime.frame / elapsedSeconds : 0;

    const readyCount = Object.values(probes).filter((probe) => probe.ok).length;
    presenterRef.current.present(context, {
      frame: runtime.frame,
      fps: runtime.fps,
      lastInput,
      readyCount,
      totalCount: SEED3_SAMPLE_RESOURCES.length,
      audioUnlocked,
    });

    if (runtime.frame % 15 === 0) {
      startTransition(() => {
        setFrame(runtime.frame);
        setFps(runtime.fps);
      });
    }
  });

  useEffect(() => {
    let animationFrame = 0;

    const loop = (timestamp: number) => {
      drawFrame(timestamp);
      animationFrame = window.requestAnimationFrame(loop);
    };

    animationFrame = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    return attachSeed3Keyboard(canvas, (input) => {
      runtimeRef.current.lastInput = input;
      setLastInput(input);
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function runProbes() {
      const results = await Promise.all(
        SEED3_SAMPLE_RESOURCES.map((path) => seed3ResourceStore.probe(path)),
      );

      if (!active) {
        return;
      }

      const nextProbes = Object.fromEntries(results.map((result) => [result.path, result]));
      seed3Logger.info("resource probes", nextProbes);
      startTransition(() => {
        runtimeRef.current.probes = nextProbes;
        setProbes(nextProbes);
      });
    }

    void runProbes();

    return () => {
      active = false;
    };
  }, []);

  const storageBackend = describeSeed3StorageBackend();

  async function handleCanvasClick() {
    canvasRef.current?.focus();

    const unlocked = await audioController.unlock();
    setAudioUnlocked(unlocked);
  }

  return (
    <section className="seed3-runtime-grid">
      <div className="seed3-panel seed3-stage">
        <div className="seed3-canvas-frame">
          <canvas
            ref={canvasRef}
            className="seed3-canvas"
            width={SEED3_CANVAS_WIDTH}
            height={SEED3_CANVAS_HEIGHT}
            onClick={() => {
              void handleCanvasClick();
            }}
          />
          <div className="seed3-canvas-hint">클릭해 포커스 및 오디오 언락</div>
        </div>
      </div>

      <aside className="seed3-sidebar">
        <section className="seed3-panel seed3-card">
          <h2>런타임 메트릭</h2>
          <p>현재는 게임 코어 대신 캔버스 부트 셸과 입력/오디오/리소스 경계만 올린 상태입니다.</p>
          <div className="seed3-card-list">
            <div className="seed3-metric">
              <span className="seed3-metric-label">Frame</span>
              <span className="seed3-metric-value">{frame}</span>
            </div>
            <div className="seed3-metric">
              <span className="seed3-metric-label">FPS</span>
              <span className="seed3-metric-value">{fps.toFixed(1)}</span>
            </div>
            <div className="seed3-metric">
              <span className="seed3-metric-label">Last Input</span>
              <span className="seed3-metric-value">{lastInput}</span>
            </div>
            <div className="seed3-metric">
              <span className="seed3-metric-label">Storage Target</span>
              <span className="seed3-metric-value">{storageBackend}</span>
            </div>
          </div>
        </section>

        <section className="seed3-panel seed3-card">
          <h2>리소스 프로브</h2>
          <p>
            무변환 자산 서빙 경로는 <code>/seed3-res</code>로 고정했습니다. 아래 항목은 실제 브라우저
            fetch 가능 여부를 점검합니다.
          </p>
          <div className="seed3-resource-list">
            {SEED3_SAMPLE_RESOURCES.map((path) => {
              const result = probes[path];
              const status = formatProbeStatus(result);
              return (
                <article key={path} className="seed3-resource-item">
                  <header>
                    <code>{path}</code>
                    <span className={`seed3-status seed3-status-${status}`}>
                      {status.toUpperCase()}
                    </span>
                  </header>
                  <div className="seed3-resource-meta">
                    {result?.ok
                      ? `${result.byteLength?.toLocaleString() ?? 0} bytes loaded`
                      : result?.error ?? "probe pending"}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="seed3-command">
            자산이 비어 있으면 <code>npm run sync:seed3-resources</code>를 먼저 실행하세요.
          </div>
        </section>
      </aside>
    </section>
  );
}
