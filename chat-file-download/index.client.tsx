import type { PluginClientContext } from "@getpaseo/plugin/client";
import { downloadFile } from "./client/download";
import { FilesRow } from "./client/files-row";
import { FILES_ROW_KIND, filesRowSchema, readFileChunk } from "./shared/files";

export default function contribute(client: PluginClientContext) {
  client.addTimelineRenderer({
    kind: FILES_ROW_KIND,
    version: 1,
    schema: filesRowSchema,
    Component: FilesRow,
  });
  client.addSlashCommand({
    name: "download",
    description: "Download a file from the agent's machine",
    argumentHint: "<path>",
    context: "agent",
    async onSubmit({ args, agent, rpc }) {
      if (!args) throw new Error("Usage: /download <path>");
      await downloadFile((input) => rpc(readFileChunk, input), args, agent.cwd);
    },
  });
  return () => {};
}
