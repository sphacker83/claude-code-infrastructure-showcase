#!/usr/bin/env node

import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) {
    return { frontmatter: {}, body: raw.trim() };
  }

  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) {
    return { frontmatter: {}, body: raw.trim() };
  }

  const fmBlock = raw.slice(4, end);
  const body = raw.slice(end + 5).trim();
  const frontmatter = {};
  for (const line of fmBlock.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) frontmatter[key] = value;
  }
  return { frontmatter, body };
}

function fail(message, code = 1) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectDir = process.env.CODEX_PROJECT_DIR
    ? path.resolve(process.env.CODEX_PROJECT_DIR)
    : path.resolve(__dirname, "../..");

  const manifestPath = path.join(projectDir, ".codex", "agents", "manifest.json");
  if (!existsSync(manifestPath)) {
    fail(`manifest not found: ${manifestPath}`);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const agentName = args.agent;
  if (!agentName) {
    const candidates = Object.keys(manifest.agents || {}).sort().join(", ");
    fail(`--agent is required. available: ${candidates}`);
  }

  const agentMeta = manifest.agents?.[agentName];
  if (!agentMeta?.path) {
    const candidates = Object.keys(manifest.agents || {}).sort().join(", ");
    fail(`unknown agent: ${agentName}. available: ${candidates}`);
  }

  const beginMarker = manifest.requiredMarkers?.begin || "AGENT_SPEC_BEGIN";
  const endMarker = manifest.requiredMarkers?.end || "AGENT_SPEC_END";

  const agentPathRel = agentMeta.path;
  const agentPathAbs = path.resolve(projectDir, agentPathRel);
  if (!existsSync(agentPathAbs)) {
    fail(`agent file not found: ${agentPathAbs}`);
  }

  const raw = readFileSync(agentPathAbs, "utf-8");
  const { frontmatter, body } = parseFrontmatter(raw);
  const sourceSha = createHash("sha256").update(raw).digest("hex");
  const role = args.type || agentMeta.defaultType || "worker";
  const task = args.task || "No explicit task provided.";
  const ownership = args.ownership || "Not specified. Set explicit ownership before execution.";

  const output = [
    beginMarker,
    `agent_name: ${agentName}`,
    `agent_role: ${role}`,
    `agent_file: ${agentPathRel}`,
    `agent_file_abs: ${agentPathAbs}`,
    `agent_source_sha256: ${sourceSha}`,
    `agent_frontmatter_name: ${frontmatter.name || agentName}`,
    `agent_frontmatter_description: ${frontmatter.description || ""}`,
    "",
    "## Runtime Assignment (Injected)",
    `Task: ${task}`,
    `Ownership Scope: ${ownership}`,
    "",
    "## Critical Runtime Constraints",
    "- You are not alone in the codebase. Do not touch unrelated edits.",
    "- Respect ownership scope strictly.",
    "- Follow the agent specification below as hard requirements.",
    "",
    "## Agent Specification (Source Markdown)",
    body,
    endMarker
  ].join("\n");

  process.stdout.write(output);
}

main();
