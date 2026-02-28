#!/usr/bin/env node
import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

interface HookInput {
  tool_name?: string;
  tool_input?: unknown;
}

interface AgentManifest {
  requiredMarkers?: {
    begin?: string;
    end?: string;
  };
  agents?: Record<string, { path: string }>;
}

const TARGET_TOOLS = new Set([
  "Task",
  "task",
  "spawn_agent",
  "SpawnAgent",
  "Agent"
]);

function fail(message: string): never {
  process.stderr.write(message);
  process.exit(2);
}

function getProjectDir() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  return process.env.CODEX_PROJECT_DIR
    ? resolve(process.env.CODEX_PROJECT_DIR)
    : resolve(scriptDir, "../..");
}

function deepCollectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) deepCollectStrings(item, out);
    return out;
  }
  if (value && typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      deepCollectStrings(entry, out);
    }
  }
  return out;
}

function main() {
  if (process.env.SKIP_AGENT_SPEC_GUARD === "1") {
    process.exit(0);
    return;
  }

  const raw = readFileSync(0, "utf-8");
  let payload: HookInput;
  try {
    payload = JSON.parse(raw) as HookInput;
  } catch {
    process.exit(0);
    return;
  }

  const toolName = payload.tool_name ?? "";
  if (!TARGET_TOOLS.has(toolName)) {
    process.exit(0);
    return;
  }

  const projectDir = getProjectDir();
  const manifestPath = join(projectDir, ".codex", "agents", "manifest.json");
  if (!existsSync(manifestPath)) {
    process.exit(0);
    return;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as AgentManifest;
  const begin = manifest.requiredMarkers?.begin ?? "AGENT_SPEC_BEGIN";
  const end = manifest.requiredMarkers?.end ?? "AGENT_SPEC_END";
  const agentNames = Object.keys(manifest.agents ?? {});

  const toolInput = payload.tool_input ?? {};
  const strings = deepCollectStrings(toolInput);
  const joined = strings.join("\n");
  const serialized = JSON.stringify(toolInput);

  const referencesManagedAgent =
    agentNames.some((name) => joined.includes(name) || serialized.includes(name)) ||
    /\/\.codex\/agents\/.+\.md/.test(joined) ||
    /\/\.codex\/agents\/.+\.md/.test(serialized) ||
    /\.codex\/agents\/.+\.md/.test(joined) ||
    /\.codex\/agents\/.+\.md/.test(serialized);

  if (!referencesManagedAgent) {
    process.exit(0);
    return;
  }

  const hasInjectedSpec = joined.includes(begin) && joined.includes(end);
  if (hasInjectedSpec) {
    process.exit(0);
    return;
  }

  const firstMatched =
    agentNames.find((name) => joined.includes(name) || serialized.includes(name)) ?? "<agent-name>";

  fail(
    [
      "⚠️ BLOCKED - Managed agent call requires injected agent specification.",
      "",
      "Required:",
      "1) Compile agent prompt from .codex/agents/*.md",
      "2) Include compiled prompt in Task/spawn_agent message",
      "",
      `Example: node "$CODEX_PROJECT_DIR/.codex/agents/compile-agent-prompt.mjs" --agent "${firstMatched}" --task "<task>" --ownership "<scope>"`,
      "Then call sub-agent with AGENT_SPEC_BEGIN...AGENT_SPEC_END included.",
      "",
      "Tip: inject compiled spec block directly into Task/spawn_agent message."
    ].join("\n")
  );
}

main();
