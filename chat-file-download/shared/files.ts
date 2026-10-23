import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";

export const FILES_ROW_KIND = "chat-file-downloads";

export const filesRowSchema = z.object({
  files: z.array(z.object({ path: z.string(), label: z.string(), size: z.number() })),
});

export type FilesRowData = z.output<typeof filesRowSchema>;

export const readFileChunk = defineRpc({
  name: "file.read-chunk",
  input: z.object({
    path: z.string(),
    cwd: z.string().optional(),
    offset: z.number().int().nonnegative(),
  }),
  output: z.object({ path: z.string(), name: z.string(), size: z.number(), base64: z.string() }),
});
