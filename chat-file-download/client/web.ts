import { Platform } from "react-native";

// This plugin typechecks without the DOM library. Declare only what this module uses.
interface WebGlobals {
  atob(data: string): string;
  Blob: new (parts: Uint8Array[], options?: { type?: string }) => unknown;
  URL: { createObjectURL(blob: unknown): string; revokeObjectURL(url: string): void };
  document: {
    createElement(tag: "a"): {
      href: string;
      download: string;
      rel: string;
      click(): void;
      remove(): void;
    };
    body: { appendChild(node: unknown): void };
  };
}

export const canSaveFiles = Platform.OS === "web";

export function decodeBase64(data: string): Uint8Array {
  const binary = (globalThis as unknown as WebGlobals).atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/** Browser and desktop app only: hands the bytes to the browser's save prompt. */
export function saveFile(name: string, chunks: Uint8Array[]): void {
  if (!canSaveFiles) throw new Error("Downloads work in the browser and desktop app only.");
  const { Blob, URL, document } = globalThis as unknown as WebGlobals;
  const url = URL.createObjectURL(new Blob(chunks, { type: "application/octet-stream" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // The browser may still be reading the blob while its save prompt is open.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
