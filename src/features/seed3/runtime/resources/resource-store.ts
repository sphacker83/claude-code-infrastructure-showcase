import { resolveSeed3ResourcePath } from "./resource-path";

export type ResourceProbeResult = {
  path: string;
  url: string;
  ok: boolean;
  byteLength: number | null;
  error?: string;
};

export class ResourceStore {
  private readonly binaryCache = new Map<string, ArrayBuffer>();

  async loadBinary(relativePath: string): Promise<ArrayBuffer> {
    const cacheKey = relativePath.replace(/^\/+/, "");
    const existing = this.binaryCache.get(cacheKey);
    if (existing) {
      return existing;
    }

    const response = await fetch(resolveSeed3ResourcePath(cacheKey), {
      cache: "force-cache",
    });

    if (!response.ok) {
      throw new Error(`Failed to load ${cacheKey} (${response.status})`);
    }

    const buffer = await response.arrayBuffer();
    this.binaryCache.set(cacheKey, buffer);
    return buffer;
  }

  async probe(relativePath: string): Promise<ResourceProbeResult> {
    const normalizedPath = relativePath.replace(/^\/+/, "");
    const url = resolveSeed3ResourcePath(normalizedPath);

    try {
      const buffer = await this.loadBinary(normalizedPath);
      return {
        path: normalizedPath,
        url,
        ok: true,
        byteLength: buffer.byteLength,
      };
    } catch (error) {
      return {
        path: normalizedPath,
        url,
        ok: false,
        byteLength: null,
        error: error instanceof Error ? error.message : "Unknown resource error",
      };
    }
  }
}

export const seed3ResourceStore = new ResourceStore();
