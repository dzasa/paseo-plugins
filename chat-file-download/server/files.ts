import { open, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, isAbsolute, relative, resolve } from "node:path";
import type { RpcInput, RpcOutput } from "@getpaseo/plugin";
import type { PluginLifecycleEvents } from "@getpaseo/plugin/server";
import type { FilesRowData, readFileChunk } from "../shared/files";

// Base64 of one chunk stays far below the daemon's 100 MiB socket frame cap.
export const CHUNK_BYTES = 4 * 1024 * 1024;
const MAX_CANDIDATES = 100;
const MAX_FILES = 50;

// shortcut: paths with spaces are not detected, upgrade to the app's own link parser if that matters
const PATH_PATTERN = /(?:~|\.{1,2})?\/[^\s`'"()<>[\]{}|:]+|[\w.@-]+(?:\/[\w.@-]+)+|[\w-]+\.[A-Za-z0-9]{1,8}\b/g;

export function latestAssistantText(
  timeline: PluginLifecycleEvents["agent.turn_ended"]["timeline"],
): string {
  let output = "";
  for (const item of timeline) {
    if (item.type === "user_message") output = "";
    else if (item.type === "assistant_message") output += `${item.text}\n`;
  }
  return output;
}

export function resolvePath(path: string, cwd: string): string {
  const expanded = path === "~" || path.startsWith("~/") ? homedir() + path.slice(1) : path;
  return resolve(cwd, expanded);
}

/** Every path mentioned in the text that is a regular file on this machine. */
export async function findReferencedFiles(text: string, cwd: string): Promise<FilesRowData["files"]> {
  const candidates = new Set<string>();
  for (const match of text.match(PATH_PATTERN) ?? []) {
    const trimmed = match.replace(/[.,;:!?]+$/, "");
    if (trimmed) candidates.add(resolvePath(trimmed, cwd));
    if (candidates.size >= MAX_CANDIDATES) break;
  }
  const files: FilesRowData["files"] = [];
  for (const path of candidates) {
    const info = await stat(path).catch(() => null);
    if (!info?.isFile()) continue;
    const inWorkspace = relative(cwd, path);
    const label = inWorkspace.startsWith("..") || isAbsolute(inWorkspace) ? path : inWorkspace;
    files.push({ path, label, size: info.size });
    if (files.length >= MAX_FILES) break;
  }
  return files;
}

export async function readChunk({
  path,
  cwd,
  offset,
}: RpcInput<typeof readFileChunk>): Promise<RpcOutput<typeof readFileChunk>> {
  const resolved = resolvePath(path, cwd ?? homedir());
  const info = await stat(resolved);
  if (!info.isFile()) throw new Error(`Not a file: ${resolved}`);
  const handle = await open(resolved, "r");
  try {
    const buffer = Buffer.alloc(Math.max(0, Math.min(CHUNK_BYTES, info.size - offset)));
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, offset);
    return {
      path: resolved,
      name: basename(resolved),
      size: info.size,
      base64: buffer.subarray(0, bytesRead).toString("base64"),
    };
  } finally {
    await handle.close();
  }
}
