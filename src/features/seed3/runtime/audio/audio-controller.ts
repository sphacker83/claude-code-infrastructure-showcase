export class Seed3AudioController {
  private context: AudioContext | null = null;

  async unlock(): Promise<boolean> {
    if (typeof window === "undefined" || typeof AudioContext === "undefined") {
      return false;
    }

    if (!this.context) {
      this.context = new AudioContext();
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    return this.context.state === "running";
  }
}

export function createSeed3AudioController(): Seed3AudioController {
  return new Seed3AudioController();
}
