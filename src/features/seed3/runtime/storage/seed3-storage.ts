export function describeSeed3StorageBackend(): string {
  if (typeof indexedDB === "undefined") {
    return "IndexedDB unavailable";
  }

  return "IndexedDB planned backend";
}
