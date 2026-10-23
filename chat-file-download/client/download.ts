import type { RpcInput, RpcOutput } from "@getpaseo/plugin";
import type { readFileChunk } from "../shared/files";
import { decodeBase64, saveFile } from "./web";

type ReadChunk = (input: RpcInput<typeof readFileChunk>) => Promise<RpcOutput<typeof readFileChunk>>;

/** Pulls the file from the daemon in chunks, then opens the browser's save prompt. */
export async function downloadFile(read: ReadChunk, path: string, cwd?: string): Promise<void> {
  const chunks: Uint8Array[] = [];
  let offset = 0;
  let name = "";
  for (;;) {
    const chunk = await read({ path, cwd, offset });
    const bytes = decodeBase64(chunk.base64);
    name = chunk.name;
    if (bytes.length > 0) chunks.push(bytes);
    offset += bytes.length;
    if (bytes.length === 0 || offset >= chunk.size) break;
  }
  saveFile(name, chunks);
}
