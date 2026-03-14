import { SEED3_RESOURCE_BASE_PATH } from "../core";

export function resolveSeed3ResourcePath(relativePath: string): string {
  const normalizedPath = relativePath.replace(/^\/+/, "");
  return `${SEED3_RESOURCE_BASE_PATH}/${normalizedPath}`;
}
