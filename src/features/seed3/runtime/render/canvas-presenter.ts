import { SEED3_CANVAS_HEIGHT, SEED3_CANVAS_WIDTH } from "../core";

type CanvasSnapshot = {
  frame: number;
  fps: number;
  lastInput: string;
  readyCount: number;
  totalCount: number;
  audioUnlocked: boolean;
};

export class Seed3CanvasPresenter {
  present(context: CanvasRenderingContext2D, snapshot: CanvasSnapshot): void {
    context.clearRect(0, 0, SEED3_CANVAS_WIDTH, SEED3_CANVAS_HEIGHT);

    const background = context.createLinearGradient(0, 0, 0, SEED3_CANVAS_HEIGHT);
    background.addColorStop(0, "#0f2631");
    background.addColorStop(1, "#040b10");
    context.fillStyle = background;
    context.fillRect(0, 0, SEED3_CANVAS_WIDTH, SEED3_CANVAS_HEIGHT);

    context.save();
    context.strokeStyle = "rgba(127, 196, 216, 0.08)";
    for (let x = 0; x <= SEED3_CANVAS_WIDTH; x += 24) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, SEED3_CANVAS_HEIGHT);
      context.stroke();
    }
    for (let y = 0; y <= SEED3_CANVAS_HEIGHT; y += 24) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(SEED3_CANVAS_WIDTH, y);
      context.stroke();
    }
    context.restore();

    context.fillStyle = "#7fc4d8";
    context.font = "700 14px IBM Plex Mono, monospace";
    context.fillText("SEED3 WEB PORT", 24, 34);

    context.fillStyle = "#ecf9fd";
    context.font = "700 38px IBM Plex Sans, sans-serif";
    context.fillText("BOOT SHELL", 24, 92);

    context.fillStyle = "#9fb6c0";
    context.font = "16px IBM Plex Sans, sans-serif";
    context.fillText("Canvas host and resource probes are active.", 24, 122);

    const progress = snapshot.totalCount === 0 ? 0 : snapshot.readyCount / snapshot.totalCount;
    context.fillStyle = "rgba(7, 27, 35, 0.92)";
    context.fillRect(24, 152, 432, 22);
    context.fillStyle = "#1c5e74";
    context.fillRect(26, 154, 428 * progress, 18);
    context.strokeStyle = "rgba(127, 196, 216, 0.35)";
    context.strokeRect(24, 152, 432, 22);

    context.fillStyle = "#ecf9fd";
    context.font = "700 14px IBM Plex Mono, monospace";
    context.fillText(`resources ${snapshot.readyCount}/${snapshot.totalCount}`, 24, 196);
    context.fillText(`fps ${snapshot.fps.toFixed(1)}`, 24, 220);
    context.fillText(`last input ${snapshot.lastInput}`, 24, 244);
    context.fillText(`audio ${snapshot.audioUnlocked ? "unlocked" : "locked"}`, 24, 268);

    const pulse = (Math.sin(snapshot.frame / 18) + 1) / 2;
    context.fillStyle = `rgba(90, 225, 164, ${0.2 + pulse * 0.5})`;
    context.fillRect(348, 214, 108, 54);
    context.fillStyle = "#031117";
    context.font = "700 12px IBM Plex Mono, monospace";
    context.fillText("NEXT", 382, 236);
    context.fillText("zlib / decoders", 364, 254);
  }
}
